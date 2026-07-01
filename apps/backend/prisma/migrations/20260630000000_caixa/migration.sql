-- CreateTable
CREATE TABLE "sessoes_caixa" (
    "id" UUID NOT NULL,
    "operadorId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "valorAbertura" DECIMAL(12,2) NOT NULL,
    "valorFechamento" DECIMAL(12,2),
    "abertaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessoes_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_caixa" (
    "id" UUID NOT NULL,
    "sessaoId" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "observacao" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_caixa_pkey" PRIMARY KEY ("id")
);

-- Safety-net checks only. Domain invariants still live in `@repo/sales`.
ALTER TABLE "sessoes_caixa"
ADD CONSTRAINT "sessoes_caixa_valorAbertura_non_negative_check"
CHECK ("valorAbertura" >= 0);

ALTER TABLE "sessoes_caixa"
ADD CONSTRAINT "sessoes_caixa_valorFechamento_non_negative_check"
CHECK ("valorFechamento" IS NULL OR "valorFechamento" >= 0);

ALTER TABLE "movimentacoes_caixa"
ADD CONSTRAINT "movimentacoes_caixa_valor_positive_check"
CHECK ("valor" > 0);

-- CreateIndex
CREATE INDEX "sessoes_caixa_operadorId_idx" ON "sessoes_caixa"("operadorId");

-- Partial unique index: at most one ABERTO session per operator. Prisma cannot
-- express a partial unique index natively, so it is authored here. This is the
-- authoritative concurrency guard backing the `abrir-caixa` use-case check
-- (design decision D3); a violation surfaces as Prisma P2002 and is mapped to
-- CASH_SESSION_ALREADY_OPEN.
CREATE UNIQUE INDEX "sessoes_caixa_operadorId_aberto_key"
ON "sessoes_caixa"("operadorId")
WHERE "status" = 'ABERTO';

-- CreateIndex
CREATE INDEX "movimentacoes_caixa_sessaoId_criadaEm_idx" ON "movimentacoes_caixa"("sessaoId", "criadaEm" DESC);

-- AddForeignKey
ALTER TABLE "movimentacoes_caixa" ADD CONSTRAINT "movimentacoes_caixa_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "sessoes_caixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
