# Tarefa: Implementar o contexto Printing (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Depende de `order` e de `device` (`ipCozinha`). **Exclusivo do totem**. Tudo em inglês, `Either`/`Result`.

Escopo: duas vias com semânticas diferentes (I4) — cliente (USB, bloqueante) e cozinha (rede, tolerante a falha).

## Ordem de execução

### 1. Regras de negócio

- **RN-PR1 (I4)** Via do cliente (`LocalUsbPrinterAdapter`) é **síncrona e bloqueante**: falha impede concluir a venda.
- **RN-PR2 (I4)** Via da cozinha (`NetworkPrinterAdapter`) **pode falhar sem bloquear** a confirmação: loga a falha e oferece **reimpressão manual**.
- **RN-PR3 (I7)** IP da cozinha vem de `device.ipCozinha` (socket TCP porta 9100), nunca hardcoded.

### 2. Backend — `apps/api`

- **Não se aplica.** Não existe módulo `printing` no backend.

### 3. Web — `apps/admin`

- **Não se aplica.**

### 4. Totem — `apps/totem` (skills: flutter-domain-layer, flutter-core-layer, flutter-ui-mvvm)

- **domain**: port `PrinterGateway` com `printCustomerReceipt(Order)` e `printKitchenTicket(Order)`, ambos `Either<PrinterUnreachable|PrinterOutOfPaper, Unit>`; failures `PrinterUnreachable`, `PrinterOutOfPaper`.
- **data**: `local_usb_printer_adapter` (ESC/POS via USB, síncrono; platform channel encapsulado) e `network_printer_adapter` (socket TCP 9100, IP de `device.ipCozinha`); mapeia erros nativos/socket para as failures.
- **ui**: `PrintingScreen` — chama a via do cliente (bloqueante) e depois a da cozinha (não bloqueia; em falha, loga e mostra botão de reimpressão manual); `order.status = printed`.

## Invariantes a garantir (checklist)

- **I4** cliente bloqueante × cozinha tolerante. **I7** ipCozinha do `device`.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

`printing` é **exclusivo do totem** (sem backend/web) e depende de `order` e de `device` (`ipCozinha`). O projeto é **NOVO (greenfield)** — pré-requisitos: [01-scaffold.md](01-scaffold.md), [03-device.md](03-device.md) (`ipCozinha`) e [05-order.md](05-order.md). Regra permanente: **alinhar e editar o que existe**, nunca recriar em paralelo. Tudo em inglês (`Either`/`Result`). Ponto sensível a não simplificar: as **duas vias têm semânticas diferentes** (I4) — cliente síncrona/bloqueante × cozinha tolerante a falha com reimpressão manual; e o IP da cozinha vem de `device`, nunca hardcoded (I7). Cada subagent faz diff mínimo contra estas RN.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: os dois adapters (USB/rede) e a PrintingScreen evoluem em paralelo após o port.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: `device.ipCozinha` + port `PrinterGateway` antes dos adapters/UI.

### Portão de cada subagent

Invoca a skill da camada → edita → totem: `flutter analyze && flutter test` (fakes de USB e socket: sucesso, indisponível, sem papel; widget test: falha da cozinha não bloqueia a confirmação) → entrega diff.

### Ordem

1. **Subagent 1 — Totem/domain** (bloqueante): port `PrinterGateway` + failures.
2. **Subagent 2 — Totem/data** (LocalUsbPrinterAdapter + NetworkPrinterAdapter) e **Subagent 3 — Totem/ui** (PrintingScreen) após o contrato.
3. **Subagent 4 — Revisão**: valida via do cliente síncrona/bloqueante × via da cozinha tolerante a falha (I4) e o IP vindo de `device` (I7); build + testes.
