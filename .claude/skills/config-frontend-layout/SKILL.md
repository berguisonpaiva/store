---
name: config-frontend-layout
description: >-
  Instala e documenta o layout/navegação do frontend Next.js (App Router) do monorepo,
  deixando o usuário ESCOLHER entre dois layouts ao chamar: "simple" (menu único shadcn
  sidebar-07, dashboard aberto, dark-only, sem auth) ou "modules" (shell de 3 colunas com
  rail de módulos, multi-módulo, NextAuth + guard por módulo/alias de permissão). Use SEMPRE
  que o pedido envolver: montar/bootstrap da estrutura base (components/, lib/, hooks/) ou do shell do
  frontend; escolher ou trocar o layout/menu/sidebar; configurar navegação, rotas
  public/private ou grupo (modules); adicionar/alterar/remover rota, menu, módulo ou item da
  sidebar; entender o título do header, o módulo ativo, ou por que um item some por perfil;
  mapear `domain` da API → módulo do front; ou aplicar shadcn/ui, tema dark e tokens no app.
  Ative mesmo sem a palavra "layout" — "criar tela X", "novo menu", "esconder item por
  permissão", "rota do estoque", "setup do frontend", "instalar a sidebar" se encaixam aqui.
tools: Read, Glob, Grep, Bash, Write, Edit, AskUserQuestion
---

# config-frontend-layout

Skill única que instala (e documenta) o layout do frontend. Ao ser chamada, o usuário
**escolhe qual layout** aplicar. São dois, deliberadamente diferentes:

| Layout      | Shell                                                     | Navegação                                            | Auth                             | Tema       | Quando usar                                             |
| ----------- | --------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- | ---------- | ------------------------------------------------------- |
| **simple**  | Sidebar única (shadcn `sidebar-07`)                       | Menu único, definido no `layout.tsx`                 | Nenhuma (dashboard aberto)       | Dark-only  | App interno/admin simples, sem controle de acesso       |
| **modules** | 3 colunas: rail de módulos + sidebar do módulo + conteúdo | Multi-módulo (`navigation.tsx`), filtrado por sessão | NextAuth v5 + guard (`proxy.ts`) | Light/dark | App com múltiplos módulos e acesso por módulo/permissão |

> **Não são "skins" do mesmo app.** O `simple` é auto-suficiente e sem backend de auth.
> O `modules` é um esqueleto autenticado que **assume um backend com auth JWT** (endpoints
> `/api/auth/login`, `/refresh`, `/logout`, `GET /api/auth/profile`). Escolha pelo que o
> projeto precisa, não pela estética.

## Fluxo

### 1. Descobrir qual layout aplicar

Se o usuário já disse qual quer ("simples", "módulos", "com login", "multi-módulo",
"sem auth"…), use isso. Se **não** ficou claro, **pergunte** com `AskUserQuestion`:

- **simple** — menu único, dashboard aberto, sem login. Mais leve.
- **modules** — 3 colunas, rail de módulos, login NextAuth e acesso por permissão. Exige backend de auth.

Não adivinhe quando o controle de acesso muda o resultado: instalar `modules` num projeto
sem backend de auth deixa o app sem conseguir logar; instalar `simple` num projeto que
precisa de múltiplos módulos e permissões joga fora a estrutura certa.

### 2. Aplicar (determinístico)

A partir da **raiz do monorepo**, rode o instalador com o layout escolhido:

```bash
# Autodetecta o único app Next.js em apps/
node .claude/skills/config-frontend-layout/scripts/apply.mjs --layout=simple
node .claude/skills/config-frontend-layout/scripts/apply.mjs --layout=modules

# Ou informe o app de destino (web, frontend, ou outro nome em apps/)
node .claude/skills/config-frontend-layout/scripts/apply.mjs --layout=modules --app=web
```

O script é idempotente e resolve sozinho:

- **App de destino** — nome explícito via `--app=`; senão autodetecta o único app Next.js
  em `apps/`. Se houver 0 ou >1 candidato, ele falha listando as opções — nesse caso
  **pergunte** ao usuário qual app e re-execute com `--app=<nome>`. Suporta layout com ou
  sem `src/`.
- **Package manager** — detecta Bun/pnpm/yarn/npm pelo `packageManager`/lockfile. Não assume `npm`.
- **Dependências, tokens de tema e rotas** do layout escolhido.
- **Marca** — patcha o nome do app (derivado do `package.json > name`) nos pontos de marca.

Se rodar sem `--layout`, o script imprime as duas opções e sai com código 2 — isso é
proposital para te lembrar de escolher (ou perguntar ao usuário).

### 3. Pós-setup e edições

Depois de aplicar, **a navegação e as rotas viram código do projeto** — edite no app, não
nos assets da skill. Para entender onde mexer (adicionar rota/menu/módulo, regras de acesso,
título do header, tema), leia a referência do layout aplicado:

- Layout **simple** → [`references/simple.md`](references/simple.md)
- Layout **modules** → [`references/modules.md`](references/modules.md)

Essas referências também respondem perguntas de manutenção ("por que esse item some por
perfil?", "onde mora a navegação?", "mapear `domain` da API → módulo") **sem** precisar
reinstalar nada. Se o pedido for só de manutenção/dúvida, vá direto à referência certa.

## Antes de aplicar: shadcn/ui atualizado

O layout **simple** usa o modelo oficial `sidebar-07` do shadcn/ui via CLI. Antes de aplicar
ou alterar esse fluxo, confirme no Context7 a forma atual de `shadcn@latest add sidebar-07` e
os tokens de tema (`globals.css`, `@theme inline`, `--sidebar-*`). Se a doc divergir, siga o
Context7 e reflita no relatório. O layout **modules** já traz os primitives `ui/` embarcados
(não roda `shadcn add`), então não depende dessa etapa para instalar.

## O que cada layout instala (resumo)

**simple** (assets em `assets/simple/`) — estrutura padrão Next.js (`components/`, `lib/`, `hooks/`):

- `components/`, `lib/`, `hooks/` — apresentação + utilitários (sem navegação; sem umbrella `shared/`).
- `app/` — `/` (landing), `(public)/join`, `(private)/layout` + `(private)/dashboard` (aberto).
- `globals.css` dark-only + `<html className="dark">`; `components.json` com aliases `@/components/...` (defaults shadcn).
- Roda `shadcn@latest add sidebar-07`.

**modules** (assets em `assets/modules/`):

- `src/` completo: shell (`components/app-shell`, `app-sidebar`, `site-header`, `nav-*`,
  `logo`, `session-*`, `theme-provider`, `module-menu-page`), navegação (`lib/navigation`,
  `navigation-access`, `auth-mappings`), auth/sessão/http (`lib/auth*`, `http/`, `actions/`,
  `schemas/`, `proxy.ts`), e rotas `(auth)/login` + `(modules)/{home,perfil,...}`.
- 4 módulos (`catalog`, `inventory`, `sales`, `settings`) com **dashboards iniciais vazios** —
  sem telas de negócio. Adicione itens em `lib/navigation.tsx` e crie as páginas.
- `.env.example` (`NEXT_PUBLIC_SERVER_URL`, `AUTH_SECRET`) e `components.json` com aliases `@/components/...`.

## Regras

- **Uma skill, dois layouts** — sempre selecione `--layout` (pergunte se não estiver claro).
- **Navegação é código do projeto** — depois de instalado, edita-se no app (layout/`navigation.tsx`),
  nunca nos assets da skill. Não recrie navegação dentro de `components/`.
- **Confirme antes de sobrescrever** — `apply.mjs` sobrescreve arquivos do destino (rotas,
  `components/`/`lib/`/`hooks/`/`src/`). Avise e confirme se o app já tiver layout instalado.
- **`modules` exige backend de auth** — não instale `modules` sem um backend JWT compatível;
  nesse caso prefira `simple` ou alinhe o backend primeiro.
- **Package manager detectado** — nunca assuma `npm`.
- **Assets embarcados são a fonte** — use sempre `.claude/skills/config-frontend-layout/assets/`.
