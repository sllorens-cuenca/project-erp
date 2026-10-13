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
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  findAll(
    @Query('clientId') clientId?: string,
    @Query('serviceType') serviceType?: string,
  ) {
    return this.projects.findAll({ clientId, serviceType })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projects.findOne(id)
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  remove(@Param('id') id: string) {
    return this.projects.remove(id)
  }
}
