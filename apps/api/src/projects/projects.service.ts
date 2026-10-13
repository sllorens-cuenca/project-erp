import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { clientId?: string; serviceType?: string }) {
    return this.prisma.project.findMany({
      where: {
        clientId: params.clientId,
        serviceType: params.serviceType,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { lists: true } },
      },
    })
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        lists: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { items: true } } },
        },
      },
    })
    if (!project) throw new NotFoundException('Obra no encontrada')
    return project
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        clientId: dto.clientId,
        name: dto.name,
        serviceType: dto.serviceType,
        status: dto.status,
        address: dto.address,
        notes: dto.notes,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { client: { select: { id: true, name: true } } },
    })
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id)
    return this.prisma.project.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        name: dto.name,
        serviceType: dto.serviceType,
        status: dto.status,
        address: dto.address,
        notes: dto.notes,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { client: { select: { id: true, name: true } } },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.project.delete({ where: { id } })
  }
}
