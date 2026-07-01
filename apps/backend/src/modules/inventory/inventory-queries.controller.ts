import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConsultarSaldo,
  ListarAbaixoDoMinimo,
  ListarMovimentacoes,
} from '@repo/inventory';
import { UserRole } from '@repo/auth';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { ListInventoryMovementsQueryDto } from './dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('inventory')
export class InventoryQueriesController {
  constructor(
    private readonly consultarSaldo: ConsultarSaldo,
    private readonly listarMovimentacoes: ListarMovimentacoes,
    private readonly listarAbaixoDoMinimo: ListarAbaixoDoMinimo,
  ) {}

  @Get('variations/:variacaoId/balance')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Fetch current and available balance for a variation' })
  @ApiOkResponse({ description: 'Balance returned' })
  async getBalance(@Param('variacaoId') variacaoId: string) {
    return unwrap(await this.consultarSaldo.execute({ variacaoId }));
  }

  @Get('variations/:variacaoId/movements')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'List variation movements with pagination and period filter' })
  @ApiOkResponse({ description: 'Movements returned' })
  async listMovements(
    @Param('variacaoId') variacaoId: string,
    @Query() query: ListInventoryMovementsQueryDto,
  ) {
    return unwrap(
      await this.listarMovimentacoes.execute({
        variacaoId,
        page: query.page,
        pageSize: query.pageSize,
        startDate: query.from,
        endDate: query.to,
      }),
    );
  }

  @Get('low-stock')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List variations below minimum stock' })
  @ApiOkResponse({ description: 'Low-stock variations returned' })
  async listLowStock() {
    return unwrap(await this.listarAbaixoDoMinimo.execute({}));
  }
}
