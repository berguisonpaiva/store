import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AjustarSaldo,
  RegistrarEntrada,
  RegistrarSaida,
} from '@repo/inventory';
import { UserRole } from '@repo/auth';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import {
  InventoryAdjustmentHttpDto,
  InventoryEntryHttpDto,
  InventoryExitHttpDto,
} from './dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('inventory')
export class InventoryCommandsController {
  constructor(
    private readonly registrarEntrada: RegistrarEntrada,
    private readonly registrarSaida: RegistrarSaida,
    private readonly ajustarSaldo: AjustarSaldo,
  ) {}

  @Post('entries')
  @HttpCode(201)
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Register a stock entry' })
  @ApiCreatedResponse({ description: 'Entry registered' })
  async createEntry(
    @Body() dto: InventoryEntryHttpDto,
    @CurrentUser('id') usuarioId: string,
  ) {
    return unwrap(
      await this.registrarEntrada.execute({
        variacaoId: dto.variacaoId,
        quantidade: dto.quantidade,
        motivo: dto.motivo,
        usuarioId,
      }),
    );
  }

  @Post('exits')
  @HttpCode(201)
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Register a manual stock exit' })
  @ApiCreatedResponse({ description: 'Exit registered' })
  async createExit(
    @Body() dto: InventoryExitHttpDto,
    @CurrentUser('id') usuarioId: string,
  ) {
    return unwrap(
      await this.registrarSaida.execute({
        variacaoId: dto.variacaoId,
        quantidade: dto.quantidade,
        motivo: dto.motivo,
        usuarioId,
      }),
    );
  }

  @Post('adjustments')
  @HttpCode(201)
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Adjust inventory balance to an absolute value' })
  @ApiCreatedResponse({ description: 'Adjustment registered' })
  async createAdjustment(
    @Body() dto: InventoryAdjustmentHttpDto,
    @CurrentUser('id') usuarioId: string,
  ) {
    return unwrap(
      await this.ajustarSaldo.execute({
        variacaoId: dto.variacaoId,
        novoSaldo: dto.novoSaldo,
        observacao: dto.observacao,
        usuarioId,
      }),
    );
  }
}
