# 06 · Módulo `vendas` — Atos Store Backend

> Sprint 6. Venda de balcão (canal PDV) e **orquestração** de estoque + pagamento + caixa. Módulo mais completo.

## Convenções (resumo — completo em `00-fundacao.md`)

- Domínio puro em `modules/vendas/src/<agregado>/`, dividido por pasta: `model/` (`*.entity.ts`, value objects `*.vo.ts`), `provider/` (contratos `*.repository.ts` e CQRS `*-query.ts`), `use-case/` (`*.use-case.ts`), `dto/` (`*.dto.ts`), `errors/` (`*-error.ts`), `service/` (specifications / domain services).
- Escrita e leitura via **use case** (`UseCase<In, Out>` com `.execute`), não command/handler. Leitura = use cases `find-*`/`list-*` apoiados num contrato `*-query.ts` (CQRS), separado do `*.repository.ts`.
- Erro de negócio via `Result` de `@repo/shared` (sem `throw`); códigos de erro = objeto const `*Error` em `errors/`, retornados por `Result.fail(CODE)`.
- Dependência externa / cross-módulo = interface (port) na pasta `provider/` deste módulo (consumidor), implementada em `apps/backend/src/modules/<m>/adapters/*.prisma.*`.
- HTTP fica no backend (`*.controller.ts` + `dto/*.http.dto.ts` + `adapters/` Prisma); o módulo de domínio não conhece Nest/Fastify/Prisma.
- Naming kebab-case dot-type (`finalizar-venda.use-case.ts`, `venda.entity.ts`).

## Responsabilidade

Registrar a venda de balcão e orquestrar baixa de estoque, pagamento e lançamento no caixa. Aggregate dono de `Venda` + `ItemVenda`. Canal fixo `PDV` no MVP 1.

## Domínio

- **Aggregate `Venda`:** `numero`, `canal` (PDV), `status`, `usuarioId` (operador), `sessaoCaixaId`, `subtotal`, `desconto`, `total`.
- **`ItemVenda`:** `variacaoId`, `quantidade`, `precoUnitario` (snapshot), `total`.
- Status no MVP 1: `ABERTA → CONCLUIDA / CANCELADA`.

## Use cases — escrita (`use-case/`)

- `criar-venda` (abre `ABERTA`; exige sessão de caixa ABERTA do operador)
- `adicionar-item` (snapshot de `precoUnitario`)
- `remover-item`
- `aplicar-desconto`
- `finalizar-venda`
- `cancelar-venda`

## `finalizar-venda` (transação única)

> Orquestração entre módulos pelos contratos (ports) que `vendas` declara na sua pasta `provider/` (`EstoqueGateway`, `PagamentoGateway`, `CaixaGateway`); o backend implementa cada um num `adapter` ligando ao módulo dono.

1. Valida saldo de cada item via `EstoqueGateway`.
2. Dá baixa no estoque (uma `SAIDA` por item, motivo `VENDA_PDV`, com `origemVendaId`).
3. Registra `Pagamento` via `PagamentoGateway`.
4. Cria `MovimentacaoCaixa` tipo `VENDA` via `CaixaGateway`.
5. Status → `CONCLUIDA`.

## `cancelar-venda`

Estorna o estoque (entrada de `DEVOLUCAO`) e reverte o caixa. Só antes do fechamento da sessão.

## Use cases — leitura (`find-*`/`list-*`, apoiados em `*-query.ts`)

- `buscar-venda`
- `listar-vendas` (por período/operador/sessão/status)
- `resumo-vendas` (totais)

## Contratos (`provider/`)

- `VendasRepository` (`*.repository.ts`) + `VendasQuery` (`*-query.ts`).
- **Consome (ports declarados aqui):** `EstoqueGateway`, `PagamentoGateway`, `CaixaGateway` — implementados nos `adapters` do backend.

## Invariantes

- Venda `CONCLUIDA` é imutável.
- `total` = Σ itens − desconto.
- Exige **sessão de caixa ABERTA** do operador.
- Soma dos pagamentos = `total` para finalizar.

## Erros de domínio (`errors/venda-error.ts` — códigos `Result.fail(CODE)`)

- `SALE_NOT_FOUND`
- `SALE_ALREADY_FINALIZED`
- `NO_OPEN_CASH_SESSION`
- `INSUFFICIENT_STOCK`
- `PAYMENT_MISMATCH`

## Dependências

`estoque` (`EstoqueGateway`), `pagamentos` (`PagamentoGateway`), `caixa` (`CaixaGateway`) — sempre via contrato (port) declarado no `provider/` de `vendas`.

## Requisitos Funcionais

- **RF-VND-01:** Iniciar venda (canal PDV) vinculada ao operador e à sua sessão de caixa ABERTA.
- **RF-VND-02:** Impedir iniciar venda sem caixa aberto do operador.
- **RF-VND-03:** Adicionar item por SKU, código de barras (bipe) ou busca por nome; informar quantidade; `precoUnitario` é capturado como snapshot.
- **RF-VND-04:** Remover item e alterar quantidade enquanto a venda está ABERTA.
- **RF-VND-05:** Aplicar desconto por valor ou por percentual sobre o total.
- **RF-VND-06:** Calcular subtotal, desconto e total automaticamente.
- **RF-VND-07:** Finalizar venda em transação única: valida saldo → baixa estoque (`VENDA_PDV`) → registra pagamento(s) → lança no caixa → status `CONCLUIDA`.
- **RF-VND-08:** Exigir que a soma dos pagamentos seja igual ao total para finalizar.
- **RF-VND-09:** Bloquear qualquer alteração de venda `CONCLUIDA`.
- **RF-VND-10:** Cancelar venda (estorna estoque e caixa) somente antes do fechamento da sessão.
- **RF-VND-11:** Gerar número sequencial único por venda.
- **RF-VND-12:** Listar/buscar vendas por período, operador, sessão e status; exibir resumo de totais.

## Campos (forms)

**Tela de Venda (PDV)** — não é um form único; é uma tela de operação:

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| busca de item | texto (SKU / código de barras / nome) | Sim (para adicionar) | variação ativa existente |
| quantidade (por item) | inteiro | Sim | > 0, ≤ saldo disponível |
| precoUnitario (por item) | decimal (readonly) | — | snapshot do preço da variação |
| descontoTipo | select `valor`/`percentual` | Não | — |
| descontoValor | decimal | Não | ≥ 0, não maior que o subtotal |

> Pagamento é tratado no módulo `pagamentos` (etapa de finalização).
