import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator'
import { USER_ROLES, UserRole } from '@erp/shared'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole

  @IsOptional()
  @IsBoolean()
  active?: boolean

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string
}
