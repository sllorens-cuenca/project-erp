import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator'
import { STOCK_MOVEMENT_TYPES, StockMovementType } from '@erp/shared'

export class CreateStockMovementDto {
  @IsString()
  materialId!: string

  /** ENTRADA | SALIDA | AJUSTE */
  @IsIn(STOCK_MOVEMENT_TYPES)
  type!: StockMovementType

  /**
   * Para ENTRADA/SALIDA: cantidad a sumar/restar.
   * Para AJUSTE: nuevo valor absoluto de stock.
   */
  @IsNumber()
  quantity!: number

  @IsOptional()
  @IsString()
  projectId?: string

  @IsOptional()
  @IsString()
  notes?: string
}
