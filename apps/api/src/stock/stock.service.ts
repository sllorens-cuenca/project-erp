import { Injectable, NotFoundException } from '@nestjs/common'
import { StockMovementType } from '@erp/shared'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStockMovementDto } from './dto/create-stock-movement.dto'

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { materialId?: string; projectId?: string }) {
    return this.prisma.stockMovement.findMany({
      where: {
        materialId: params.materialId,
        projectId: params.projectId,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        material: { select: { id: true, sku: true, name: true, unit: true } },
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })
  }

  /** Registra un movimiento y actualiza el stock del material en la misma transacción. */
  async create(dto: CreateStockMovementDto, userId?: string) {
    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    })
    if (!material) throw new NotFoundException('Material no encontrado')

    let newStock = material.stock
    switch (dto.type) {
      case StockMovementType.ENTRADA:
        newStock = material.stock + Math.abs(dto.quantity)
        break
      case StockMovementType.SALIDA:
        newStock = material.stock - Math.abs(dto.quantity)
        break
      case StockMovementType.AJUSTE:
        newStock = dto.quantity
        break
    }

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          materialId: dto.materialId,
          type: dto.type,
          quantity: dto.quantity,
          projectId: dto.projectId,
          notes: dto.notes,
          userId,
        },
        include: {
          material: { select: { id: true, sku: true, name: true, unit: true } },
          project: { select: { id: true, name: true } },
        },
      })
      const updated = await tx.material.update({
        where: { id: dto.materialId },
        data: { stock: newStock },
      })
      return { movement, material: updated }
    })
  }
}
