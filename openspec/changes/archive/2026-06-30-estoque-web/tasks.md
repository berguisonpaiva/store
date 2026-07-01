> Frontend-only (`apps/web`, layout simple + NextAuth). Leituras no servidor com Bearer; mutações via Server Actions. **Usar as skills `config-new-module`, `config-frontend-layout`, `frontend-form-schema`.** Sem deleção (ledger imutável; correção via Ajuste de Saldo). Consultar docs do Next 16 in-repo antes de codar.

## 1. Pré-requisitos

- [x] 1.1 Confirmar `estoque-backend` acessível em `NEXT_PUBLIC_API_URL` e `web-auth` aplicado (`lib/http`, sessão)
- [x] 1.2 Criar `src/modules/estoque/` (pastas `components`, `data`, `schemas`)
- [x] 1.3 Reutilizar o componente/padrão de busca de variação por SKU/nome estabelecido pelo catalog-web (combobox de lookup → `variacaoId`)

## 2. Data layer — skill `frontend-form-schema`

- [x] 2.1 Leituras (server) com `apiJson`: `consultarSaldo(variacaoId)`, `listarMovimentacoes(params)`, `listarAbaixoDoMinimo()`
- [x] 2.2 Server Actions (mutações) com `apiFetch`: `registrarEntrada`, `registrarSaida`, `ajustarSaldo` (endpoints `/api/inventory/entrada|saida|ajuste`)
- [x] 2.3 Mapear erros do backend → campo/toast: 409 `ESTOQUE_INSUFICIENTE` (quantidade), 404 `VARIACAO_NAO_ENCONTRADA` (variação), 400 `QUANTIDADE_INVALIDA`; `revalidatePath` do saldo/movimentações no sucesso
- [x] 2.4 Schemas Zod (`*.schema.ts`) + `zodResolver`: entrada (`quantidade > 0`, motivo COMPRA/DEVOLUCAO/AJUSTE), saída (`quantidade > 0` e `≤ saldo`, motivo PERDA/AJUSTE), ajuste (`novoSaldo ≥ 0`, `observacao` obrigatória)

## 3. Rotas e navegação — skill `config-frontend-layout`

- [x] 3.1 Rotas de operação em `(private)/inventory/`: `entrada/page.tsx`, `saida/page.tsx`, `ajuste/page.tsx`
- [x] 3.2 Rotas de leitura em `(private)/inventory/`: `saldo/page.tsx`, `movimentacoes/page.tsx`, `abaixo-do-minimo/page.tsx`
- [x] 3.3 Registrar a seção/itens “Estoque” em `NAVIGATION_SECTIONS` (não destrutivo)

## 4. Operações de estoque — skills `config-new-module` / `frontend-form-schema`

- [x] 4.1 Form Entrada de Estoque (RHF): lookup de variação, `quantidade > 0`, select `motivo`, `observacao` opcional; validação inline; submit via Server Action; toast de sucesso (RF-EST-01)
- [x] 4.2 Form Saída Manual (RHF): lookup de variação, `quantidade > 0` e `≤ saldo`, select `motivo` PERDA/AJUSTE, `observacao` opcional; 409 `ESTOQUE_INSUFICIENTE` no campo quantidade (RF-EST-02, RF-EST-05)
- [x] 4.3 Form Ajuste de Saldo (RHF): lookup de variação, `novoSaldo ≥ 0`, `observacao` obrigatória (justificativa); submit via Server Action (RF-EST-04)
- [x] 4.4 404 `VARIACAO_NAO_ENCONTRADA` no campo de variação; erros de submissão via toast; sem controle de delete

## 5. Telas de consulta — skills `config-new-module` / `frontend-form-schema`

- [x] 5.1 Consultar saldo: lookup de variação → exibir `saldoAtual` e `saldoDisponivel`; estado vazio/404 (RF-EST-06)
- [x] 5.2 Histórico de movimentações: filtro por variação/período + paginação via `nuqs`; estado vazio (RF-EST-07)
- [x] 5.3 Lista abaixo do mínimo: variações abaixo de `estoqueMinimo` com saldo atual; estado vazio (RF-EST-08)

## 6. Verificação — skill `verify`

- [x] 6.1 `next build` verde, sem erro de tipos (rotas de inventory geradas)
- [x] 6.2 Com backend + Postgres reais: sessão NextAuth, leituras server-side com Bearer renderizam saldo/movimentações/abaixo-do-mínimo; mutações (Server Actions) apontam para `/api/inventory/*` (entrada/saída/ajuste), com 409/404/400 mapeados
- [x] 6.3 Acesso sem sessão → redireciona para `/join`; seção/itens “Estoque” registrados em `NAVIGATION_SECTIONS`
- [x] 6.4 Sem deleção na UI; leituras via `apiJson`/`apiFetch` (Bearer da sessão)
