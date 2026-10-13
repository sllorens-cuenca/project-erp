import { IsOptional, IsString } from 'class-validator'

export class CreateListDto {
  @IsString()
  projectId!: string

  @IsOptional()
  @IsString()
  notes?: string
}
