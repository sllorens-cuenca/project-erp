import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import type { AuthUser } from '@erp/shared'
import { MaterialListStatus, UserRole } from '@erp/shared'
import { ListsService } from './lists.service'
import { CreateListDto } from './dto/create-list.dto'
import { UpdateListDto } from './dto/update-list.dto'
import { AddItemDto } from './dto/add-item.dto'
import { UpdateItemDto } from './dto/update-item.dto'
import { RunCommandsDto } from './dto/run-commands.dto'
import { ChangeStatusDto } from './dto/change-status.dto'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

const WRITE_ROLES = [UserRole.ADMIN, UserRole.ALMACENERO] as const

@Controller('lists')
export class ListsController {
  constructor(private readonly lists: ListsService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    return this.lists.findAll({ projectId, status })
  }

  @Get('pending')
  pending() {
    return this.lists.findPendingConfirmation()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lists.findOne(id)
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateListDto, @CurrentUser() user: AuthUser) {
    return this.lists.create(dto, user.id)
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateListDto) {
    return this.lists.update(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.lists.remove(id)
  }

  // ---- líneas de material ----

  @Post(':id/items')
  @Roles(...WRITE_ROLES)
  addItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    return this.lists.addItem(id, dto)
  }

  @Patch(':id/items/:itemId')
  @Roles(...WRITE_ROLES)
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.lists.updateItem(id, itemId, dto)
  }

  @Delete(':id/items/:itemId')
  @Roles(...WRITE_ROLES)
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.lists.removeItem(id, itemId)
  }

  // ---- barra de comandos ----

  @Post(':id/commands')
  @Roles(...WRITE_ROLES)
  runCommands(@Param('id') id: string, @Body() dto: RunCommandsDto) {
    return this.lists.runCommands(id, dto.text)
  }

  // ---- flujo de estados ----

  @Patch(':id/status')
  @Roles(...WRITE_ROLES)
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lists.changeStatus(id, dto.status, user)
  }

  @Post(':id/confirm')
  @Roles(...WRITE_ROLES)
  confirm(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.lists.changeStatus(id, MaterialListStatus.CONFIRMADO, user)
  }

  @Post(':id/send')
  @Roles(...WRITE_ROLES)
  send(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.lists.send(id, user)
  }

  // ---- exportación ----

  @Get(':id/export')
  async export(
    @Param('id') id: string,
    @Query('format') format: 'html' | 'csv' | 'text' = 'csv',
    @Res() res: Response,
  ) {
    const content = await this.lists.exportDocument(id, format)
    const types: Record<string, string> = {
      csv: 'text/csv; charset=utf-8',
      html: 'text/html; charset=utf-8',
      text: 'text/plain; charset=utf-8',
    }
    const ext = format === 'html' ? 'html' : format === 'text' ? 'txt' : 'csv'
    res.setHeader('Content-Type', types[format])
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="registro-${id}.${ext}"`,
    )
    res.send(content)
  }

  @Get(':id/document')
  async document(@Param('id') id: string, @Res() res: Response) {
    const html = await this.lists.renderHtml(id)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  }
}
