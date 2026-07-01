## 1. Domain — `modules/vendas` (Subagent 1, blocking)

- [x] 1.1 Scaffold the `vendas` aggregate folders: `model/`, `provider/`, `use-case/`, `dto/`, `errors/`, `service/` (kebab-case dot-type).
- [x] 1.2 Define value objects (`*.vo.ts`): money/`Decimal` VO, quantity (`> 0`), discount (`valor`/`percentual`, capped at subtotal) with `Result` validation.
- [x] 1.3 Implement `ItemVenda` entity (`variacaoId`, `quantidade`, `precoUnitario` snapshot, `total = precoUnitario × quantidade`).
- [x] 1.4 Implement `Pagamento` entity/VO (`forma`, `valor`) owned by the `Venda` aggregate.
- [x] 1.5 Implement `Venda` aggregate root (`numero`, `canal = PDV`, `status`, `usuarioId`, `sessaoCaixaId`, `subtotal`, `desconto`, `total`, items, payments) with `total = Σ itens − desconto` and `CONCLUIDA` immutability.
- [x] 1.6 Define `errors/venda-error.ts` codes: `SALE_NOT_FOUND`, `SALE_ALREADY_FINALIZED`, `NO_OPEN_CASH_SESSION`, `INSUFFICIENT_STOCK`, `PAYMENT_MISMATCH`.
- [x] 1.7 Declare provider contracts in `provider/`: `VendasRepository` (`*.repository.ts`), `VendasQuery` (`*-query.ts`).
- [x] 1.8 Declare consumed ports in `provider/`: `EstoqueGateway` (validar saldo, `darBaixa` `VENDA_PDV` com `origemVendaId`, `estornar`/`DEVOLUCAO`) and `CaixaGateway` (`caixaAbertoDoOperador`, `registrarVenda` `VENDA`, reverter).
- [x] 1.9 Define DTOs (`dto/*.dto.ts`) for create/add-item/discount/finalize inputs and venda/resumo outputs.
- [x] 1.10 Implement write use cases: `criar-venda` (requires open session via `CaixaGateway`), `adicionar-item` (price snapshot), `remover-item`, `aplicar-desconto`.
- [x] 1.11 Implement `finalizar-venda` orchestration in order 1→5 (validate → `darBaixa` → persist payments → `registrarVenda` → `CONCLUIDA`) with `Σ pagamentos = total` check and full rollback on any step failure.
- [x] 1.12 Implement `cancelar-venda` (estorno de estoque `DEVOLUCAO` + reversão de caixa; bloqueado após fechamento da sessão).
- [x] 1.13 Implement read use cases: `buscar-venda`, `listar-vendas` (período/operador/sessão/status), `resumo-vendas`.
- [x] 1.14 Domain tests — VOs/cálculo: `total`, snapshot de `precoUnitario`, desconto valor vs. percentual (limite no subtotal).
- [x] 1.15 Domain tests — write use cases with fake ports: happy path + each error code (`criar-venda`/`NO_OPEN_CASH_SESSION`; add/remove/discount/`SALE_ALREADY_FINALIZED`; `finalizar`/`INSUFFICIENT_STOCK`/`PAYMENT_MISMATCH` + rollback; `cancelar` estorno + bloqueio pós-fechamento).
- [x] 1.16 Domain tests — read: `resumo-vendas` soma totais por período/operador/sessão/status.

## 2. Backend — `apps/backend/src/modules/vendas` (Subagent 2)

> Prerequisite: `caixa`'s `cash-sales-port` and `estoque`'s `inventory-sales-port` are applied.

- [x] 2.1 Add `prisma/models/vendas.model.prisma`: `Venda` (`id`, `numero` unique, `canal`, `status`, `usuarioId`, `sessaoCaixaId`, `subtotal`, `desconto`, `total`, `criadaEm`, `concluidaEm?`, `canceladaEm?`), `ItemVenda` (FK `vendaId`), `Pagamento` (FK `vendaId`, `forma`, `valor`) — all money as `Decimal`.
- [x] 2.2 Create versioned SQL migration with a DB sequence/atomic counter + unique constraint for `numero`; run `prisma generate`.
- [x] 2.3 Implement the Prisma adapter (`*.prisma.ts`) for `VendasRepository` + `VendasQuery` with `toDomain`/`fromDomain` (sale + items + payments).
- [x] 2.4 Implement the `EstoqueGateway` adapter delegating to the `estoque` sales port (`darBaixa` `VENDA_PDV` + `origemVendaId`, `estornar`/`DEVOLUCAO`).
- [x] 2.5 Implement the `CaixaGateway` adapter delegating to the `caixa` cash port (`caixaAbertoDoOperador`, `registrarVenda` `VENDA`, reverter).
- [x] 2.6 Wrap `finalizar-venda`/`cancelar-venda` in a single transaction (`TransactionManager`/`runInTransaction`) so stock + payments + cash + status are atomic.
- [x] 2.7 Wire `VendasModule` (composition root) binding each port to its owner module and registering use cases.
- [x] 2.8 Implement In/Out DTOs (`CriarVendaInDTO {}`, `AdicionarItemInDTO`, `AplicarDescontoInDTO`, `FinalizarVendaInDTO`, `VendaOutDTO`, `ResumoVendasOutDTO`).
- [x] 2.9 Implement controllers for all routes (`POST /vendas`, `/:id/itens`, `DELETE /:id/itens/:itemId`, `PATCH /:id/desconto`, `POST /:id/finalizar`, `/:id/cancelar`, `GET /:id`, `GET /vendas`, `GET /vendas/resumo`) with `@ApiBearerAuth` and Swagger decorators; derive `usuarioId`/`sessaoCaixaId` from auth context.
- [x] 2.10 Map `Result.fail(CODE)` → HTTP (`SALE_NOT_FOUND` 404, `SALE_ALREADY_FINALIZED` 409, `NO_OPEN_CASH_SESSION`/`INSUFFICIENT_STOCK`/`PAYMENT_MISMATCH` 422, invalid input 400).
- [x] 2.11 Backend tests — Prisma adapter: `toDomain/fromDomain`, sequence garante `numero` único sob concorrência, persistência de itens/pagamentos.
- [x] 2.12 Backend tests — port adapters call the correct `estoque`/`caixa` use cases.
- [x] 2.13 Backend tests — integration `finalizar-venda`: happy path applies stock + payment + cash + `CONCLUIDA`; injected failure at payment/cash step → rollback completo (estoque não baixa).
- [x] 2.14 Backend tests — `cancelar-venda`: estorna estoque (`DEVOLUCAO`) e reverte caixa; bloqueio após fechamento.
- [x] 2.15 Backend tests — controllers e2e: one assertion per route/error row (status correto); test DB (Docker Compose) + reset entre suites.

## 3. Web — `apps/frontend/src/modules/vendas` (Subagent 3, parallel with §4)

- [x] 3.1 Add the datasource/client for the `/vendas` API endpoints.
- [x] 3.2 Build the PDV screen shell with the open-cash-session precondition (block + guidance on `NO_OPEN_CASH_SESSION`).
- [x] 3.3 Implement the single item-entry field (SKU/barcode/name) with `@headlessui/react` `Combobox` via `Controller`, auto-focus, add without reload.
- [x] 3.4 Implement the editable item list (quantity `> 0`/`≤ saldo`, read-only snapshot `precoUnitario` via `NumericFormat`, per-line total).
- [x] 3.5 Implement the live summary (subtotal/desconto/total) and discount control (`valor`/`percentual`, `≥ 0`, `≤ subtotal`) with Zod schemas.
- [x] 3.6 Implement the finalize/payment step (block until `Σ pagamentos = total`) and the cancel action (before session close).
- [x] 3.7 Map API error codes to UI: `NO_OPEN_CASH_SESSION` (block), `INSUFFICIENT_STOCK` (highlight item), `PAYMENT_MISMATCH` (block finalize), `SALE_ALREADY_FINALIZED` (read-only).
- [x] 3.8 Web tests — Zod schemas (quantity `> 0`, discount `≤ subtotal`), total calculation, API error mapping, add-by-bip flow with mocked datasource.

## 4. Mobile — Flutter (Subagent 4, parallel with §3)

- [x] 4.1 `lib/domain`: `Venda`/`ItemVenda` entities, `VendasRepository` contract (`Future<Either<Failure, T>>`), `Failure` types (`SaleNotFound`, `SaleAlreadyFinalized`, `NoOpenCashSession`, `InsufficientStock`, `PaymentMismatch`).
- [x] 4.2 `lib/domain`: use cases `CriarVenda`, `AdicionarItem`, `RemoverItem`, `AplicarDesconto`, `FinalizarVenda`, `CancelarVenda`, `BuscarVenda`, `ListarVendas`, `ResumoVendas`.
- [x] 4.3 `lib/data`: `VendasRemoteDataSource`, `VendasRepositoryImpl`, DTOs/mappers (venda, item, desconto, finalização/pagamentos, resumo), HTTP/código → `Exception` → `Failure`.
- [x] 4.4 `lib/ui`: `VendaPdvView` (bip/busca, lista de itens, resumo, ações) with MVVM/Cubit (`BlocBuilder` com bloc explícito; ViewModel sem import de Flutter; `AppToast`).
- [x] 4.5 `lib/ui`: `DescontoSheet` (`valor`/`percentual`, `≤ subtotal`) and `FinalizarVendaView` (payment step, block until pagamentos = total); estados de saldo insuficiente, sem caixa, venda concluída (read-only); confirmação ao cancelar.
- [x] 4.6 `lib/app`: register repository/datasource/use cases in `get_it`; GoRouter routes with operator + open-session guard.
- [x] 4.7 Mobile tests — domain use cases with fake repo (happy + each `Failure`).
- [x] 4.8 Mobile tests — data: `VendasRepositoryImpl` maps HTTP → `Failure`; DTO ↔ entity mappers.
- [x] 4.9 Mobile tests — UI (Cubit + widget): add by bip, total recalculation, no-cash block, `PaymentMismatch` finalize block, `CONCLUIDA` read-only (`pumpApp` + l10n, mocktail + bloc_test, no flaky).

## 5. Review (Subagent 5, optional)

- [x] 5.1 Validate the `finalizar-venda` single transaction end-to-end and rollback on each failing step.
- [x] 5.2 Verify invariants across layers: `total = Σ itens − desconto`, `Σ pagamentos = total`, `CONCLUIDA` immutability, `numero` sequential/unique, cancel-only-before-close.
