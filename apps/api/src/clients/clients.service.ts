import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { matches } from '../common/utils/text'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista de clientes, opcionalmente filtrando por texto (nombre/teléfono/email). */
  async findAll(search?: string) {
    const clients = await this.prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { projects: true } } },
    })
    if (!search) return clients
    return clients.filter(
      (c) =>
        matches(c.name, search) ||
        matches(c.phone, search) ||
        matches(c.email, search),
    )
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        // La web cuenta los registros por obra (`_count.lists`) en la ficha del cliente.
        projects: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { lists: true } } },
        },
      },
    })
    if (!client) throw new NotFoundException('Cliente no encontrado')
    return client
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto })
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id)
    return this.prisma.client.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    // Cascada: elimina también sus obras (configurado en el esquema Prisma).
    return this.prisma.client.delete({ where: { id } })
  }
}
