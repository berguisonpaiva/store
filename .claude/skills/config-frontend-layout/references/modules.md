# Referência — Layout "modules"

Mapa do shell autenticado de 3 colunas e do sistema de navegação multi-módulo. Após instalar,
estes arquivos vivem no app (`<srcRoot>/...`, onde `srcRoot` é `src/` ou a raiz do app,
conforme o projeto). O código é a fonte de verdade — confirme nos arquivos antes de afirmar
algo, porque o projeto pode ter evoluído desde a instalação.

## Arquivos-fonte (onde mexer)

| Responsabilidade                                       | Arquivo                             |
| ------------------------------------------------------ | ----------------------------------- |
| Declaração de módulos, menus e helpers de match        | `lib/navigation.tsx`                |
| Regras de acesso (filtro por módulo + alias)           | `lib/navigation-access.ts`          |
| Mapeamento `domain` da API → id de módulo + alias→CASL | `lib/auth-mappings.ts`              |
| Shell de 3 colunas (rail + sidebar + conteúdo)         | `components/app-shell.tsx`          |
| Sidebar do módulo ativo (menus)                        | `components/app-sidebar.tsx`        |
| Header (título + dropdown de usuário)                  | `components/site-header.tsx`        |
| Layout do grupo autenticado                            | `app/(modules)/layout.tsx`          |
| Guard de rota (proxy)                                  | `proxy.ts`                          |
| Auth (NextAuth v5 + refresh)                           | `lib/auth.ts`, `lib/auth.config.ts` |
| Cliente HTTP (base URL via env)                        | `http/base.ts`, `http/server.ts`    |

As páginas vivem em `app/(modules)/<rota-pt>/page.tsx`; o login em `app/(auth)/login/`.

## Convenções Next.js usadas aqui

- **`src/` + pastas convencionais.** Todo o código vive em `src/{app,components,hooks,http,
lib,schemas,actions,types}`, com nomes de arquivo kebab-case e sem sufixos `.component`/
  `.hook`/`.util` — o padrão recomendado do Next.js.
- **`proxy.ts` é o middleware (Next.js 16).** A partir do Next.js 16 o arquivo `middleware.ts`
  foi **renomeado para `proxy.ts`** (mesmo comportamento; runtime `nodejs`, sem `edge`). Por
  isso o guard mora em `src/proxy.ts` e **não** existe `middleware.ts` — não "conserte"
  recriando `middleware.ts`. (Se algum dia precisar do runtime `edge`, aí sim volte a
  `middleware.ts`.)
- **Private folders `_components/`.** Componentes colocados ao lado de uma rota — não
  roteáveis — ficam em pastas com prefixo `_` (ex.
  `app/(modules)/perfil/trocar-senha-obrigatoria/_components/`). O `_` opta a pasta para fora
  do sistema de rotas e evita conflito com convenções futuras do Next.js.
- **Route groups `(grupo)`.** `(auth)` e `(modules)` agrupam rotas sem afetar a URL.

## Anatomia do shell (3 colunas)

`AppShell` monta três colunas dentro de um `SidebarProvider`:

```
┌──────┬─────────────────┬──────────────────────────┐
│ Col1 │      Col2       │           Col3           │
│ Rail │   AppSidebar    │   SiteHeader + conteúdo  │
│ 60px │  (menu módulo)  │   (título + children)    │
└──────┴─────────────────┴──────────────────────────┘
```

| Coluna                    | O que é                                      | Conteúdo                                                             | Dimensão                                   |
| ------------------------- | -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| **1 — Rail de módulos**   | `<aside>` fora do Sidebar shadcn             | Logo (→ `/home`); um ícone por módulo do perfil; Perfil no rodapé    | `60px` fixo                                |
| **2 — Sidebar do módulo** | `AppSidebar`                                 | Menus (`items`) do **módulo ativo**; renderiza `groups` se existirem | `--sidebar-width: 12rem`, colapsado `3rem` |
| **3 — Conteúdo**          | `SidebarInset` + `SiteHeader` + `{children}` | Header com título + área scrollável                                  | `flex-1`                                   |

Se nenhum módulo casa com a rota, a coluna 2 some e o conteúdo ocupa colunas 2+3.

## Itens fixos (sempre presentes)

Não vêm do array `modules` — são codados no `AppShell`, fora do mapa de navegação, então
`userHasRouteAccess` os libera por padrão.

| Item                       | href                               | Posição         |
| -------------------------- | ---------------------------------- | --------------- |
| Início / Logo              | `/home`                            | topo do rail    |
| Perfil                     | `/perfil`                          | rodapé do rail  |
| Troca de senha obrigatória | `/perfil/trocar-senha-obrigatoria` | rota standalone |

## Módulos (dinâmicos, filtrados por sessão)

São **4**, declarados em `navigation.tsx` como `AppModule[]`. **IDs em inglês** (vêm da API no
campo `domain`); **URLs em português**. Tipos:

```ts
type AppModule = { id; label; icon; items: SubItem[]; groups?: { label; items }[] };
type SubItem = { label; href; icon; title?; requiredPermissionAlias? };
```

O scaffold instala cada módulo **com apenas o item Dashboard** apontando para a raiz:

| Módulo (id) | Label        | Ícone              | Rota raiz       |
| ----------- | ------------ | ------------------ | --------------- |
| `catalog`   | Cadastro     | `FolderOpen`       | `/cadastro`     |
| `inventory` | Estoque      | `Package`          | `/estoque`      |
| `sales`     | Financeiro   | `CircleDollarSign` | `/financeiro`   |
| `settings`  | Configuração | `Settings`         | `/configuracao` |

### Adicionar um item de menu

1. Acrescente um `SubItem` ao array `items` do módulo em `navigation.tsx`, com `label`,
   `href` (PT), `icon` Lucide e `requiredPermissionAlias` (alias da API). Ex.:

   ```ts
   { label: "Categorias", href: "/cadastro/categorias", icon: Tags,
     requiredPermissionAlias: "catalog.category.read" }
   ```

2. Crie a página em `app/(modules)/<rota>/page.tsx`. Sem a página, o item dá 404.
3. **Garanta o alias no backend** — o mesmo alias precisa existir e ser validado lá, senão o
   item nunca aparece (o filtro de acesso o esconde).

### Adicionar um módulo

1. Adicione o `AppModule` em `navigation.tsx`.
2. Registre o `domain` correspondente em `DOMAIN_ALIASES` (`auth-mappings.ts`).
3. Crie o módulo no backend (que gera o `domain` e os aliases de permissão).

## Controle de acesso

`navigation-access.ts` é consultado pela UI (`AppShell`) e pelo middleware (`proxy.ts`), para
que sidebar e guard nunca divirjam:

- **`filterAppModules(modules, session)`** — mantém só módulos cujo `id ∈ session.modules` **e**
  com ≥1 item cujo `requiredPermissionAlias ∈ session.permissionAliases`. Módulo sem item
  visível é ocultado por inteiro.
- **`userHasRouteAccess(pathname, session)`** — exige módulo habilitado + alias da rota. Conta
  `INACTIVE` → bloqueada. Rota fora do mapa de navegação → liberada.
- `requiredPermissionAlias` vazio/ausente ⇒ item depende **só** do módulo.

`auth-mappings.ts` traduz `domain` da API → id de módulo
(`cadastro→catalog`, `estoque→inventory`, `financeiro→sales`, `configuracao→settings`).

## Como módulo/título ativos são resolvidos

- **Módulo ativo**: `findBestMatch(pathname)` — casa pelo `href` de prefixo mais longo.
- **Item ativo na sidebar**: `getLongestActiveHref(pathname, hrefs)`.
- **Título do header**: `getModulePageTitle(moduleId, pathname)` — label do item de href mais
  específico; cai para o `label` do módulo se nada casar.

## Auth e backend

Este layout assume um backend com auth JWT. O fluxo (NextAuth v5 Credentials + refresh):

1. Login em `/login` → `signIn("credentials")` → `POST /api/auth/login` (accessToken + refreshToken).
2. `GET /api/auth/profile` (Bearer) → perfil + `modules` + `permissionAliases` + `status`.
3. JWT callback renova o token antes de expirar (`POST /api/auth/refresh`).
4. Session popula `permissions`, `modules`, `permissionAliases`.
5. `proxy.ts` valida `userHasRouteAccess`; trata `RefreshTokenExpired`, `mustChangePassword`
   e `status=INACTIVE`.

**Env** (veja `.env.example`): `NEXT_PUBLIC_SERVER_URL` (base da API), `AUTH_SECRET`
(assinatura das sessões; fallbacks `NEXTAUTH_SECRET`/`BETTER_AUTH_SECRET`).

A base URL do HTTP vem de `NEXT_PUBLIC_SERVER_URL` (fallback `http://localhost:3333`) em
`http/base.ts` e `http/server.ts`. Não hardcode domínios.

## Checklist ao mexer

A navegação está espalhada de propósito (front + back). Ao adicionar/alterar rota, menu ou
módulo, alinhe os dois lados: item em `navigation.tsx`, página em `app/(modules)/...`, e alias
existente e validado no backend. Não há guard separado a editar — `proxy.ts` já consome
`userHasRouteAccess`, então a rota fica protegida ao entrar no mapa.
