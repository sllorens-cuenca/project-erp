import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  MATERIAL_LIST_STATUS_LABELS,
  MaterialListStatus,
  SERVICE_TYPE_LABELS,
  ServiceType,
} from '@erp/shared'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'
import { ListsService } from '../lists/lists.service'
import { UpdateReminderConfigDto } from './dto/update-reminder-config.dto'

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name)
  private lastRunDate: string | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly lists: ListsService,
  ) {}

  async onModuleInit() {
    await this.getConfig()
  }

  async getConfig() {
    const existing = await this.prisma.jobConfig.findUnique({
      where: { id: 'reminder' },
    })
    if (existing) return existing
    return this.prisma.jobConfig.create({
      data: {
        id: 'reminder',
        enabled: process.env.REMINDER_ENABLED !== 'false',
        hour: Number(process.env.REMINDER_HOUR ?? 8),
        minute: Number(process.env.REMINDER_MINUTE ?? 0),
      },
    })
  }

  async updateConfig(dto: UpdateReminderConfigDto) {
    await this.getConfig()
    return this.prisma.jobConfig.update({
      where: { id: 'reminder' },
      data: dto,
    })
  }

  /**
   * Se comprueba cada minuto; cuando la hora configurada coincide y aún no
   * se ha lanzado hoy, se envía el recordatorio. Es un patrón sencillo que
   * permite cambiar la hora en caliente sin reiniciar el proceso.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    const config = await this.getConfig()
    if (!config.enabled) return

    const now = new Date()
    if (now.getHours() !== config.hour || now.getMinutes() !== config.minute) {
      return
    }
    const today = now.toISOString().slice(0, 10)
    if (this.lastRunDate === today) return
    this.lastRunDate = today

    await this.run()
  }

  /** Envía el recordatorio diario con los registros pendientes de confirmar. */
  async run() {
    const pending = await this.lists.findPendingConfirmation()
    const to = process.env.INTERNAL_EMAIL
    const subject = `Recordatorio de almacén: ${pending.length} registro(s) por confirmar`

    const rows = pending
      .map((l) => {
        const label =
          MATERIAL_LIST_STATUS_LABELS[l.status as MaterialListStatus] ??
          l.status
        const service =
          SERVICE_TYPE_LABELS[l.project.serviceType as ServiceType] ??
          l.project.serviceType
        return `<li><b>${escapeHtml(l.project.client.name)}</b> — ${escapeHtml(
          l.project.name,
        )} (${escapeHtml(service)}) · ${l._count.items} líneas · estado: ${escapeHtml(
          label,
        )}</li>`
      })
      .join('')

    const html = `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;color:#1f2937">
      <h2>Recordatorio diario de almacén</h2>
      ${
        pending.length === 0
          ? '<p>No hay registros pendientes de confirmar. ¡Todo al día! ✅</p>'
          : `<p>Tienes <b>${pending.length}</b> registro(s) pendientes de verificar y confirmar:</p><ul>${rows}</ul>`
      }
    </body></html>`

    if (to) {
      try {
        await this.mail.send({ to, subject, html })
      } catch (err) {
        this.logger.error(`Fallo al enviar recordatorio: ${String(err)}`)
      }
    } else {
      this.logger.warn(
        'Recordatorio generado pero INTERNAL_EMAIL no está configurado',
      )
    }

    return this.prisma.reminderLog.create({
      data: {
        pendingCount: pending.length,
        details: pending.map((l) => `${l.project.client.name}/${l.project.name}`).join(', '),
      },
    })
  }

  history() {
    return this.prisma.reminderLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 30,
    })
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
