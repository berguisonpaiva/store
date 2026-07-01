> Princípio: **todas as verificações na regra de negócio** (VO → entidade → policy → use case). Nada delegado ao banco. **Sempre usar a skill indicada em cada grupo.** Ledger é imutável (append-only) — sem edição/deleção de movimentação. Sem persistência/HTTP/UI neste change.

## 1. Scaffold do módulo — skill `module-aggregate`

- [x] 1.1 Criar package `modules/estoque` (`@repo/estoque`) espelhando `@repo/catalog` (package.json, tsconfig, jest.config, src/index.ts)
- [x] 1.2 `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module estoque --aggregate movimentacao`
- [x] 1.3 Adicionar `@repo/catalog` às deps (leitura de `VariacaoProduto`/`minStock`); registrar no workspace
- [x] 1.4 Garantir build + testes do scaffold verdes

## 2. Value objects e enums — skill `module-value-object`

- [x] 2.1 `QuantidadeMovimentada` (inteiro > 0) → `QUANTIDADE_INVALIDA`
- [x] 2.2 `Saldo` (inteiro ≥ 0) e `SaldoResultante` (inteiro ≥ 0 no fluxo normal)
- [x] 2.3 Enums `TipoMovimentacao` (`ENTRADA`/`SAIDA`) e `MotivoMovimentacaoEstoque` (`COMPRA`/`AJUSTE`/`DEVOLUCAO`/`VENDA_PDV`/`VENDA_ONLINE`/`PERDA`)
- [x] 2.4 Reusar `Id`/`PositiveInteger`/`NonNegative` do shared quando couber

## 3. Entidades — skill `module-entity`  _(spec: inventory-ledger)_

- [x] 3.1 `MovimentacaoEstoque` (ledger imutável): variacaoId, tipo, motivo, quantidade, `saldoResultante`, `origemVendaId?`, timestamp; sem setters/edição
- [x] 3.2 `saldoResultante = saldoAnterior ± quantidade` calculado/assertado na criação (`tryCreate`)
- [x] 3.3 `EstoqueSaldo` (projeção por `variacaoId`): `saldoAtual`, `quantidadeReservada` (default 0), `estoqueMinimo` (seed do catalog)
- [x] 3.4 Quantidade ≤ 0 rejeitada via VO → `QUANTIDADE_INVALIDA`

## 4. Policy de saldo — skill `module-domain-service`  _(specs: inventory-ledger, inventory-sales-port)_

- [x] 4.1 Regra saldo não-negativo para saída normal/`darBaixa` → `ESTOQUE_INSUFICIENTE`
- [x] 4.2 Validação de saldo disponível (`saldoAtual − quantidadeReservada ≥ qtd`) antes de `darBaixa` → `ESTOQUE_INSUFICIENTE`
- [x] 4.3 `ajustar-saldo` é a única exceção ao não-negativo (define saldo absoluto ≥ 0); calcula o delta e o sinal (ENTRADA/SAIDA, motivo AJUSTE)
- [x] 4.4 Serviços puros + testes de borda (testes na seção 9)

## 5. Ports — skill `module-repository`

- [x] 5.1 `EstoqueRepository` com escrita transacional única `aplicarMovimentacao(mov, novoSaldo)` (ledger + `saldoAtual` juntos ou nada) + leitura do `EstoqueSaldo` por variação
- [x] 5.2 `EstoqueQuery` (consultar-saldo, listar-movimentacoes paginado/período, listar-abaixo-do-minimo)
- [x] 5.3 **Expor** `EstoquePort` com `darBaixa(variacaoId, qtd, origemVendaId)` e `estornar(...)` para `vendas`
- [x] 5.4 Sem implementação de infra no módulo

## 6. DTOs — skill `module-dto`

- [x] 6.1 Inputs: registrar-entrada, registrar-saida, ajustar-saldo (novoSaldo, observacao)
- [x] 6.2 Output/query DTOs: saldo (saldoAtual + saldoDisponivel), movimentação (tipo/motivo/quantidade/saldoResultante/timestamp), item abaixo-do-mínimo; reusar paginação; sem vazar entidade

## 7. Commands (use cases) — skill `module-use-case`  _(spec: inventory-ledger)_

- [x] 7.1 `registrar-entrada` (motivo COMPRA/DEVOLUCAO/AJUSTE; variação existe → soma saldo → grava ledger+saldo em transação única) (RF-EST-01, RF-EST-03)
- [x] 7.2 `registrar-saida` (motivo PERDA/AJUSTE; bloqueia saldo negativo) (RF-EST-02, RF-EST-05)
- [x] 7.3 `ajustar-saldo` (define saldo absoluto ≥ 0, registra diferença como AJUSTE) (RF-EST-04)
- [x] 7.4 Use cases só orquestram; invariantes em VO/entidade/policy; falhas com `Result.fail(<CODE>)`; `VARIACAO_NAO_ENCONTRADA` quando variação inexistente

## 8. Port de vendas (operações expostas) — skill `module-use-case`  _(spec: inventory-sales-port)_

- [x] 8.1 `darBaixa(variacaoId, qtd, origemVendaId)`: valida saldo disponível → grava `SAIDA` (VENDA_PDV/VENDA_ONLINE) + saldo em transação única (RF-EST-09)
- [x] 8.2 `estornar(...)`: grava `ENTRADA` compensatória ligada ao mesmo `origemVendaId`, restaura saldo (RF-EST-09)
- [x] 8.3 Garantir que saída por venda **não** é command público — só acessível via `EstoquePort` (RF-EST-09)

## 9. Queries (use cases) — skill `module-query-cqrs`  _(spec: inventory-balance-queries)_

- [x] 9.1 `consultar-saldo` (saldoAtual + `saldoDisponivel = saldoAtual − quantidadeReservada`) (RF-EST-06)
- [x] 9.2 `listar-movimentacoes` (por variação/período, paginado, ordenado por data) (RF-EST-07)
- [x] 9.3 `listar-abaixo-do-minimo` (`saldoAtual < estoqueMinimo`) (RF-EST-08)

## 10. Testes — skills `module-entity` / `module-use-case` / `module-domain-service`

- [x] 10.1 Fakes in-memory de `EstoqueRepository` (com transação simulada), `EstoqueQuery` e `EstoquePort`
- [x] 10.2 Entidade/ledger: criação válida/ inválida, `saldoResultante` = anterior ± qtd, imutabilidade
- [x] 10.3 Policy: não-negativo, saldo disponível, exceção do `ajustar-saldo`
- [x] 10.4 Commands: entrada/saída/ajuste cobrindo RF-EST-01..05 e transação única (rollback parcial)
- [x] 10.5 Port de vendas: `darBaixa`/`estornar`, validação de disponível, ausência de command público (RF-EST-09)
- [x] 10.6 Queries: consultar-saldo, listar-movimentacoes (período), abaixo-do-mínimo (RF-EST-06..08)

## 11. Wire-up e verificação

- [x] 11.1 Exportar contratos públicos em `modules/estoque/src/index.ts` (commands, queries, `EstoquePort`, erros, enums)
- [x] 11.2 Confirmar ausência de NestJS/HTTP/DB/UI e que nenhuma regra depende do banco; ledger sem edição/deleção; saída por venda só via port
- [x] 11.3 Build do workspace + suíte de testes do módulo verdes
