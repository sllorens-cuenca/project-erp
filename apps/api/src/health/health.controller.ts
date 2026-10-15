import { Controller, Get } from '@nestjs/common'
import { Public } from '../common/decorators/public.decorator'

/**
 * Estado del servicio. Público a propósito: sirve para comprobar de un vistazo
 * qué commit está desplegado en cada entorno (Render expone `RENDER_GIT_COMMIT`).
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return {
      ok: true,
      commit: process.env.RENDER_GIT_COMMIT ?? null,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }
}
