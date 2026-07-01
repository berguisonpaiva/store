## ADDED Requirements

### Requirement: HTTP surface for sales

The system SHALL expose the sales use cases under `/vendas` via NestJS controllers, all authenticated (`@ApiBearerAuth`) and documented with Swagger (`@ApiTags('vendas')`, `@ApiOperation`, `@ApiResponse` per status). The routes SHALL be: `POST /vendas`, `POST /vendas/:id/itens`, `DELETE /vendas/:id/itens/:itemId`, `PATCH /vendas/:id/desconto`, `POST /vendas/:id/finalizar`, `POST /vendas/:id/cancelar`, `GET /vendas/:id`, `GET /vendas` (filters), and `GET /vendas/resumo`.

#### Scenario: Routes are authenticated and documented

- **WHEN** the API is generated
- **THEN** every `/vendas` route requires a bearer token and appears under the `vendas` Swagger tag with documented response statuses

### Requirement: Operator and session derived from the authenticated context

The system SHALL derive `usuarioId` (operator) and `sessaoCaixaId` from the authenticated request context, never from the request body. `CriarVendaInDTO` therefore carries no operator/session fields.

#### Scenario: Create derives identity from the token

- **WHEN** `POST /vendas` is called by an authenticated operator
- **THEN** the sale's `usuarioId` and `sessaoCaixaId` come from the auth context and any operator/session values in the body are ignored

### Requirement: Input and output DTOs

The system SHALL define In DTOs: `CriarVendaInDTO` (`{}`), `AdicionarItemInDTO` (`{ variacaoId | sku | codigoBarras, quantidade: int > 0 }`), `AplicarDescontoInDTO` (`{ tipo: 'valor' | 'percentual', valor: number ≥ 0 }`), and `FinalizarVendaInDTO` (`{ pagamentos: [{ forma, valor }] }`). It SHALL define Out DTOs: `VendaOutDTO` (`{ id, numero, canal, status, usuarioId, sessaoCaixaId, subtotal, desconto, total, itens[] }`) and `ResumoVendasOutDTO` (totals per filter). Invalid bodies MUST return `BadRequestException` (400).

#### Scenario: Add-item accepts one of three identifiers

- **WHEN** `POST /vendas/:id/itens` is called with `sku` or `codigoBarras` or `variacaoId` and `quantidade > 0`
- **THEN** the identifier is resolved to a variation and the item is added

#### Scenario: Invalid body is rejected

- **WHEN** a request body fails DTO validation (e.g. `quantidade` ≤ 0)
- **THEN** the response is 400 and nothing is persisted

### Requirement: Map domain failures to HTTP status codes

The system SHALL map domain `Result.fail(CODE)` to HTTP exceptions: `SALE_NOT_FOUND` → 404 (`NotFoundException`); `SALE_ALREADY_FINALIZED` → 409 (`ConflictException`); `NO_OPEN_CASH_SESSION`, `INSUFFICIENT_STOCK`, `PAYMENT_MISMATCH` → 422 (`UnprocessableEntityException`); invalid input → 400 (`BadRequestException`).

#### Scenario: No open session returns 422

- **WHEN** `POST /vendas` runs for an operator without an open cash session
- **THEN** the response is 422 (`NO_OPEN_CASH_SESSION`)

#### Scenario: Mutating a finalized sale returns 409

- **WHEN** add-item, remove-item, apply-discount, or finalize targets a `CONCLUIDA` sale
- **THEN** the response is 409 (`SALE_ALREADY_FINALIZED`)

#### Scenario: Finalize errors return 422

- **WHEN** `POST /vendas/:id/finalizar` fails with insufficient stock or payments ≠ total
- **THEN** the response is 422 (`INSUFFICIENT_STOCK` or `PAYMENT_MISMATCH`)

#### Scenario: Unknown sale returns 404

- **WHEN** any `/vendas/:id...` route targets a sale id that does not exist
- **THEN** the response is 404 (`SALE_NOT_FOUND`)

### Requirement: Prisma persistence with Decimal money

The system SHALL persist `Venda`, `ItemVenda`, and `Pagamento` via Prisma in `prisma/models/vendas.model.prisma`. `Venda` SHALL have `id`, `numero` (unique), `canal`, `status`, `usuarioId`, `sessaoCaixaId`, `subtotal`, `desconto`, `total`, `criadaEm`, `concluidaEm?`, `canceladaEm?`. `ItemVenda` SHALL have `id`, `vendaId` (FK), `variacaoId`, `quantidade`, `precoUnitario`, `total`. All monetary values SHALL use `Decimal` (never `float`). The adapter SHALL implement `VendasRepository` and `VendasQuery` with `toDomain`/`fromDomain` mapping.

#### Scenario: Money is stored as Decimal

- **WHEN** a sale with monetary values is persisted
- **THEN** `subtotal`, `desconto`, `total`, `precoUnitario`, and payment `valor` are `Decimal` columns

#### Scenario: Items persist under their sale

- **WHEN** a sale with items is saved and reloaded
- **THEN** `fromDomain`/`toDomain` round-trips the sale with all its items and payments intact

### Requirement: Atomic unique sale number under concurrency

The system SHALL generate `numero` from a database sequence/atomic counter so that concurrent sales never receive the same number. A unique constraint on `numero` MUST hold.

#### Scenario: Concurrent finalizations keep numbers unique

- **WHEN** multiple sales are created/finalized concurrently
- **THEN** each persisted `numero` is distinct and the unique constraint is never violated

### Requirement: Port adapters bound in the composition root

The system SHALL implement `EstoqueGateway` as an adapter that calls the `estoque` sales port (validate balance, `darBaixa` with `VENDA_PDV` and `origemVendaId`, `estornar`/`DEVOLUCAO` on cancel) and `CaixaGateway` as an adapter that calls the `caixa` cash port (`caixaAbertoDoOperador`, `registrarVenda` with `tipo = VENDA`, reverse on cancel). Both adapters SHALL be wired to the `vendas`-declared ports in `VendasModule`.

#### Scenario: Estoque adapter delegates to the estoque port

- **WHEN** the domain calls `EstoqueGateway.darBaixa`
- **THEN** the adapter invokes the `estoque` sales port recording a `SAIDA` `VENDA_PDV` with `origemVendaId`

#### Scenario: Caixa adapter delegates to the caixa port

- **WHEN** the domain calls `CaixaGateway.registrarVenda`
- **THEN** the adapter invokes the `caixa` cash port creating a `VENDA` movement for the session

### Requirement: Finalize and cancel run in a single database transaction

The system SHALL execute `finalizar-venda` and `cancelar-venda` within one transaction (`TransactionManager` / `runInTransaction`) so that stock changes, payment persistence, cash movement, and status change commit together. Any step failure MUST roll back the whole transaction with no side effects.

#### Scenario: Finalize commits all effects together

- **WHEN** `POST /vendas/:id/finalizar` succeeds
- **THEN** stock take-down, payments, cash `VENDA` movement, and `CONCLUIDA` status are all committed in one transaction

#### Scenario: Injected failure rolls everything back

- **WHEN** the payment or cash step throws during finalize after stock was taken down
- **THEN** the transaction rolls back: stock is not reduced, no payment row remains, no cash movement exists, and the sale stays `ABERTA`

#### Scenario: Cancel reverses within a transaction

- **WHEN** `POST /vendas/:id/cancelar` runs before the session closes
- **THEN** stock `DEVOLUCAO`, cash reversal, and `CANCELADA` status commit together; if the session is already closed the request is rejected and nothing changes
