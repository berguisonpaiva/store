import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { toHttpException } from './domain-error.mapper';

describe('domain-error.mapper', () => {
  test('maps inventory domain errors to the expected HTTP exceptions', () => {
    expect(toHttpException(['ESTOQUE_INSUFICIENTE'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['VARIACAO_NAO_ENCONTRADA'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['QUANTIDADE_INVALIDA'])).toBeInstanceOf(
      BadRequestException,
    );
  });

  test('maps auth/user domain errors to the expected HTTP exceptions', () => {
    expect(toHttpException(['EMAIL_ALREADY_IN_USE'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['USER_NOT_FOUND'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['OPERATION_NOT_ALLOWED_FOR_ROLE'])).toBeInstanceOf(
      ForbiddenException,
    );
    expect(toHttpException(['INVALID_CREDENTIALS'])).toBeInstanceOf(
      UnauthorizedException,
    );
    expect(toHttpException(['INVALID_TOKEN'])).toBeInstanceOf(
      UnauthorizedException,
    );
    expect(toHttpException(['USER_INACTIVE'])).toBeInstanceOf(
      UnauthorizedException,
    );
    expect(toHttpException(['CANNOT_DEACTIVATE_SELF'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  test('maps catalog domain errors to the expected HTTP exceptions', () => {
    expect(toHttpException(['CATEGORY_ALREADY_EXISTS'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['SKU_ALREADY_IN_USE'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['BARCODE_ALREADY_IN_USE'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['CATEGORY_NOT_FOUND'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['PRODUCT_NOT_FOUND'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['VARIATION_NOT_FOUND'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['CATEGORY_INACTIVE'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(toHttpException(['INVALID_PRICE'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(toHttpException(['PRODUCT_MUST_HAVE_VARIATION'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  test('maps caixa (PT) domain errors to the expected HTTP exceptions', () => {
    expect(toHttpException(['CAIXA_JA_ABERTO'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['CAIXA_JA_FECHADO'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['VENDA_PENDENTE_NO_FECHAMENTO'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(toHttpException(['CAIXA_NAO_ENCONTRADO'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['NAO_E_DONO_DO_CAIXA'])).toBeInstanceOf(
      ForbiddenException,
    );
    expect(toHttpException(['ACESSO_NEGADO'])).toBeInstanceOf(
      ForbiddenException,
    );
    expect(toHttpException(['VALOR_INVALIDO'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  test('maps venda domain errors to the expected HTTP exceptions', () => {
    expect(toHttpException(['SALE_NOT_FOUND'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['ITEM_NOT_FOUND'])).toBeInstanceOf(
      NotFoundException,
    );
    expect(toHttpException(['SALE_ALREADY_FINALIZED'])).toBeInstanceOf(
      ConflictException,
    );
    expect(toHttpException(['NO_OPEN_CASH_SESSION'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(toHttpException(['INSUFFICIENT_STOCK'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(toHttpException(['PAYMENT_MISMATCH'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(toHttpException(['DISCOUNT_EXCEEDS_SUBTOTAL'])).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(toHttpException(['INVALID_QUANTITY'])).toBeInstanceOf(
      BadRequestException,
    );
  });
});
