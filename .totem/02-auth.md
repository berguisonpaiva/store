# Tarefa: Implementar Auth (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Depende só de [01-scaffold.md](01-scaffold.md). Tudo em inglês, `Either`/`Result`.

Escopo: **duas identidades distintas** — o **device** (totem → API, via pairing + device token) e o **usuário admin** (painel → API, via login/senha). Mais a proteção da tela de admin **local** do totem (PIN), já que o equipamento fica exposto ao público na loja. O cliente final **não se autentica** — o totem é anônimo para quem compra.

## Ordem de execução

### 1. Regras de negócio

- **RN-A1 (I10)** Toda rota da API é autenticada. Únicas exceções públicas: `POST /auth/login` (admin) e `POST /devices/pair` (pairing com código de provisionamento).
- **RN-A2** Pairing do device: o admin gera um **código de provisionamento** (curto, expira, uso único) no painel; no primeiro boot o totem envia o código + seus dados → a API cria o `Device` e devolve um **device token** (JWT de longa duração ou API key revogável). O token fica em **storage seguro do Windows**, nunca em texto plano.
- **RN-A3 (I10)** `deviceId`/`storeId` derivam **sempre do token**, nunca do payload — um totem não consegue enviar pedido/heartbeat como outro (anti-spoof da idempotência por `order.id`).
- **RN-A4** Usuário admin: login/senha (hash bcrypt, senha nunca retornada), role única `ADMIN` no MVP; sessão JWT no painel.
- **RN-A5 (I11)** A tela de admin **local** do totem (config `ipCozinha` etc.) exige **PIN** — o público toca no equipamento.
- **RN-A6** Tokens de device são **revogáveis** pelo painel (totem roubado/trocado); heartbeat com token revogado → 401 e o totem entra em modo "reparear" (sem abrir vendas novas... mas **vendas já pagas na fila continuam** — dado local não se perde; ver I9).

### 2. Backend — `apps/api` (skills: config-new-module, module-entity, module-use-case, module-repository, module-dto, backend-controller, backend-prisma-data)

- Módulo `auth`: `AdminUser` (email único, hash, role) + `ProvisioningCode` (código, expiração, usado) + emissão/validação do device token.
- Endpoints: `POST /auth/login` (admin), `POST /devices/pair` (troca código → device token; cria o `Device` de [03-device.md](03-device.md)), `POST /devices/:id/revoke` (admin).
- Guards em `shared/` (do scaffold): `AdminGuard` (JWT de usuário) × `DeviceGuard` (device token) — cada rota declara qual aceita. Seed técnico de um admin inicial.

### 3. Web — `apps/admin` (skills: config-frontend-layout, frontend-form-schema)

- Tela de **login** (React Hook Form + Zod); guard de sessão nas rotas `(private)` — sem sessão, redireciona para login (I10).
- Tela de **provisionamento**: gerar código de pairing para um novo totem; listar devices com botão **revogar** (RN-A6).

### 4. Totem — `apps/totem` (skills: flutter-domain-layer, flutter-core-layer, flutter-ui-mvvm)

- **domain**: port `AuthGateway` (`pair(code) → Either<PairingFailed, DeviceCredential>`); failures `PairingFailed`, `Unauthorized`.
- **data/core**: armazenamento do device token em **storage seguro**; **interceptor HTTP** (no client do scaffold) que injeta o token em toda chamada e traduz 401 → `Unauthorized` (dispara modo "reparear", sem descartar a fila — I9).
- **ui**: fluxo de **pairing no primeiro boot** (input do código, feedback de erro); **PIN** protegendo a tela de admin local (I11).

## Invariantes a garantir (checklist)

- **I10** toda rota autenticada; `deviceId`/`storeId` do token, nunca do payload.
- **I11** tela de admin local com PIN.
- **I9** revogação/401 nunca descarta a fila local de vendas pagas.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

O projeto é **NOVO (greenfield)** — pré-requisito: [01-scaffold.md](01-scaffold.md) (guards base, HTTP client com interceptor plugável, shell do admin). Regra permanente: **alinhar e editar o que existe**, nunca recriar em paralelo. Ponto sensível: auth vem **antes** dos contextos de negócio porque `device`/`catalog`/`order`/`sync` declaram rotas autenticadas (I10) — sem os guards, os docs `03`+ não fecham.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web (login/provisionamento) e totem (pairing/PIN) são independentes após o contrato da API.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: guards e pairing contratados antes de qualquer contexto de negócio.

### Portão de cada subagent

Invoca a skill da camada → edita → api: `turbo build --filter=api && bun test` (login, pairing, revogação, guards: sem token → 401, token de device em rota admin → 403); admin: `build`+`lint`; totem: `flutter analyze && flutter test` (pairing, storage seguro, interceptor, PIN) → entrega diff.

### Ordem

1. **Subagent 1 — Backend** (bloqueante): módulo auth + guards + pairing + seed do admin.
2. **Subagent 2 — Web** (login + provisionamento/revogação) e **Subagent 3 — Totem** (pairing + interceptor + PIN) em paralelo.
3. **Subagent 4 — Revisão**: valida I10 (401/403 nas matrizes device×admin×anônimo, deviceId do token), I11 (PIN) e RN-A6 (revogação não descarta fila — I9); build + testes + lint.
