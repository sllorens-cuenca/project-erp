import { IsString, MinLength } from 'class-validator'

export class RunCommandsDto {
  /**
   * Texto libre con uno o varios comandos, separados por saltos de línea
   * o por ";". Ejemplos:
   *   /cobre 25 m
   *   +regleta 10
   *   tuberia 12/14 5
   */
  @IsString()
  @MinLength(1)
  text!: string
}
