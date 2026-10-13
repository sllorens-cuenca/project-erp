import { Body, Controller, Get, Patch, Post } from '@nestjs/common'
import { UserRole } from '@erp/shared'
import { RemindersService } from './reminders.service'
import { UpdateReminderConfigDto } from './dto/update-reminder-config.dto'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get('config')
  config() {
    return this.reminders.getConfig()
  }

  @Patch('config')
  @Roles(UserRole.ADMIN)
  update(@Body() dto: UpdateReminderConfigDto) {
    return this.reminders.updateConfig(dto)
  }

  @Get('history')
  history() {
    return this.reminders.history()
  }

  /** Lanza el recordatorio manualmente (útil para probar). */
  @Post('run')
  @Roles(UserRole.ADMIN, UserRole.ALMACENERO)
  run() {
    return this.reminders.run()
  }
}
