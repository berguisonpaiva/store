-- Reconciliation: stock reservation (quantidadeReservada) was never written by any
-- use case, so saldoDisponivel always equalled saldoAtual. Drop the dead column and
-- its non-negative check constraint; the balance model is now saldoAtual + estoqueMinimo.
ALTER TABLE "estoque_saldos"
DROP CONSTRAINT IF EXISTS "estoque_saldos_quantidadeReservada_non_negative_check";

ALTER TABLE "estoque_saldos"
DROP COLUMN "quantidadeReservada";
