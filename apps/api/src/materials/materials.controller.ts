import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { UserRole } from '@erp/shared'
import { MaterialsService } from './materials.service'
import { CreateMaterialDto } from './dto/create-material.dto'
import { UpdateMaterialDto } from './dto/update-material.dto'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('onlyActive') onlyActive?: string,
  ) {
    return this.materials.findAll({
      search,
      onlyActive: onlyActive === 'true',
    })
  }

  @Get('low-stock')
  lowStock() {
    return this.materials.lowStock()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materials.findOne(id)
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  create(@Body() dto: CreateMaterialDto) {
    return this.materials.create(dto)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materials.update(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  remove(@Param('id') id: string) {
    return this.materials.remove(id)
  }
}
