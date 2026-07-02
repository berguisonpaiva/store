import { Injectable } from '@nestjs/common';
import { VariacaoGateway, VariacaoParaVenda } from '@repo/sales';
import { PrismaService } from '../../../db/prisma.service';

/// Resolved variation identity used by the add-item route to translate a
/// `sku`/`codigoBarras` reference into the canonical `variacaoId`. Price and
/// activity are NOT resolved here anymore — the domain re-reads them through
/// `VariacaoGateway.buscarParaVenda` (RN10) so the rules stay in the use case.
export interface VariacaoResolvida {
  variacaoId: string;
}

/// Catalog variation reader for the vendas module. Two roles:
///
/// 1. `resolver` — HTTP-edge helper that maps one of three identifiers
///    (`variacaoId`, `sku`, or `codigoBarras`/barcode) to the variation id.
/// 2. `buscarParaVenda` — the backend binding of the domain `VariacaoGateway`
///    port (design D1): returns the current price (cents) and whether the
///    variation is sellable. A variation is only `ativa` when BOTH its own
///    `active` flag and its product's `active` flag are true (soft-delete model).
///
/// Read-only; lives in the vendas module so add-item never reaches into another
/// module's use cases (only its persisted catalog data).
@Injectable()
export class VariacaoPrismaReader implements VariacaoGateway {
  constructor(private readonly prisma: PrismaService) {}

  async buscarParaVenda(variacaoId: string): Promise<VariacaoParaVenda | null> {
    const row = await this.prisma.client.variation.findUnique({
      where: { id: variacaoId },
      select: {
        id: true,
        priceCents: true,
        active: true,
        product: { select: { active: true } },
      },
    });
    if (!row) {
      return null;
    }
    return {
      variacaoId: row.id,
      preco: row.priceCents,
      ativa: row.active && row.product.active,
    };
  }

  async resolver(input: {
    variacaoId?: string;
    sku?: string;
    codigoBarras?: string;
  }): Promise<VariacaoResolvida | null> {
    const row = await this.findRow(input);
    if (!row) {
      return null;
    }
    return { variacaoId: row.id };
  }

  private async findRow(input: {
    variacaoId?: string;
    sku?: string;
    codigoBarras?: string;
  }) {
    if (input.variacaoId) {
      return this.prisma.client.variation.findUnique({
        where: { id: input.variacaoId },
        select: { id: true },
      });
    }
    if (input.sku) {
      return this.prisma.client.variation.findUnique({
        where: { sku: input.sku },
        select: { id: true },
      });
    }
    if (input.codigoBarras) {
      return this.prisma.client.variation.findUnique({
        where: { barcode: input.codigoBarras },
        select: { id: true },
      });
    }
    return null;
  }
}
