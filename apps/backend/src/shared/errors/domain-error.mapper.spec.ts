import {
  BadRequestException,
  ConflictException,
  NotFoundException,
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
});
