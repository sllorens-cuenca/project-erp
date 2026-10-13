import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { UserRole } from '@erp/shared'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: publicSelect,
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicSelect,
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return user
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase()
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new ConflictException('Ese email ya está registrado')

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        role: dto.role ?? UserRole.TECNICO,
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
      select: publicSelect,
    })
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id)

    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.role !== undefined) data.role = dto.role
    if (dto.active !== undefined) data.active = dto.active
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10)

    return this.prisma.user.update({
      where: { id },
      data,
      select: publicSelect,
    })
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('No puedes eliminar tu propio usuario')
    }
    await this.findOne(id)
    // Baja lógica: se desactiva para no romper referencias históricas.
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: publicSelect,
    })
  }
}
