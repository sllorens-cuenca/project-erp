import { Body, Controller, Get, Post } from '@nestjs/common'
import type { AuthUser, LoginResponse } from '@erp/shared'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
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
}
