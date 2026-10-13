import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthUser } from '@erp/shared'

/** Inyecta el usuario autenticado (desde el JWT) en el handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>()
    return request.user
  },
)
