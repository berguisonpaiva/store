# Prompt — Módulo `caixa` (Atos Store)

> Sessão de caixa do PDV: abertura, fechamento e movimentos manuais.
> Aggregate dono de `SessaoCaixa` + `MovimentacaoCaixa`.
> Consumido por `vendas` via `CaixaGateway`. Não depende de nenhum outro módulo.

---

## 0. Como executar este prompt (subagents separados)

> **IMPORTANTE — divida o trabalho em subagents independentes.**
> Cada camada abaixo (regra de negócio, backend, web, mobile) deve ser executada por um
> **subagent dedicado**, não tudo de uma vez no mesmo contexto.

### Por que separar em subagents
- **Contexto enxuto e focado:** cada agente carrega só a skill e os arquivos da sua camada
  (ex.: `module-*` para domínio, `backend-*` para o backend, `frontend-*` para web,
  `flutter-*` para mobile). Menos ruído = menos erro.
- **Paralelismo real:** web e mobile não dependem um do outro e podem rodar ao mesmo tempo,
  reduzindo o tempo total.
- **Fronteira de revisão clara:** cada subagent entrega um diff coeso por camada, fácil de revisar
  e reverter isoladamente.
- **Respeita a dependência de build:** o domínio é a fonte da verdade dos contratos e erros;
  ele precisa estabilizar antes das camadas que o consomem.

### Ordem de execução
1. **Subagent 1 — Regra de Negócio** (seção 1). Bloqueante: define entidades, use cases,
   contratos (`provider/`) e códigos de erro consumidos pelas demais camadas.
2. **Subagent 2 — Backend** (seção 2). Depende do contrato do domínio.
3. **Subagent 3 — Web** e **Subagent 4 — Mobile** (seções 3 e 4). Independentes entre si —
   podem rodar **em paralelo** assim que a API do backend estiver contratada.
4. **Subagent 5 — Revisão** (opcional): valida invariantes ponta a ponta e a fórmula de saldo
   compartilhada.

> Cada subagent deve receber **apenas a sua seção** + o "Mapa de dependências" (final do doc)
> como contexto. Não passe o documento inteiro para um único agente.

---

## 1. Regra de Negócio (domínio puro — `modules/caixa`)

### Contexto
Modelar o núcleo de domínio do caixa, sem dependência de framework, banco ou HTTP.

### Entidades / Aggregate
- **`SessaoCaixa`** (aggregate root)
  - `operadorId`, `status` (`ABERTO` | `FECHADO`)
  - `valorAbertura`, `valorFechamento?`
  - `abertaEm`, `fechadaEm?`
- **`MovimentacaoCaixa`**
  - `tipo` (`SUPRIMENTO` | `SANGRIA` | `VENDA`)
  - `valor`, `observacao?`

### Use cases — escrita (`use-case/`)
- `abrir-caixa` (`valorAbertura`)
- `fechar-caixa` (`valorFechamento`, calcula divergência vs. esperado)
- `registrar-sangria`
- `registrar-suprimento`

### Use cases — leitura (`find-*` / `list-*`, apoiados em `*-query.ts`)
- `caixa-aberto-do-operador`
- `resumo-sessao` → `esperado = abertura + suprimentos + vendas em dinheiro − sangrias`
- `listar-movimentacoes`

### Contratos (`provider/`)
- `CaixaRepository` (`*.repository.ts`) — sessão e movimentos.
- `CaixaQuery` (`*-query.ts`) — projeções de leitura (resumo, movimentações).
- Expõe para `vendas` (via use cases):
  - `caixaAbertoDoOperador(usuarioId)`
  - `registrarVenda(sessaoId, valor)`
  - `vendas` depende de um **port** na própria pasta `provider/`, ligado ao caixa no backend (adapter).

### Invariantes (obrigatórias)
- No máximo **1 caixa `ABERTO` por operador** por vez.
- **Não fecha** com venda `ABERTA` pendente na sessão.
- `MovimentacaoCaixa` tipo `VENDA` **só** entra via módulo `vendas`.

### Erros de domínio (`errors/caixa-error.ts` — `Result.fail(CODE)`)
- `CASH_SESSION_ALREADY_OPEN`
- `CASH_SESSION_NOT_FOUND`
- `CASH_SESSION_ALREADY_CLOSED`
- `PENDING_SALE_IN_SESSION`

### Requisitos Funcionais
| RF | Descrição |
|---|---|
| RF-CX-01 | Abrir caixa informando valor de abertura (fundo de troco). |
| RF-CX-02 | Impedir abertura se o operador já possui caixa `ABERTO`. |
| RF-CX-03 | Registrar sangria (retirada) com valor e observação. |
| RF-CX-04 | Registrar suprimento (reforço) com valor e observação. |
| RF-CX-05 | Registrar automaticamente movimento `VENDA` ao finalizar venda (via `CaixaGateway`). |
| RF-CX-06 | Calcular saldo esperado = abertura + suprimentos + vendas em dinheiro − sangrias. |
| RF-CX-07 | Fechar caixa com valor contado, registrando divergência vs. esperado. |
| RF-CX-08 | Impedir fechamento com venda `ABERTA` pendente na sessão. |
| RF-CX-09 | Consultar caixa aberto do operador e resumo da sessão. |

### Critérios de aceite
- `abrir-caixa` com operador que já tem sessão `ABERTO` → `Result.fail(CASH_SESSION_ALREADY_OPEN)`.
- `fechar-caixa` em sessão inexistente → `CASH_SESSION_NOT_FOUND`; já fechada → `CASH_SESSION_ALREADY_CLOSED`.
- `fechar-caixa` com venda `ABERTA` na sessão → `PENDING_SALE_IN_SESSION`.
- `resumo-sessao` calcula o esperado pela fórmula acima; divergência = `valorFechamento − esperado`.
- `valorAbertura ≥ 0`; `valorFechamento ≥ 0`; movimentos manuais `valor > 0`.

### Testes do domínio (obrigatórios)
- **Entidades / VOs:** validação de `valor` (`≥ 0` / `> 0`), transições de `status`.
- **Use cases (escrita):** um teste por código de erro + caminho feliz, com repositório fake.
  - `abrir-caixa`: feliz + `CASH_SESSION_ALREADY_OPEN`.
  - `fechar-caixa`: feliz + `NOT_FOUND` + `ALREADY_CLOSED` + `PENDING_SALE_IN_SESSION` + cálculo de divergência.
  - `registrar-sangria` / `registrar-suprimento`: feliz + `NOT_FOUND` + `valor > 0`.
- **Use cases (leitura):** `resumo-sessao` valida a fórmula `abertura + suprimentos + vendas$ − sangrias`.
- Cobertura mínima: todos os ramos de erro e a fórmula de saldo.

---

## 2. Backend (NestJS + Fastify + Prisma — `apps/backend/src/modules/caixa`)

### Contexto
Expor o domínio do caixa via HTTP, persistir com Prisma e ligar o adapter consumido por `vendas`.

### Camada Prisma (`backend-prisma-data`)
- Models `SessaoCaixa` e `MovimentacaoCaixa` em `prisma/models/caixa.model.prisma`.
  - `SessaoCaixa`: `id`, `operadorId`, `status`, `valorAbertura`, `valorFechamento?`,
    `abertaEm`, `fechadaEm?`.
  - `MovimentacaoCaixa`: `id`, `sessaoId` (FK), `tipo`, `valor`, `observacao?`, `criadaEm`.
- Adapter `*.prisma.ts` implementando `CaixaRepository` e `CaixaQuery`
  (mapeamento `toDomain` / `fromDomain`).
- **Índice único parcial:** `operadorId` onde `status = ABERTO` — reforça RF-CX-02 no banco
  (garante "1 caixa aberto por operador" mesmo sob concorrência).
- Migração SQL versionada + `prisma generate`.
- `Decimal` para valores monetários (sem `float`).

### Adapter para `vendas`
- Implementar o port que `vendas` declara em sua própria `provider/`, delegando para os use cases:
  - `caixaAbertoDoOperador(usuarioId)`
  - `registrarVenda(sessaoId, valor)` → cria `MovimentacaoCaixa` tipo `VENDA`.
- Operações que alteram saldo + criam movimento devem rodar em **transação**
  (`TransactionManager` / `runInTransaction`).
- Wiring no `CaixaModule` / `VendasModule` (composition root do backend).

### Controllers HTTP (`*.controller.ts` — `backend-controller`)
| Verbo | Rota | Use case | Erros → HTTP |
|---|---|---|---|
| POST | `/caixa/abrir` | `abrir-caixa` | `CASH_SESSION_ALREADY_OPEN` → 409 |
| POST | `/caixa/:id/fechar` | `fechar-caixa` | `CASH_SESSION_NOT_FOUND` → 404; `CASH_SESSION_ALREADY_CLOSED` → 409; `PENDING_SALE_IN_SESSION` → 422 |
| POST | `/caixa/:id/sangria` | `registrar-sangria` | `CASH_SESSION_NOT_FOUND` → 404 |
| POST | `/caixa/:id/suprimento` | `registrar-suprimento` | `CASH_SESSION_NOT_FOUND` → 404 |
| GET | `/caixa/aberto` | `caixa-aberto-do-operador` | — |
| GET | `/caixa/:id/resumo` | `resumo-sessao` | `CASH_SESSION_NOT_FOUND` → 404 |
| GET | `/caixa/:id/movimentacoes` | `listar-movimentacoes` | — |

### DTOs
**Entrada (`InDTO`)**
- `AbrirCaixaInDTO` → `{ valorAbertura: number }` (`≥ 0`).
- `FecharCaixaInDTO` → `{ valorFechamento: number }` (`≥ 0`).
- `MovimentacaoInDTO` (sangria/suprimento) → `{ valor: number (> 0), observacao: string (obrigatória) }`.

**Saída (`OutDTO`)**
- `SessaoOutDTO` → dados da sessão (`id`, `operadorId`, `status`, valores, datas).
- `ResumoSessaoOutDTO` → `{ abertura, suprimentos, vendasDinheiro, sangrias, esperado, contado?, divergencia? }`.
- `MovimentacaoOutDTO` → `{ id, tipo, valor, observacao?, criadaEm }`.

### Requisitos
- Bind `@Body/@Param`, guard de autenticação (`@ApiBearerAuth`).
- Decorators Swagger: `@ApiTags('caixa')`, `@ApiOperation`, `@ApiResponse` (por código de status).
- Mapear `Result.fail(CODE)` → exceção HTTP correta
  (`ConflictException` 409, `NotFoundException` 404, `UnprocessableEntityException` 422,
  `BadRequestException` 400).
- `registrar-venda` **não** é exposto como rota pública — só via adapter de `vendas`.
- `operadorId` derivado do usuário autenticado (não vem no body).

### Critérios de aceite
- Cada rota orquestra o use case e devolve o status correto por código de erro.
- `GET /caixa/:id/resumo` retorna `{ abertura, suprimentos, vendasDinheiro, sangrias, esperado }`.
- Concorrência de abertura dupla barrada (use case + índice único parcial).
- Valores monetários como `Decimal`, sem perda de precisão.

### Testes do backend (obrigatórios)
- **Adapter Prisma (`*.prisma.ts`):** `toDomain/fromDomain`; índice único parcial impede 2º `ABERTO`;
  transação registra venda + movimento atomicamente (rollback em falha).
- **Controllers (e2e / integração):** uma asserção por linha da tabela de rotas —
  cada código de erro mapeia para o status HTTP esperado (409/404/422/400) e o caminho feliz.
- **Adapter para `vendas`:** `caixaAbertoDoOperador` e `registrarVenda` chamam os use cases
  e persistem `MovimentacaoCaixa` tipo `VENDA`.
- **Regressão de invariante:** tentar fechar caixa com venda `ABERTA` → 422 `PENDING_SALE_IN_SESSION`.
- Rodar com banco de teste (Docker Compose) + reset entre suites.

---

## 3. Web (Next.js App Router — `apps/frontend/src/modules/caixa`)

### Contexto
PDV web: o operador abre/fecha caixa e registra sangria/suprimento. Consome a API do backend.

### Telas
1. **Status do Caixa** — mostra se há caixa aberto do operador (`GET /caixa/aberto`); CTA "Abrir caixa" ou painel da sessão ativa.
2. **Abrir Caixa** — form `valorAbertura`.
3. **Sessão Ativa** — resumo (esperado/contado/divergência ao fechar), lista de movimentações, ações: sangria, suprimento, fechar.
4. **Fechar Caixa** — form `valorFechamento`; exibe **saldo esperado**, **valor contado** e **divergência** antes de confirmar.

### Forms + schemas (Zod / React Hook Form + `react-number-format`)
**Abrir Caixa**
| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| valorAbertura | decimal | Sim | ≥ 0 |

**Fechar Caixa**
| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| valorFechamento | decimal | Sim | ≥ 0 (valor contado na gaveta) |

**Sangria / Suprimento**
| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| valor | decimal | Sim | > 0 |
| observacao | texto | Sim | motivo da retirada/reforço |

### Requisitos
- Campos monetários com `NumericFormat` via `Controller`.
- Tela de fechar exibe a divergência calculada (esperado vs. contado) em tempo real antes de submeter.
- Tratar erros da API por código:
  - `CASH_SESSION_ALREADY_OPEN` → bloquear "Abrir" e mostrar sessão ativa.
  - `PENDING_SALE_IN_SESSION` → bloquear fechamento com aviso "há venda aberta".
- Esconder/desabilitar ações conforme permissão do operador.

### Critérios de aceite
- Operador sem caixa aberto vê só "Abrir caixa"; com caixa aberto vê a sessão.
- Fechar mostra esperado, contado e divergência antes do confirm.
- Sangria/suprimento exigem `valor > 0` e `observacao` preenchida.

### Testes web
- Schemas Zod: `valorAbertura ≥ 0`, `valorFechamento ≥ 0`, `valor > 0`, `observacao` obrigatória.
- Render condicional: sem caixa → "Abrir"; com caixa → sessão ativa.
- Mapeamento de erro da API (códigos → mensagem/UI bloqueada).

---

## 4. Mobile (Flutter — Clean Architecture / DDD / MVVM)

> Camadas: `domain` (contratos + use cases), `data` (repos + DTOs + datasource HTTP),
> `ui` (Cubit/ViewModel + views), `app` (DI get_it + rotas), `core` (HTTP/storage).

### Domain (`lib/domain`)
- Entidades `SessaoCaixa`, `MovimentacaoCaixa` (espelham o domínio do backend).
- Contratos: `CaixaRepository` (Future<Either<Failure, T>>).
- Use cases: `AbrirCaixa`, `FecharCaixa`, `RegistrarSangria`, `RegistrarSuprimento`, `ObterCaixaAberto`, `ObterResumoSessao`, `ListarMovimentacoes`.
- `Failure` por código: `CashSessionAlreadyOpen`, `CashSessionNotFound`, `CashSessionAlreadyClosed`, `PendingSaleInSession`.

### Data (`lib/data`)
- `CaixaRepositoryImpl` + `CaixaRemoteDataSource` (chama a API do backend).
- DTOs/mappers para abrir, fechar, sangria, suprimento, resumo e movimentações.
- Mapeia erro HTTP/código do backend → `Exception` → `Failure`.

### UI (`lib/ui` — MVVM/Cubit)
- **CaixaStatusView** — verifica caixa aberto do operador.
- **AbrirCaixaView** — form `valorAbertura` (≥ 0).
- **SessaoAtivaView** — resumo + lista de movimentações + ações (sangria, suprimento, fechar).
- **FecharCaixaView** — `valorFechamento` (≥ 0); exibe esperado, contado e divergência.
- **Sangria/Suprimento (sheet/dialog)** — `valor` (> 0) + `observacao` (obrigatória).
- ViewModels sem import de Flutter; `BlocBuilder` com bloc explícito; `AppToast` para feedback; confirmação ao fechar caixa.

### App (`lib/app`)
- Registrar repositório, datasource e use cases no get_it.
- Rotas (GoRouter) com guard de operador autenticado.

### Critérios de aceite
- Mesmas invariantes e códigos de erro do backend tratados como `Failure` e refletidos na UI.
- Fechar caixa mostra esperado/contado/divergência antes do confirm.
- Formulários validam `≥ 0` (abertura/fechamento) e `> 0` + observação (sangria/suprimento).

### Testes mobile (`flutter-testing`)
- **Domain:** use cases com repositório fake — caminho feliz + cada `Failure`.
- **Data:** `CaixaRepositoryImpl` mapeia erro HTTP → `Failure`; mappers DTO ↔ entidade.
- **UI (Cubit + widget):** estados de loading/sucesso/erro; fechar exibe divergência;
  validação de formulários; confirmação ao fechar.
- mocktail + bloc_test; `pumpApp` com l10n; sem testes flaky.

---

## Mapa de dependências
- `caixa` → **nenhuma dependência direta**.
- `vendas` → `caixa` via `CaixaGateway`:
  - lê caixa aberto do operador;
  - registra movimento `VENDA` ao finalizar a venda (RF-CX-05).
- Fórmula de saldo (compartilhada por backend/web/mobile):
  `esperado = abertura + suprimentos + vendas_em_dinheiro − sangrias`
