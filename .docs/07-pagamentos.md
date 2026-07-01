# 07 · Módulo `pagamentos` — Atos Store Backend

> Sprint 6 (junto com `vendas`). Pagamentos **presenciais** da venda.

## Convenções (resumo — completo em `00-fundacao.md`)

- Domínio puro em `modules/pagamentos/src/<agregado>/`, dividido por pasta: `model/` (`*.entity.ts`, value objects `*.vo.ts`), `provider/` (contratos `*.repository.ts` e CQRS `*-query.ts`), `use-case/` (`*.use-case.ts`), `dto/` (`*.dto.ts`), `errors/` (`*-error.ts`), `service/` (specifications / domain services).
- Escrita e leitura via **use case** (`UseCase<In, Out>` com `.execute`), não command/handler. Leitura = use cases `find-*`/`list-*` apoiados num contrato `*-query.ts` (CQRS), separado do `*.repository.ts`.
- Erro de negócio via `Result` de `@repo/shared` (sem `throw`); códigos de erro = objeto const `*Error` em `errors/`, retornados por `Result.fail(CODE)`.
- Dependência externa / cross-módulo = interface (port) na pasta `provider/` do módulo **consumidor**, implementada em `apps/backend/src/modules/<m>/adapters/*.prisma.*`.
- HTTP fica no backend (`*.controller.ts` + `dto/*.http.dto.ts` + `adapters/` Prisma); o módulo de domínio não conhece Nest/Fastify/Prisma.
- Naming kebab-case dot-type (`registrar-pagamento.use-case.ts`, `pagamento.entity.ts`).

## Responsabilidade

Registrar pagamentos presenciais vinculados à venda. Aggregate dono de `Pagamento`.

## Domínio

- **`Pagamento`:** `vendaId`, `forma`, `status`, `valor`, `gatewayRef?`.
- **Formas (MVP 1):** `DINHEIRO`, `PIX`, `CARTAO_DEBITO`, `CARTAO_CREDITO`. `MERCADO_PAGO` fica para o MVP 2.

## Use cases — escrita (`use-case/`)

- `registrar-pagamento` (vinculado à venda)
- `estornar-pagamento`

## Use cases — leitura (`find-*`/`list-*`, apoiados em `*-query.ts`)

- `pagamentos-da-venda`
- `totais-por-forma` (relatório de fechamento)

## Contratos (`provider/`)

- `PagamentosRepository` (`*.repository.ts`) + `PagamentosQuery` (`*-query.ts`).
- **Expõe para `vendas`** `registrar-pagamento`/`estornar-pagamento` via use cases; `vendas` declara o contrato `PagamentoGateway` na sua pasta `provider/`, ligado por um `adapter` no backend.

## Invariantes

- Pagamento presencial entra como `APROVADO` direto (sem gateway assíncrono no MVP 1).
- Permite múltiplas formas na mesma venda (Σ = total da venda).
- Estorno só antes do fechamento do caixa.

## Erros de domínio (`errors/pagamento-error.ts` — códigos `Result.fail(CODE)`)

- `PAYMENT_NOT_FOUND`
- `INVALID_AMOUNT`
- `REFUND_NOT_ALLOWED`

## Dependências

Nenhuma direta. É consumido por `vendas` via `PagamentoGateway`. **MVP 2:** adicionar `MERCADO_PAGO` + status assíncrono via webhook.

## Requisitos Funcionais

- **RF-PAG-01:** Registrar pagamento presencial vinculado à venda (forma + valor).
- **RF-PAG-02:** Formas suportadas no MVP 1: `DINHEIRO`, `PIX`, `CARTAO_DEBITO`, `CARTAO_CREDITO`.
- **RF-PAG-03:** Pagamento presencial entra como `APROVADO` imediatamente (sem gateway assíncrono).
- **RF-PAG-04:** Permitir múltiplas formas na mesma venda (pagamento dividido); a soma deve igualar o total.
- **RF-PAG-05:** Para `DINHEIRO`, calcular o troco (valor recebido − valor aplicado) — informativo, não persistido.
- **RF-PAG-06:** Estornar pagamento apenas antes do fechamento do caixa.
- **RF-PAG-07:** Relatório de totais por forma de pagamento (apoio ao fechamento do caixa).

## Campos (forms)

**Registrar Pagamento**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| forma | select `DINHEIRO`/`PIX`/`CARTAO_DEBITO`/`CARTAO_CREDITO` | Sim | — |
| valor | decimal | Sim | > 0, soma das formas = total da venda |
| valorRecebido | decimal | Não (só `DINHEIRO`) | ≥ valor; troco = `valorRecebido − valor` |

> **MVP 2:** adicionar `MERCADO_PAGO` com status assíncrono (`PENDENTE → APROVADO/RECUSADO`) via webhook.
