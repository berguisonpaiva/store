## Context

O change `sales-module` (arquivado) implementou o fluxo Caixa + Vendas completo: domínio puro em `modules/sales/src/{cash-session,venda}` (Result/Entity/VOs, ports selados, `TransactionContext`), casca NestJS CQRS em `apps/backend/src/modules/sales` (+ `cash-session/`), Prisma com índice único parcial (RN01) e sequence atômica do `numero`, painel ADMIN "Caixas" no web e PDV no mobile (Flutter, Clean Architecture/MVVM/Cubit). A gap analysis contra a especificação consolidada (RN01–RN11) apontou apenas lacunas pontuais; este design cobre como fechá-las com diff mínimo, reusando os padrões existentes.

Estado relevante hoje:
- `Venda` (entidade) já possui `alterarQuantidadeItem`, `adicionarPagamento`, `atribuirNumero` — faltam os use cases/rotas que os expõem.
- A leitura de variação no backend (`variacao.prisma.reader.ts`) não valida `ativa`, e o domínio não declara um port para isso.
- Caixa: controllers usam `GET /caixa/aberto` (equivalente ao `GET /caixa/me` da especificação) e não expõem `GET /caixa/:id`; a coluna Prisma é `operadorId` (domínio usa `usuarioId`).
- Mobile: PDV, abrir/fechar caixa e histórico de vendas prontos; faltam histórico/detalhe de sessões e validações preventivas.

## Goals / Non-Goals

**Goals:**
- Impedir venda de variação inativa/inexistente via port de domínio (`VariacaoGateway`) com erros próprios.
- Expor pagamento incremental e alteração de quantidade na API e no domínio.
- Expor `GET /caixa/:id` com escopo dono/admin.
- Completar o fluxo do operador no mobile: histórico de sessões, detalhe de sessão, bloqueios preventivos (abertura duplicada, venda pendente no fechamento).
- Cobrir com testes unitários (fakes in-memory) os cenários novos + RN06 da venda `CONCLUIDA`.

**Non-Goals:**
- Recriar/renomear estruturas que já funcionam (sem migração Prisma, sem renomear `operadorId`, sem tocar no web).
- PDV na web (fora do MVP).
- Alterar a orquestração transacional de finalizar/cancelar (RN08/RN09 já corretos via `TransactionManager.runInTransaction`).

## Decisions

1. **`VariacaoGateway` como port do domínio; validação no use case `AdicionarItem` (e reforço em `AlterarQuantidadeItem` para estoque).**
   `provider/variacao.gateway.ts` com `buscarParaVenda(variacaoId): Promise<{ variacaoId, preco, ativa } | null>`. O use case falha com `VARIACAO_NAO_ENCONTRADA` (null) ou `VARIACAO_INATIVA` (`ativa === false`) antes de checar estoque. No backend, um adapter fino reusa `variacao.prisma.reader.ts` (estendido para retornar `ativa`). *Alternativa considerada:* validar só no adapter backend — rejeitada porque a regra é de negócio e precisa ser testável no domínio com fakes.

2. **Manter rotas existentes onde são equivalentes funcionais; adicionar apenas o que falta.**
   - `GET /caixa/aberto` permanece como a rota canônica do "caixa do operador" (a especificação chama de `GET /caixa/me`; criar alias duplicaria superfície sem ganho).
   - `PATCH /vendas/:id/desconto` permanece (a especificação cita POST; PATCH é o verbo já publicado e consumido por mobile/web).
   - Novas rotas: `POST /vendas/:id/pagamentos` (adiciona um pagamento; a redefinição em lote continua acontecendo em `finalizar`), `PATCH /vendas/:id/itens/:itemId/quantidade` (body `{ quantidade }`), `GET /caixa/:id` (retorna `SessaoCaixaOutput`; dono ou ADMIN, senão `ACESSO_NEGADO` → 403) e `GET /caixa/minhas` (sessões do próprio operador, paginada, filtros `{ status?, from?, to? }` — necessária porque `GET /caixa` é ADMIN-only e o histórico mobile precisa listar as sessões do operador).

3. **`AdicionarPagamento` não valida `Σ pagamentos == total`.** O mismatch só é regra de conclusão (RN07): o operador pode registrar pagamentos parciais em sequência; `finalizar` continua sendo o ponto que exige igualdade (`PAYMENT_MISMATCH`). O use case exige venda `ABERTA`, dono, `valor > 0` e forma válida (`INVALID_PAYMENT`).

4. **`AlterarQuantidadeItem` revalida estoque disponível** para a nova quantidade via `EstoqueGateway.validarSaldoDisponivel` (mesmo padrão do `AdicionarItem`), falhando com `INSUFFICIENT_STOCK`.

5. **`SessaoCaixa`: alinhamento de API sem quebra.** Adicionar `isAberta()`, `isFechada()`, `pertenceAoUsuario(usuarioId)` e `static hydrate()` como métodos ao lado dos existentes (`aberta`, `restore`), migrando os call sites do módulo para os novos nomes; `restore` pode delegar para `hydrate` e ser mantido até não ter mais uso. Nenhuma regra muda.

6. **Prisma intocado.** `numero` (sequence atômica), índice parcial RN01 e todos os modelos já existem; `operadorId` permanece como nome de coluna (o domínio/DTOs já traduzem para `usuarioId`). Renomear coluna = migração + churn sem valor de negócio.

7. **Mobile segue o padrão em camadas existente** (`domain/caixa` use cases → `data/caixa` repositório/DTOs → `ui/caixa` Cubit/página, GoRouter, get_it):
   - `listar_sessoes_usecase` + `CaixaHistoryPage`/`CaixaHistoryCubit` (rota `/caixa/historico`), consumindo o endpoint de listagem já com escopo do operador.
   - `obter_sessao_usecase` (via novo `GET /caixa/:id` + resumo/movimentações existentes) + `CaixaDetailPage`/`CaixaDetailCubit` (rota `/caixa/historico/:id`), read-only para sessão fechada.
   - Abrir caixa: `AbrirCaixaCubit` consulta `obter_caixa_aberto` antes de submeter e redireciona/bloqueia se já houver sessão (a API continua autoritativa com `CAIXA_JA_ABERTO`).
   - Fechar caixa: tratar `VENDA_PENDENTE_NO_FECHAMENTO` como estado explícito da UI (mensagem + atalho para a venda aberta); a validação autoritativa permanece no backend.

8. **Mapeamento HTTP dos novos códigos** no `shared/errors/domain-error.mapper.ts`: `VARIACAO_NAO_ENCONTRADA` → 404, `VARIACAO_INATIVA` → 422, `ACESSO_NEGADO` (venda) → 403 — mesmos status já usados pelos equivalentes de estoque/caixa.

## Risks / Trade-offs

- [Divergência nominal com a especificação (`/caixa/me`, POST desconto)] → Registrada aqui como decisão consciente de diff mínimo; specs delta documentam as rotas reais. Se o consumidor externo exigir os nomes literais, criar aliases é trivial e aditivo.
- [Validação de variação ativa muda comportamento de `POST /vendas/:id/itens`] → Vendas de variações inativas passam a falhar (422). É o comportamento correto por RN; risco de regressão em fluxos que dependiam do buraco é aceito e coberto por teste.
- [Pagamento incremental convive com `definirPagamentos` no finalizar] → O finalizar continua **redefinindo** os pagamentos com o payload recebido; pagamentos incrementais são conveniência de UI. Documentado no spec para evitar dupla contagem.
- [Checagem preventiva no mobile pode divergir do backend (corrida)] → UI trata como pré-checagem de UX; toda regra continua imposta pelo backend (409), e a UI também trata o erro.

## Migration Plan

Sem migração de dados/schema. Deploy normal por camada (domínio → backend → mobile). Rollback = revert do commit; nenhuma rota existente muda de contrato.

## Open Questions

- Nenhuma bloqueante. (Se surgir consumidor externo exigindo `GET /caixa/me` literal, resolver com alias na própria rota.)
