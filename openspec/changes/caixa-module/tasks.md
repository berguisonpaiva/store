## 1. Domain — modules/caixa (Subagent 1, blocking)

- [x] 1.1 Scaffold the `caixa` module/aggregate (`model`, `provider`, `use-case`, `errors`) following the `module-aggregate` layout.
- [x] 1.2 Define `errors/caixa-error.ts` with codes `CASH_SESSION_ALREADY_OPEN`, `CASH_SESSION_NOT_FOUND`, `CASH_SESSION_ALREADY_CLOSED`, `PENDING_SALE_IN_SESSION`.
- [x] 1.3 Implement `SessaoCaixa` aggregate root (`operadorId`, `status`, `valorAbertura`, `valorFechamento?`, `abertaEm`, `fechadaEm?`) with `valorAbertura ≥ 0`, `valorFechamento ≥ 0`, and `ABERTO → FECHADO` once-only transition.
- [x] 1.4 Implement `MovimentacaoCaixa` (`tipo` SUPRIMENTO|SANGRIA|VENDA, `valor > 0`, `observacao?`) with money as a precise non-negative VO (no float).
- [x] 1.5 Define `provider/CaixaRepository` (session + movement persistence) and `provider/CaixaQuery` (read projections) as framework-free interfaces.
- [x] 1.6 Implement `abrir-caixa` use case (one open session per operator → `CASH_SESSION_ALREADY_OPEN`).
- [x] 1.7 Implement `registrar-sangria` and `registrar-suprimento` use cases (`valor > 0`, `CASH_SESSION_NOT_FOUND`).
- [x] 1.8 Implement `fechar-caixa` use case (computes `divergencia = valorFechamento − esperado`; `NOT_FOUND`, `ALREADY_CLOSED`, `PENDING_SALE_IN_SESSION` via injected pending-sale predicate).
- [x] 1.9 Implement read use cases `caixa-aberto-do-operador`, `resumo-sessao` (formula `abertura + suprimentos + vendasDinheiro − sangrias`), `listar-movimentacoes` over `CaixaQuery`.
- [x] 1.10 Expose the cash port surface used by `vendas` (`caixaAbertoDoOperador(usuarioId)`, `registrarVenda(sessaoId, valor)`) with `VENDA` creation only via this path.
- [x] 1.11 Domain tests: entity/VO validation (`≥ 0` / `> 0`, status transitions); one happy + one per error for each write use case; `resumo-sessao` formula; divergence calc — with fake repository/query.

## 2. Backend — apps/backend/src/modules/caixa (Subagent 2, after domain)

- [x] 2.1 Add Prisma models in `prisma/models/caixa.model.prisma` (`SessaoCaixa`, `MovimentacaoCaixa` with FK `sessaoId`, money as `Decimal`).
- [x] 2.2 Create versioned SQL migration including the partial unique index on `operadorId WHERE status = ABERTO`; run `prisma generate`. _(migration authored + `prisma generate` run; apply via `migrate deploy` is CI/DB-gated — Neon cloud DB, no local Docker)_
- [x] 2.3 Implement `*.prisma.ts` adapter for `CaixaRepository` + `CaixaQuery` with `toDomain`/`fromDomain` (Decimal-safe).
- [x] 2.4 Implement transactional movement registration via `TransactionManager` / `runInTransaction` (rollback on failure).
- [x] 2.5 Implement the adapter binding the port `vendas` declares → delegates `caixaAbertoDoOperador` / `registrarVenda` to the use cases.
- [x] 2.6 Define In DTOs (`AbrirCaixaInDTO`, `FecharCaixaInDTO`, `MovimentacaoInDTO`) and Out DTOs (`SessaoOutDTO`, `ResumoSessaoOutDTO`, `MovimentacaoOutDTO`).
- [x] 2.7 Implement `caixa.controller.ts` routes (`/caixa/abrir`, `/:id/fechar`, `/:id/sangria`, `/:id/suprimento`, `/aberto`, `/:id/resumo`, `/:id/movimentacoes`) with auth guard, `@ApiBearerAuth`, `@ApiTags('caixa')`, `operadorId` from token.
- [x] 2.8 Map error codes → HTTP (`ALREADY_OPEN`/`ALREADY_CLOSED` → 409, `NOT_FOUND` → 404, `PENDING_SALE_IN_SESSION` → 422, invalid input → 400) with `@ApiResponse` per status; ensure no public `registrar-venda` route.
- [x] 2.9 Wire `CaixaModule` (composition root) and expose the port for `VendasModule` to bind.
- [x] 2.10 Backend tests: adapter `toDomain/fromDomain`; partial index blocks 2nd `ABERTO`; transactional venda+movement (rollback); controller e2e one assertion per route/error row; port adapter persists `VENDA`; close-with-pending-sale → 422. _(20 caixa unit/integration tests green; live-DB e2e + index-collision test are Docker/CI-gated)_

## 3. Web — apps/frontend/src/modules/caixa (Subagent 3, parallel after API contract)

- [x] 3.1 Scaffold the web `caixa` module and API client for the `/caixa/*` routes.
- [x] 3.2 Build the Cash Status screen: `GET /caixa/aberto` → "Abrir caixa" CTA when none, else active-session panel.
- [x] 3.3 Build Abrir Caixa form (Zod + RHF, `NumericFormat` via `Controller`, `valorAbertura ≥ 0`).
- [x] 3.4 Build Sessão Ativa: resumo, movements list, actions (sangria, suprimento, fechar).
- [x] 3.5 Build Sangria/Suprimento form (`valor > 0`, required `observacao`).
- [x] 3.6 Build Fechar Caixa form (`valorFechamento ≥ 0`) showing live `esperado` / `contado` / `divergencia` before confirm.
- [x] 3.7 Map API errors: `CASH_SESSION_ALREADY_OPEN` blocks "Abrir" + shows active session; `PENDING_SALE_IN_SESSION` blocks close with "há venda aberta"; hide/disable actions by permission.
- [x] 3.8 Web tests: Zod schemas (`≥ 0`, `> 0`, required `observacao`); conditional render (no caixa → "Abrir", caixa → session); API error → UI mapping.

## 4. Mobile — Flutter cash-session feature (Subagent 4, parallel after API contract)

- [x] 4.1 `domain`: entities `SessaoCaixa`/`MovimentacaoCaixa`, `CaixaRepository` (`Future<Either<Failure, T>>`), `Failure` codes (`CashSessionAlreadyOpen`, `CashSessionNotFound`, `CashSessionAlreadyClosed`, `PendingSaleInSession`).
- [x] 4.2 `domain` use cases: `AbrirCaixa`, `FecharCaixa`, `RegistrarSangria`, `RegistrarSuprimento`, `ObterCaixaAberto`, `ObterResumoSessao`, `ListarMovimentacoes`.
- [x] 4.3 `data`: `CaixaRemoteDataSource` + `CaixaRepositoryImpl`, DTOs/mappers, HTTP/code → `Exception` → `Failure`.
- [x] 4.4 `ui`: `CaixaStatusView`, `AbrirCaixaView` (`≥ 0`), `SessaoAtivaView` (resumo + movements + actions), `FecharCaixaView` (esperado/contado/divergencia), Sangria/Suprimento sheet (`> 0` + `observacao`); Cubits with no Flutter imports, `BlocBuilder` explicit, `AppToast`, close confirmation.
- [x] 4.5 `app`: register repo/datasource/use cases in `get_it`; GoRouter routes guarded for authenticated operator.
- [x] 4.6 Mobile tests: domain use cases (happy + each `Failure`) with fake repo; data mappers + HTTP→Failure; Cubit/widget states (loading/success/error), close shows divergence, form validation, close confirmation (mocktail + bloc_test + `pumpApp` with l10n).

## 5. Review (Subagent 5, optional)

- [x] 5.1 Verify invariants end to end: one open session per operator (use case + index), no close with pending sale, `VENDA` only via port.
- [x] 5.2 Verify the shared formula `esperado = abertura + suprimentos + vendas_em_dinheiro − sangrias` is consistent across backend, web, and mobile.
