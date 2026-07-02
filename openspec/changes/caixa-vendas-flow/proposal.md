## Why

O fluxo Caixa + Vendas do módulo `sales` foi implementado pelo change `sales-module` (arquivado em 2026-07-02, specs sincronizados) e cobre a grande maioria das RN01–RN11 da especificação consolidada do PDV. Uma análise de gaps do código atual contra essa especificação revelou lacunas residuais que quebram regras de negócio ou deixam o fluxo do operador incompleto: **variação inativa ainda pode ser vendida** (não há `VariacaoGateway` no domínio nem os erros `VARIACAO_INATIVA`/`VARIACAO_NAO_ENCONTRADA`), **não há pagamento incremental** (`POST /vendas/:id/pagamentos`) nem **alteração de quantidade de item** exposta na API, o detalhe da sessão (`GET /caixa/:id`) não existe, e no mobile faltam **histórico/detalhe de sessões de caixa** e validações preventivas (abrir com caixa já aberto; fechar com venda pendente). Este change fecha esses gaps com diff mínimo — sem recriar nada que já funciona.

## What Changes

- **Domínio `modules/sales/src/venda`**: novo provider `variacao.gateway.ts` (`buscarParaVenda` → `{ variacaoId, preco, ativa }`); `adicionar-item.use-case.ts` passa a validar existência e atividade da variação com os novos erros `VARIACAO_NAO_ENCONTRADA`/`VARIACAO_INATIVA`; novos use cases `adicionar-pagamento.use-case.ts` e `alterar-quantidade-item.use-case.ts` (a entidade `Venda` já tem os métodos); `VendaError` ganha `VARIACAO_INATIVA`, `VARIACAO_NAO_ENCONTRADA` e `ACESSO_NEGADO`.
- **Domínio `modules/sales/src/cash-session`**: alinhar API da entidade `SessaoCaixa` — `isAberta()`, `isFechada()`, `pertenceAoUsuario(usuarioId)` e `hydrate()` (hoje `restore()`/getter `aberta`) — sem mudança de comportamento.
- **Backend `apps/backend/src/modules/sales`**: novas rotas `POST /vendas/:id/pagamentos` e `PATCH /vendas/:id/itens/:itemId/quantidade`; nova rota `GET /caixa/:id` (detalhe da sessão, com escopo dono/admin); adapter do `VariacaoGateway` sobre o reader Prisma existente; mapeamento HTTP dos novos códigos (`VARIACAO_NAO_ENCONTRADA` → 404, `VARIACAO_INATIVA` → 422, `ACESSO_NEGADO` de venda → 403).
- **Especificação do `numero` sequencial da venda**: já implementado (entidade + sequence atômica na migração) mas ausente dos specs — vira requirement em `sale-lifecycle` (catch-up de spec, sem mudança de código além de testes se faltarem).
- **Mobile `apps/mobile`**: telas de **histórico de sessões de caixa** e **detalhe read-only de sessão** (use cases + cubits + rotas); bloqueio preventivo na tela de abrir caixa quando já existe sessão aberta; tratamento explícito de `VENDA_PENDENTE_NO_FECHAMENTO` no fluxo de fechar caixa.
- **Testes**: domínio — variação inativa/não encontrada não vende; imutabilidade RN06 da venda `CONCLUIDA` (item, desconto, pagamento); pagamento incremental e alterar quantidade.
- **Sem mudanças**: web (`apps/web`) já atende integralmente o painel ADMIN de Caixas; transação de finalizar/cancelar (RN08/RN09), resumo automático (RN10), índice único parcial (RN01) e scoping dono/admin já estão implementados e especificados.

## Capabilities

### New Capabilities

_Nenhuma — todos os gaps são extensões de capabilities existentes._

### Modified Capabilities

- `sale-lifecycle`: RN10 passa a exigir validação de variação via `VariacaoGateway` do domínio com erros próprios (`VARIACAO_NAO_ENCONTRADA`/`VARIACAO_INATIVA`); novo requirement para o `numero` sequencial atribuído na finalização.
- `sale-api`: novos endpoints `POST /vendas/:id/pagamentos` (pagamento incremental) e `PATCH /vendas/:id/itens/:itemId/quantidade`; mapeamento de erros ampliado com os novos códigos.
- `cash-session-api`: novo endpoint `GET /caixa/:id` (detalhe da sessão com escopo dono/admin).
- `mobile-pdv`: requirement explícito de histórico de sessões de caixa + detalhe read-only de sessão; validações preventivas de abertura duplicada e de fechamento com venda pendente na UI.

## Impact

- **Domínio** `modules/sales/src/venda`: `errors/venda.error.ts`, `provider/variacao.gateway.ts` (novo), `use-case/{adicionar-item, adicionar-pagamento (novo), alterar-quantidade-item (novo)}.use-case.ts`, barrels e testes jest com fakes in-memory.
- **Domínio** `modules/sales/src/cash-session`: `model/sessao-caixa.entity.ts` (métodos de conveniência, alias `hydrate`).
- **Backend**: `vendas-commands.controller.ts`, `cash-session/caixa-queries.controller.ts`, novo adapter `variacao.gateway` (reusa `variacao.prisma.reader.ts`), DTOs HTTP novos, `shared/errors/domain-error.mapper.ts`, bindings em `sales.module.ts`. Sem mudança de schema Prisma nem migração.
- **Mobile**: `lib/domain/caixa` (use cases de listar sessões / obter sessão), `lib/data/caixa` (repositório/DTOs), `lib/ui/caixa` (history + detail pages, cubits), `lib/app/router`, DI; ajustes em `abrir_caixa_cubit` e `fechar_caixa_page`.
- **Web**: nenhum.
- **Portões**: `turbo build --filter=@repo/sales && bun test modules/sales`; `turbo build --filter=backend && bun test apps/backend`; `flutter analyze && flutter test`; final `bun lint && bun test && turbo build`.
