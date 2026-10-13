import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import {
  PROJECT_STATUSES,
  ProjectStatus,
  SERVICE_TYPES,
  ServiceType,
} from '@erp/shared'

export class CreateProjectDto {
  @IsString()
  clientId!: string

  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  @IsIn(SERVICE_TYPES)
  serviceType?: ServiceType

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}
