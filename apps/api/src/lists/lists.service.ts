import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  MaterialListStatus,
  StockMovementType,
} from '@erp/shared'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'
import { matches } from '../common/utils/text'
import { CreateListDto } from './dto/create-list.dto'
import { UpdateListDto } from './dto/update-list.dto'
import { AddItemDto } from './dto/add-item.dto'
import { UpdateItemDto } from './dto/update-item.dto'
import { parseCommands } from './command.parser'
import {
  buildCsv,
  buildHtml,
  buildSubject,
  buildText,
  ListDocumentData,
} from './document.builder'

const listInclude = {
  project: { include: { client: true } },
  createdBy: { select: { id: true, name: true } },
  confirmedBy: { select: { id: true, name: true } },
  items: {
    include: { material: true },
    orderBy: { createdAt: 'asc' as const },
  },
  emails: { orderBy: { createdAt: 'desc' as const } },
}

/** Transiciones de estado permitidas en el flujo de preparación. */
const TRANSITIONS: Record<MaterialListStatus, MaterialListStatus[]> = {
  BORRADOR: [MaterialListStatus.EN_PREPARACION],
  EN_PREPARACION: [MaterialListStatus.BORRADOR, MaterialListStatus.LISTO],
  LISTO: [MaterialListStatus.EN_PREPARACION, MaterialListStatus.CONFIRMADO],
  CONFIRMADO: [MaterialListStatus.ENVIADO, MaterialListStatus.LISTO],
  ENVIADO: [],
}

type FullList = Awaited<ReturnType<ListsService['findOne']>>

@Injectable()
export class ListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  findAll(params: { projectId?: string; status?: string }) {
    return this.prisma.materialList.findMany({
      where: { projectId: params.projectId, status: params.status },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { include: { client: { select: { id: true, name: true } } } },
        _count: { select: { items: true } },
      },
    })
  }

  async findOne(id: string) {
    const list = await this.prisma.materialList.findUnique({
      where: { id },
      include: listInclude,
    })
    if (!list) throw new NotFoundException('Registro no encontrado')
    return list
  }

  /** Registros pendientes de confirmar (para el recordatorio diario). */
  findPendingConfirmation() {
    return this.prisma.materialList.findMany({
      where: {
        status: {
          in: [
            MaterialListStatus.EN_PREPARACION,
            MaterialListStatus.LISTO,
            MaterialListStatus.BORRADOR,
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        project: { include: { client: { select: { id: true, name: true } } } },
        _count: { select: { items: true } },
      },
    })
  }

  create(dto: CreateListDto, userId?: string) {
    return this.prisma.materialList.create({
      data: {
        projectId: dto.projectId,
        notes: dto.notes,
        createdById: userId,
        status: MaterialListStatus.BORRADOR,
      },
      include: listInclude,
    })
  }

  async update(id: string, dto: UpdateListDto) {
    await this.findOne(id)
    return this.prisma.materialList.update({
      where: { id },
      data: { notes: dto.notes },
      include: listInclude,
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.materialList.delete({ where: { id } })
  }

  // ---------------------------------------------------------------- items

  async addItem(listId: string, dto: AddItemDto) {
    const list = await this.findOne(listId)
    if (list.status === MaterialListStatus.ENVIADO) {
      throw new BadRequestException('El registro ya fue enviado')
    }

    const qty = dto.requestedQty
    if (qty === undefined || qty === null || !Number.isFinite(Number(qty)) || Number(qty) <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que 0')
    }

    const { material, unit } = await this.resolveMaterial(dto)

    // Si el material ya está en el registro, se acumula la cantidad.
    const existing = list.items.find((i) => i.materialId === material.id)
    if (existing) {
      await this.prisma.materialListItem.update({
        where: { id: existing.id },
        data: { requestedQty: existing.requestedQty + Number(qty) },
      })
    } else {
      await this.prisma.materialListItem.create({
        data: {
          listId,
          materialId: material.id,
          requestedQty: Number(qty),
          unit: unit ?? material.unit,
          notes: dto.notes,
        },
      })
    }
    return this.findOne(listId)
  }

  async updateItem(listId: string, itemId: string, dto: UpdateItemDto) {
    await this.assertItemInList(listId, itemId)
    await this.prisma.materialListItem.update({
      where: { id: itemId },
      data: {
        requestedQty: dto.requestedQty,
        preparedQty: dto.preparedQty,
        notes: dto.notes,
      },
    })
    return this.findOne(listId)
  }

  async removeItem(listId: string, itemId: string) {
    await this.assertItemInList(listId, itemId)
    await this.prisma.materialListItem.delete({ where: { id: itemId } })
    return this.findOne(listId)
  }

  /** Ejecuta la barra de comandos sobre un registro. */
  async runCommands(listId: string, text: string) {
    await this.findOne(listId)
    const { parsed, errors } = parseCommands(text)
    const added: string[] = []

    for (const cmd of parsed) {
      try {
        const { material } = await this.resolveMaterial({
          materialName: cmd.materialName,
        })
        await this.addItem(listId, {
          materialId: material.id,
          requestedQty: cmd.quantity,
          unit: cmd.unit ?? material.unit,
        })
        added.push(`${cmd.quantity} ${cmd.unit ?? material.unit} de ${material.name}`)
      } catch (err) {
        errors.push(
          `No se pudo añadir "${cmd.materialName}": ${(err as Error).message}`,
        )
      }
    }

    const list = await this.findOne(listId)
    return {
      ok: errors.length === 0,
      added,
      errors,
      list,
    }
  }

  // -------------------------------------------------------------- estados

  /** Cambia el estado aplicando las reglas de transición y sus efectos. */
  async changeStatus(
    id: string,
    target: MaterialListStatus,
    user?: { id: string },
  ) {
    const list = await this.findOne(id)
    const current = list.status as MaterialListStatus

    if (current === target) return list
    if (!TRANSITIONS[current]?.includes(target)) {
      throw new BadRequestException(
        `Transición no permitida: ${current} → ${target}`,
      )
    }

    if (target === MaterialListStatus.CONFIRMADO) {
      return this.confirm(id, user)
    }
    if (target === MaterialListStatus.ENVIADO) {
      return this.send(id, user)
    }

    return this.prisma.materialList.update({
      where: { id },
      data: { status: target },
      include: listInclude,
    })
  }

  /**
   * Confirma la preparación: fija las cantidades preparadas, descuenta el
   * stock de los materiales en una transacción y marca el registro.
   */
  async confirm(id: string, user?: { id: string }) {
    const list = await this.findOne(id)
    const current = list.status as MaterialListStatus
    if (
      current !== MaterialListStatus.LISTO &&
      current !== MaterialListStatus.CONFIRMADO
    ) {
      throw new BadRequestException(
        'Solo se puede confirmar un registro en estado LISTO',
      )
    }
    if (current === MaterialListStatus.CONFIRMADO) return list

    await this.prisma.$transaction(async (tx) => {
      for (const item of list.items) {
        const qty = item.preparedQty > 0 ? item.preparedQty : item.requestedQty

        await tx.materialListItem.update({
          where: { id: item.id },
          data: { preparedQty: qty },
        })

        const material = await tx.material.findUnique({
          where: { id: item.materialId },
        })
        if (!material) continue

        await tx.stockMovement.create({
          data: {
            materialId: item.materialId,
            projectId: list.projectId,
            userId: user?.id,
            type: StockMovementType.SALIDA,
            quantity: qty,
            notes: `Preparación del registro ${list.id}`,
          },
        })
        await tx.material.update({
          where: { id: item.materialId },
          data: { stock: material.stock - qty },
        })
      }

      await tx.materialList.update({
        where: { id },
        data: {
          status: MaterialListStatus.CONFIRMADO,
          confirmedById: user?.id,
        },
      })
    })

    return this.findOne(id)
  }

  /** Envía el registro por email al cliente + copia interna y lo marca enviado. */
  async send(id: string, user?: { id: string }) {
    const list = await this.findOne(id)
    const current = list.status as MaterialListStatus
    if (current !== MaterialListStatus.CONFIRMADO) {
      throw new BadRequestException(
        'El registro debe estar CONFIRMADO antes de enviarse',
      )
    }

    const data = this.toDocumentData(list)
    const subject = buildSubject(data)
    const html = buildHtml(data)

    const internal = process.env.INTERNAL_EMAIL
    const clientEmail = list.project.client.email ?? undefined
    const to = clientEmail ?? internal
    if (!to) {
      throw new BadRequestException(
        'El cliente no tiene email y no hay copia interna configurada',
      )
    }
    const cc =
      internal && clientEmail && internal !== clientEmail ? internal : undefined

    let status = 'ENVIADO'
    let error: string | undefined
    try {
      await this.mail.send({ to, cc, subject, html, text: buildText(data) })
    } catch (err) {
      status = 'ERROR'
      error = (err as Error).message
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.emailLog.create({
        data: {
          listId: id,
          to,
          cc,
          subject,
          status,
          error,
          sentAt: status === 'ENVIADO' ? new Date() : null,
        },
      })
      if (status === 'ENVIADO') {
        await tx.materialList.update({
          where: { id },
          data: { status: MaterialListStatus.ENVIADO, sentAt: new Date() },
        })
      }
    })

    if (status === 'ERROR') {
      throw new BadRequestException(`No se pudo enviar el correo: ${error}`)
    }
    return this.findOne(id)
  }

  // -------------------------------------------------------------- exports

  async exportDocument(id: string, format: 'html' | 'csv' | 'text') {
    const list = await this.findOne(id)
    const data = this.toDocumentData(list)
    if (format === 'csv') return buildCsv(data)
    if (format === 'text') return buildText(data)
    return buildHtml(data)
  }

  /** Documento HTML listo para imprimir/guardar como PDF en el navegador. */
  async renderHtml(id: string) {
    const list = await this.findOne(id)
    return buildHtml(this.toDocumentData(list))
  }

  // -------------------------------------------------------------- helpers

  private async resolveMaterial(dto: {
    materialId?: string
    materialName?: string
    sku?: string
  }) {
    if (dto.materialId) {
      const material = await this.prisma.material.findUnique({
        where: { id: dto.materialId },
      })
      if (!material) throw new BadRequestException('Material no encontrado')
      return { material, unit: undefined as string | undefined }
    }

    const term = dto.sku ?? dto.materialName
    if (!term) {
      throw new BadRequestException('Indica el material (id, sku o nombre)')
    }

    // 1) SKU exacto.
    const bySku = await this.prisma.material.findUnique({ where: { sku: term } })
    if (bySku) return { material: bySku, unit: bySku.unit }

    // 2) Nombre/SKU sin distinguir acentos ni mayúsculas.
    const candidates = await this.prisma.material.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    const material = candidates.find(
      (m) => matches(m.name, term) || matches(m.sku, term),
    )
    if (!material) {
      throw new BadRequestException(
        `No existe ningún material que coincida con "${term}"`,
      )
    }
    return { material, unit: material.unit }
  }

  private async assertItemInList(listId: string, itemId: string) {
    const item = await this.prisma.materialListItem.findUnique({
      where: { id: itemId },
    })
    if (!item || item.listId !== listId) {
      throw new NotFoundException('Línea de material no encontrada')
    }
  }

  private toDocumentData(list: FullList): ListDocumentData {
    return {
      id: list.id,
      status: list.status,
      projectName: list.project.name,
      serviceType: list.project.serviceType,
      clientName: list.project.client.name,
      clientEmail: list.project.client.email,
      address: list.project.address,
      createdAt: list.createdAt,
      sentAt: list.sentAt,
      notes: list.notes,
      preparedBy: list.confirmedBy?.name ?? list.createdBy?.name ?? null,
      items: list.items.map((i) => ({
        materialName: i.material.name,
        sku: i.material.sku,
        unit: i.unit,
        requestedQty: i.requestedQty,
        preparedQty: i.preparedQty,
        notes: i.notes,
      })),
    }
  }
}
