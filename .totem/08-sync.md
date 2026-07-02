# Tarefa: Implementar o contexto Sync (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Depende de `order` e `device`. **Nenhum contexto depende de `sync`** — infraestrutura transversal. Tudo em inglês, `Either`/`Result`.

Escopo: fila offline-first drenada por um worker independente da UI (I5), com envio idempotente (I1) que **nunca perde venda paga** (I9).

## Ordem de execução

### 1. Regras de negócio

- **RN-S1 (I5)** `SyncQueueWorker` roda **independente da UI** — continua tentando mesmo com o totem em tela de erro.
- **RN-S2 (I1)** Envio **idempotente por `order.id`**; retry não duplica.
- **RN-S3 (I9)** Venda paga **nunca se perde**: falha de envio mantém o item na fila (`syncFailed`) e agenda nova tentativa (retry exponencial).
- **RN-S4** Sucesso → `order.status = synced` e atualiza `SyncState` do `device` (pendências, último sync).

### 2. Backend — `apps/api` (skills: config-new-module, backend-controller, backend-prisma-data)

- Endpoint de ingestão compartilhado com `order` (`POST /orders`), **idempotente por `order.id`** (ver [05-order.md](05-order.md)), autenticado por **device token** (I10). O contexto `sync` é quem **consome** esse endpoint a partir do totem.

### 3. Web — `apps/admin` (skill: config-frontend-layout)

- No dashboard, expor o **estado de sync por totem** (pendências, último sync) vindo de `device`/heartbeat.

### 4. Totem — `apps/totem` (skills: flutter-domain-layer, flutter-core-layer, flutter-ui-mvvm)

- **domain**: VO `SyncQueueItem` (`orderId`, `payload`, `attempts`, `nextAttemptAt`); failure `OrderSyncFailed`.
- **data**: tabela Drift `sync_queue` + datasource; `order_sync_api_data_source` (`POST /orders`, `shared-contracts`, **device token** injetado pelo interceptor de auth — I10); `sync_queue_worker` — retry exponencial, roda no bootstrap **fora da árvore de UI** (I5); sucesso remove da fila + `synced`; falha mantém + `syncFailed` (I9).
- **ui**: `ConfirmationScreen` **enfileira** o pedido e volta ao catálogo **sem esperar** o envio (I9); badge de pendências lê o `SyncState`.

## Invariantes a garantir (checklist)

- **I5** worker independente da UI. **I1** idempotente. **I9** venda paga nunca se perde.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

`sync` é **transversal**: depende de `order` e `device`, mas **nenhum contexto depende dele**. Reusa o endpoint `POST /orders` idempotente de [05-order.md](05-order.md). O projeto é **NOVO (greenfield)** — pré-requisitos: [01-scaffold.md](01-scaffold.md), [02-auth.md](02-auth.md), [03-device.md](03-device.md) e [05-order.md](05-order.md). Regra permanente: **alinhar e editar o que existe**, nunca recriar em paralelo. Tudo em inglês (`Either`/`Result`). Pontos sensíveis a não simplificar: o worker roda **fora da árvore de UI** (I5), o envio é **idempotente por `order.id`** (I1) e uma venda paga **nunca se perde** por rede (I9). Cada subagent faz diff mínimo contra estas RN.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: o worker (`data`) e o status no dashboard (`web`) são independentes após o contrato.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: `order` (payload/id) + endpoint idempotente antes do worker.

### Portão de cada subagent

Invoca a skill da camada → edita → totem: `flutter analyze && flutter test` (worker com API fake: sucesso, retry, idempotência, persistência da fila após restart) → entrega diff.

### Ordem

1. **Subagent 1 — Totem/domain** (bloqueante): VO `SyncQueueItem` + failure `OrderSyncFailed`.
2. **Subagent 2 — Backend** (ingestão idempotente — se ainda não feita em `order`) e **Subagent 3 — Totem/data** (fila + worker) em paralelo.
3. **Subagent 4 — Totem/ui** (ConfirmationScreen + badge) e **Subagent 5 — Web** (status no dashboard).
4. **Subagent 6 — Revisão**: valida o worker independente da UI (I5), a idempotência por `order.id` (I1) e que a venda paga nunca se perde (I9); build + testes + lint.
