import { Test, TestingModule } from '@nestjs/testing';
import {
  AjustarSaldo,
  ConsultarSaldo,
  ListarAbaixoDoMinimo,
  ListarMovimentacoes,
  MotivoMovimentacaoEstoque,
  RegistrarEntrada,
  RegistrarSaida,
} from '@repo/inventory';
import { Result } from '@repo/shared';
import { InventoryCommandsController } from './inventory-commands.controller';
import { InventoryQueriesController } from './inventory-queries.controller';

describe('Inventory controllers', () => {
  let commandsController: InventoryCommandsController;
  let queriesController: InventoryQueriesController;

  const registrarEntrada = { execute: jest.fn() };
  const registrarSaida = { execute: jest.fn() };
  const ajustarSaldo = { execute: jest.fn() };
  const consultarSaldo = { execute: jest.fn() };
  const listarMovimentacoes = { execute: jest.fn() };
  const listarAbaixoDoMinimo = { execute: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryCommandsController, InventoryQueriesController],
      providers: [
        { provide: RegistrarEntrada, useValue: registrarEntrada },
        { provide: RegistrarSaida, useValue: registrarSaida },
        { provide: AjustarSaldo, useValue: ajustarSaldo },
        { provide: ConsultarSaldo, useValue: consultarSaldo },
        { provide: ListarMovimentacoes, useValue: listarMovimentacoes },
        { provide: ListarAbaixoDoMinimo, useValue: listarAbaixoDoMinimo },
      ],
    }).compile();

    commandsController = module.get(InventoryCommandsController);
    queriesController = module.get(InventoryQueriesController);
  });

  test('delegates stock entry requests to RegistrarEntrada', async () => {
    registrarEntrada.execute.mockResolvedValue(Result.ok(undefined));

    await commandsController.createEntry(
      {
        variacaoId: '11111111-1111-1111-1111-111111111111',
        quantidade: 5,
        motivo: MotivoMovimentacaoEstoque.COMPRA,
      },
      '99999999-9999-9999-9999-999999999999',
    );

    expect(registrarEntrada.execute).toHaveBeenCalledWith({
      variacaoId: '11111111-1111-1111-1111-111111111111',
      quantidade: 5,
      motivo: MotivoMovimentacaoEstoque.COMPRA,
      usuarioId: '99999999-9999-9999-9999-999999999999',
    });
  });

  test('delegates balance lookups to ConsultarSaldo', async () => {
    consultarSaldo.execute.mockResolvedValue(
      Result.ok({
        variacaoId: '11111111-1111-1111-1111-111111111111',
        saldoAtual: 10,
        estoqueMinimo: 3,
      }),
    );

    await queriesController.getBalance('11111111-1111-1111-1111-111111111111');

    expect(consultarSaldo.execute).toHaveBeenCalledWith({
      variacaoId: '11111111-1111-1111-1111-111111111111',
    });
  });
});
