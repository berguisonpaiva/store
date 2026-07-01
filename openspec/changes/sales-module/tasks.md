## 1. Domain — caixa reconciliation (`modules/sales/src/cash-session`)

- [x] 1.1 Rename `StatusSessaoCaixa` values `ABERTO/FECHADO` → `ABERTA/FECHADA`; update `SessaoCaixa`, mappers, and every reference in `modules/sales`.
- [x] 1.2 Rename `CaixaError` codes to PT: `CASH_SESSION_ALREADY_OPEN→CAIXA_JA_ABERTO`, `CASH_SESSION_NOT_FOUND→CAIXA_NAO_ENCONTRADO`, `CASH_SESSION_ALREADY_CLOSED→CAIXA_JA_FECHADO`, `PENDING_SALE_IN_SESSION→VENDA_PENDENTE_NO_FECHAMENTO`, `VALOR_ABERTURA_INVALIDO`/`VALOR_FECHAMENTO_INVALIDO`/`VALOR_MOVIMENTACAO_INVALIDO→VALOR_INVALIDO`.
- [x] 1.3 Add new `CaixaError` codes `NAO_E_DONO_DO_CAIXA` and `ACESSO_NEGADO`.
- [x] 1.4 Enforce owner-only in `FecharCaixa`, `RegistrarSangria`, `RegistrarSuprimento` (`NAO_E_DONO_DO_CAIXA`); take the acting `usuarioId` as an input, not from the session.
- [x] 1.5 Enforce read-scope (`ACESSO_NEGADO`) for non-ADMIN reads in `ResumoSessao`/`ListarMovimentacoes`; allow ADMIN to bypass.
- [x] 1.6 Extend `CaixaPort` with `isSessaoAberta(sessaoId)` and `estornarVenda(sessaoId, valor, tx?)`, and add `tx?` to `registrarVenda`; implement all in `CaixaPortService` (sealed `VENDA`/reversal movements only).
- [x] 1.7 Define a `PendingSalePredicate` port and wire it into `FecharCaixa` (fail `VENDA_PENDENTE_NO_FECHAMENTO` when a pending sale exists).
- [x] 1.8 Confirm `fechar-caixa` returns the resumo `{ totalVendas, qtdVendas, totalPorForma, sangrias, suprimentos, saldoEsperado }` (RN05) and closed-session immutability (RN06).
- [x] 1.9 Update jest tests + in-memory mocks for RN01, owner/scope, blocked-close, closed-immutability; all green.

## 2. Domain — venda invariants (`modules/sales/src/venda`)

- [x] 2.1 Confirm the lifecycle write-guard (RN11): writes only while `ABERTA` (`SALE_NOT_OPEN`/`SALE_ALREADY_FINALIZED`).
- [x] 2.2 Confirm add-item snapshots active-variation price (RN10) and validates `validarSaldoDisponivel` (RN09) with `INVALID_QUANTITY`/`INVALID_PRICE`/inactive-variation failures.
- [x] 2.3 Confirm discount capping (`DISCOUNT_EXCEEDS_SUBTOTAL`/`INVALID_DISCOUNT`) and `VendaCalculatorService` totals.
- [x] 2.4 Confirm split payments + `concluir` requiring items and `Σ pagamentos == total` (`SALE_HAS_NO_ITEMS`/`PAYMENT_MISMATCH`/`INVALID_PAYMENT`, RN12).
- [x] 2.5 Confirm `CaixaGateway`/`EstoqueGateway` ports thread `tx?`; `cancelar` blocked on closed session (`CASH_SESSION_CLOSED`) via `isSessaoAberta`.
- [x] 2.6 Orchestration jest tests (fake `CaixaGateway`/`EstoqueGateway`): RN09 rollback when stock or cash fails at finalize (assert same `tx`), RN11 write-block, `PAYMENT_MISMATCH`; all green.
- [x] 2.7 Ensure `modules/sales/src/index.ts` barrels export both aggregates; `turbo build --filter=@repo/sales` + `bun test` green.

## 3. Backend — Prisma & migration (`apps/backend/prisma`)

- [x] 3.1 Confirm models `SessaoCaixa`, `MovimentacaoCaixa`, `Venda`, `ItemVenda`, `Pagamento` in `models/*.model.prisma`.
- [x] 3.2 Migration: rewrite existing `status` values `ABERTO→ABERTA`/`FECHADO→FECHADA` on `sessoes_caixa`.
- [x] 3.3 Migration: (re)create the partial unique index `UNIQUE(operadorId) WHERE status='ABERTA'` (RN01) with the new predicate; provide the down-migration.
- [x] 3.4 Regenerate the Prisma client and run the migration locally.

## 4. Backend — adapters & gateways (`apps/backend/src/modules/sales`)

- [x] 4.1 Propagate the caixa rename through `CaixaPrismaRepository`/`CaixaPrismaQuery`/mappers and HTTP DTOs.
- [x] 4.2 Replace `StubPendingSalePredicate` with a real `PendingSalePredicate` backed by vendas (an `ABERTA` sale ⇒ pending); wire the vendas→caixa binding at the Nest module level.
- [x] 4.3 Update `CaixaGatewayAdapter` to go through the extended `CaixaPort` (`isSessaoAberta`/`estornarVenda`/`registrarVenda(tx)`), removing direct repository access.
- [x] 4.4 Ensure `EstoqueGatewayAdapter` forwards `tx` into `EstoquePort.darBaixa/estornar` and maps stock failure → `INSUFFICIENT_STOCK`.
- [x] 4.5 Route `FinalizarVenda`/`CancelarVenda` through `TransactionManager.runInTransaction`, passing the same `tx` to both gateways and the vendas repository (RN09).

## 5. Backend — controllers, scoping & error mapping

- [x] 5.1 Add `GET /caixa` restricted to `@Papeis(ADMIN)` with filters `{ usuarioId?, status?, from?, to? }` (RN04); OPERADOR → 403.
- [x] 5.2 Derive `usuarioId`/`role` from JWT (`@CurrentUser`, `@Papeis`) in all caixa/venda controllers; never from body.
- [x] 5.3 Apply owner/read scoping on caixa and venda routes (surface `NAO_E_DONO_DO_CAIXA`/`ACESSO_NEGADO` → 403) (RN02/RN03).
- [x] 5.4 Complete `shared/errors/domain-error.mapper.ts` for all `CaixaError` codes (409/422, 403, 404, 400/422) alongside `VendaError`.
- [x] 5.5 Verify Swagger/class-validator on all command/query DTOs; register bindings in `sales.module.ts`/`cash-session/caixa.module.ts`.
- [x] 5.6 Controller/e2e tests: ADMIN list-all vs OPERADOR 403, cross-operator read 403, error-code→status mapping; `turbo build --filter=backend` + `bun test` green.

## 6. Web — ADMIN "Caixas" panel (`apps/web`)

- [x] 6.1 Add the ADMIN-only "Caixas" sidebar entry + private-shell page guard (redirect non-ADMIN) (RN04).
- [x] 6.2 Session listing page (all operators) with operator/period/status filters (query-string via nuqs), backed by `GET /caixa`.
- [x] 6.3 Session detail page: abertura/fechamento, sangrias/suprimentos, automatic resumo (RN05), and linked sales — read-only.
- [x] 6.4 Read schemas/types for the caixa responses; `turbo build --filter=web` green.

## 7. Mobile — PDV core (`apps/mobile`)

- [x] 7.1 Domain + data layers for `caixa` and `venda` (entities, DTOs/mappers, repositories) keyed by `variacaoId`, money in cents.
- [x] 7.2 Abrir caixa (blocked if one open, RN01) with `valorAbertura`; sangria/suprimento.
- [x] 7.3 PDV: lookup variation (catalog), add items, apply discount, compute total, register split payments, finalize (stock baixa RN09), cancel with estorno; surface `INSUFFICIENT_STOCK`/`PAYMENT_MISMATCH`/inactive-variation.
- [x] 7.4 Fechar caixa showing the automatic resumo (RN05) with pending-sale block.
- [x] 7.5 History of the operator's own sessions/sales (RN03).
- [x] 7.6 get_it modules + routes wired; widget/integration tests; Flutter build/tests green.

## 8. Review & verification (end-to-end)

- [x] 8.1 Verify abrir/fechar caixa with resumo (RN05) and the sale flow criar→itens→desconto→pagamentos→finalizar end-to-end.
- [x] 8.2 Verify RN09 single-transaction rollback/estorno on finalize and cancel (stock + cash + sale together).
- [x] 8.3 Verify RN11 `CONCLUIDA` immutability, RN12 `Σ pagamentos == total`, RN01 one-open-per-operator, RN02/RN03/RN04 owner/admin scoping.
- [x] 8.4 Run monorepo build + tests + lint green; confirm no leftover `ABERTO`/`FECHADO`/English caixa codes remain.
