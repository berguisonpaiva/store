# 00 · Fundação — Totem de Autoatendimento

> Convenções comuns a todas as etapas. É a fonte única; os docs de etapa (`01`+) repetem só um resumo e apontam pra cá. Reflete os skills `flutter-clean-architecture` / `flutter-domain-layer` / `flutter-data-drift-layer` / `flutter-core-layer` / `flutter-ui-mvvm` / `flutter-app-composition` (totem) e `config-*` / `module-*` / `backend-*` (api) / `config-frontend-layout` / `frontend-form-schema` (admin).

## Princípio que muda tudo: a lógica crítica roda NO TOTEM

Diferente do Atos Store (regra no backend), aqui **pagamento, impressão e venda rodam no totem**. O backend (`apps/api`) só: sincroniza pedidos, serve o catálogo, alimenta o admin e, no futuro, orquestra múltiplos totens. O totem é **offline-first**: **nenhuma tela bloqueia esperando o backend**.

## Monorepo

```
totem/
├── apps/
│   ├── totem/            ← Flutter Desktop (Windows) — app do cliente (dono da regra crítica)
│   ├── api/              ← NestJS (Fastify) — catálogo, ingestão de sync, relatórios
│   └── admin/            ← Next.js (App Router) — painel remoto
└── packages/
    └── shared-contracts/ ← DTOs espelhados totem↔api, testados por schema (sem bridge TS/Dart)
```

## Bounded contexts e dependência

| Contexto | Onde vive | Responsabilidade |
|---|---|---|
| `device`  | Totem + API | Identidade do totem (loja, número, ipCozinha), estado de sync |
| `catalog` | API (dono) + Totem (cache local) | Produtos/preços; totem lê cache, sincroniza |
| `order`   | Totem (dono) + API (réplica) | Ciclo de vida do pedido: criação, itens, status, total |
| `payment` | Totem (exclusivo) | Adapter do modo quiosque da maquininha — nunca toca dado de cartão |
| `printing`| Totem (exclusivo) | Duas vias: cliente (USB) e cozinha (socket ESC/POS) |
| `sync`    | Totem (orquestra) | Fila offline-first de pedidos pendentes de envio à API |

**Ordem de dependência:** `device → catalog → order → payment/printing → sync`. `sync` depende de `order` e `device`, mas **nenhum contexto depende de `sync`** — é infraestrutura transversal, não domínio.

## Roteiro de execução (projeto NOVO — ordem dos docs)

1. [01-scaffold.md](01-scaffold.md) — monorepo + 3 apps + shared-contracts (**bloqueante de tudo**).
2. [02-auth.md](02-auth.md) — pairing/device token, login do admin, PIN local (**bloqueante dos contextos**: toda rota é autenticada, I10).
3. [03-device.md](03-device.md) → [04-catalog.md](04-catalog.md) → [05-order.md](05-order.md) → [06-payment.md](06-payment.md) + [07-printing.md](07-printing.md) (em paralelo) → [08-sync.md](08-sync.md).
4. [09-testes-e-review.md](09-testes-e-review.md) — ao fim de cada contexto e como portão final.

`01` e `02` são **fundação executável**, não bounded contexts de negócio; os docs `03`+ seguem as 4 seções abaixo.

## Estrutura de cada doc de contexto (`03`+)

Cada doc cobre **um bounded context** com as seções sempre nesta ordem (espelha o modelo do Atos, com "mobile" → "totem"):

1. **Regras de negócio** — as RN/invariantes que valem para o contexto.
2. **Backend** — `apps/api` (ou "não se aplica" quando o contexto é exclusivo do totem).
3. **Web** — `apps/admin` (ou "não se aplica").
4. **Totem** — `apps/totem` (domain → data → ui do contexto).

A ordem das seções é de leitura; a **ordem de build** real (dependências) vai na seção "Ordem" de cada doc.

## Fluxo de venda (atravessa os contextos)

`CatalogScreen (catalog) → CartScreen (order) → PaymentScreen (payment) → PrintingScreen (printing) → ConfirmationScreen (sync enfileira)`. Cada contexto contribui sua tela; nenhuma espera a API (I2).

## Camadas (Flutter, por bounded context)

```
apps/totem/lib/<context>/
├── domain/     # entities, value objects, ports (interfaces), failures  — puro, sem SDK/Flutter
├── data/       # repositories, datasources, adapters concretos (Drift, USB, socket, SDK)
└── ui/         # views, viewmodels (Cubit), states                       — sem regra de negócio
apps/totem/lib/app/   # composition root (get_it), rotas, bootstrap
apps/totem/lib/core/  # wrappers técnicos genéricos (platform channels, http, clock)
```

## Erros — `Either`/`Result`, nunca `throw`

- Todo retorno falível usa `Either<Failure, T>` (fpdart). Nomes de classe e failures **em inglês**.
- Exemplos de contrato: `Either<PaymentDeclined, PaymentResult>`, `Either<PrinterUnreachable, Unit>`, `Either<OrderSyncFailed, Unit>`.
- Ports de domínio são **interfaces abstratas**; a implementação concreta vive em `data/` (ou `core/`). Domínio nunca importa SDK/Flutter.

## Backend (`apps/api`) — companion

- NestJS sobre Fastify, Prisma modular por domínio (`auth`, `device`, `catalog`, `order`). **Sem módulos `payment`/`printing`** — não existem fora do totem.
- `order`: ingestão **idempotente por `order.id`** (UUID gerado no totem). Retry não duplica.
- **Auth** ([02-auth.md](02-auth.md)): device token via pairing (totem) × JWT de usuário (admin); toda rota autenticada, identidade derivada do token (I10).

## Invariantes globais (checklist — repetidos onde aplicam)

- **I1** `order.id` é UUID gerado no totem, nunca no backend → idempotência de sync.
- **I2** Nenhuma tela do totem aguarda a API para completar pagamento ou impressão.
- **I3** `PaymentGateway` é a única fronteira que toca a maquininha — trocar de adquirente não vaza para `domain`/`ui`.
- **I4** Via do cliente (`LocalUsbPrinterAdapter`) é síncrona e bloqueante; via da cozinha (`NetworkPrinterAdapter`) pode falhar sem bloquear a confirmação (loga + reimpressão manual).
- **I5** `SyncQueueWorker` roda independente da UI — a fila continua tentando mesmo com o totem em tela de erro.
- **I6** Catálogo local nunca fica vazio: sem a primeira sincronização, o app não abre vendas.
- **I7** `device.ipCozinha` é configurável em tela de admin local do totem, não hardcoded.
- **I8** `order.criadoEm` (timestamp local) é a fonte de verdade dos relatórios, não a hora de chegada na API.
- **I9** `payment` e `sync` são desacoplados: maquininha aprovou + sync falhou → pedido fica em fila; nunca se perde venda paga por rede.
- **I10** Toda rota da API é autenticada (device token no totem, usuário no admin); `deviceId`/`storeId` derivam **do token**, nunca do payload.
- **I11** A tela de admin local do totem é protegida por **PIN** (equipamento exposto ao público).

## Fora de escopo (decisão consciente — revisitar depois)

- Modo quiosque do Windows (fullscreen/lockdown), auto-start, watchdog e auto-update do totem.
- Observabilidade centralizada (exportar logs de falha de impressão/sync para a API) — por ora, logs locais.
- Multi-loja/orquestração de frota (`device.storeId` já prepara o modelo).
- Conciliação com a adquirente (pagamentos × pedidos).

## Divida em subagents (um por camada/contexto)

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo: adapters de `payment`/`printing`, backend e admin são independentes assim que os contratos existem.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: `domain` compila antes de `data`/`ui` consumirem.

## Portão de cada etapa

Invoca a skill da camada → edita → `flutter analyze` + `flutter test` (totem) / `turbo build` + testes (api/admin) verdes → entrega diff. Testes de `data` rodam contra recurso real (Drift/socket fake), sem mock de banco.

## Desenhos (`.totem/desenhos/`)

- `arquitetura.excalidraw` — monorepo, contexts, cadeia de dependência, fronteira offline e auth (device token × admin JWT).
- `fluxo-venda.excalidraw` — Catalog → Cart → Payment → Printing → Confirmation + gateways.
- `sync-offline.excalidraw` — pedido → fonte de verdade local → fila → worker (retry) → ingestão idempotente na API.
