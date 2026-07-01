# Prompt — Módulo `vendas` (Atos Store)

> Sprint 6. Venda de balcão (canal PDV) e **orquestração** de estoque + pagamento + caixa.
> Módulo mais completo. Aggregate dono de `Venda` + `ItemVenda`. Canal fixo `PDV` no MVP 1.
> Depende de `estoque`, `pagamentos` e `caixa` — sempre via contrato (port) declarado no
> `provider/` de `vendas`.

---

## 0. Como executar este prompt (subagents separados)

> **IMPORTANTE — divida o trabalho em subagents independentes.**
> Cada camada abaixo (regra de negócio, backend, web, mobile) deve ser executada por um
> **subagent dedicado**, não tudo de uma vez no mesmo contexto.

### Por que separar em subagents
- **Contexto enxuto e focado:** cada agente carrega só a skill e os arquivos da sua camada
  (`module-*` para domínio, `backend-*` para o backend, `frontend-*` para web,
  `flutter-*` para mobile). Menos ruído = menos erro.
- **Paralelismo real:** web e mobile não dependem um do outro e podem rodar ao mesmo tempo.
- **Fronteira de revisão clara:** cada subagent entrega um diff coeso por camada, fácil de
  revisar e reverter isoladamente.
- **Respeita a dependência de build:** `vendas` orquestra `estoque`, `pagamentos` e `caixa`.
  Os **ports** (`EstoqueGateway`, `PagamentoGateway`, `CaixaGateway`) precisam estar contratados
  no domínio antes de o backend implementar os adapters. O domínio é a fonte da verdade.

### Ordem de execução
1. **Subagent 1 — Regra de Negócio** (seção 1). Bloqueante: entidades, use cases, **ports**
   consumidos, contratos próprios e códigos de erro.
2. **Subagent 2 — Backend** (seção 2). Depende do domínio + dos adapters de `estoque`,
   `pagamentos` e `caixa`.
3. **Subagent 3 — Web** e **Subagent 4 — Mobile** (seções 3 e 4). Independentes entre si —
   **em paralelo** assim que a API estiver contratada.
4. **Subagent 5 — Revisão** (opcional): valida a transação única de `finalizar-venda` ponta a
   ponta e as invariantes (total, pagamento = total, imutabilidade da `CONCLUIDA`).

> Cada subagent recebe **apenas a sua seção** + o "Mapa de dependências" (final do doc).
> Não passe o documento inteiro para um único agente.
> **Pré-requisito:** os módulos `estoque`, `pagamentos` e `caixa` já devem expor seus contratos
> antes do Subagent 2.

---

## 1. Regra de Negócio (domínio puro — `modules/vendas`)

### Contexto
Núcleo de domínio da venda de balcão, sem framework/banco/HTTP. Orquestra outros módulos
**apenas via ports** declarados na própria pasta `provider/`.

### Estrutura de pastas (por agregado)
`model/` (`*.entity.ts`, `*.vo.ts`) · `provider/` (`*.repository.ts`, `*-query.ts`, ports) ·
`use-case/` (`*.use-case.ts`) · `dto/` (`*.dto.ts`) · `errors/` (`*-error.ts`) ·
`service/` (specifications / domain services). Naming kebab-case dot-type.

### Entidades / Aggregate
- **`Venda`** (aggregate root)
  - `numero` (sequencial único), `canal` (`PDV`), `status`, `usuarioId` (operador),
    `sessaoCaixaId`, `subtotal`, `desconto`, `total`.
- **`ItemVenda`**
  - `variacaoId`, `quantidade`, `precoUnitario` (snapshot), `total`.
- **Status (MVP 1):** `ABERTA → CONCLUIDA | CANCELADA`.

### Use cases — escrita (`use-case/`)
- `criar-venda` (abre `ABERTA`; exige sessão de caixa `ABERTA` do operador)
- `adicionar-item` (snapshot de `precoUnitario`)
- `remover-item`
- `aplicar-desconto`
- `finalizar-venda`
- `cancelar-venda`

### `finalizar-venda` (transação única)
> Orquestração entre módulos pelos ports que `vendas` declara em `provider/`
> (`EstoqueGateway`, `PagamentoGateway`, `CaixaGateway`); o backend implementa cada um num adapter.
1. Valida saldo de cada item via `EstoqueGateway`.
2. Dá baixa no estoque (uma `SAIDA` por item, motivo `VENDA_PDV`, com `origemVendaId`).
3. Registra `Pagamento` via `PagamentoGateway`.
4. Cria `MovimentacaoCaixa` tipo `VENDA` via `CaixaGateway`.
5. Status → `CONCLUIDA`.

### `cancelar-venda`
Estorna o estoque (entrada de `DEVOLUCAO`) e reverte o caixa. **Só antes do fechamento da sessão.**

### Use cases — leitura (`find-*` / `list-*`, apoiados em `*-query.ts`)
- `buscar-venda`
- `listar-vendas` (por período/operador/sessão/status)
- `resumo-vendas` (totais)

### Contratos (`provider/`)
- `VendasRepository` (`*.repository.ts`) + `VendasQuery` (`*-query.ts`).
- **Consome (ports declarados aqui):** `EstoqueGateway`, `PagamentoGateway`, `CaixaGateway`
  — implementados nos adapters do backend.

### Invariantes (obrigatórias)
- Venda `CONCLUIDA` é **imutável**.
- `total` = Σ itens − desconto.
- Exige **sessão de caixa `ABERTA`** do operador.
- Soma dos pagamentos = `total` para finalizar.

### Erros de domínio (`errors/venda-error.ts` — `Result.fail(CODE)`)
- `SALE_NOT_FOUND`
- `SALE_ALREADY_FINALIZED`
- `NO_OPEN_CASH_SESSION`
- `INSUFFICIENT_STOCK`
- `PAYMENT_MISMATCH`

### Requisitos Funcionais
| RF | Descrição |
|---|---|
| RF-VND-01 | Iniciar venda (PDV) vinculada ao operador e à sua sessão de caixa `ABERTA`. |
| RF-VND-02 | Impedir iniciar venda sem caixa aberto do operador. |
| RF-VND-03 | Adicionar item por SKU, código de barras (bipe) ou nome; informar quantidade; `precoUnitario` snapshot. |
| RF-VND-04 | Remover item e alterar quantidade enquanto `ABERTA`. |
| RF-VND-05 | Aplicar desconto por valor ou percentual sobre o total. |
| RF-VND-06 | Calcular subtotal, desconto e total automaticamente. |
| RF-VND-07 | Finalizar em transação única: valida saldo → baixa estoque (`VENDA_PDV`) → registra pagamento(s) → lança no caixa → `CONCLUIDA`. |
| RF-VND-08 | Exigir soma dos pagamentos = total para finalizar. |
| RF-VND-09 | Bloquear qualquer alteração de venda `CONCLUIDA`. |
| RF-VND-10 | Cancelar venda (estorna estoque e caixa) somente antes do fechamento da sessão. |
| RF-VND-11 | Gerar número sequencial único por venda. |
| RF-VND-12 | Listar/buscar vendas por período, operador, sessão e status; exibir resumo de totais. |

### Critérios de aceite
- `criar-venda` sem caixa aberto → `Result.fail(NO_OPEN_CASH_SESSION)`.
- Qualquer escrita em venda `CONCLUIDA` → `SALE_ALREADY_FINALIZED`.
- `finalizar-venda` com saldo insuficiente → `INSUFFICIENT_STOCK`; soma de pagamentos ≠ total → `PAYMENT_MISMATCH`.
- `adicionar-item` captura `precoUnitario` como snapshot (não muda se o preço da variação mudar depois).
- `total = Σ itens − desconto`; desconto (valor ou %) nunca maior que o subtotal.
- `numero` é sequencial e único.

### Testes do domínio (obrigatórios)
- **VOs / cálculo:** `total`, snapshot de `precoUnitario`, desconto valor vs. percentual (limite no subtotal).
- **Use cases (escrita):** um teste por código de erro + caminho feliz, com ports fakes.
  - `criar-venda`: feliz + `NO_OPEN_CASH_SESSION`.
  - `adicionar/remover-item` e `aplicar-desconto`: feliz + `SALE_ALREADY_FINALIZED`.
  - `finalizar-venda`: feliz (ordem 1→5) + `INSUFFICIENT_STOCK` + `PAYMENT_MISMATCH`;
    falha em qualquer passo **reverte tudo** (rollback da orquestração).
  - `cancelar-venda`: feliz (estorno) + bloqueio após fechamento da sessão.
- **Use cases (leitura):** `resumo-vendas` soma totais por período/operador/sessão/status.
- Cobertura mínima: todos os ramos de erro + a transação única de `finalizar-venda`.

---

## 2. Backend (NestJS + Fastify + Prisma — `apps/backend/src/modules/vendas`)

### Contexto
Expor o domínio via HTTP, persistir com Prisma e implementar os **adapters** que ligam os ports
de `vendas` aos módulos `estoque`, `pagamentos` e `caixa`.

### Camada Prisma (`backend-prisma-data`)
- Models `Venda` e `ItemVenda` em `prisma/models/vendas.model.prisma`.
  - `Venda`: `id`, `numero` (único), `canal`, `status`, `usuarioId`, `sessaoCaixaId`,
    `subtotal`, `desconto`, `total`, `criadaEm`, `concluidaEm?`, `canceladaEm?`.
  - `ItemVenda`: `id`, `vendaId` (FK), `variacaoId`, `quantidade`, `precoUnitario`, `total`.
- Adapter `*.prisma.ts` implementando `VendasRepository` e `VendasQuery` (`toDomain`/`fromDomain`).
- **Número sequencial:** sequence/contador atômico no banco (garante `numero` único sob concorrência).
- `Decimal` para valores monetários (sem `float`).

### Adapters dos ports (orquestração)
- `EstoqueGateway` → adapter chama use cases de `estoque` (validar saldo, registrar `SAIDA`
  `VENDA_PDV` com `origemVendaId`, `DEVOLUCAO` no cancelamento).
- `PagamentoGateway` → adapter chama `pagamentos` (registrar pagamento(s)).
- `CaixaGateway` → adapter chama `caixa` (`MovimentacaoCaixa` tipo `VENDA`; reverter no cancelamento).
- **`finalizar-venda` e `cancelar-venda` rodam em transação única** (`TransactionManager` /
  `runInTransaction`): baixa de estoque + pagamento + caixa + status são atômicos; falha em
  qualquer passo faz rollback completo.
- Wiring no `VendasModule` (composition root) ligando cada adapter ao módulo dono.

### Controllers HTTP (`*.controller.ts` — `backend-controller`)
| Verbo | Rota | Use case | Erros → HTTP |
|---|---|---|---|
| POST | `/vendas` | `criar-venda` | `NO_OPEN_CASH_SESSION` → 422 |
| POST | `/vendas/:id/itens` | `adicionar-item` | `SALE_NOT_FOUND` → 404; `SALE_ALREADY_FINALIZED` → 409 |
| DELETE | `/vendas/:id/itens/:itemId` | `remover-item` | `SALE_NOT_FOUND` → 404; `SALE_ALREADY_FINALIZED` → 409 |
| PATCH | `/vendas/:id/desconto` | `aplicar-desconto` | `SALE_NOT_FOUND` → 404; `SALE_ALREADY_FINALIZED` → 409 |
| POST | `/vendas/:id/finalizar` | `finalizar-venda` | `INSUFFICIENT_STOCK` → 422; `PAYMENT_MISMATCH` → 422; `SALE_ALREADY_FINALIZED` → 409 |
| POST | `/vendas/:id/cancelar` | `cancelar-venda` | `SALE_NOT_FOUND` → 404; `SALE_ALREADY_FINALIZED` → 409 |
| GET | `/vendas/:id` | `buscar-venda` | `SALE_NOT_FOUND` → 404 |
| GET | `/vendas` | `listar-vendas` | — (filtros: período/operador/sessão/status) |
| GET | `/vendas/resumo` | `resumo-vendas` | — |

### DTOs
**Entrada (`InDTO`)**
- `CriarVendaInDTO` → `{ }` (operador + sessão derivados do usuário autenticado).
- `AdicionarItemInDTO` → `{ variacaoId | sku | codigoBarras, quantidade: int (> 0) }`.
- `AplicarDescontoInDTO` → `{ tipo: 'valor' | 'percentual', valor: number (≥ 0) }`.
- `FinalizarVendaInDTO` → `{ pagamentos: [{ forma, valor }] }` (Σ valores = total).

**Saída (`OutDTO`)**
- `VendaOutDTO` → `{ id, numero, canal, status, usuarioId, sessaoCaixaId, subtotal, desconto, total, itens[] }`.
- `ResumoVendasOutDTO` → totais por filtro.

### Requisitos
- Bind `@Body/@Param/@Query`, guard de autenticação (`@ApiBearerAuth`).
- Swagger: `@ApiTags('vendas')`, `@ApiOperation`, `@ApiResponse` por status.
- Mapear `Result.fail(CODE)` → exceção HTTP (`ConflictException` 409,
  `NotFoundException` 404, `UnprocessableEntityException` 422, `BadRequestException` 400).
- `usuarioId` e `sessaoCaixaId` derivados do contexto autenticado, não do body.

### Critérios de aceite
- `finalizar-venda` executa 1→5 atomicamente; falha em qualquer passo → rollback total e nenhum efeito colateral.
- `numero` único mesmo com finalizações concorrentes.
- Alteração em venda `CONCLUIDA` → 409.
- Valores monetários como `Decimal`.

### Testes do backend (obrigatórios)
- **Adapter Prisma:** `toDomain/fromDomain`; sequence garante `numero` único; persistência de itens.
- **Adapters dos ports:** `EstoqueGateway`/`PagamentoGateway`/`CaixaGateway` chamam os use cases
  corretos dos módulos donos.
- **Transação de `finalizar-venda` (integração):** caminho feliz aplica baixa + pagamento + caixa
  + `CONCLUIDA`; injetar falha no passo de pagamento/caixa → **rollback completo** (estoque não baixa).
- **`cancelar-venda`:** estorna estoque (`DEVOLUCAO`) e reverte caixa; bloqueio após fechamento.
- **Controllers (e2e):** uma asserção por linha da tabela de rotas (cada erro → status correto).
- Banco de teste (Docker Compose) + reset entre suites.

---

## 3. Web (Next.js App Router — `apps/frontend/src/modules/vendas`)

### Contexto
Tela de operação do PDV (não é um form único): bipar/buscar itens, ajustar quantidade,
aplicar desconto, finalizar com pagamento. Consome a API do backend.

### Tela de Venda (PDV)
- **Pré-condição:** exige caixa aberto do operador; sem caixa → bloquear e orientar abrir caixa
  (`NO_OPEN_CASH_SESSION`).
- **Adição de item:** campo único que aceita SKU / código de barras (bipe) / busca por nome
  (autocomplete via `@headlessui/react Combobox`); variação ativa existente.
- **Lista de itens:** quantidade editável (> 0, ≤ saldo), `precoUnitario` readonly (snapshot), total por linha.
- **Resumo:** subtotal, desconto, total atualizados automaticamente.
- **Desconto:** select `valor`/`percentual` + valor (≥ 0, não maior que subtotal).
- **Finalizar:** etapa de pagamento (módulo `pagamentos`) — soma dos pagamentos = total.
- **Cancelar:** disponível antes do fechamento da sessão.

### Campos
| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| busca de item | texto (SKU / código de barras / nome) | Sim (para adicionar) | variação ativa existente |
| quantidade (por item) | inteiro | Sim | > 0, ≤ saldo disponível |
| precoUnitario (por item) | decimal (readonly) | — | snapshot do preço da variação |
| descontoTipo | select `valor`/`percentual` | Não | — |
| descontoValor | decimal | Não | ≥ 0, não maior que o subtotal |

### Requisitos (`frontend-form-schema`)
- Campos monetários com `NumericFormat` via `Controller`; busca com `Combobox` via `Controller`.
- Quantidade valida `> 0` e `≤ saldo`; desconto valida `≤ subtotal`.
- Tratar erros por código:
  - `NO_OPEN_CASH_SESSION` → bloquear venda.
  - `INSUFFICIENT_STOCK` → destacar item sem saldo.
  - `PAYMENT_MISMATCH` → bloquear finalização até pagamentos = total.
  - `SALE_ALREADY_FINALIZED` → travar edição da venda concluída.
- Foco automático no campo de bipe; adicionar item sem recarregar a tela.

### Critérios de aceite
- Operador sem caixa aberto não inicia venda.
- Subtotal/desconto/total recalculam a cada mudança.
- Não finaliza enquanto pagamentos ≠ total.
- Venda concluída fica somente leitura.

### Testes web
- Schemas Zod: quantidade `> 0`, desconto `≤ subtotal`.
- Cálculo de totais (subtotal − desconto).
- Mapeamento de erros da API (códigos → UI bloqueada/destacada).
- Fluxo de adicionar item por bipe (mock do datasource).

---

## 4. Mobile (Flutter — Clean Architecture / DDD / MVVM)

> Camadas: `domain` (contratos + use cases), `data` (repos + DTOs + datasource HTTP),
> `ui` (Cubit/ViewModel + views), `app` (DI get_it + rotas), `core` (HTTP/storage).

### Domain (`lib/domain`)
- Entidades `Venda`, `ItemVenda` (espelham o backend); status `ABERTA/CONCLUIDA/CANCELADA`.
- Contratos: `VendasRepository` (Future<Either<Failure, T>>).
- Use cases: `CriarVenda`, `AdicionarItem`, `RemoverItem`, `AplicarDesconto`, `FinalizarVenda`,
  `CancelarVenda`, `BuscarVenda`, `ListarVendas`, `ResumoVendas`.
- `Failure` por código: `SaleNotFound`, `SaleAlreadyFinalized`, `NoOpenCashSession`,
  `InsufficientStock`, `PaymentMismatch`.

### Data (`lib/data`)
- `VendasRepositoryImpl` + `VendasRemoteDataSource` (chama a API do backend).
- DTOs/mappers para venda, item, desconto, finalização (pagamentos), resumo.
- Mapeia erro HTTP/código → `Exception` → `Failure`.

### UI (`lib/ui` — MVVM/Cubit)
- **VendaPdvView** — tela de operação: campo de bipe/busca, lista de itens, resumo (subtotal/desconto/total), ações.
- **DescontoSheet** — tipo `valor`/`percentual` + valor (`≤ subtotal`).
- **FinalizarVendaView** — etapa de pagamento; bloqueia até pagamentos = total.
- Estados de saldo insuficiente, sem caixa aberto e venda concluída (somente leitura).
- ViewModels sem import de Flutter; `BlocBuilder` com bloc explícito; `AppToast` para feedback;
  confirmação ao cancelar venda.

### App (`lib/app`)
- Registrar repositório, datasource e use cases no get_it.
- Rotas (GoRouter) com guard de operador autenticado + caixa aberto.

### Critérios de aceite
- Mesmas invariantes e códigos de erro do backend tratados como `Failure` e refletidos na UI.
- Totais recalculam automaticamente; não finaliza enquanto pagamentos ≠ total.
- Venda concluída fica somente leitura; cancelamento só antes do fechamento da sessão.

### Testes mobile (`flutter-testing`)
- **Domain:** use cases com repositório fake — caminho feliz + cada `Failure`.
- **Data:** `VendasRepositoryImpl` mapeia erro HTTP → `Failure`; mappers DTO ↔ entidade.
- **UI (Cubit + widget):** adicionar item por bipe, recálculo de totais, bloqueio sem caixa,
  bloqueio de finalização com `PaymentMismatch`, venda concluída readonly.
- mocktail + bloc_test; `pumpApp` com l10n; sem testes flaky.

---

## Mapa de dependências
- `vendas` → **consome** (via ports declarados em `provider/`):
  - `estoque` (`EstoqueGateway`) — validar saldo, `SAIDA` `VENDA_PDV`, `DEVOLUCAO` no cancelamento.
  - `pagamentos` (`PagamentoGateway`) — registrar pagamento(s); Σ pagamentos = total.
  - `caixa` (`CaixaGateway`) — `MovimentacaoCaixa` tipo `VENDA`; reverter no cancelamento.
- Cada port é implementado num **adapter** no backend, ligando ao módulo dono.
- Regra de cálculo (compartilhada por backend/web/mobile):
  `total = Σ itens − desconto` · `finalizar` exige `Σ pagamentos = total` · `precoUnitario` é snapshot.
