import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Result } from '@repo/shared';

/// Maps stable domain error codes to HTTP exceptions. Controllers stay free of
/// rule logic; they only translate `Result` failures.
const ERROR_MAP: Record<string, (code: string) => HttpException> = {
  EMAIL_ALREADY_IN_USE: (c) => new ConflictException(c),
  USER_NOT_FOUND: (c) => new NotFoundException(c),
  OPERATION_NOT_ALLOWED_FOR_ROLE: (c) => new ForbiddenException(c),
  USER_INACTIVE: (c) => new UnauthorizedException(c),
  CANNOT_DEACTIVATE_SELF: (c) => new BadRequestException(c),
  INVALID_CREDENTIALS: (c) => new UnauthorizedException(c),
  INVALID_TOKEN: (c) => new UnauthorizedException(c),
  // Catalog (products / variations / categories)
  PRODUCT_NOT_FOUND: (c) => new NotFoundException(c),
  VARIATION_NOT_FOUND: (c) => new NotFoundException(c),
  CATEGORY_NOT_FOUND: (c) => new NotFoundException(c),
  SKU_ALREADY_IN_USE: (c) => new ConflictException(c),
  BARCODE_ALREADY_IN_USE: (c) => new ConflictException(c),
  CATEGORY_ALREADY_EXISTS: (c) => new ConflictException(c),
  CATEGORY_INACTIVE: (c) => new UnprocessableEntityException(c),
  PRODUCT_MUST_HAVE_VARIATION: (c) => new UnprocessableEntityException(c),
  // Inventory
  ESTOQUE_INSUFICIENTE: (c) => new UnprocessableEntityException(c),
  LEDGER_IMUTAVEL: (c) => new ConflictException(c),
  VARIACAO_NAO_ENCONTRADA: (c) => new NotFoundException(c),
  QUANTIDADE_INVALIDA: (c) => new BadRequestException(c),
  MOTIVO_MOVIMENTACAO_INVALIDO: (c) => new BadRequestException(c),
  SALDO_INVALIDO: (c) => new BadRequestException(c),
  // Caixa (cash session) — Portuguese codes (sales-module, Decision 2)
  CAIXA_JA_ABERTO: (c) => new ConflictException(c),
  CAIXA_NAO_ENCONTRADO: (c) => new NotFoundException(c),
  CAIXA_JA_FECHADO: (c) => new ConflictException(c),
  VENDA_PENDENTE_NO_FECHAMENTO: (c) => new ConflictException(c),
  NAO_E_DONO_DO_CAIXA: (c) => new ForbiddenException(c),
  ACESSO_NEGADO: (c) => new ForbiddenException(c),
  VALOR_INVALIDO: (c) => new BadRequestException(c),
  // Vendas (PDV sales). `VARIACAO_NAO_ENCONTRADA` (404) and `ACESSO_NEGADO` (403)
  // are shared string codes already mapped above by inventory/caixa — the mapper
  // keys on the code string, so they are intentionally NOT duplicated here.
  VARIACAO_INATIVA: (c) => new UnprocessableEntityException(c),
  SALE_NOT_FOUND: (c) => new NotFoundException(c),
  ITEM_NOT_FOUND: (c) => new NotFoundException(c),
  SALE_ALREADY_FINALIZED: (c) => new ConflictException(c),
  SALE_NOT_OPEN: (c) => new ConflictException(c),
  NO_OPEN_CASH_SESSION: (c) => new ConflictException(c),
  INSUFFICIENT_STOCK: (c) => new UnprocessableEntityException(c),
  PAYMENT_MISMATCH: (c) => new UnprocessableEntityException(c),
  SALE_HAS_NO_ITEMS: (c) => new UnprocessableEntityException(c),
  CASH_SESSION_CLOSED: (c) => new ConflictException(c),
  DISCOUNT_EXCEEDS_SUBTOTAL: (c) => new UnprocessableEntityException(c),
  INVALID_QUANTITY: (c) => new BadRequestException(c),
  INVALID_PRICE: (c) => new BadRequestException(c),
  INVALID_DISCOUNT: (c) => new BadRequestException(c),
  INVALID_PAYMENT: (c) => new BadRequestException(c),
};

export function toHttpException(errors: string[]): HttpException {
  const code = errors?.[0] ?? 'UNKNOWN_ERROR';
  const factory = ERROR_MAP[code];
  return factory ? factory(code) : new BadRequestException(code);
}

/// Returns the success value or throws the mapped HTTP exception.
export function unwrap<T>(result: Result<T>): T {
  if (result.isFailure) {
    throw toHttpException(result.errors);
  }
  return result.instance;
}
