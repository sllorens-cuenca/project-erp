import { UserRole } from '@erp/shared'

export const WRITE_ROLES_WEB = [UserRole.ADMIN, UserRole.ALMACENERO] as const

export function puedeCrearRegistros(
  role: string | null | undefined,
): boolean {
  return role === UserRole.ADMIN || role === UserRole.ALMACENERO
}
