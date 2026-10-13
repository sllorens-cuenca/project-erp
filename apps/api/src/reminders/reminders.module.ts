import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersController } from './reminders.controller'
import { ListsModule } from '../lists/lists.module'

@Module({
  imports: [ListsModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
