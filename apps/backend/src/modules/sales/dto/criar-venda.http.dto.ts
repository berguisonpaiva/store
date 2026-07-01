import { ApiProperty } from '@nestjs/swagger';

/// `POST /vendas` body. Empty by design (D7): `usuarioId` and `sessaoCaixaId` are
/// derived from the authenticated operator's open session, never from the body.
export class CriarVendaInDTO {
  @ApiProperty({
    required: false,
    description:
      'No fields. Operator and cash session come from the authenticated context.',
  })
  readonly _?: never;
}
