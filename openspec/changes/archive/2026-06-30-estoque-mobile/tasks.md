> Flutter (`apps/mobile`), Clean Architecture + MVVM. Leitura operacional (saldo/histórico/alertas) + movimentações rápidas (entrada/saída/ajuste). Reusa o `HttpClient` autenticado do `mobile-auth`. **Usar as skills indicadas.** Saída por venda (`darBaixa`/`estornar`) fica fora (módulo `vendas`); scanner de câmera adiado.

## 1. Domain — skill `flutter-domain-layer`

- [x] 1.1 Entidades `StockBalanceEntity` (`saldoAtual`, `saldoDisponivel`, `quantidadeReservada`, `estoqueMinimo`), `StockMovementEntity` (`tipo`, `motivo`, `quantidade`, `saldoResultante`, `criadoEm`), `LowStockItemEntity`
- [x] 1.2 `InventoryRepository` (consultarSaldoPorSku, consultarSaldoPorBarcode, listarMovimentacoes c/ filtro de período, listarAbaixoDoMinimo, registrarEntrada, registrarSaida, ajustarSaldo)
- [x] 1.3 `InventoryFailure`s (`VariationNotFound`, `InsufficientStock`, `InvalidQuantity`, `InventoryNetwork`)
- [x] 1.4 Use cases de leitura: `GetBalanceBySku`, `GetBalanceByBarcode`, `ListMovements`, `ListLowStock` (`Either`)
- [x] 1.5 Use cases de escrita: `RegisterEntry` (qtd > 0), `RegisterExit` (qtd > 0), `AdjustBalance` (novoSaldo >= 0) (`Either`)

## 2. Data — skill `flutter-data-drift-layer`

- [x] 2.1 DTOs (saldo, movimentação, low-stock, requests de entrada/saída/ajuste) + mappers para domínio
- [x] 2.2 `InventoryRemoteDataSource(Impl)` via `HttpClient` — leitura: `GET /api/inventory/balance/by-sku/:sku`, `/balance/by-barcode/:barcode`, `/movements`, `/low-stock`
- [x] 2.3 `InventoryRemoteDataSource(Impl)` — escrita: `POST /api/inventory/entrada`, `/saida`, `/ajuste`
- [x] 2.4 `InventoryRepositoryImpl` convertendo `AppException` e códigos do backend → `InventoryFailure` (`VARIACAO_NAO_ENCONTRADA`/`ESTOQUE_INSUFICIENTE`/`QUANTIDADE_INVALIDA`)

## 3. UI leitura — skills `flutter-ui-mvvm` / `flutter-design-system`

- [x] 3.1 `BalanceLookupCubit`/state + tela de consulta de saldo (entrada de SKU/barcode → `saldoAtual`/`saldoDisponivel`; `AppToast` em not-found) — sem imports de Flutter
- [x] 3.2 `MovementsCubit`/state + tela de histórico de movimentações por variação/período (tipo, motivo, quantidade, saldoResultante, data)
- [x] 3.3 `LowStockCubit`/state + lista de alertas de baixo estoque (variações no/abaixo do `estoqueMinimo`)
- [x] 3.4 Strings de l10n (pt/en) + `flutter gen-l10n`

## 4. UI movimentações — skills `flutter-ui-mvvm` / `flutter-design-system`

- [x] 4.1 `StockMovementCubit`/state (entrada/saída/ajuste) — sem imports de Flutter; valida qtd > 0 e novoSaldo >= 0 antes do use case
- [x] 4.2 Form de entrada (variação por SKU/barcode, quantidade, motivo `COMPRA`/`DEVOLUCAO`/`AJUSTE`, observação opcional) → `RegisterEntry`; explicit-bloc, cubit via getIt, sem `BlocProvider`
- [x] 4.3 Form de saída (quantidade, motivo `PERDA`/`AJUSTE`, observação opcional) → `RegisterExit`; `AppToast` para `ESTOQUE_INSUFICIENTE`
- [x] 4.4 Form de ajuste de saldo (novoSaldo >= 0, justificativa obrigatória) → `AdjustBalance`; `AppToast` para `QUANTIDADE_INVALIDA`
- [x] 4.5 Após movimento bem-sucedido, refletir o novo saldo (re-fetch) na consulta/histórico; strings de l10n (pt/en) dos motivos e mensagens de erro

## 5. App — skill `flutter-app-composition`

- [x] 5.1 Registrar datasource/repository/use cases e cubits no get_it (módulos data/domain/ui)
- [x] 5.2 Adicionar rotas de estoque (consulta de saldo, histórico, alertas, entrada/saída/ajuste) no router guardado e entrada de navegação

## 6. Testes — skill `flutter-testing`

- [x] 6.1 `BalanceLookupCubit`: sucesso e not-found (mocktail + bloc_test)
- [x] 6.2 `MovementsCubit` / `LowStockCubit`: carregamento e filtro de período / lista de alertas
- [x] 6.3 `StockMovementCubit`: entrada/saída/ajuste — sucesso, `ESTOQUE_INSUFICIENTE`, `QUANTIDADE_INVALIDA`
- [x] 6.4 Repository: mapeamento DTO→entidade e `AppException`/códigos do backend → `InventoryFailure`
- [x] 6.5 Widget test da consulta de saldo (render + lookup achado/não-achado) com `pumpApp` + l10n

## 7. Verificação — skill `verify`

- [x] 7.1 `flutter analyze` + `flutter test` verdes; `gen-l10n` sem erro
- [x] 7.2 Com backend rodando: consultar saldo por SKU/barcode; ver histórico/período; lista de baixo estoque; registrar entrada/saída/ajuste (sucesso e erros de domínio)
- [x] 7.3 Confirmar ViewModels sem imports de Flutter e chamadas autenticadas (bearer) reutilizando o `HttpClient`
