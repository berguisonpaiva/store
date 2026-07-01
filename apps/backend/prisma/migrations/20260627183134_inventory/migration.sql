-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" UUID NOT NULL,
    "variacaoId" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldoResultante" INTEGER NOT NULL,
    "origemVendaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_saldos" (
    "id" UUID NOT NULL,
    "variacaoId" UUID NOT NULL,
    "saldoAtual" INTEGER NOT NULL,
    "quantidadeReservada" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_saldos_pkey" PRIMARY KEY ("id")
);

-- Safety-net checks only. Domain invariants still live in `@repo/inventory`.
ALTER TABLE "estoque_saldos"
ADD CONSTRAINT "estoque_saldos_saldoAtual_non_negative_check"
CHECK ("saldoAtual" >= 0);

ALTER TABLE "estoque_saldos"
ADD CONSTRAINT "estoque_saldos_quantidadeReservada_non_negative_check"
CHECK ("quantidadeReservada" >= 0);

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_variacaoId_createdAt_idx" ON "movimentacoes_estoque"("variacaoId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_origemVendaId_idx" ON "movimentacoes_estoque"("origemVendaId");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_saldos_variacaoId_key" ON "estoque_saldos"("variacaoId");

-- CreateIndex
CREATE INDEX "estoque_saldos_saldoAtual_estoqueMinimo_idx" ON "estoque_saldos"("saldoAtual", "estoqueMinimo");

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "variations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_saldos" ADD CONSTRAINT "estoque_saldos_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "variations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
