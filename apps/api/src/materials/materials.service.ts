import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { matches } from '../common/utils/text'
import { CreateMaterialDto } from './dto/create-material.dto'
import { UpdateMaterialDto } from './dto/update-material.dto'

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { search?: string; onlyActive?: boolean }) {
    const materials = await this.prisma.material.findMany({
      where: params.onlyActive ? { active: true } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    if (!params.search) return materials

    return materials.filter(
      (m) =>
        matches(m.name, params.search!) ||
        matches(m.sku, params.search!) ||
        matches(m.category, params.search!),
    )
  }

  /** Materiales por debajo del stock mínimo → alertas de reposición. */
  async lowStock() {
    const materials = await this.prisma.material.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    return materials.filter((m) => m.stock <= m.minStock)
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({ where: { id } })
    if (!material) throw new NotFoundException('Material no encontrado')
    return material
  }

  async create(dto: CreateMaterialDto) {
    const exists = await this.prisma.material.findUnique({
      where: { sku: dto.sku },
    })
    if (exists) throw new ConflictException('Ya existe un material con ese SKU')
    return this.prisma.material.create({ data: dto })
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id)
    if (dto.sku) {
      const other = await this.prisma.material.findUnique({
        where: { sku: dto.sku },
      })
      if (other && other.id !== id) {
        throw new ConflictException('Ya existe un material con ese SKU')
      }
    }
    return this.prisma.material.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.material.delete({ where: { id } })
  }
}
