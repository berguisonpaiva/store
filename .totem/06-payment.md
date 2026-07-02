# Tarefa: Implementar o contexto Payment (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Depende de `order`. **Exclusivo do totem**. Tudo em inglês, `Either`/`Result`.

Escopo: modo quiosque da maquininha atrás de uma interface; adquirente (Stone/PagBank) **em aberto**, isolada em `data` (I3). Nunca tocar dado de cartão.

## Ordem de execução

### 1. Regras de negócio

- **RN-P1 (I3)** `PaymentGateway` é a **única fronteira** que toca a maquininha — trocar de adquirente não vaza para `domain`/`ui`.
- **RN-P2** Nunca manipular dado de cartão (modo quiosque).
- **RN-P3** Timeout da maquininha tem tratamento próprio (`PaymentTimeout`) e feedback visual claro ao cliente.
- **RN-P4 (I9)** Aprovar pagamento **não** depende de rede com a API; `payment` é desacoplado de `sync`.

### 2. Backend — `apps/api`

- **Não se aplica.** Não existe módulo `payment` no backend — a responsabilidade é exclusiva do totem.

### 3. Web — `apps/admin`

- **Não se aplica.** (O valor pago aparece indiretamente no dashboard via `order`, não como domínio de pagamento.)

### 4. Totem — `apps/totem` (skills: flutter-domain-layer, flutter-core-layer, flutter-ui-mvvm)

- **domain**: VO `PaymentResult` (`approved`/`declined`, valor + id da transação, **sem** dado de cartão); failures `PaymentDeclined`, `PaymentTimeout`; port `PaymentGateway.charge(Order) → Either<PaymentDeclined|PaymentTimeout, PaymentResult>` (única fronteira, I3).
- **data**: `kiosk_payment_gateway_impl` implementando o port; isola 100% o SDK da adquirente (platform channel encapsulado em `core` se preciso). Timeout → `PaymentTimeout`; recusa → `PaymentDeclined`.
- **ui**: `PaymentScreen` — chama `PaymentGateway`, trata `PaymentTimeout` com feedback claro (cliente nunca fica sem saber se pagou); sucesso → `order.status = paid`.

## Invariantes a garantir (checklist)

- **I3** única fronteira com a maquininha. **I9** desacoplado de `sync`.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

`payment` é **exclusivo do totem** (sem backend/web) e depende de `order`. A adquirente (Stone/PagBank) está **em aberto**: tudo de SDK fica atrás do port `PaymentGateway`. O projeto é **NOVO (greenfield)** — pré-requisitos: [01-scaffold.md](01-scaffold.md) e [05-order.md](05-order.md). Regra permanente: **alinhar e editar o que existe**, nunca recriar em paralelo. Tudo em inglês (`Either`/`Result`). Ponto sensível: nada de SDK/plataforma pode vazar para `domain`/`ui` (I3), e nunca manipular dado de cartão. Cada subagent faz diff mínimo contra estas RN.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: `data` (impl do gateway) e `ui` (PaymentScreen) evoluem em paralelo após o port.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: port `PaymentGateway` (domínio) antes do impl e da tela.

### Portão de cada subagent

Invoca a skill da camada → edita → totem: `flutter analyze && flutter test` (fake do SDK: aprovação, recusa, timeout; widget test do feedback de timeout) → entrega diff.

### Ordem

1. **Subagent 1 — Totem/domain** (bloqueante): VO `PaymentResult` + failures + port `PaymentGateway`.
2. **Subagent 2 — Totem/data** (impl atrás da interface) e **Subagent 3 — Totem/ui** (PaymentScreen) após o contrato.
3. **Subagent 4 — Revisão**: valida `PaymentGateway` como única fronteira com a maquininha (I3), tratamento de timeout e o desacoplamento de `sync` (I9); build + testes.
