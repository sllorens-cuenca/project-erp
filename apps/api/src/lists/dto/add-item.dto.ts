import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

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
  @Min(0.000001)
  requestedQty?: number

  @IsOptional()
  @IsString()
  unit?: string

  @IsOptional()
  @IsString()
  notes?: string
}
