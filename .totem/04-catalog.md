# Tarefa: Implementar o contexto Catalog (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Depende de `device`. Tudo em inglês, `Either`/`Result`.

Escopo: catálogo cujo **dono é a API**; o totem é **leitor** com cache local que **nunca fica vazio** (I6). Offline-first.

## Ordem de execução

### 1. Regras de negócio

- **RN-C1** A **API é a fonte de verdade** do catálogo; o totem nunca escreve.
- **RN-C2 (I6)** Cache local nunca vazio: sem a primeira sincronização, o totem **não abre vendas** (boot guard).
- **RN-C3** Refresh no boot + a cada 5 min (ou push do admin ao alterar preço). Se a API cair, opera com o **último catálogo salvo**; falha de rede não limpa o cache.

### 2. Backend — `apps/api` (skills: config-new-module, module-entity, module-dto, module-query-cqrs, backend-controller, backend-prisma-data)

- Módulo `catalog` (dono): `GET /catalog` (listagem consumida pelo totem, autenticada por **device token**) e escrita vinda do admin (`POST/PATCH /catalog/products`, autenticada por **usuário admin** — I10, ver [02-auth.md](02-auth.md)).

### 3. Web — `apps/admin` (skill: frontend-form-schema)

- Gestão de catálogo: formulários (React Hook Form + Zod) + Server Actions que **escrevem** na API (nome, preço com máscara monetária, disponibilidade). É o que o totem sincroniza.

### 4. Totem — `apps/totem` (skills: flutter-domain-layer, flutter-data-drift-layer, flutter-ui-mvvm)

- **domain**: entidade `Product` read-only (`id`, `name`, `price`, `available`); failures `CatalogUnavailable`, `CatalogNeverSynced`.
- **data**: tabela Drift `products` + `catalog_local_data_source`; `api_catalog_data_source` (`GET /catalog`, via `shared-contracts`); `cached_catalog_repository` — **lê local primeiro**, atualiza em background, expõe `hasInitialSync` (I6).
- **ui**: `CatalogScreen` (lista do cache, monta `Order` draft) + **boot guard** que bloqueia vendas enquanto `hasInitialSync == false`.

## Invariantes a garantir (checklist)

- **I6** catálogo local nunca vazio (boot guard). **I2** leitura de catálogo nunca aguarda a API.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

`catalog` depende de `device`. A **API é a dona** do catálogo: o contrato `GET /catalog` precisa existir/estar acordado antes de o totem consumir. O projeto é **NOVO (greenfield)** — pré-requisitos: [01-scaffold.md](01-scaffold.md), [02-auth.md](02-auth.md) e [03-device.md](03-device.md). Regra permanente: **alinhar e editar o que existe**, nunca recriar em paralelo. Tudo em inglês (`Either`/`Result`); o totem **nunca escreve** catálogo. Cada subagent lê sua camada e faz diff mínimo contra estas RN.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web (gestão) e totem (cache) são independentes após o contrato da API.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: contrato `catalog` (API) + `device` antes do cache do totem.

### Portão de cada subagent

Invoca a skill da camada → edita → totem: `flutter analyze && flutter test`; api/admin: `turbo build`/`build` + testes verdes → entrega diff.

### Ordem

1. **Subagent 1 — Backend** (catalog module): define o contrato de `GET /catalog` e a escrita do admin.
2. **Subagent 2 — Totem/domain** + **Subagent 3 — Totem/data** (cache + datasource + `hasInitialSync`).
3. **Subagent 4 — Totem/ui** (CatalogScreen + boot guard) e **Subagent 5 — Web** (gestão) em paralelo.
4. **Subagent 6 — Revisão**: valida cache local nunca vazio + boot guard (I6) e que nenhuma leitura de catálogo aguarda a API (I2); build + testes + lint.
