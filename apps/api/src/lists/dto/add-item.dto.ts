import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator'

export class AddItemDto {
  /** Puede indicarse por id o por nombre/sku (útil para la barra de comandos). */
  @IsOptional()
  @IsString()
  materialId?: string

  @IsOptional()
  @IsString()
  materialName?: string

  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsNumber()
  @IsPositive()
  requestedQty?: number

  @IsOptional()
  @IsString()
  unit?: string

  @IsOptional()
  @IsString()
  notes?: string
}
