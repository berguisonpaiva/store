-- CreateTable
CREATE TABLE "vendas" (
    "id" UUID NOT NULL,
    "numero" INTEGER,
    "canal" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "usuarioId" UUID NOT NULL,
    "sessaoCaixaId" UUID NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "desconto" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "id" UUID NOT NULL,
    "vendaId" UUID NOT NULL,
    "variacaoId" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" UUID NOT NULL,
    "vendaId" UUID NOT NULL,
    "forma" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- Safety-net checks only. Domain invariants still live in `@repo/sales`.
ALTER TABLE "vendas"
ADD CONSTRAINT "vendas_subtotal_non_negative_check" CHECK ("subtotal" >= 0);
ALTER TABLE "vendas"
ADD CONSTRAINT "vendas_desconto_non_negative_check" CHECK ("desconto" >= 0);
ALTER TABLE "vendas"
ADD CONSTRAINT "vendas_total_non_negative_check" CHECK ("total" >= 0);
ALTER TABLE "itens_venda"
ADD CONSTRAINT "itens_venda_quantidade_positive_check" CHECK ("quantidade" > 0);
ALTER TABLE "pagamentos"
ADD CONSTRAINT "pagamentos_valor_positive_check" CHECK ("valor" > 0);

-- Atomic, gap-tolerant source of the human-readable receipt `numero` (design D4).
-- `proximoNumero(tx?)` calls `nextval('vendas_numero_seq')`; nextval is atomic and
-- non-transactional, so concurrent sales never receive the same number. The
-- UNIQUE constraint on "vendas"."numero" is the authoritative backstop: a
-- collision surfaces as Prisma P2002.
CREATE SEQUENCE "vendas_numero_seq" START WITH 1 INCREMENT BY 1;

-- CreateIndex
CREATE UNIQUE INDEX "vendas_numero_key" ON "vendas"("numero");
CREATE INDEX "vendas_usuarioId_idx" ON "vendas"("usuarioId");
CREATE INDEX "vendas_sessaoCaixaId_idx" ON "vendas"("sessaoCaixaId");
CREATE INDEX "vendas_status_criadaEm_idx" ON "vendas"("status", "criadaEm" DESC);

-- CreateIndex
CREATE INDEX "itens_venda_vendaId_idx" ON "itens_venda"("vendaId");

-- CreateIndex
CREATE INDEX "pagamentos_vendaId_idx" ON "pagamentos"("vendaId");

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_vendaId_fkey"
  FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_vendaId_fkey"
  FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
