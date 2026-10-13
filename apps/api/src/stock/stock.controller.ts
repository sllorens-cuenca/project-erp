import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import type { AuthUser } from '@erp/shared'
import { UserRole } from '@erp/shared'
import { StockService } from './stock.service'
import { CreateStockMovementDto } from './dto/create-stock-movement.dto'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('stock-movements')
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  findAll(
    @Query('materialId') materialId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.stock.findAll({ materialId, projectId })
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO, UserRole.TECNICO)
  create(@Body() dto: CreateStockMovementDto, @CurrentUser() user: AuthUser) {
    return this.stock.create(dto, user.id)
  }
}
