import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { AuthUser } from '@erp/shared'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'cambia-esta-clave',
    })
  }

  /** El payload ya contiene el AuthUser; passport lo adjunta a req.user. */
  validate(payload: AuthUser): AuthUser {
    return payload
  }
}
