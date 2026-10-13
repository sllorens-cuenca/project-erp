import { IsIn, IsOptional, IsString } from 'class-validator'
import { MATERIAL_LIST_STATUSES, MaterialListStatus } from '@erp/shared'

export class UpdateListDto {
  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsIn(MATERIAL_LIST_STATUSES)
  status?: MaterialListStatus
}
