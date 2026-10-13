/**
 * Enumeraciones compartidas entre la API y la web.
 *
 * Se modelan como objetos `as const` + unión de tipos en lugar de `enum`
 * nativo para que sean portables (SQLite en desarrollo, PostgreSQL en
 * producción) y fáciles de usar en validaciones.
 */

export const UserRole = {
  ADMIN: 'ADMIN',
  ALMACENERO: 'ALMACENERO',
  TECNICO: 'TECNICO',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]
export const USER_ROLES = Object.values(UserRole)

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  ALMACENERO: 'Almacenero',
  TECNICO: 'Técnico',
}

export const ServiceType = {
  INSTALACION: 'INSTALACION',
  REPARACION: 'REPARACION',
  AIRE_ACONDICIONADO: 'AIRE_ACONDICIONADO',
  OTRO: 'OTRO',
} as const
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]
export const SERVICE_TYPES = Object.values(ServiceType)

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  INSTALACION: 'Instalación',
  REPARACION: 'Reparación',
  AIRE_ACONDICIONADO: 'Aire acondicionado',
  OTRO: 'Otro',
}

export const ProjectStatus = {
  ABIERTA: 'ABIERTA',
  EN_CURSO: 'EN_CURSO',
  FINALIZADA: 'FINALIZADA',
  CANCELADA: 'CANCELADA',
} as const
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]
export const PROJECT_STATUSES = Object.values(ProjectStatus)

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ABIERTA: 'Abierta',
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

export const MaterialUnit = {
  UD: 'UD',
  M: 'M',
  M2: 'M2',
  KG: 'KG',
  L: 'L',
  ROLLO: 'ROLLO',
  CAJA: 'CAJA',
  PAQUETE: 'PAQUETE',
} as const
export type MaterialUnit = (typeof MaterialUnit)[keyof typeof MaterialUnit]
export const MATERIAL_UNITS = Object.values(MaterialUnit)

export const StockMovementType = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
  AJUSTE: 'AJUSTE',
} as const
export type StockMovementType =
  (typeof StockMovementType)[keyof typeof StockMovementType]
export const STOCK_MOVEMENT_TYPES = Object.values(StockMovementType)

export const MaterialListStatus = {
  BORRADOR: 'BORRADOR',
  EN_PREPARACION: 'EN_PREPARACION',
  LISTO: 'LISTO',
  CONFIRMADO: 'CONFIRMADO',
  ENVIADO: 'ENVIADO',
} as const
export type MaterialListStatus =
  (typeof MaterialListStatus)[keyof typeof MaterialListStatus]
export const MATERIAL_LIST_STATUSES = Object.values(MaterialListStatus)

export const MATERIAL_LIST_STATUS_LABELS: Record<MaterialListStatus, string> = {
  BORRADOR: 'Borrador',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  CONFIRMADO: 'Confirmado',
  ENVIADO: 'Enviado',
}

/** Orden del flujo de preparación (para avanzar de estado). */
export const MATERIAL_LIST_FLOW: MaterialListStatus[] = [
  MaterialListStatus.BORRADOR,
  MaterialListStatus.EN_PREPARACION,
  MaterialListStatus.LISTO,
  MaterialListStatus.CONFIRMADO,
  MaterialListStatus.ENVIADO,
]

export const EmailStatus = {
  PENDIENTE: 'PENDIENTE',
  ENVIADO: 'ENVIADO',
  ERROR: 'ERROR',
} as const
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus]
