# Tarefa: Implementar suíte de testes de integração (e2e) do fluxo completo do PDV

Fonte da verdade = as regras abaixo. Siga a arquitetura em camadas já usada no repo (domínio puro em `modules/*`, casca NestJS em `apps/backend`, mobile em `apps/mobile`). Reutilize `@repo/shared`, guards (`JwtGuard`, `RolesGuard`), decorators (`@Public`, `@Papeis`, `@CurrentUser`), `Result`, o mapeamento de erros em `apps/backend/src/shared/errors/domain-error.mapper.ts` e o seed em `apps/backend/prisma/seed/main.ts`.

⚠️ ESCOPO: são **testes de integração HTTP (e2e)** contra a aplicação NestJS real (Fastify) com **PostgreSQL real via Docker**. Não usar mocks de repositório, não usar fakes de banco. Os testes exercitam o fluxo completo: **login → cadastro de usuário → permissões → categoria → produto/variação → estoque → abrir caixa → venda → fechar caixa**, incluindo **todos os tratamentos de erro** com seus códigos e status HTTP, e a verificação de que **todo código de erro possui tradução** no mobile (`app_pt.arb` / `app_en.arb`).

⚠️ IDIOMA: manter a nomenclatura existente — módulos `auth`/`catalog`/`inventory` com erros em inglês onde já estão em inglês (`USER_NOT_FOUND`, `CATEGORY_ALREADY_EXISTS`), módulo `sales`/`inventory` com os códigos já existentes em português (`CAIXA_JA_ABERTO`, `ESTOQUE_INSUFICIENTE`). **Não renomear códigos de erro** — eles são contrato com o mobile.

## Objetivo

Criar em `apps/backend/test/` uma suíte e2e (Jest + supertest, config `test/jest-e2e.json`) que:

* sobe a aplicação Nest completa com `FastifyAdapter` (lembrar de `await app.getHttpAdapter().getInstance().ready()` após `app.init()`);
* roda contra um banco Postgres de teste (Docker), com migrações aplicadas e banco limpo entre arquivos/testes;
* cobre o caminho feliz de ponta a ponta e **cada código de erro** de cada módulo com o status HTTP correto;
* valida a matriz de permissões ADMIN × OPERADOR × anônimo em todos os endpoints;
* garante que todo código de erro retornado pelo backend tem chave de tradução no mobile (pt e en).

## Visão do fluxo (caminho feliz — teste `fluxo-completo.e2e-spec.ts`)

```text
Seed cria ADMIN (admin@store.local / Admin!123)
        ↓
POST /auth/login (ADMIN) → accessToken
        ↓
POST /users → cria OPERADOR
        ↓
POST /auth/login (OPERADOR) → token do operador
        ↓
POST /categories → cria categoria
        ↓
POST /products → cria produto com 1 variação (preço > 0)
        ↓
POST /inventory/entries → entrada de estoque para a variação
        ↓
POST /caixa/abrir (OPERADOR) → SessaoCaixa ABERTA
        ↓
POST /vendas → venda vinculada à sessão (sessaoCaixaId preenchido)
        ↓
POST /vendas/:id/itens → adiciona item (por variacaoId, sku e codigoBarras)
        ↓
PATCH /vendas/:id/desconto → aplica desconto
        ↓
POST /vendas/:id/pagamentos → pagamento dividido (DINHEIRO + PIX)
        ↓
POST /vendas/:id/finalizar → Σ pagamentos == total
        ↓
GET /inventory/variations/:variacaoId/balance → saldo baixado
GET /caixa/:id/movimentacoes → movimentação VENDA registrada
        ↓
POST /caixa/:id/fechar → resumo automático correto
GET /caixa/:id/resumo → saldoEsperado = abertura + dinheiro + suprimentos - sangrias
```

## Infraestrutura de teste (criar primeiro)

Arquivos em `apps/backend/test/utils/`:

```text
test/utils/create-test-app.ts    // sobe NestFastifyApplication com AppModule real
test/utils/db.ts                 // truncateAll() — TRUNCATE de todas as tabelas (ordem por FK) entre testes
test/utils/auth.ts               // loginAsAdmin(), loginAsOperador(), createOperador() — retornam tokens
test/utils/factories.ts          // criarCategoria(), criarProdutoComVariacao(), darEntradaEstoque(), abrirCaixa(), criarVendaComItem()
```

Regras da infra:

* `DATABASE_URL` de teste separada (ex.: sufixo `_test` no database do docker-compose existente); nunca rodar contra o banco de dev;
* antes da suíte: `prisma migrate deploy` + seed do admin (reutilizar `seedAdmin` ou criar o admin via Prisma direto no helper);
* `beforeEach`: truncate + re-seed do admin; testes independentes entre si;
* helpers de request sempre via `supertest(app.getHttpServer())` com header `Authorization: Bearer <token>`;
* asserts de erro SEMPRE verificam **status HTTP + código de erro no body** (o backend retorna o código estável na message da exceção).

## Arquivos de teste

```text
test/auth.e2e-spec.ts
test/users.e2e-spec.ts
test/permissions.e2e-spec.ts
test/categories.e2e-spec.ts
test/products.e2e-spec.ts
test/inventory.e2e-spec.ts
test/caixa.e2e-spec.ts
test/vendas.e2e-spec.ts
test/fluxo-completo.e2e-spec.ts
```

## Cenários obrigatórios

### RT01 — Auth (`auth.e2e-spec.ts`)

| Cenário | Esperado |
|---|---|
| Login com seed admin válido | 200/201 + accessToken + refreshToken + dados do usuário |
| Login com senha errada | 401 `INVALID_CREDENTIALS` |
| Login com email inexistente | 401 `INVALID_CREDENTIALS` |
| Login de usuário desativado | 401 `USER_INACTIVE` |
| `GET /auth/me` com token válido | 200 + id/name/email/role |
| `GET /auth/me` sem token | 401 |
| `GET /auth/me` com token inválido/expirado | 401 `INVALID_TOKEN` (ou 401 genérico do JwtGuard, conforme implementação) |
| `POST /auth/refresh` com refresh válido | novo accessToken |
| `POST /auth/refresh` com refresh inválido | 401 `INVALID_TOKEN` |

### RT02 — Usuários (`users.e2e-spec.ts`)

| Cenário | Esperado |
|---|---|
| ADMIN cria OPERADOR | 201 + usuário ativo com role OPERADOR |
| ADMIN cria usuário com email duplicado | 409 `EMAIL_ALREADY_IN_USE` |
| Criar com role inválida | 400 `INVALID_ROLE` |
| Criar com senha fraca / email inválido | 400 (validação de VO) |
| `PATCH /users/:id` inexistente | 404 `USER_NOT_FOUND` |
| ADMIN desativa OPERADOR → operador não loga mais | 401 `USER_INACTIVE` no login seguinte |
| ADMIN tenta desativar a si mesmo | erro `CANNOT_DEACTIVATE_SELF` |
| Ativar usuário desativado → volta a logar | 200 |
| `GET /users` paginado | estrutura de paginação correta |

### RT03 — Permissões (`permissions.e2e-spec.ts`)

Matriz completa: para cada linha, testar com token de ADMIN, token de OPERADOR e sem token.

| Endpoint | ADMIN | OPERADOR | Anônimo |
|---|---|---|---|
| `POST /users`, `PATCH /users/:id`, `GET /users` | ✅ | 403 | 401 |
| `POST /categories`, `PATCH /categories/:id*` | ✅ | 403 | 401 |
| `POST /products`, `PATCH /products/:id*`, variações CRUD | ✅ | 403 | 401 |
| `GET /variations/by-sku/:sku`, `by-barcode/:barcode` | ✅ | ✅ | 401 |
| `POST /inventory/entries`, `/exits` | ✅ | ✅ | 401 |
| `POST /inventory/adjustments`, `GET /inventory/low-stock` | ✅ | 403 | 401 |
| `POST /caixa/abrir`, vendas commands | ✅ | ✅ | 401 |
| `GET /caixa` (listar todas as sessões) | ✅ | 403 | 401 |
| `GET /caixa/:id` de sessão de OUTRO operador | ✅ | 403 `ACESSO_NEGADO`/`NAO_E_DONO_DO_CAIXA` | 401 |
| `GET /vendas/:id` de venda de OUTRO operador | ✅ | 403 `ACESSO_NEGADO` | 401 |
| `POST /caixa/:id/sangria` em caixa de outro operador | — | 403 `NAO_E_DONO_DO_CAIXA` | 401 |

### RT04 — Categorias (`categories.e2e-spec.ts`)

| Cenário | Esperado |
|---|---|
| Criar categoria | 201 |
| Criar categoria com nome duplicado | 409 `CATEGORY_ALREADY_EXISTS` |
| Renomear para nome já existente | 409 `CATEGORY_ALREADY_EXISTS` |
| `PATCH` categoria inexistente | 404 `CATEGORY_NOT_FOUND` |
| Desativar → criar produto nessa categoria | erro `CATEGORY_INACTIVE` |
| Ativar de volta → criar produto funciona | 201 |
| `GET /categories?active=true` filtra corretamente | 200 |

### RT05 — Produtos e variações (`products.e2e-spec.ts`)

| Cenário | Esperado |
|---|---|
| Criar produto com 1+ variações | 201 |
| Criar produto sem variação | 422/400 `PRODUCT_MUST_HAVE_VARIATION` |
| Criar produto em categoria inexistente | 404 `CATEGORY_NOT_FOUND` |
| SKU duplicado (no mesmo POST ou entre produtos) | 409 `SKU_ALREADY_IN_USE` |
| Barcode duplicado | 409 `BARCODE_ALREADY_IN_USE` |
| Preço zero ou negativo | 400 `INVALID_PRICE` |
| `GET /products/:id` inexistente | 404 `PRODUCT_NOT_FOUND` |
| `PATCH` variação inexistente | 404 `VARIATION_NOT_FOUND` |
| Buscar `GET /variations/by-sku/:sku` e `by-barcode/:barcode` | 200 com preço atual |
| Busca por SKU inexistente | 404 |

### RT06 — Estoque (`inventory.e2e-spec.ts`)

| Cenário | Esperado |
|---|---|
| Entrada de estoque → saldo atualizado | `GET .../balance` reflete |
| Entrada/saída com quantidade ≤ 0 | 400 `QUANTIDADE_INVALIDA` |
| Saída maior que o saldo | 422 `ESTOQUE_INSUFICIENTE` |
| Movimentar variação inexistente | 404 `VARIACAO_NAO_ENCONTRADA` |
| Ajuste absoluto (ADMIN) | saldo vira o valor ajustado |
| Ajuste com valor negativo | 400 `SALDO_INVALIDO` |
| `GET .../movements` lista ledger em ordem | 200 paginado |
| `GET /inventory/low-stock` lista variação abaixo do mínimo | 200 |

### RT07 — Caixa (`caixa.e2e-spec.ts`)

| Cenário | Esperado |
|---|---|
| Abrir caixa | 201 + sessão ABERTA + movimentação ABERTURA |
| Abrir segundo caixa (mesmo operador) | 409 `CAIXA_JA_ABERTO` |
| Dois operadores diferentes abrem caixa simultaneamente | ambos 201 |
| Abrir com valor negativo | 400 `VALOR_INVALIDO` |
| Sangria e suprimento em caixa aberto | 201 + movimentações registradas |
| Sangria com valor ≤ 0 | 400 `VALOR_INVALIDO` |
| Sangria em caixa de outro operador | 403 `NAO_E_DONO_DO_CAIXA` |
| Sangria/suprimento em caixa fechado | 409 `CAIXA_JA_FECHADO` |
| Fechar caixa → resumo automático | totalVendas, qtdVendas, totalPorForma, sangrias, suprimentos, saldoEsperado corretos |
| saldoEsperado = abertura + vendas em DINHEIRO + suprimentos − sangrias (cartão/pix fora do físico) | validar com venda paga em DINHEIRO+PIX |
| Fechar caixa já fechado | 409 `CAIXA_JA_FECHADO` |
| Fechar com venda ABERTA pendente | 409 `VENDA_PENDENTE_NO_FECHAMENTO` |
| Fechar caixa inexistente | 404 `CAIXA_NAO_ENCONTRADO` |
| ADMIN fecha caixa de operador | permitido conforme regra atual |
| `GET /caixa/aberto` sem caixa aberto | resposta vazia/404 conforme contrato atual |

### RT08 — Vendas (`vendas.e2e-spec.ts`)

| Cenário | Esperado |
|---|---|
| Criar venda sem caixa aberto | 409 `NO_OPEN_CASH_SESSION` |
| Criar venda com caixa aberto | 201 + `sessaoCaixaId` da sessão do operador |
| Adicionar item por variacaoId, por sku e por codigoBarras | 201, preço = preço atual da variação |
| Adicionar item de variação inexistente | 404 `VARIACAO_NAO_ENCONTRADA` |
| Adicionar item de variação inativa | 422 `VARIACAO_INATIVA` |
| Adicionar item sem estoque suficiente | 422 `INSUFFICIENT_STOCK` |
| Quantidade ≤ 0 | 400 `INVALID_QUANTITY` |
| Alterar quantidade acima do estoque | 422 `INSUFFICIENT_STOCK` |
| Remover item inexistente | 404 `ITEM_NOT_FOUND` |
| Desconto maior que subtotal | 422 `DISCOUNT_EXCEEDS_SUBTOTAL` |
| Desconto negativo/percentual inválido | 400 `INVALID_DISCOUNT` |
| Pagamento com valor ≤ 0 ou forma inválida | 400 `INVALID_PAYMENT` |
| Finalizar sem itens | 422 `SALE_HAS_NO_ITEMS` |
| Finalizar com Σ pagamentos ≠ total | 422 `PAYMENT_MISMATCH` |
| Finalizar com pagamento dividido exato (DINHEIRO + CARTAO_CREDITO) | 200 + status CONCLUIDA |
| Após finalizar: saldo de estoque baixado E movimentação VENDA no caixa | verificar via GET de estoque e movimentações |
| Alterar item/desconto/pagamento de venda CONCLUIDA | 409/422 `SALE_NOT_OPEN` ou `SALE_ALREADY_FINALIZED` |
| Finalizar venda já finalizada | `SALE_ALREADY_FINALIZED` |
| Rollback: finalizar com estoque que se esgotou entre o add e o finalizar | erro + venda continua ABERTA + nenhuma movimentação de caixa + estoque intacto |
| Cancelar venda ABERTA | CANCELADA, sem estorno |
| Cancelar venda CONCLUIDA | CANCELADA + estoque estornado + movimentação de estorno no caixa |
| Cancelar venda CONCLUIDA com caixa já fechado | 409 `CASH_SESSION_CLOSED` |
| Venda em caixa fechado (finalizar venda de sessão fechada) | 409 `CASH_SESSION_CLOSED`/`CAIXA_JA_FECHADO` |
| `GET /vendas/:id` inexistente | 404 `SALE_NOT_FOUND` |
| OPERADOR lista `GET /vendas` → só as suas; ADMIN → todas | escopo correto |

### RT09 — Fluxo completo (`fluxo-completo.e2e-spec.ts`)

Um único teste (ou describe sequencial) executando o diagrama da "Visão do fluxo" de ponta a ponta com asserts em cada etapa, incluindo conferência numérica final do resumo do caixa (centavos exatos).

## Traduções (mobile)

Os erros do backend são **códigos estáveis** (sem i18n no servidor); o mobile traduz em `apps/mobile/lib/l10n/app_pt.arb` e `app_en.arb`.

Tarefa:

1. Extrair a lista completa de códigos de:
   * `modules/auth/src/user/errors/user-error.ts` e `modules/auth/src/auth/errors/auth-error.ts`
   * `modules/catalog/src/category/errors/category-error.ts` e `modules/catalog/src/product/errors/product-error.ts`
   * `modules/inventory/src/movimentacao/errors/estoque.error.ts`
   * `modules/sales/src/venda/errors/venda.error.ts` e `modules/sales/src/cash-session/errors/caixa.error.ts`
2. Conferir que cada código tem chave correspondente nos dois `.arb` (seguir o padrão já usado, ex.: `inventoryErrorInsufficientStock`); adicionar as faltantes em pt E en e regenerar `app_localizations*.dart` (`flutter gen-l10n`).
3. Conferir que os mappers de failure do mobile (`apps/mobile/lib/domain/*/errors/*_failure.dart` + datasources) cobrem todos os códigos, com fallback para erro genérico.
4. Criar um teste (Dart ou script Node no backend) que falhe se surgir código de erro sem tradução — comparação estática lista de códigos × chaves dos `.arb`.
5. Conferir também que todo código novo está mapeado em `apps/backend/src/shared/errors/domain-error.mapper.ts` com o status HTTP da tabela abaixo.

## HTTP Error Mapping (referência para asserts)

```text
INVALID_CREDENTIALS / INVALID_TOKEN / USER_INACTIVE → 401
OPERATION_NOT_ALLOWED_FOR_ROLE / ACESSO_NEGADO / NAO_E_DONO_DO_CAIXA → 403
*_NOT_FOUND / *_NAO_ENCONTRADO(A) / SALE_NOT_FOUND → 404
EMAIL_ALREADY_IN_USE / CATEGORY_ALREADY_EXISTS / SKU_ALREADY_IN_USE / BARCODE_ALREADY_IN_USE → 409
CAIXA_JA_ABERTO / CAIXA_JA_FECHADO / NO_OPEN_CASH_SESSION / CASH_SESSION_CLOSED / VENDA_PENDENTE_NO_FECHAMENTO → 409
INSUFFICIENT_STOCK / ESTOQUE_INSUFICIENTE / PAYMENT_MISMATCH / SALE_HAS_NO_ITEMS / DISCOUNT_EXCEEDS_SUBTOTAL / VARIACAO_INATIVA / CATEGORY_INACTIVE → 422
INVALID_* / QUANTIDADE_INVALIDA / VALOR_INVALIDO / SALDO_INVALIDO / CANNOT_DEACTIVATE_SELF → 400
```

Se algum mapeamento estiver ausente ou divergente no `domain-error.mapper.ts`, corrigir o mapper (diff mínimo) — os testes são a especificação.

## Ordem de execução com subagents

IMPORTANTE: dividir em subagents independentes. O Subagent 1 é pré-requisito dos demais; 2–4 podem rodar em paralelo depois dele.

### Subagent 1 — Infra de teste
Escopo: `apps/backend/test/utils`, `test/jest-e2e.json`, docker/env de teste.
Responsável por: `create-test-app.ts` (Fastify ready), `db.ts` (truncate), `auth.ts`, `factories.ts`, banco `_test`, script/documentação de execução.
Portão:
```bash
cd apps/backend && bun run db:start && bun run prisma:migrate:deploy
bun run test:e2e -- --testPathPattern=smoke   # um smoke test do harness sobe app e loga admin
```

### Subagent 2 — Auth, usuários e permissões
Escopo: `test/auth.e2e-spec.ts`, `test/users.e2e-spec.ts`, `test/permissions.e2e-spec.ts` (RT01–RT03).
Portão:
```bash
cd apps/backend && bun run test:e2e -- --testPathPattern="auth|users|permissions"
```

### Subagent 3 — Catálogo e estoque
Escopo: `test/categories.e2e-spec.ts`, `test/products.e2e-spec.ts`, `test/inventory.e2e-spec.ts` (RT04–RT06).
Portão:
```bash
cd apps/backend && bun run test:e2e -- --testPathPattern="categories|products|inventory"
```

### Subagent 4 — Caixa, vendas e fluxo completo
Escopo: `test/caixa.e2e-spec.ts`, `test/vendas.e2e-spec.ts`, `test/fluxo-completo.e2e-spec.ts` (RT07–RT09).
Portão:
```bash
cd apps/backend && bun run test:e2e -- --testPathPattern="caixa|vendas|fluxo"
```

### Subagent 5 — Traduções
Escopo: `apps/mobile/lib/l10n`, mappers de failure do mobile, `domain-error.mapper.ts`, verificação estática código × tradução.
Portão:
```bash
cd apps/mobile && flutter gen-l10n && flutter analyze && flutter test
```

### Subagent 6 — Revisão
Validar ponta a ponta: rodar TODA a suíte do zero (banco recém-criado), conferir que nenhum teste depende de ordem, que todos os códigos de erro das tabelas RT01–RT09 têm pelo menos um teste, que todos têm tradução pt/en, e que nenhum teste usa mock de repositório.
Portão final:
```bash
cd apps/backend && bun run db:start && bun run prisma:migrate:deploy && bun run test:e2e
bun lint && turbo build
cd apps/mobile && flutter analyze && flutter test
```

## Checklist final

* Suíte e2e roda com um comando a partir de banco vazio (migrate + seed automáticos);
* Fluxo completo login → cadastro → categoria → produto → estoque → caixa → venda → fechamento passa com valores conferidos em centavos;
* Todos os códigos de erro de auth, users, catalog, inventory, caixa e vendas têm teste com status HTTP + código assertados;
* Matriz de permissões ADMIN/OPERADOR/anônimo coberta para todos os endpoints;
* OPERADOR só acessa seus próprios caixas e vendas; ADMIN acessa todos;
* Rollback transacional testado (finalizar e cancelar com falha no meio);
* Pagamento dividido testado; `Σ pagamentos == total`;
* Todo código de erro tem tradução em `app_pt.arb` e `app_en.arb`, com verificação automática;
* `domain-error.mapper.ts` cobre todos os códigos com o status da tabela;
* Testes independentes entre si (truncate entre testes), sem mocks de banco;
* Não recriar código paralelo; diff mínimo sobre o que já existe.
