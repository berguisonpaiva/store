> Flutter (`apps/mobile`), Clean Architecture + MVVM, foco em leitura/PDV. Reusa o `HttpClient` autenticado do `mobile-auth`. **Usar as skills indicadas.** Autoria de produto/categoria fica no web.

## 1. Domain — skill `flutter-domain-layer`

- [x] 1.1 Entidades `ProductEntity` (+ `VariationEntity` list), `CategoryEntity`
- [x] 1.2 `CatalogRepository` (listProducts c/ busca+filtros+paginação, getProduct, findVariationBySku, findVariationByBarcode, listCategories)
- [x] 1.3 `CatalogFailure`s (`ProductNotFound`, `VariationNotFound`, `CatalogNetwork`)
- [x] 1.4 Use cases: `ListProducts`, `GetProduct`, `FindVariationBySku`, `FindVariationByBarcode`, `ListCategories` (`Either`)

## 2. Data — skill `flutter-data-drift-layer`

- [x] 2.1 DTOs (product, variation, category, paginated) + mappers para domínio
- [x] 2.2 `CatalogRemoteDataSource(Impl)` via `HttpClient`: `GET /api/products`, `/products/:id`, `/variations/by-sku/:sku`, `/variations/by-barcode/:barcode`, `/categories`
- [x] 2.3 `CatalogRepositoryImpl` convertendo `AppException`→`CatalogFailure` (404→not-found)

## 3. UI — skills `flutter-ui-mvvm` / `flutter-design-system`

- [x] 3.1 `ProductsCubit`/state (lista + busca + filtro categoria/status + paginação `loadMore`) — sem imports de Flutter
- [x] 3.2 `ProductsPage` (lista) + detalhe do produto (variações: SKU, preço, status); explicit-bloc, cubit via getIt, sem `BlocProvider`
- [x] 3.3 `VariationLookupCubit`/state + tela/seção de lookup PDV (entrada de SKU/barcode → resolve variação; `AppToast` em not-found)
- [x] 3.4 Strings de l10n (pt/en) + `flutter gen-l10n`; formatação de preço (cents→moeda) só na UI

## 4. App — skill `flutter-app-composition`

- [x] 4.1 Registrar datasource/repository/use cases e cubits no get_it (módulos data/domain/ui)
- [x] 4.2 Adicionar rota do catálogo no router guardado e entrada de navegação

## 5. Testes — skill `flutter-testing`

- [x] 5.1 `ProductsCubit`: busca/filtro/paginação (mocktail + bloc_test)
- [x] 5.2 `VariationLookupCubit`: sucesso e not-found
- [x] 5.3 Repository: mapeamento DTO→entidade e `AppException`→`CatalogFailure`
- [x] 5.4 Widget test da lista (render + busca) com `pumpApp` + l10n

## 6. Verificação — skill `verify`

- [x] 6.1 `flutter analyze` + `flutter test` verdes; `gen-l10n` sem erro
- [x] 6.2 Com backend rodando: listar/buscar/filtrar produtos; abrir detalhe; lookup por SKU/barcode (achado e não-achado)
- [x] 6.3 Confirmar ViewModels sem imports de Flutter e chamadas autenticadas (bearer) reutilizando o `HttpClient`
