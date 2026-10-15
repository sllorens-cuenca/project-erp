import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'

import { JwtAuthGuard, RolesGuard } from './common/guards/auth.guards'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ClientsModule } from './clients/clients.module'
import { ProjectsModule } from './projects/projects.module'
import { MaterialsModule } from './materials/materials.module'
import { StockModule } from './stock/stock.module'
import { ListsModule } from './lists/lists.module'
import { MailModule } from './mail/mail.module'
import { RemindersModule } from './reminders/reminders.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ProjectsModule,
    MaterialsModule,
    StockModule,
    ListsModule,
    RemindersModule,
    HealthModule,
  ],
  providers: [
    // Autenticación y roles para toda la app (salvo @Public()).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
