import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import type { AuthUser, LoginResponse } from '@erp/shared'
import { UserRole } from '@erp/shared'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciales incorrectas')
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException('Credenciales incorrectas')
    }
    return this.buildResponse(user)
  }

  /** ¿Existe ya algún usuario en el sistema? (para el onboarding). */
  async isSetupComplete(): Promise<boolean> {
    return (await this.prisma.user.count()) > 0
  }

  /**
   * Configuración inicial: crea el primer usuario como ADMIN.
   * Solo funciona mientras no exista ningún usuario.
   */
  async setup(dto: RegisterDto): Promise<LoginResponse> {
    if (await this.isSetupComplete()) {
      throw new UnauthorizedException(
        'La configuración inicial ya se ha completado',
      )
    }
    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: UserRole.ADMIN,
      },
    })
    return this.buildResponse(user)
  }

  /** Actualiza el nombre del usuario y reemite el token (name va en el JWT). */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<LoginResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
    })
    return this.buildResponse(user)
  }

  /** Cambia la contraseña verificando antes la actual. */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario no válido')
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!valid) {
      throw new BadRequestException('La contraseña actual no es correcta')
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    })
  }

  async validateUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user || !user.active) return null
    return this.toAuthUser(user)
  }

  private buildResponse(user: {
    id: string
    email: string
    name: string
    role: string
  }): LoginResponse {
    const authUser = this.toAuthUser(user)
    const accessToken = this.jwt.sign(authUser)
    return { accessToken, user: authUser }
  }

  private toAuthUser(user: {
    id: string
    email: string
    name: string
    role: string
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    }
  }
}
