import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export interface SendMailInput {
  to: string | string[]
  cc?: string | string[]
  subject: string
  html: string
  text?: string
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter

  constructor() {
    this.transporter = this.buildTransporter()
  }

  /**
   * Crea el transporte según MAIL_TRANSPORT:
   *  - "json": no envía nada, imprime el correo en consola (desarrollo).
   *  - "smtp": envía por SMTP (Gmail, Outlook, proveedor transaccional...).
   */
  private buildTransporter(): Transporter {
    const transport = process.env.MAIL_TRANSPORT ?? 'json'

    if (transport === 'smtp') {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      })
    }

    // Transporte "json": genera el mensaje pero no lo envía.
    return nodemailer.createTransport({ jsonTransport: true })
  }

  async send(input: SendMailInput): Promise<void> {
    const from = process.env.MAIL_FROM ?? 'Almacen <almacen@example.com>'
    const info = await this.transporter.sendMail({
      from,
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })

    if ((process.env.MAIL_TRANSPORT ?? 'json') === 'json') {
      this.logger.log(
        `[MAIL:json] Para=${input.to} Asunto="${input.subject}" (no enviado, transporte de desarrollo)`,
      )
      this.logger.debug(info.message?.toString())
    }
  }
}
