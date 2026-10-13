import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator'
import { USER_ROLES, UserRole } from '@erp/shared'

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole
}
