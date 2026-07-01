# 05 · Módulo `caixa` — Atos Store Backend

> Sprint 5. Sessão de caixa do PDV. Implementar antes de `vendas`.

## Convenções (resumo — completo em `00-fundacao.md`)

- Domínio puro em `modules/caixa/src/<agregado>/`, dividido por pasta: `model/` (`*.entity.ts`, value objects `*.vo.ts`), `provider/` (contratos `*.repository.ts` e CQRS `*-query.ts`), `use-case/` (`*.use-case.ts`), `dto/` (`*.dto.ts`), `errors/` (`*-error.ts`), `service/` (specifications / domain services).
- Escrita e leitura via **use case** (`UseCase<In, Out>` com `.execute`), não command/handler. Leitura = use cases `find-*`/`list-*` apoiados num contrato `*-query.ts` (CQRS), separado do `*.repository.ts`.
- Erro de negócio via `Result` de `@repo/shared` (sem `throw`); códigos de erro = objeto const `*Error` em `errors/`, retornados por `Result.fail(CODE)`.
- Dependência externa / cross-módulo = interface (port) na pasta `provider/` do módulo **consumidor**, implementada em `apps/backend/src/modules/<m>/adapters/*.prisma.*`.
- HTTP fica no backend (`*.controller.ts` + `dto/*.http.dto.ts` + `adapters/` Prisma); o módulo de domínio não conhece Nest/Fastify/Prisma.
- Naming kebab-case dot-type (`abrir-caixa.use-case.ts`, `sessao-caixa.entity.ts`).

## Responsabilidade

Sessão de caixa do PDV — abertura, fechamento e movimentos manuais. Aggregate dono de `SessaoCaixa` + `MovimentacaoCaixa`.

## Domínio

- **`SessaoCaixa`:** `operadorId`, `status` (ABERTO/FECHADO), `valorAbertura`, `valorFechamento?`, `abertaEm`, `fechadaEm?`.
- **`MovimentacaoCaixa`:** `tipo` (SUPRIMENTO/SANGRIA/VENDA), `valor`, `observacao?`.

## Use cases — escrita (`use-case/`)

- `abrir-caixa` (`valorAbertura`)
- `fechar-caixa` (`valorFechamento`, calcula divergência vs. esperado)
- `registrar-sangria`
- `registrar-suprimento`

## Use cases — leitura (`find-*`/`list-*`, apoiados em `*-query.ts`)

- `caixa-aberto-do-operador`
- `resumo-sessao` (esperado = abertura + suprimentos + vendas em dinheiro − sangrias)
- `listar-movimentacoes`

## Contratos (`provider/`)

- `CaixaRepository` (`*.repository.ts`) — sessão e movimentos.
- `CaixaQuery` (`*-query.ts`) — projeções de leitura (resumo, movimentações).
- **Expõe para `vendas`** `caixaAbertoDoOperador(usuarioId)` e `registrarVenda(sessaoId, valor)` via use cases. `vendas` depende de um contrato (port) na sua própria pasta `provider/`, ligado ao caixa pelo backend (`adapter`).

## Invariantes

- No máximo **1 caixa ABERTO por operador** por vez.
- Não fecha com venda `ABERTA` pendente na sessão.
- `MovimentacaoCaixa` tipo `VENDA` só entra via módulo `vendas`.

## Erros de domínio (`errors/caixa-error.ts` — códigos `Result.fail(CODE)`)

- `CASH_SESSION_ALREADY_OPEN`
- `CASH_SESSION_NOT_FOUND`
- `CASH_SESSION_ALREADY_CLOSED`
- `PENDING_SALE_IN_SESSION`

## Dependências

Nenhuma direta. É consumido por `vendas` via `CaixaGateway`.

## Requisitos Funcionais

- **RF-CX-01:** Abrir caixa informando o valor de abertura (fundo de troco).
- **RF-CX-02:** Impedir abertura se o operador já possui um caixa ABERTO.
- **RF-CX-03:** Registrar sangria (retirada) com valor e observação.
- **RF-CX-04:** Registrar suprimento (reforço) com valor e observação.
- **RF-CX-05:** Registrar automaticamente um movimento de VENDA quando uma venda é finalizada (via `CaixaGateway`).
- **RF-CX-06:** Calcular o saldo esperado = abertura + suprimentos + vendas em dinheiro − sangrias.
- **RF-CX-07:** Fechar caixa informando o valor contado, registrando a divergência vs. o esperado.
- **RF-CX-08:** Impedir fechamento com venda ABERTA pendente na sessão.
- **RF-CX-09:** Consultar o caixa aberto do operador e o resumo da sessão.

## Campos (forms)

**Abrir Caixa**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| valorAbertura | decimal | Sim | ≥ 0 |

**Fechar Caixa**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| valorFechamento | decimal | Sim | ≥ 0 (valor contado na gaveta) |

> Ao fechar, o sistema exibe: saldo esperado, valor contado e divergência.

**Sangria / Suprimento**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| valor | decimal | Sim | > 0 |
| observacao | texto | Sim | motivo da retirada/reforço |
