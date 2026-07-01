# Tarefa: Implementar o módulo Inventory (padrão do monorepo)

Fonte da verdade = as regras abaixo. Siga a arquitetura em camadas já usada no repo
(domínio puro em `modules/*`, casca NestJS em `apps/backend`, web em `apps/web`,
mobile em `apps/mobile`). Reutilize `@repo/shared` e os guards/decorators já existentes.
Cada pasta com `index.ts` de barrel.

⚠️ **IDIOMA:** este módulo segue o padrão do próprio código — `inventory`/`sales`/`caixa`
são escritos em **PORTUGUÊS** (`movimentacao`, `EstoqueSaldo`, `saldo`, `variacaoId`,
`usuarioId`), diferente de `auth`/`catalog` (inglês). **Mantenha português aqui** — não
traduza nomes de pasta, classe, VO, erro ou campo.

Escopo: saldo por **variação** + histórico imutável (ledger) de movimentações; entrada/saída/ajuste
com motivo controlado (ADMIN); baixa/estorno por venda via port transacional; saldo nunca negativo.
Depende de `catalog` (lê `Variation`). NÃO é consumido de volta por `catalog` (direção preservada).

## Modelo (leia antes)

- Tudo é chaveado por **`variacaoId`** (a variação do catalog), nunca por produto.
- Dois eixos na movimentação: **`TipoMovimentacao`** (`ENTRADA`/`SAIDA`) **+** **`MotivoMovimentacaoEstoque`**
  (`COMPRA`, `AJUSTE`, `DEVOLUCAO`, `VENDA_PDV`, `VENDA_ONLINE`, `PERDA`).
- Duas entidades: **`EstoqueSaldo`** (projeção de saldo, mutável) e **`MovimentacaoEstoque`** (ledger, imutável).

## Ordem de execução (respeite as dependências)

### 1. Domínio — `modules/inventory` (agregado `movimentacao`) (skills: module-value-object, module-entity, module-dto, module-repository, module-query-cqrs, module-domain-service, module-use-case)

Em `modules/inventory/src/movimentacao/`:

- **model/**
  - `tipo-movimentacao.ts` — enum `TipoMovimentacao = { ENTRADA, SAIDA }`.
  - `motivo-movimentacao-estoque.ts` — enum `MotivoMovimentacaoEstoque = { COMPRA, AJUSTE, DEVOLUCAO, VENDA_PDV, VENDA_ONLINE, PERDA }` (RN02).
  - `quantidade-movimentada.vo.ts` — `QuantidadeMovimentada` (> 0). `saldo.vo.ts` — `Saldo` (>= 0).
    `saldo-resultante.vo.ts` — `SaldoResultante` (>= 0; falha ⇒ saldo negativo, RN05).
  - `estoque-saldo.entity.ts` — `EstoqueSaldo` (Entity + Result): `variacaoId`, `saldoAtual`, `quantidadeReservada`,
    `estoqueMinimo`, derivado `saldoDisponivel = saldoAtual - quantidadeReservada`. Rejeita `saldoAtual - reservada < 0`.
    Factory `createFromCatalogVariation(variation, overrides?)` → saldo 0 e `estoqueMinimo = variation.minStock` (RN01).
  - `movimentacao-estoque.entity.ts` — `MovimentacaoEstoque` (Entity **imutável**, RN07): `variacaoId`, `tipo`, `motivo`,
    `quantidade`, `saldoResultante` (calculado de `saldoAnterior ± quantidade`), `origemVendaId?`, `usuarioId`.
    `cloneWith` sempre retorna `Result.fail(EstoqueError.LEDGER_IMUTAVEL)`.
- **errors/** `estoque.error.ts` — `EstoqueError` (strings): `ESTOQUE_INSUFICIENTE` (RN05), `VARIACAO_NAO_ENCONTRADA`,
  `QUANTIDADE_INVALIDA`, `SALDO_INVALIDO`, `MOTIVO_MOVIMENTACAO_INVALIDO`, `LEDGER_IMUTAVEL` (RN07).
- **dto/** `movimentacao.dto.ts` — `RegistrarEntradaInputDTO`, `RegistrarSaidaInputDTO`
  (`{variacaoId, quantidade, motivo, usuarioId}`), `AjustarSaldoInputDTO` (`{variacaoId, novoSaldo, observacao?, usuarioId}`),
  `ListarMovimentacoesInputDTO` (Paginated + `{variacaoId, startDate?, endDate?}`), `SaldoEstoqueDTO`,
  `MovimentacaoEstoqueDTO`, `ItemAbaixoDoMinimoDTO`, e mappers `toSaldoEstoqueDTO`/`toMovimentacaoEstoqueDTO`.
- **provider/**
  - `catalog-variation.reader.ts` — port **`CatalogVariationReader`** (declarado AQUI, no consumidor): `findById(variationId) → Variation | null`. Reusa `Variation` de `@repo/catalog`.
  - `estoque.repository.ts` — `EstoqueRepository` (comando): `findSaldoByVariacaoId`,
    `aplicarMovimentacao(movimentacao, novoSaldo, { saldoAbsoluto? })` — persiste ledger + saldo **atomicamente sob lock** (delta relativo por padrão; absoluto no ajuste).
  - `estoque.query.ts` — `EstoqueQuery` (CQRS): `consultarSaldo(variacaoId)`, `listarMovimentacoes(input)` (paginado), `listarAbaixoDoMinimo()`.
  - `estoque.port.ts` — port **`EstoquePort`** exposto a `sales`: `darBaixa(variacaoId, quantidade, origemVendaId, usuarioId, motivo?)` e `estornar(...)`, ambos `Promise<Result<void>>`.
- **service/** `estoque-policy.service.ts` — `assertSaldoSuficiente(saldoAtual, qtd)`,
  `assertSaldoDisponivel(saldoAtual, reservada, qtd)` (usa `saldoDisponivel`, RN05),
  `calculateAdjustment(saldoAtual, novoSaldo) → { tipo, quantidade }`.
- **use-case/**
  - `estoque-use-case.base.ts` — base com `loadContext(variacaoId)` (carrega saldo; lazy-init via `CatalogVariationReader` + `createFromCatalogVariation`, RN01; `VARIACAO_NAO_ENCONTRADA` se a variação não existe) e `persistMovement(saldo, { tipo, motivo, quantidade, usuarioId, origemVendaId?, saldoAbsoluto? })` (monta `MovimentacaoEstoque` + novo `EstoqueSaldo` e chama `aplicarMovimentacao`).
  - `registrar-entrada.use-case.ts` — ADMIN. `ENTRADA`; motivo ∈ `{COMPRA, DEVOLUCAO, AJUSTE}`, senão `MOTIVO_MOVIMENTACAO_INVALIDO`.
  - `registrar-saida.use-case.ts` — ADMIN. `SAIDA`; motivo ∈ `{PERDA, AJUSTE}`; valida `assertSaldoSuficiente` (RN05).
  - `ajustar-saldo.use-case.ts` — ADMIN. Correção para `novoSaldo` absoluto; `calculateAdjustment` define tipo+quantidade; motivo fixo `AJUSTE`; `saldoAbsoluto: true`; no-op se delta 0. `observacao?` opcional (RN03/RN04).
  - `consultar-saldo.use-case.ts` — `{variacaoId}` → `SaldoEstoqueDTO`. Via `EstoqueQuery`.
  - `listar-movimentacoes.use-case.ts` — ADMIN. filtros `variacaoId`, `startDate`, `endDate`, paginado.
  - `listar-abaixo-do-minimo.use-case.ts` — ADMIN. itens com `saldoDisponivel < estoqueMinimo`.
  - `estoque-port.service.ts` — implementa `EstoquePort` (**consumido só por `sales`**, RN06, nunca por usuário direto):
    `darBaixa` (`SAIDA`, motivo ∈ `{VENDA_PDV, VENDA_ONLINE}`, valida `assertSaldoDisponivel`) e `estornar` (`ENTRADA`).

Cobrir com testes (jest) usando mocks in-memory (incl. `CatalogVariationReader` e `EstoqueRepository` fakes) no padrão de `modules/*/test/mock/*`.
Exportar tudo pelos `index.ts` até `modules/inventory/src/index.ts`.

### 2. Backend — `apps/backend/src/modules/inventory` (skills: backend-controller, backend-prisma-data, config-shared-backend)

- **Adapters dos ports** em `adapters/`:
  - `estoque.prisma.repository.ts` — `EstoqueRepository`; `aplicarMovimentacao` grava ledger + saldo sob `SELECT … FOR UPDATE` na mesma tx (suporta `saldoAbsoluto`).
  - `estoque.prisma.query.ts` — `EstoqueQuery` (projeções/paginção).
  - `catalog-variation.prisma.reader.ts` — implementa `CatalogVariationReader` lendo `Variation` do Prisma e reusando `Variation.tryCreate` de `@repo/catalog`.
- **Prisma** em `prisma/models/*.model.prisma`, migração:
  - `EstoqueSaldo` (`variacaoId` PK/único, `saldoAtual`, `quantidadeReservada`, `estoqueMinimo`, timestamps).
  - `MovimentacaoEstoque` (id, `variacaoId` FK, `tipo`, `motivo`, `quantidade`, `saldoResultante`, `origemVendaId` nullable, `usuarioId`, `createdAt`) — **append-only** (RN07).
- **Controllers CQRS + http DTOs** (class-validator, Swagger `@ApiTags/@ApiOperation/@ApiResponse/@ApiBearerAuth`):
  - `inventory-commands.controller.ts` (`@Roles('ADMIN')`, RN04): `POST /estoque/entrada` (`inventory-entry.http.dto.ts`), `POST /estoque/saida` (`inventory-exit.http.dto.ts`), `POST /estoque/ajuste` (`inventory-adjustment.http.dto.ts`).
  - `inventory-queries.controller.ts`: `GET /estoque/:variacaoId` (saldo), `GET /estoque/movimentacoes` (`@Roles('ADMIN')`, `list-inventory-movements.query.dto.ts`), `GET /estoque/abaixo-do-minimo` (`@Roles('ADMIN')`).
- **Port transacional exposto a `sales`:** registrar `EstoquePortService` como provider de `EstoquePort`. A baixa/estorno
  deve participar da **mesma transação da venda** (via `TransactionManager`/`runInTransaction` do shared, recebendo o `tx` do Prisma) — RN06 e a transação única do create-sale.
- Mapear erros → HTTP em `shared/errors/domain-error.mapper.ts`: `ESTOQUE_INSUFICIENTE`/`LEDGER_IMUTAVEL` → 409/422,
  `VARIACAO_NAO_ENCONTRADA` → 404, `QUANTIDADE_INVALIDA`/`MOTIVO_MOVIMENTACAO_INVALIDO`/`SALDO_INVALIDO` → 400.
- Registrar em `inventory.module.ts` o binding port→adapter (repository, query, reader, `EstoquePort`).

### 3. Web — `apps/web` (skills: config-frontend-layout, frontend-form-schema)

- Adicionar item **Estoque** na sidebar do layout admin existente; **só aparece para ADMIN** (RN04) — ocultação é reforço.
- Página faz checkup de permissão no load; se não for ADMIN, redireciona para a principal.
- Consulta de saldo por variação (saldoAtual / reservada / disponível / mínimo).
- Registrar **entrada**, **saída** e **ajuste** (form React Hook Form + Zod, `*.schema.ts`); motivo obrigatório conforme o tipo (RN03).
- Histórico de movimentações com filtros (variação, período) e visão "abaixo do mínimo".

### 4. Mobile — `apps/mobile` (Flutter; skills flutter-\*)

- Consulta de saldo disponível por variação ao montar a venda no PDV (leitura — opcional para o MVP).
- Sem entrada/saída/ajuste no mobile neste MVP.

## Invariantes a garantir (checklist)

RN01 saldo inicia em zero (lazy, seedado da variação) • RN02 todo write gera `MovimentacaoEstoque` (tipo + motivo)
• RN03 ajuste/entrada/saída com motivo controlado por tipo • RN04 comandos só ADMIN • RN05 saldo/disponível nunca negativo
• RN06 baixa/estorno por venda só via `EstoquePort` (transacional, nunca por usuário) • RN07 ledger imutável.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

O módulo NÃO é greenfield. Já existem `modules/inventory/src/movimentacao/**` (entidades `EstoqueSaldo`/`MovimentacaoEstoque`,
VOs `saldo`/`quantidade-movimentada`/`saldo-resultante`, ports `catalog-variation.reader`/`estoque.repository`/`estoque.query`/`estoque.port`,
policy e use cases), os adapters/controllers em `apps/backend/src/modules/inventory`, e os guards/decorators compartilhados.
Tudo é **em português** e por **`variacaoId`**. REGRA: **alinhar e editar o que existe**, nunca recriar em paralelo nem em inglês.
Antes de escrever, cada subagent lê os arquivos da sua camada e faz diff mínimo contra estas RN.
Divergências a reconciliar: o código já tem **reserva de estoque** (`quantidadeReservada`/`saldoDisponivel`) e `listar-abaixo-do-minimo`,
não mencionados no doc original — confirmar antes de remover/simplificar.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web e mobile são independentes.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: domínio compila antes do backend consumir; `catalog` antes de `inventory`.

### Portão de cada subagent

Invoca a skill da camada → edita → `turbo build --filter=<pkg>` + `bun test` verdes → entrega diff.

### Ordem

1. **Subagent 1 — Domínio** (seção 1). Bloqueante: entidades, enums, VOs, ports (incl. `EstoquePort`/`CatalogVariationReader`), policy, use cases, erros. Testes jest verdes.
2. **Subagent 2 — Backend** (seção 2), depende de (1). Sub-ordem: schema Prisma (EstoqueSaldo/MovimentacaoEstoque) + migração → adapters (repository/query/reader) → `EstoquePort` transacional → controllers CQRS/DTOs. Bind port→adapter no módulo.
3. **Subagent 3 — Web** e **Subagent 4 — Mobile** (seções 3 e 4): em paralelo assim que a API estiver contratada.
4. **Subagent 5 — Revisão**: valida entrada/saída/ajuste e consulta de saldo ponta a ponta, ledger imutável (RN07), saldo/disponível nunca negativo (RN05), comandos ADMIN-only (RN04), lazy-init em zero (RN01), e a baixa/estorno de venda via `EstoquePort` **na mesma transação** da venda (RN06); roda build + testes + lint no monorepo.
