-- RF20: every stock movement records the responsible user (usuarioId).
-- Added NOT NULL; pre-existing rows (if any) are backfilled with a sentinel
-- UUID, after which the default is dropped so new writes MUST supply a user.
ALTER TABLE "movimentacoes_estoque"
ADD COLUMN "usuarioId" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE "movimentacoes_estoque"
ALTER COLUMN "usuarioId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_usuarioId_idx" ON "movimentacoes_estoque" ("usuarioId");
