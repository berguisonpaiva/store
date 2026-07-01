# Referência — Layout "simple"

Shell de sidebar única (shadcn `sidebar-07`), dashboard aberto (sem guard de auth), tema
dark-only. A estrutura segue o **padrão do Next.js**: código compartilhado nas pastas
convencionais `components/`, `lib/` e `hooks/` (sem umbrella `shared/`), nomes de arquivo
sem sufixos Angular (`.component`/`.hook`/`.util`). Após instalar, estes arquivos vivem no
app (`<srcRoot>/...`, onde `srcRoot` é `src/` ou a raiz do app). O código é a fonte de
verdade — confirme nos arquivos antes de afirmar algo.

## Princípios

- **Layout server, casca client.** O `app/(private)/layout.tsx` é um **Server Component** (sem
  `"use client"`) que apenas delega para `app/(private)/private-shell.tsx` — a casca client
  onde mora a interatividade (Context do `SidebarProvider`, `onLogout`, navegação). Isso
  separa client de server: o `children` é repassado como **slot**, então páginas server
  aninhadas continuam server (o `"use client"` da casca não as contamina), e o layout pode
  fazer trabalho de servidor (ler sessão e injetar o usuário) antes de renderizar.
- **Navegação é estado da aplicação.** Os itens de menu são definidos em
  `app/(private)/private-shell.tsx` (`NAVIGATION_SECTIONS`), **não** em `components/`.
  Para mudar o menu, edita-se a casca.
- **Menu único.** Uma só área de navegação (sem rail de módulos / sem menu duplo). Todos os
  itens ficam em `sections` passados ao `SidebarMenu`.
- **Dashboard aberto.** O grupo `(private)` usa o `AdminShell`, mas **sem** guard de auth — as
  rotas privadas são acessíveis diretamente. Para proteger, adicione um guard ao layout.
- **Dark-only.** `app/globals.css` é sobrescrito com tokens shadcn/Tailwind v4 em modo escuro
  fixo, e o `<html>` recebe a classe `dark`. Sem `prefers-color-scheme`.

## Estrutura (padrão Next.js)

```
<srcRoot>/
  app/                      # roteamento (App Router)
    (private)/              # grupo de rotas privadas (não afeta a URL)
    (public)/               # grupo de rotas públicas
    globals.css · page.tsx
  components/
    ui/                     # primitives shadcn/ui + componentes de apresentação
    form/                   # validador de formulário
    branding/               # app-logo
    layout/                 # admin-shell · app-shell · public-boxed-layout
  hooks/                    # use-local-storage, …
  lib/                      # utils (cn) · color · constants · i18n/
```

Sem umbrella `shared/` e sem barrel raiz: importa-se direto pelo alias `@/` (ex.
`@/components/ui/button`, `@/lib/utils`, `@/hooks/use-local-storage`), os aliases padrão do
shadcn/ui.

## Arquivos-fonte (onde mexer)

| Responsabilidade                        | Arquivo                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| Layout (Server Component, lê sessão)    | `app/(private)/layout.tsx`                                |
| Casca client (sidebar + interatividade) | `app/(private)/private-shell.tsx`                         |
| Navegação (itens do menu único)         | `app/(private)/private-shell.tsx` → `NAVIGATION_SECTIONS` |
| Logout (Server Action)                  | `app/(private)/actions.ts` → `logoutAction`               |
| Shell admin (sidebar + header)          | `components/layout/` + `components/ui/sidebar*`           |
| Layout public (Server Component)        | `app/(public)/layout.tsx`                                 |
| Casca client public (usePathname)       | `app/(public)/public-shell.tsx`                           |
| Apresentação + utilitários              | `components/`, `hooks/`, `lib/`                           |
| Tokens de tema (dark-only)              | `app/globals.css`                                         |
| Landing                                 | `app/page.tsx`                                            |
| Auth de exemplo (sem form real)         | `app/(public)/join/page.tsx`                              |
| Dashboard aberto                        | `app/(private)/dashboard/page.tsx`                        |

`components/`, `hooks/` e `lib/` contêm **apenas** apresentação e utilitários — nenhuma
navegação.

## Rotas instaladas

```
/             → app/page.tsx                       (landing com hero → /join e /dashboard)
/join         → app/(public)/join/page.tsx         (tela de auth de exemplo, sem form real)
/dashboard    → app/(private)/dashboard/page.tsx   (dashboard aberto dentro do AdminShell)
```

## Editar a navegação

Adicione/edite entradas em `NAVIGATION_SECTIONS` dentro de
`app/(private)/private-shell.tsx` e crie a página correspondente em
`app/(private)/<rota>/page.tsx`. Como é menu único, não há módulos nem filtro por permissão —
todos os itens aparecem.

## Logout (Server Action)

O logout é uma **Server Action** em `app/(private)/actions.ts` (`logoutAction`), e a casca
client (`private-shell.tsx`) a liga ao shell via `onLogout={() => logoutAction()}` (o wrapper
evita repassar o evento do clique como argumento à action). Concentrar o efeito numa Server
Action — em vez de um `router.push` no client — deixa o ponto de saída único e pronto para
auth.

Sem backend de auth (caso do `simple`), a action apenas redireciona para a landing. Ao
adicionar NextAuth, troque o corpo por `signOut` (que já cuida do redirect):

```ts
'use server';
import { signOut } from '@/lib/auth';

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
```

## Toaster (mensagens de erro/sucesso)

O `<Toaster />` (sonner) é montado no root layout (`app/layout.tsx`) na instalação. É o
canal padrão para **erros de submissão** de formulários: a action retorna o resultado e o
componente client chama `toast.error(mensagem)` — erros de **campo** (validação) continuam
inline ao lado do input. Detalhes e exemplos na skill `frontend-form-schema`.

## shadcn/ui e tokens

- `components.json` aponta os aliases para os defaults do shadcn (`@/components`,
  `@/components/ui`, `@/lib`, `@/hooks`, `@/lib/utils`).
- A instalação roda `shadcn@latest add sidebar-07` com o runner do package manager detectado.
  Os primitives embarcados são copiados **depois** do `shadcn add`, então prevalecem.
- Templates novos usam **tokens semânticos** (`bg-background`, `bg-card`,
  `text-muted-foreground`, `border-border`, `bg-sidebar`, …) em vez de cores cruas.

## Próximos passos típicos

1. Editar `NAVIGATION_SECTIONS` (em `app/(private)/private-shell.tsx`) para os menus reais.
2. Implementar o formulário real em `app/(public)/join/page.tsx`.
3. (Opcional) Adicionar guard de auth se as rotas privadas precisarem de proteção — este
   layout não traz `RouteGuard` por padrão. Se o projeto exige multi-módulo + acesso por
   permissão, considere reinstalar com `--layout=modules`.
4. (Opcional) Ajustar as cores de marca nos tokens de `app/globals.css`.
