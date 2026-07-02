# Tarefa: Implementar o contexto Device (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Clean Architecture/DDD/MVVM; tudo em inglês, `Either`/`Result` (fpdart), barrels. **Primeiro da cadeia** `device → catalog → order → payment/printing → sync`.

Escopo: identidade do totem (loja, número) e estado de sync. `device.ipCozinha` alimenta a via da cozinha (contexto `printing`) e **precisa ser configurável** (I7).

## Ordem de execução

### 1. Regras de negócio

- **RN-D1** Cada totem tem identidade: `storeId`, `name` (ou número do totem), `id`.
- **RN-D2 (I7)** `ipCozinha` é configurável em tela de admin local do totem — **nunca hardcoded**; validado como IPv4.
- **RN-D3** O totem reporta seu `SyncState` (pendências, último sync) à API por heartbeat; a API só registra, não decide.

### 2. Backend — `apps/api` (skills: config-new-module, module-entity, module-repository, module-use-case, module-dto, backend-controller, backend-prisma-data)

- Módulo `device`: entidade `Device` (`id`, `storeId`, `name`, `ipCozinha`, `lastSeenAt`).
- O registro do totem **nasce no pairing** ([02-auth.md](02-auth.md)); `POST /devices/:id/heartbeat` (recebe `SyncState`) autenticado por **device token**, com `deviceId` derivado do token (I10).

### 3. Web — `apps/admin` (skills: config-frontend-layout)

- Lista de totens com **status de sync/heartbeat** (online/offline, pendências, último sync). Somente leitura.

### 4. Totem — `apps/totem` (skills: flutter-domain-layer, flutter-data-drift-layer, flutter-ui-mvvm)

- **domain**: entidade `Device`; VOs `SyncState`, `KitchenIp` (valida IPv4); failures `DeviceNotConfigured`, `InvalidKitchenIp`.
- **data**: tabela Drift `devices` (uma linha) + `device_repository_impl` com `watchSyncState()`.
- **ui**: tela de **admin local do totem** para editar `storeId`, `name`, `ipCozinha` (I7); ViewModel (Cubit) sem import de Flutter, validação via VO.

## Invariantes a garantir (checklist)

- **I7** `ipCozinha` configurável em tela, não hardcoded.
- `SyncState` é escrito pelo `SyncQueueWorker` (contexto `sync`) e lido pela UI e pelo heartbeat.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

`device` é o contexto **base** da cadeia: nada depende dele ainda, mas `catalog`, `order`, `printing` e `sync` consomem `id`/`storeId`/`ipCozinha`/`SyncState`. O projeto é **NOVO (greenfield)** — pré-requisitos: [01-scaffold.md](01-scaffold.md) (monorepo/apps/infra) e [02-auth.md](02-auth.md) (pairing/token do device). Regra permanente: **alinhar e editar o que existe**, nunca recriar em paralelo. Tudo em inglês (`Either`/`Result`) — **não** introduzir português nem mocks de banco. Antes de escrever, cada subagent lê os arquivos da sua camada e faz diff mínimo contra estas RN.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web (admin) e totem são independentes assim que a API está contratada.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: `device` (identidade + `ipCozinha`) contratado antes de `printing`/`sync` consumirem; domínio antes de data/ui/backend.

### Portão de cada subagent

Invoca a skill da camada → edita → totem: `flutter analyze && flutter test`; api/admin: `turbo build` + testes verdes → entrega diff.

### Ordem

1. **Subagent 1 — Totem/domain** (bloqueante): entidade `Device` + VOs (`SyncState`, `KitchenIp`) + failures. Testes verdes.
2. **Subagent 2 — Backend** (device module) e **Subagent 3 — Totem/data** em paralelo após o contrato.
3. **Subagent 4 — Totem/ui** (config local) e **Subagent 5 — Web** (lista de totens) em paralelo.
4. **Subagent 6 — Revisão**: valida `ipCozinha` configurável em tela (I7) e o `SyncState` sendo escrito pelo worker e lido pela UI/heartbeat; roda build + testes + lint.
