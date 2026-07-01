# 04 · Módulo `estoque` — Atos Store Backend

> Sprint 4. Saldo e movimentação por variação (SKU). **Coração do MVP.** Dono do `saldoAtual`.

## Convenções (resumo — completo em `00-fundacao.md`)

- Domínio puro em `modules/estoque/src/<agregado>/`, dividido por pasta: `model/` (`*.entity.ts`, value objects `*.vo.ts`), `provider/` (contratos `*.repository.ts` e CQRS `*-query.ts`), `use-case/` (`*.use-case.ts`), `dto/` (`*.dto.ts`), `errors/` (`*-error.ts`), `service/` (specifications / domain services).
- Escrita e leitura via **use case** (`UseCase<In, Out>` com `.execute`), não command/handler. Leitura = use cases `find-*`/`list-*` apoiados num contrato `*-query.ts` (CQRS), separado do `*.repository.ts`.
- Erro de negócio via `Result` de `@repo/shared` (sem `throw`); códigos de erro = objeto const `*Error` em `errors/`, retornados por `Result.fail(CODE)`.
- Dependência externa / cross-módulo = interface (port) na pasta `provider/` do módulo **consumidor**, implementada em `apps/backend/src/modules/<m>/adapters/*.prisma.*`.
- HTTP fica no backend (`*.controller.ts` + `dto/*.http.dto.ts` + `adapters/` Prisma); o módulo de domínio não conhece Nest/Fastify/Prisma.
- Naming kebab-case dot-type (`registrar-entrada.use-case.ts`, `movimentacao-estoque.entity.ts`).

## Responsabilidade

Controlar saldo e movimentação por variação. `MovimentacaoEstoque` é o **ledger imutável** (fonte da verdade); `saldoAtual` / `quantidadeReservada` / `estoqueMinimo` ficam na variação como leitura rápida.

## Domínio

- **`MovimentacaoEstoque`** (ledger): `tipo` (ENTRADA/SAIDA), `motivo`, `quantidade`, `saldoResultante`, `origemVendaId?`.
- Enum `MotivoMovimentacaoEstoque`: `COMPRA`, `AJUSTE`, `DEVOLUCAO`, `VENDA_PDV`, `VENDA_ONLINE`, `PERDA`.

## Use cases — escrita (`use-case/`)

- `registrar-entrada` (motivo COMPRA / DEVOLUCAO / AJUSTE)
- `registrar-saida` (motivo PERDA / AJUSTE)
- `ajustar-saldo`

> A saída por **venda** NÃO é use case público de UI — é exposta como use case de baixa (`dar-baixa` / `estornar`) consumida pelo módulo `vendas` através do contrato descrito em **Contratos**.

## Regra central (transação única)

Toda entrada/saída executa numa transação: (1) cria a `MovimentacaoEstoque` com `saldoResultante`; (2) atualiza o `saldoAtual` da variação. As duas coisas juntas ou nada.

## Use cases — leitura (`find-*`/`list-*`, apoiados em `*-query.ts`)

- `consultar-saldo` (variação)
- `listar-movimentacoes` (por variação/período)
- `listar-abaixo-do-minimo` (alertas de reposição)

## Contratos (`provider/`)

- `EstoqueRepository` (`*.repository.ts`) — escrita do ledger e do saldo.
- `EstoqueQuery` (`*-query.ts`) — projeções de leitura (saldo, movimentações).
- **Expõe para `vendas`** `darBaixa(variacaoId, qtd, origemVendaId)` e `estornar(...)` via use cases. `vendas` depende de um contrato (port) na sua própria pasta `provider/`, que o backend liga ao estoque por um `adapter`.

## Invariantes

- `saldoAtual` não fica negativo (exceto `ajustar-saldo` explícito).
- `saldoResultante` = saldo anterior ± quantidade.
- Baixa por venda valida saldo disponível (`saldoAtual − quantidadeReservada`) antes.

## Erros de domínio (`errors/estoque-error.ts` — códigos `Result.fail(CODE)`)

- `INSUFFICIENT_STOCK`
- `VARIATION_NOT_FOUND`
- `INVALID_QUANTITY`

## Dependências

Lê a `VariacaoProduto` (definida em `catalogo`). É consumido por `vendas` via `EstoqueGateway`.

## Requisitos Funcionais

- **RF-EST-01:** Registrar entrada de estoque (motivo COMPRA/DEVOLUCAO/AJUSTE) informando variação e quantidade.
- **RF-EST-02:** Registrar saída manual (motivo PERDA/AJUSTE).
- **RF-EST-03:** Cada movimentação cria um registro no ledger (com `saldoResultante`) e atualiza o `saldoAtual` na mesma transação.
- **RF-EST-04:** Ajuste de saldo permite definir o saldo absoluto (correção de inventário), registrando a diferença como movimentação.
- **RF-EST-05:** Impedir saída que deixe o saldo negativo (exceto ajuste explícito).
- **RF-EST-06:** Consultar saldo atual e saldo disponível (`saldoAtual − quantidadeReservada`) por variação.
- **RF-EST-07:** Listar movimentações por variação e período.
- **RF-EST-08:** Listar variações abaixo do estoque mínimo (alerta de reposição).
- **RF-EST-09:** Expor `darBaixa`/`estornar` via `EstoqueGateway` para o módulo `vendas` (sem use case público de saída por venda).

## Campos (forms)

**Entrada de Estoque**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| variacaoId | busca (SKU/nome/bipe) | Sim | variação existente |
| quantidade | inteiro | Sim | > 0 |
| motivo | select `COMPRA`/`DEVOLUCAO`/`AJUSTE` | Sim | — |
| observacao | texto | Não | — |

**Saída Manual**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| variacaoId | busca | Sim | variação existente |
| quantidade | inteiro | Sim | > 0, ≤ saldo |
| motivo | select `PERDA`/`AJUSTE` | Sim | — |
| observacao | texto | Não | — |

**Ajuste de Saldo (inventário)**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| variacaoId | busca | Sim | variação existente |
| novoSaldo | inteiro | Sim | ≥ 0 |
| observacao | texto | Sim | justificativa do ajuste |
