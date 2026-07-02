## 1. Domínio — venda (`modules/sales/src/venda`)

- [x] 1.1 Adicionar `VARIACAO_INATIVA`, `VARIACAO_NAO_ENCONTRADA` e `ACESSO_NEGADO` a `errors/venda.error.ts`.
- [x] 1.2 Criar `provider/variacao.gateway.ts` com `buscarParaVenda(variacaoId): Promise<{ variacaoId, preco, ativa } | null>`; exportar no barrel de providers.
- [x] 1.3 Ajustar `use-case/adicionar-item.use-case.ts` para resolver a variação via `VariacaoGateway`, falhando com `VARIACAO_NAO_ENCONTRADA`/`VARIACAO_INATIVA` antes da checagem de estoque (preço continua snapshotado da variação).
- [x] 1.4 Criar `use-case/adicionar-pagamento.use-case.ts` (venda `ABERTA`, dono, `{ forma, valor > 0 }`; sem exigir `Σ == total` — RN07 permanece só no finalizar).
- [x] 1.5 Criar `use-case/alterar-quantidade-item.use-case.ts` (venda `ABERTA`, dono, `quantidade > 0`, revalida `EstoqueGateway.validarSaldoDisponivel` → `INSUFFICIENT_STOCK`).
- [x] 1.6 Exportar os novos use cases nos barrels (`use-case/index.ts`, `src/index.ts`).
- [x] 1.7 Testes jest com fakes in-memory: variação inativa e inexistente não vendem; pagamento incremental parcial aceito e bloqueado fora de `ABERTA`; alterar quantidade revalida estoque; RN06 — venda `CONCLUIDA` rejeita alterar item, desconto e pagamento.

## 2. Domínio — cash-session (`modules/sales/src/cash-session`)

- [x] 2.1 Adicionar a `SessaoCaixa` os métodos `isAberta()`, `isFechada()`, `pertenceAoUsuario(usuarioId)` e `static hydrate()` (delegando/absorvendo `restore()`/getter `aberta`), migrando os call sites do módulo — sem mudança de comportamento.
- [x] 2.2 Portão da camada: `turbo build --filter=@repo/sales && bun test modules/sales` verde.

## 3. Backend (`apps/backend/src/modules/sales` + shared)

- [x] 3.1 Estender `adapters/variacao.prisma.reader.ts` para retornar `ativa` e criar o adapter do `VariacaoGateway`; registrar binding em `sales.module.ts`.
- [x] 3.2 Rota `POST /vendas/:id/pagamentos` (DTO HTTP `{ forma, valor }` em reais → cents) ligada ao `AdicionarPagamento`.
- [x] 3.3 Rota `PATCH /vendas/:id/itens/:itemId/quantidade` (DTO `{ quantidade }`) ligada ao `AlterarQuantidadeItem`.
- [x] 3.4 Rotas `GET /caixa/:id` (detalhe, escopo dono/ADMIN, `ACESSO_NEGADO` → 403) e `GET /caixa/minhas` (sessões do próprio operador, paginada, filtros `{ status?, from?, to? }`) em `cash-session/caixa-queries.controller.ts`.
- [x] 3.5 Completar `shared/errors/domain-error.mapper.ts`: `VARIACAO_NAO_ENCONTRADA` → 404, `VARIACAO_INATIVA` → 422, `ACESSO_NEGADO` (venda) → 403.
- [x] 3.6 Swagger/class-validator nos novos DTOs; testes de controller cobrindo as 3 rotas novas e o mapeamento dos novos códigos.
- [x] 3.7 Portão da camada: `turbo build --filter=backend && bun test apps/backend` verde.

## 4. Mobile (`apps/mobile`)

- [x] 4.1 Domain/data: `listar_sessoes_usecase` e `obter_sessao_usecase` em `lib/domain/caixa`, com repositório/DTOs em `lib/data/caixa` consumindo `GET /caixa/minhas` e `GET /caixa/:id` (+ resumo/movimentações existentes).
- [x] 4.2 UI: `CaixaHistoryPage` + `CaixaHistoryCubit` (rota `/caixa/historico`) listando as sessões do operador.
- [x] 4.3 UI: `CaixaDetailPage` + `CaixaDetailCubit` (rota `/caixa/historico/:id`) read-only com dados da sessão, resumo e movimentações.
- [x] 4.4 `AbrirCaixaCubit`/`AbrirCaixaPage`: pré-checar `obter_caixa_aberto` e bloquear/redirecionar para a sessão ativa; continuar tratando `CAIXA_JA_ABERTO` da API.
- [x] 4.5 Fluxo de fechar caixa: estado explícito para `VENDA_PENDENTE_NO_FECHAMENTO` com atalho para a venda aberta.
- [x] 4.6 Registrar rotas no GoRouter e dependências no get_it; testes de Cubit/widget para history, detail e os dois bloqueios preventivos.
- [x] 4.7 Portão da camada: `flutter analyze && flutter test` verde.

## 5. Revisão ponta a ponta

- [x] 5.1 Validar o fluxo completo contra as RN: abrir caixa → criar venda → itens (variação inativa bloqueada) → desconto → pagamentos (incremental e dividido) → finalizar (estoque + caixa na mesma transação) → resumo → fechar caixa (bloqueado com venda pendente); cancelamento com estorno; caixa fechado e venda concluída imutáveis; admin vê todos, operador só os seus.
- [x] 5.2 Portão final: `turbo build` 7/7 verde e `bun test` sem nenhuma falha nova (5 falhas pré-existentes em HEAD: 4 specs de backend que não carregam sob bun/class-validator + 1 teste em packages/shared); `bun lint` bloqueado apenas por 90 erros pré-existentes de `apps/web` — ambos fora do escopo, sinalizados como tarefas separadas.
- [x] 5.3 Correção da revisão: abrir caixa registra movimentação `ABERTURA` atômica com a sessão (enum + factory + use case + adapter Prisma), sem contar como suprimento no resumo.
- [x] 5.4 Correção da revisão: mobile mapeia `tipo: 'VENDA'` do wire corretamente (era `VENDA_DINHEIRO`, caía no fallback "suprimento") e trata tipos desconhecidos com segurança.
