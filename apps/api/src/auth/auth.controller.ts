import { Body, Controller, Get, Patch, Post } from '@nestjs/common'
import type { AuthUser, LoginResponse } from '@erp/shared'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { Public } from '../common/decorators/public.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto)
  }

  @Public()
  @Get('setup/status')
  async setupStatus(): Promise<{ configured: boolean }> {
    return { configured: await this.auth.isSetupComplete() }
  }

  @Public()
  @Post('setup')
  setup(@Body() dto: RegisterDto): Promise<LoginResponse> {
    return this.auth.setup(dto)
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user
  }

  /** Actualiza el nombre del usuario y reemite el token con los datos nuevos. */
  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<LoginResponse> {
    return this.auth.updateProfile(user.id, dto)
  }

  /** Cambia la contraseña del propio usuario (verifica la actual). */
  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ ok: true }> {
    await this.auth.changePassword(user.id, dto)
    return { ok: true }
  }
}
