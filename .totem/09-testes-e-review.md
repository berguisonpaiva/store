# Tarefa: Testes e Code Review (Regras → Backend → Web → Totem)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Portão transversal: rodar ao fim de cada contexto e como validação final do projeto.

## 1. Regras de negócio (o que a revisão precisa provar)

Todos os invariantes de [00-fundacao.md](00-fundacao.md):

- **I1** `order.id` UUID no totem; ingestão idempotente no backend.
- **I2** nenhuma tela aguarda a API pra pagar/imprimir.
- **I3** `PaymentGateway` é a única fronteira com a maquininha (SDK não vaza pra `domain`/`ui`).
- **I4** via do cliente síncrona/bloqueante × via da cozinha tolerante (reimpressão manual).
- **I5** `SyncQueueWorker` roda independente da UI.
- **I6** catálogo local nunca vazio (boot guard antes de abrir vendas).
- **I7** `device.ipCozinha` configurável em tela.
- **I8** `order.criadoEm` local é a verdade dos relatórios.
- **I9** `payment` e `sync` desacoplados: venda paga nunca se perde por rede.
- **I10** toda rota da API é autenticada (device token no totem, usuário no admin); `deviceId`/`storeId` derivam do token, nunca do payload.
- **I11** tela de admin local do totem protegida por PIN.

## 2. Backend — `apps/api` (jest)

- Ingestão idempotente: mesmo `order.id` enviado 2x → **1** registro.
- `criadoEm` do payload preservado (I8).
- Sem token → 401 em todas as rotas; device token de A enviando pedido "como B" → o pedido fica de A (I10); rota de admin com device token → 403.

## 3. Web — `apps/admin`

- Dashboard usa `order.criadoEm` (I8); catálogo escreve na API (nunca fala direto com o totem).
- Rotas protegidas redirecionam para login sem sessão (I10).
- `build` + `lint` verdes.

## 4. Totem — `apps/totem` (skills: flutter-testing, flutter-code-review)

- **domain**: transições de `OrderStatus`, recálculo de total, validação de IP, `PaymentResult`.
- **data**: repositórios e adapters contra recurso real (Drift de teste, socket/USB/SDK fakes) — **sem mock de banco**; worker de sync (sucesso, retry, idempotência, persistência após restart).
- **ui**: widget tests do fluxo — timeout de pagamento com feedback claro; falha da via da cozinha **sem** bloquear a confirmação; tela de admin local exige PIN (I11).
- **auth**: token do device em storage seguro; interceptor injeta token em toda chamada; pairing exigido no primeiro boot (I10).
- **code review** (flutter-code-review): auditar I1–I11 nas fronteiras.

## Portão final

`cd apps/totem && flutter analyze && flutter test`; `cd apps/api && turbo build && bun test`; `cd apps/admin && bun run build && bun run lint`.
