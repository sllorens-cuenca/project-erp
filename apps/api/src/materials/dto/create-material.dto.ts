import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'
import { MATERIAL_UNITS, MaterialUnit } from '@erp/shared'

export class CreateMaterialDto {
  @IsString()
  @MinLength(1)
  sku!: string

  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsIn(MATERIAL_UNITS)
  unit?: MaterialUnit

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
