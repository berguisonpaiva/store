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
  USER_INACTIVE: (c) => new ForbiddenException(c),
  INVALID_CREDENTIALS: (c) => new UnauthorizedException(c),
  INVALID_TOKEN: (c) => new UnauthorizedException(c),
  INVALID_CURRENT_PASSWORD: (c) => new BadRequestException(c),
  // Catalog (products / variations / categories)
  PRODUCT_NOT_FOUND: (c) => new NotFoundException(c),
  VARIATION_NOT_FOUND: (c) => new NotFoundException(c),
  CATEGORY_NOT_FOUND: (c) => new NotFoundException(c),
  SKU_ALREADY_IN_USE: (c) => new ConflictException(c),
  BARCODE_ALREADY_IN_USE: (c) => new ConflictException(c),
  CATEGORY_NAME_ALREADY_IN_USE: (c) => new ConflictException(c),
  PRODUCT_MUST_HAVE_VARIATION: (c) => new BadRequestException(c),
  CATEGORY_NOT_FOUND_FOR_PRODUCT: (c) => new BadRequestException(c),
  // Inventory
  ESTOQUE_INSUFICIENTE: (c) => new ConflictException(c),
  VARIACAO_NAO_ENCONTRADA: (c) => new NotFoundException(c),
  QUANTIDADE_INVALIDA: (c) => new BadRequestException(c),
  // Caixa (cash session)
  CASH_SESSION_ALREADY_OPEN: (c) => new ConflictException(c),
  CASH_SESSION_NOT_FOUND: (c) => new NotFoundException(c),
  CASH_SESSION_ALREADY_CLOSED: (c) => new ConflictException(c),
  PENDING_SALE_IN_SESSION: (c) => new UnprocessableEntityException(c),
  // Vendas (PDV sales)
  SALE_NOT_FOUND: (c) => new NotFoundException(c),
  ITEM_NOT_FOUND: (c) => new NotFoundException(c),
  SALE_ALREADY_FINALIZED: (c) => new ConflictException(c),
  SALE_NOT_OPEN: (c) => new ConflictException(c),
  NO_OPEN_CASH_SESSION: (c) => new UnprocessableEntityException(c),
  INSUFFICIENT_STOCK: (c) => new UnprocessableEntityException(c),
  PAYMENT_MISMATCH: (c) => new UnprocessableEntityException(c),
  SALE_HAS_NO_ITEMS: (c) => new UnprocessableEntityException(c),
  CASH_SESSION_CLOSED: (c) => new UnprocessableEntityException(c),
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
