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
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.clients.findAll(search)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clients.findOne(id)
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  create(@Body() dto: CreateClientDto) {
    return this.clients.create(dto)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  remove(@Param('id') id: string) {
    return this.clients.remove(id)
  }
}
