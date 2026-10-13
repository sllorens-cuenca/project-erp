import type { UserRole } from './enums'

/** Usuario autenticado tal y como viaja en el token JWT. */
export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

/** Línea de material pedida por la barra de comandos. */
export interface CommandLine {
  material: string
  quantity: number
  unit?: string
}

/** Resultado de interpretar un comando del almacén. */
export interface CommandResult {
  ok: boolean
  message: string
  data?: unknown
}
