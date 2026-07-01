> Backend-only. Regra de negócio fica no domínio (`@repo/estoque`); este change só adapta infraestrutura e apresentação. **Sempre usar a skill indicada.** Constraints de banco entram só como rede de segurança redundante. Ledger é append-only (sem update/delete). Saída por venda não vira rota HTTP — só `EstoquePort` via DI.

## 1. Pré-requisitos

- [x] 1.1 Confirmar `estoque-domain` aplicado e `@repo/estoque` compilando
- [x] 1.2 Adicionar `@repo/estoque` (e confirmar `@repo/catalog` para ler `minStock`) às deps de `apps/backend/package.json`

## 2. Schema Prisma — skill `backend-prisma-data`

- [x] 2.1 `estoque.model.prisma`: `MovimentacaoEstoque` (tipo, motivo, quantidade int, saldoResultante int, origemVendaId? , variacaoId FK, createdAt) — append-only, sem campos de update
- [x] 2.2 `EstoqueSaldo` (variacaoId único, saldoAtual int, quantidadeReservada int default 0, estoqueMinimo int seedado de catalog `Variation.minStock`) com checks redundantes `saldoAtual >= 0` e `quantidadeReservada >= 0`
- [x] 2.3 Gerar migration + `prisma:generate`

## 3. Adapter de escrita (transação única) — skill `backend-prisma-data`

- [x] 3.1 `EstoquePrismaRepository` implementando `EstoqueRepository`: write atômica (insere `MovimentacaoEstoque` + atualiza `EstoqueSaldo.saldoAtual`) em `runInTransaction`
- [x] 3.2 Read-modify-write do saldo sob row lock (`SELECT ... FOR UPDATE`) para serializar movimentações concorrentes na mesma variação
- [x] 3.3 Seed da linha de `EstoqueSaldo` na primeira movimentação (estoqueMinimo lido de catalog), `toDomain`/`fromDomain` retornando `Result`; sem update/delete do ledger

## 4. EstoquePort para vendas — skill `backend-prisma-data`

- [x] 4.1 Implementar `EstoquePort` (`darBaixa`/`estornar`) reusando a write transacional: `darBaixa` grava `SAIDA` `VENDA_*` com `origemVendaId`; `estornar` grava `ENTRADA` compensatória ligada ao mesmo `origemVendaId`
- [x] 4.2 Garantir que NÃO existe rota HTTP para saída de venda — port só disponível via DI

## 5. Adapter de leitura — skill `backend-prisma-data`

- [x] 5.1 `EstoquePrismaQuery` implementando `EstoqueQuery`: saldo (saldoAtual + saldoDisponivel), movimentações (paginadas + filtro de período), abaixo-do-mínimo (`saldoAtual < estoqueMinimo`)
- [x] 5.2 Retornar DTOs de leitura, sem vazar a entidade do ledger/projeção

## 6. Mapeamento de erros — skill `backend-controller`

- [x] 6.1 Estender `domain-error.mapper`: `ESTOQUE_INSUFICIENTE`→409, `VARIACAO_NAO_ENCONTRADA`→404, `QUANTIDADE_INVALIDA`→400

## 7. EstoqueModule — skills `config-new-module` / `backend-controller`

- [x] 7.1 Scaffold `apps/backend/src/modules/inventory/` (module, controllers, adapters, dtos, provider do `EstoquePort`)
- [x] 7.2 DTOs HTTP + `class-validator` (entrada/saída com `quantidade > 0` e `motivo` válido, ajuste com `novoSaldo >= 0` e `observacao` obrigatória, query de movimentações com período + paginação)
- [x] 7.3 Controller de comandos: `POST /api/inventory/entries` (registrar-entrada), `POST /api/inventory/exits` (registrar-saida), `POST /api/inventory/adjustments` (ajustar-saldo)
- [x] 7.4 Controller de leitura: `GET /api/inventory/variations/:variacaoId/balance`, `GET /api/inventory/variations/:variacaoId/movements`, `GET /api/inventory/low-stock`
- [x] 7.5 Guards: `@UseGuards(JwtGuard, RolesGuard)`; entradas/saídas e leituras de saldo/movimentações com `@Papeis(MASTER, ADMIN, OPERADOR)`; `adjustments` e `low-stock` com `@Papeis(MASTER, ADMIN)`
- [x] 7.6 Wiring DI dos use cases de `@repo/estoque` (comandos + queries + `EstoquePort`) com os adapters; Swagger/OpenAPI em todas as rotas

## 8. Registro

- [x] 8.1 Registrar `EstoqueModule` em `app.module.ts`

## 9. Verificação — skill `verify`

- [x] 9.1 `prisma:migrate:dev` + `prisma:generate` locais sem erro; `migrate status` up to date
- [x] 9.2 Build do backend verde
- [x] 9.3 Via API: registrar entrada (saldo sobe), saída (saldo desce), ajuste (saldo absoluto + movimentação de delta); consultar saldo (saldoAtual + saldoDisponivel), listar movimentações (período/paginação), low-stock; 401 sem token, 409 `ESTOQUE_INSUFICIENTE`, 404 `VARIACAO_NAO_ENCONTRADA`, 400 `QUANTIDADE_INVALIDA`, 403 OPERADOR em `adjustments`/`low-stock`
- [x] 9.4 Confirmar transação única (ledger + saldo juntos) e ausência de rota de saída por venda; controllers/adapters sem regra de domínio e ledger sem update/delete
