import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import type { AuthUser, UserRole } from '@erp/shared'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/** Autenticación por JWT. Respeta @Public() para endpoints abiertos. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true
    return super.canActivate(context)
  }
}

/** Comprueba el rol del usuario frente a @Roles(...). */
@Injectable()
export class RolesGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
    const user = request.user
    return !!user && required.includes(user.role)
  }
}
