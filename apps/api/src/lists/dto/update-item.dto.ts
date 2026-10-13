import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedQty?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  preparedQty?: number

  @IsOptional()
  @IsString()
  notes?: string
}
