# Tarefa: Implementar o módulo Sales (padrão do monorepo)

Fonte da verdade = as regras abaixo. Siga a arquitetura em camadas já usada no repo
(domínio puro em `modules/*`, casca NestJS em `apps/backend`, web em `apps/web`,
mobile em `apps/mobile`). Reutilize `@repo/shared` e os guards/decorators já existentes.
Cada pasta com `index.ts` de barrel.

⚠️ **IDIOMA:** `sales` é escrito em **PORTUGUÊS** (`venda`, `cash-session`/`caixa`,
`SessaoCaixa`, `usuarioId`, `sessaoCaixaId`, `variacaoId`), como `inventory`. NÃO traduza.

Escopo: PDV = **sessão de caixa** (abrir/fechar com resumo + sangria/suprimento) + **venda** com
ciclo de vida (`ABERTA → CONCLUIDA | CANCELADA`), itens, desconto e pagamentos (possivelmente
divididos). Dois aggregates: `cash-session` e `venda`. Orquestra `catalog` (preço da variação) e
`inventory` (baixa/estorno) via gateways transacionais. É o **último** na ordem de build.

## Modelo (leia antes)

- Tudo por **`variacaoId`** (nunca produto). Valores monetários em **centavos** (`Dinheiro`/`ValorMonetario`).
- `Venda` é raiz e **possui `ItemVenda` e `Pagamento`**. Pagamento é entidade → **pagamento dividido** é permitido;
  concluir exige `Σ pagamentos == total`. Só `CONCLUIDA` é imutável; `ABERTA` é mutável; `CANCELADA` estorna.
- `SessaoCaixa` possui `MovimentacaoCaixa` (ABERTURA, VENDA, SANGRIA, SUPRIMENTO). Fechamento gera resumo e é bloqueado se houver venda pendente.

## Ordem de execução (respeite as dependências)

### 1. Domínio — `modules/sales` (skills: module-value-object, module-entity, module-dto, module-repository, module-query-cqrs, module-domain-service, module-use-case)

Agregado `cash-session` em `modules/sales/src/cash-session/`:

- **model/**
  - `status-sessao-caixa.ts` — enum `StatusSessaoCaixa = { ABERTA, FECHADA }`.
  - `tipo-movimentacao-caixa.ts` — enum `TipoMovimentacaoCaixa = { ABERTURA, VENDA, SANGRIA, SUPRIMENTO }`.
  - `valor-monetario.vo.ts` (`ValorMonetario`, centavos), `valor-positivo.vo.ts` (`ValorPositivo`, > 0).
  - `sessao-caixa.entity.ts` — `SessaoCaixa` (Entity + Result): `usuarioId`, `status`, `valorAbertura`,
    `abertaEm`, `fechadaEm?`. Método `fechar()` → `Result` (`CAIXA_JA_FECHADO`, RN06). Imutável após fechar.
  - `movimentacao-caixa.entity.ts` — `MovimentacaoCaixa` (imutável): `sessaoCaixaId`, `tipo`, `valor`, `origemVendaId?`, `usuarioId`.
- **errors/** `caixa.error.ts` — `CaixaError`: `CAIXA_NAO_ENCONTRADO`, `CAIXA_JA_ABERTO` (RN01), `CAIXA_JA_FECHADO` (RN06),
  `NAO_E_DONO_DO_CAIXA` (RN02), `ACESSO_NEGADO` (RN03), `VENDA_PENDENTE_NO_FECHAMENTO`, `VALOR_INVALIDO`.
- **dto/** `caixa.dto.ts` — saída da sessão + resumo (`{ totalVendas, qtdVendas, totalPorForma, sangrias, suprimentos, saldoEsperado }`, RN05); filtros `{ usuarioId?, status?, from?, to? }`.
- **provider/**
  - `caixa.repository.ts` — `CaixaRepository`: `findAbertaByUsuario`, `findById`, `create`, `save`, `aplicarMovimentacao`.
  - `caixa.query.ts` — `CaixaQuery` (CQRS): consulta/resumo/listagem paginada.
  - `caixa.port.ts` — port **`CaixaPort`** exposto a `venda`: `caixaAbertoDoOperador(usuarioId)`, `isSessaoAberta(id)`,
    `registrarVenda(sessaoId, valor, tx?)`, `estornarVenda(sessaoId, valor, tx?)`.
  - `pending-sale.predicate.ts` — `PendingSalePredicate` (bloqueia fechar com venda em aberto).
- **use-case/**
  - `registrar-movimentacao.base.ts` — base para movimentações de caixa.
  - `abrir-caixa.use-case.ts` — OPERADOR. in `{usuarioId, valorAbertura}` → `{sessaoCaixaId}`. Erro: `CAIXA_JA_ABERTO` (RN01).
  - `fechar-caixa.use-case.ts` — OPERADOR/dono. in `{sessaoCaixaId, usuarioId}` → resumo (RN05). Erros: `CAIXA_NAO_ENCONTRADO`, `CAIXA_JA_FECHADO`, `NAO_E_DONO_DO_CAIXA` (RN02), `VENDA_PENDENTE_NO_FECHAMENTO`.
  - `caixa-aberto-do-operador.use-case.ts` — retorna a sessão aberta do operador (usado pelo port).
  - `registrar-sangria.use-case.ts` / `registrar-suprimento.use-case.ts` — OPERADOR/dono. Movimenta caixa.
  - `listar-movimentacoes.use-case.ts` — movimentações da sessão.
  - `resumo-sessao.use-case.ts` — resumo automático (RN05).
  - `caixa-port.service.ts` — implementa `CaixaPort` (consumido só por `venda`).

Agregado `venda` em `modules/sales/src/venda/`:

- **model/**
  - `canal-venda.ts` — enum `CanalVenda = { PDV }`. `status-venda.ts` — `StatusVenda = { ABERTA, CONCLUIDA, CANCELADA }`.
  - `forma-pagamento.ts` — `FormaPagamento = { DINHEIRO, CARTAO_DEBITO, CARTAO_CREDITO, PIX }` (RN12).
  - `tipo-desconto.ts` — `TipoDesconto` (percentual/absoluto). `dinheiro.vo.ts` (`Dinheiro`, centavos),
    `quantidade-vendida.vo.ts` (`QuantidadeVendida`, > 0), `desconto.vo.ts` (`Desconto`, não excede subtotal).
  - `item-venda.entity.ts` — `ItemVenda`: `variacaoId`, `quantidade`, `precoUnitario`, `subtotal`.
  - `pagamento.entity.ts` — `Pagamento`: `forma`, `valor` (> 0). **Vários por venda.**
  - `venda.entity.ts` — `Venda` (raiz): `numero?`, `canal` (PDV), `status`, `usuarioId`, `sessaoCaixaId`,
    `itens[]`, `pagamentos[]`, `desconto`, `concluidaEm?`, `canceladaEm?`. Factories `abrir`/`hydrate`; métodos
    `adicionarItem`, `removerItem`, `alterarQuantidadeItem`, `aplicarDesconto`, `adicionarPagamento`/`definirPagamentos`,
    `atribuirNumero`, `concluir` (exige itens + `Σ pagamentos == total`, senão `PAYMENT_MISMATCH`), `cancelar`.
    Escritas só em `ABERTA` (`SALE_NOT_OPEN`/`SALE_ALREADY_FINALIZED`, RN11).
- **errors/** `venda.error.ts` — `VendaError`: `SALE_NOT_FOUND`, `SALE_ALREADY_FINALIZED`, `NO_OPEN_CASH_SESSION` (RN07),
  `INSUFFICIENT_STOCK` (RN09), `PAYMENT_MISMATCH`, `SALE_NOT_OPEN`, `ITEM_NOT_FOUND`, `INVALID_QUANTITY`, `INVALID_PRICE`,
  `INVALID_DISCOUNT`, `DISCOUNT_EXCEEDS_SUBTOTAL`, `INVALID_PAYMENT`, `SALE_HAS_NO_ITEMS`, `CASH_SESSION_CLOSED`.
- **dto/** `venda.dto.ts` — saída da venda (itens, pagamentos, subtotal/desconto/total) + inputs por operação.
- **provider/**
  - `vendas.repository.ts` — `VendasRepository`: `create`, `save`, `findById`, próximo `numero`.
  - `vendas.query.ts` — `VendasQuery` (CQRS): listagem/resumo por sessão.
  - `caixa.gateway.ts` — port **`CaixaGateway`** (declarado aqui, ligado ao `CaixaPort`): `caixaAbertoDoOperador`, `isSessaoAberta`, `registrarVenda(...tx?)`, `estornarVenda(...tx?)`.
  - `estoque.gateway.ts` — port **`EstoqueGateway`** (ligado ao `EstoquePort` do inventory): `validarSaldoDisponivel(variacaoId, qtd)`, `darBaixa(variacaoId, qtd, origemVendaId, usuarioId, tx?)`, `estornar(...)`. Usa `TransactionContext`.
- **service/** `venda-calculator.service.ts` — `subtotal`, `totals(itens, desconto)`, `totalPagamentos`.
- **use-case/** (`venda-use-case.base.ts` como base):
  - `criar-venda.use-case.ts` — OPERADOR. Abre `Venda` na sessão aberta do operador via `CaixaGateway` (RN07/RN08); `NO_OPEN_CASH_SESSION` se não houver.
  - `adicionar-item.use-case.ts` / `remover-item.use-case.ts` — obtém preço da **variação** (catalog, ativa — RN10) e valida `validarSaldoDisponivel` (RN09). Erros: `PRODUCT/VARIATION` inativa/inexistente, `INSUFFICIENT_STOCK`.
  - `aplicar-desconto.use-case.ts` — aplica `Desconto`; `DISCOUNT_EXCEEDS_SUBTOTAL`.
  - `finalizar-venda.use-case.ts` — `concluir()` + `estoque.darBaixa` + `caixa.registrarVenda`, **na mesma transação** (RN09); rollback/estorno total em falha. Erros: `SALE_HAS_NO_ITEMS`, `PAYMENT_MISMATCH`, `INSUFFICIENT_STOCK`.
  - `cancelar-venda.use-case.ts` — estorna estoque e caixa; bloqueado se a sessão já fechou (`CASH_SESSION_CLOSED`, via `isSessaoAberta`).
  - `buscar-venda.use-case.ts` / `listar-vendas.use-case.ts` / `resumo-vendas.use-case.ts` — leitura, com escopo por dono/role (RN03/RN04; `ACESSO_NEGADO`).

Cobrir com testes (jest) usando mocks in-memory (incl. `CaixaGateway`/`EstoqueGateway` fakes), destacando:
RN01 (um caixa aberto), RN09 (rollback/estorno quando estoque ou caixa falha na finalização),
RN11 (bloqueio de escrita em venda `CONCLUIDA`), `PAYMENT_MISMATCH`. Exportar tudo até `modules/sales/src/index.ts`.

### 2. Backend — `apps/backend/src/modules/sales` (+ nested `cash-session/`) (skills: backend-controller, backend-prisma-data, config-shared-backend)

- **Adapters (venda)** em `sales/adapters/`: `vendas.prisma.repository.ts`, `vendas.prisma.query.ts`, `venda.mapper.ts`,
  `variacao.prisma.reader.ts` (lê preço/ativo da `Variation`), `estoque.gateway.adapter.ts` (liga `EstoqueGateway`→`EstoquePort`),
  `caixa.gateway.adapter.ts` (liga `CaixaGateway`→`CaixaPort`), `money.ts`.
- **Adapters (caixa)** em `sales/cash-session/adapters/`: `caixa.prisma.repository.ts`, `caixa.prisma.query.ts`,
  `stub-pending-sale.predicate.ts`, `money.ts`.
- **Prisma** (`prisma/models/*.model.prisma`, migração):
  - `SessaoCaixa` (id, usuarioId FK, status, valorAbertura, abertaEm, fechadaEm nullable) + índice único parcial **`UNIQUE(usuarioId) WHERE status='ABERTA'`** (RN01).
  - `MovimentacaoCaixa` (id, sessaoCaixaId FK, tipo, valor, origemVendaId nullable, usuarioId, createdAt) — append-only.
  - `Venda` (id, numero, canal, status, usuarioId FK, sessaoCaixaId FK, concluidaEm/canceladaEm nullable, timestamps),
    `ItemVenda` (id, vendaId FK, variacaoId FK, quantidade, precoUnitario, subtotal), `Pagamento` (id, vendaId FK, forma, valor).
- **Transação única do finalizar/cancelar:** rodar em `runInTransaction`/`TransactionManager` do shared; os gateways de estoque e caixa recebem o `tx` e commitam/revertem junto com a venda (RN09).
- **Controllers CQRS + http DTOs** (class-validator, Swagger):
  - `cash-session/caixa-commands.controller.ts`: `POST /caixa/abrir`, `POST /caixa/:id/fechar`, `POST /caixa/:id/sangria`, `POST /caixa/:id/suprimento` (OPERADOR/dono).
  - `cash-session/caixa-queries.controller.ts`: `GET /caixa/me`, `GET /caixa` (`@Roles('ADMIN')`, RN04), `GET /caixa/:id` (resumo), `GET /caixa/:id/movimentacoes`.
  - `vendas-commands.controller.ts`: `POST /vendas` (criar), `POST /vendas/:id/itens`, `DELETE /vendas/:id/itens/:itemId`, `POST /vendas/:id/desconto`, `POST /vendas/:id/finalizar`, `POST /vendas/:id/cancelar` (OPERADOR).
  - `vendas-queries.controller.ts`: `GET /vendas/:id`, `GET /caixa/:id/vendas`.
- Escopo por role/dono no backend (RN02/RN03/RN04) usando `userId`/`role` do contexto de `auth`.
- Mapear erros → HTTP: `CAIXA_JA_ABERTO`/`CAIXA_JA_FECHADO`/`NO_OPEN_CASH_SESSION`/`INSUFFICIENT_STOCK`/`PAYMENT_MISMATCH`/`VENDA_PENDENTE_NO_FECHAMENTO` → 409/422; `NAO_E_DONO_DO_CAIXA`/`ACESSO_NEGADO` → 403; `*_NOT_FOUND`/`*_NAO_ENCONTRADO` → 404; `INVALID_*`/`SALE_HAS_NO_ITEMS`/`DISCOUNT_EXCEEDS_SUBTOTAL` → 400/422.
- Registrar em `sales.module.ts` / `cash-session/caixa.module.ts` os bindings port→adapter (repos, queries, `CaixaGateway`, `EstoqueGateway`, `CaixaPort`, reader de variação).

### 3. Web — `apps/web` (skills: config-frontend-layout)

- Painel de **consulta do admin** (item **Caixas** na sidebar; layout existente):
  - Listagem de todas as sessões (todos operadores), filtro por operador/período/status.
  - Detalhe da sessão: abertura/fechamento, sangrias/suprimentos, resumo automático (RN05) e vendas vinculadas.
- PDV (abrir/fechar/vender) **não** é obrigatório na web neste MVP — é o fluxo do mobile.

### 4. Mobile — `apps/mobile` (Flutter; skills flutter-\*) — CORE do mobile

- **Abrir caixa** (bloqueado se já houver um aberto, RN01), informando valor de abertura; sangria/suprimento.
- **PDV**: buscar variação (consulta `catalog`), montar itens, aplicar desconto, calcular total, registrar pagamento(s) — inclusive **divididos** —, finalizar (baixa de estoque, RN09) e cancelar com estorno.
- **Fechar caixa** exibindo o resumo automático (RN05) antes de confirmar; bloqueio se houver venda pendente.
- **Histórico** das próprias sessões e vendas (RN03).

## Invariantes a garantir (checklist)

RN01 um caixa aberto por operador (índice único parcial) • RN02 só o dono abre/fecha • RN03 operador vê só os seus
• RN04 admin vê todos • RN05 resumo automático no fechamento • RN06 sessão fechada imutável • RN07 venda exige caixa aberto
• RN08 venda vinculada à sessão aberta • RN09 finalizar/cancelar em transação única (baixa/estorno de estoque + caixa)
• RN10 variação inativa não vende • RN11 venda `CONCLUIDA` imutável (mutável só em `ABERTA`) • RN12 formas de pagamento válidas; concluir exige `Σ pagamentos == total`.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

O módulo NÃO é greenfield. Já existem `modules/sales/src/{venda,cash-session}/**` (com ciclo de vida da venda,
pagamentos/desconto, sessão de caixa com sangria/suprimento/resumo, ports `CaixaGateway`/`EstoqueGateway`/`CaixaPort`),
os adapters/controllers em `apps/backend/src/modules/sales` (com `cash-session/` aninhado) e os guards/decorators compartilhados.
Tudo é **em português** e por **`variacaoId`**. REGRA: **alinhar e editar o que existe**, nunca recriar em paralelo nem em inglês.
Antes de escrever, cada subagent lê os arquivos da sua camada e faz diff mínimo contra estas RN.
Divergências a reconciliar: o doc original dizia "venda imutável" e "uma forma de pagamento", mas o código tem
**ciclo de vida** (ABERTA→CONCLUIDA→CANCELADA), **pagamento dividido**, **desconto**, **sangria/suprimento** e **cancelamento com estorno** — confirmar antes de remover/simplificar.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web e mobile são independentes.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: `catalog` e `inventory` contratados antes de `sales`; domínio antes do backend.

### Portão de cada subagent

Invoca a skill da camada → edita → `turbo build --filter=<pkg>` + `bun test` verdes → entrega diff.

### Ordem

1. **Subagent 1 — Domínio** (seção 1). Bloqueante: entidades (SessaoCaixa/MovimentacaoCaixa/Venda/ItemVenda/Pagamento), enums, VOs, ports/gateways, services, use cases, erros. Testes jest verdes.
2. **Subagent 2 — Backend** (seção 2), depende de (1). Sub-ordem: schema Prisma (SessaoCaixa/MovimentacaoCaixa/Venda/ItemVenda/Pagamento) + migração (incl. índice único parcial RN01) → adapters (repos/queries/reader) → gateways transacionais (`CaixaGateway`/`EstoqueGateway`) + `CaixaPort` → controllers CQRS/DTOs. Bind port→adapter nos módulos.
3. **Subagent 3 — Web** e **Subagent 4 — Mobile** (seções 3 e 4): em paralelo assim que a API estiver contratada.
4. **Subagent 5 — Revisão**: valida abrir/fechar caixa com resumo (RN05) e o fluxo de venda ponta a ponta (criar→itens→desconto→pagamentos→finalizar), o rollback/estorno transacional de finalizar/cancelar (RN09), imutabilidade da venda `CONCLUIDA` (RN11), `Σ pagamentos == total` (RN12), um caixa aberto por operador (RN01) e escopo dono/admin (RN02/RN03/RN04); roda build + testes + lint no monorepo.
