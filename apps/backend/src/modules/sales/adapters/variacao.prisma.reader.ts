import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma.service';

/// Resolved variation snapshot used by the add-item route to bind a line's
/// `variacaoId` and its price snapshot (`precoUnitario`, cents). The price is
/// copied into the sale line at add time (design D5) and never re-read.
export interface VariacaoResolvida {
  variacaoId: string;
  precoUnitario: number;
}

/// Resolves a catalog variation by one of three identifiers (`variacaoId`, `sku`,
/// or `codigoBarras`/barcode) and returns its current price in cents. Read-only;
/// lives in the vendas module so add-item never reaches into another module's
/// use cases (only its persisted catalog data).
@Injectable()
export class VariacaoPrismaReader {
  constructor(private readonly prisma: PrismaService) {}

  async resolver(input: {
    variacaoId?: string;
    sku?: string;
    codigoBarras?: string;
  }): Promise<VariacaoResolvida | null> {
    const row = await this.findRow(input);
    if (!row) {
      return null;
    }
    return { variacaoId: row.id, precoUnitario: row.priceCents };
  }

  private async findRow(input: {
    variacaoId?: string;
    sku?: string;
    codigoBarras?: string;
  }) {
    if (input.variacaoId) {
      return this.prisma.client.variation.findUnique({
        where: { id: input.variacaoId },
        select: { id: true, priceCents: true },
      });
    }
    if (input.sku) {
      return this.prisma.client.variation.findUnique({
        where: { sku: input.sku },
        select: { id: true, priceCents: true },
      });
    }
    if (input.codigoBarras) {
      return this.prisma.client.variation.findUnique({
        where: { barcode: input.codigoBarras },
        select: { id: true, priceCents: true },
      });
    }
    return null;
  }
}
