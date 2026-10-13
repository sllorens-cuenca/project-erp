import { IsIn } from 'class-validator'
import { MATERIAL_LIST_STATUSES, MaterialListStatus } from '@erp/shared'

export class ChangeStatusDto {
  @IsIn(MATERIAL_LIST_STATUSES)
  status!: MaterialListStatus
}
