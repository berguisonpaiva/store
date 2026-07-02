import { BadRequestException, HttpStatus } from '@nestjs/common';
import { toHttpException } from './domain-error.mapper';

describe('domain-error.mapper', () => {
  const canonicalTable: Array<[number, string[]]> = [
    [
      HttpStatus.UNAUTHORIZED,
      ['INVALID_CREDENTIALS', 'INVALID_TOKEN', 'USER_INACTIVE'],
    ],
    [
      HttpStatus.FORBIDDEN,
      ['OPERATION_NOT_ALLOWED_FOR_ROLE', 'ACESSO_NEGADO', 'NAO_E_DONO_DO_CAIXA'],
    ],
    [
      HttpStatus.NOT_FOUND,
      [
        'USER_NOT_FOUND',
        'CATEGORY_NOT_FOUND',
        'PRODUCT_NOT_FOUND',
        'VARIATION_NOT_FOUND',
        'VARIACAO_NAO_ENCONTRADA',
        'CAIXA_NAO_ENCONTRADO',
        'SALE_NOT_FOUND',
        'ITEM_NOT_FOUND',
      ],
    ],
    [
      HttpStatus.CONFLICT,
      [
        'EMAIL_ALREADY_IN_USE',
        'CATEGORY_ALREADY_EXISTS',
        'SKU_ALREADY_IN_USE',
        'BARCODE_ALREADY_IN_USE',
        'LEDGER_IMUTAVEL',
        'CAIXA_JA_ABERTO',
        'CAIXA_JA_FECHADO',
        'NO_OPEN_CASH_SESSION',
        'CASH_SESSION_CLOSED',
        'VENDA_PENDENTE_NO_FECHAMENTO',
        'SALE_ALREADY_FINALIZED',
        'SALE_NOT_OPEN',
      ],
    ],
    [
      HttpStatus.UNPROCESSABLE_ENTITY,
      [
        'INSUFFICIENT_STOCK',
        'ESTOQUE_INSUFICIENTE',
        'PAYMENT_MISMATCH',
        'SALE_HAS_NO_ITEMS',
        'DISCOUNT_EXCEEDS_SUBTOTAL',
        'VARIACAO_INATIVA',
        'CATEGORY_INACTIVE',
        'PRODUCT_MUST_HAVE_VARIATION',
      ],
    ],
    [
      HttpStatus.BAD_REQUEST,
      [
        'INVALID_ROLE',
        'INVALID_QUANTITY',
        'QUANTIDADE_INVALIDA',
        'INVALID_DISCOUNT',
        'INVALID_PAYMENT',
        'INVALID_PRICE',
        'VALOR_INVALIDO',
        'SALDO_INVALIDO',
        'MOTIVO_MOVIMENTACAO_INVALIDO',
        'CANNOT_DEACTIVATE_SELF',
      ],
    ],
  ];

  test.each(
    canonicalTable.flatMap(([status, codes]) =>
      codes.map((code) => ({ code, status })),
    ),
  )('maps $code to HTTP $status', ({ code, status }) => {
    const exception = toHttpException([code]);

    expect(exception.getStatus()).toBe(status);
    expect(exception.message).toBe(code);
  });

  test('falls back to bad request for unknown codes', () => {
    const exception = toHttpException(['UNKNOWN_CODE']);

    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toBe('UNKNOWN_CODE');
  });
});
