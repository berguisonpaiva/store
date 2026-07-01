-- Caixa PT reconciliation (sales-module change, Decision 2).
--
-- The `StatusSessaoCaixa` enum values were renamed `ABERTO -> ABERTA` and
-- `FECHADO -> FECHADA` in the domain. The persisted `status` string must move
-- with them, and the RN01 partial unique index predicate (one open session per
-- operator) must be re-created against the new `'ABERTA'` value. The rename
-- preserves every row — no data loss.

-- 1) Rewrite existing status values to the new PT vocabulary.
UPDATE "sessoes_caixa" SET "status" = 'ABERTA' WHERE "status" = 'ABERTO';
UPDATE "sessoes_caixa" SET "status" = 'FECHADA' WHERE "status" = 'FECHADO';

-- 2) Drop the old partial unique index (predicate `status = 'ABERTO'`).
DROP INDEX IF EXISTS "sessoes_caixa_operadorId_aberto_key";

-- 3) Re-create the partial unique index with the new predicate `status = 'ABERTA'`
-- (RN01). Prisma cannot express a partial unique index natively, so it is
-- authored here; a violation surfaces as Prisma P2002 and is mapped to
-- CAIXA_JA_ABERTO.
CREATE UNIQUE INDEX "sessoes_caixa_operadorId_aberta_key"
ON "sessoes_caixa"("operadorId")
WHERE "status" = 'ABERTA';

-- ---------------------------------------------------------------------------
-- DOWN MIGRATION (documented — Prisma migrations are forward-only). To revert,
-- run the following as a new migration:
--
--   UPDATE "sessoes_caixa" SET "status" = 'ABERTO' WHERE "status" = 'ABERTA';
--   UPDATE "sessoes_caixa" SET "status" = 'FECHADO' WHERE "status" = 'FECHADA';
--   DROP INDEX IF EXISTS "sessoes_caixa_operadorId_aberta_key";
--   CREATE UNIQUE INDEX "sessoes_caixa_operadorId_aberto_key"
--   ON "sessoes_caixa"("operadorId")
--   WHERE "status" = 'ABERTO';
-- ---------------------------------------------------------------------------

