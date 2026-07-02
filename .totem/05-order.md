# Tarefa: Implementar o contexto Order (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Depende de `catalog` e `device`. O totem é o **dono**; a API é réplica de sync. Tudo em inglês, `Either`/`Result`.

Escopo: ciclo de vida do pedido, com `order.id` **gerado no totem** (I1) e `criadoEm` local como verdade dos relatórios (I8).

## Ordem de execução

### 1. Regras de negócio

- **RN-O1 (I1)** `order.id` é UUID **gerado no totem** na criação — nunca no backend → idempotência de sync.
- **RN-O2 (I8)** `order.criadoEm` (timestamp local) é a fonte de verdade dos relatórios, não a hora de chegada na API.
- **RN-O3** Status: `draft → paid → printed → synced`; `printed → syncFailed` (retry volta a `synced`). Total sempre = soma dos itens.
- **RN-O4** Decisão consciente: `OrderStatus` inclui estados de sync (`synced`/`syncFailed`) numa única máquina de estados por pragmatismo; as transições de sync são de propriedade **exclusiva** do `SyncQueueWorker` — a UI nunca as dispara.

### 2. Backend — `apps/api` (skills: config-new-module, module-entity, module-use-case, module-repository, module-dto, backend-controller, backend-prisma-data)

- Módulo `order`: `POST /orders` — **ingestão idempotente por `order.id`** (reenvio do mesmo id não duplica — upsert / “já existe” → 200). Autenticada por **device token**; `deviceId`/`storeId` derivam do **token**, nunca do payload (I10) — um totem não consegue enviar pedido como outro. Persistir `criadoEm` do payload (I8). `GET /orders` para o dashboard (autenticado por usuário admin; filtros loja/totem/período).

### 3. Web — `apps/admin` (skill: config-frontend-layout)

- Dashboard de vendas consumindo `GET /orders`: faturamento, pedidos por totem, com datas por `order.criadoEm` (I8).

### 4. Totem — `apps/totem` (skills: flutter-domain-layer, flutter-data-drift-layer, flutter-ui-mvvm)

- **domain**: aggregate root `Order` (`id` UUID, `items`, `total`, `status`, `criadoEm`); VOs `OrderItem`, `OrderTotal`, enum `OrderStatus`; failures `EmptyOrder`, `InvalidStatusTransition`.
- **data**: tabelas Drift `orders`/`order_items`; `sqlite_order_repository` (fonte de verdade local; `create`, `updateStatus`, `findById`, `watchPending`; sem N+1).
- **ui**: `CartScreen` (edita itens, recalcula total; parte do fluxo Catalog→Cart→Payment).

## Invariantes a garantir (checklist)

- **I1** `order.id` UUID no totem. **I8** `criadoEm` local = verdade dos relatórios.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

`order` depende de `catalog` e `device`. O totem é o **dono**; a API é réplica de sync. O projeto é **NOVO (greenfield)** — pré-requisitos: [01-scaffold.md](01-scaffold.md), [02-auth.md](02-auth.md), [03-device.md](03-device.md) e [04-catalog.md](04-catalog.md). Regra permanente: **alinhar e editar o que existe**, nunca recriar em paralelo. Tudo em inglês (`Either`/`Result`). Ponto sensível a reconciliar: `order.id` **é gerado no totem** (I1) e `criadoEm` é o timestamp local (I8) — se algum código gerar id/timestamp no backend, corrigir. Cada subagent faz diff mínimo contra estas RN.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web (dashboard) e totem são independentes após o contrato.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: `catalog`/`device` contratados antes de `order`; domínio antes de data/backend/ui.

### Portão de cada subagent

Invoca a skill da camada → edita → totem: `flutter analyze && flutter test` (transições de status persistidas); api: `turbo build && bun test` (mesmo `order.id` 2x → 1 registro) → entrega diff.

### Ordem

1. **Subagent 1 — Totem/domain** (bloqueante): aggregate `Order` + VOs + `OrderStatus`. Testes verdes.
2. **Subagent 2 — Totem/data** e **Subagent 3 — Backend** (ingestão idempotente) em paralelo.
3. **Subagent 4 — Totem/ui** (CartScreen) e **Subagent 5 — Web** (dashboard).
4. **Subagent 6 — Revisão**: valida `order.id` UUID no totem + ingestão idempotente (I1), `criadoEm` local como verdade dos relatórios (I8) e as transições de status; build + testes + lint.
