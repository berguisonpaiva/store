> Frontend-only (`apps/web`), layout "simple" + NextAuth v5. O backend é a autoridade de credenciais; o web só gerencia sessão/cookie e ciclo de token. **Usar as skills `config-frontend-layout` (simple) e `frontend-form-schema`** (adaptada ao validador custom do projeto). Antes de codar NextAuth, conferir compatibilidade com Next 16/React 19 via `node_modules/next/dist/docs/` e Context7 (ver `apps/web/AGENTS.md`).

## 1. Dependências e env

- [x] 1.1 Confirmar versão compatível de `next-auth` (v5/beta) com Next 16.2.9 + React 19 via Context7 / docs in-repo e instalar
- [x] 1.2 Adicionar util de decode de JWT (`jose`)
- [x] 1.3 Adicionar `AUTH_SECRET` (e `AUTH_URL` se necessário) em `.env` e `.env.example`; manter `NEXT_PUBLIC_API_URL`

## 2. Configuração NextAuth — skill `config-frontend-layout`

- [x] 2.1 `src/lib/auth.ts`: `NextAuth({...})` exportando `handlers`, `auth`, `signIn`, `signOut`, com session strategy `jwt`
- [x] 2.2 Credentials provider `authorize`: `POST ${NEXT_PUBLIC_API_URL}/api/auth/login` → tokens; decodificar access token (`jose`) para `{ id, name, email, role }`; retornar `null` em 401/403
- [x] 2.3 Callback `jwt`: armazenar `accessToken`, `refreshToken`, `accessTokenExpires` e dados do usuário; refresh via `POST /api/auth/refresh` quando expirado; setar `error` em falha
- [x] 2.4 Callback `session`: expor `user` (com `role`), `accessToken` e `error`
- [x] 2.5 `src/app/api/auth/[...nextauth]/route.ts` reexportando `handlers`
- [x] 2.6 Tipagem: estender os tipos de `next-auth` (`Session`/`JWT`) para incluir `role`, `accessToken`, `error`

## 3. Proteção de rotas — skill `config-frontend-layout`

- [x] 3.1 `src/middleware.ts` com `auth`: sem sessão em `(private)` → `/join`; com sessão em `/join` → `/dashboard`; configurar `matcher`
- [x] 3.2 `(private)/layout.tsx`: ler sessão com `auth()`, `redirect('/join')` se ausente, injetar `userName`/`userEmail` reais no `PrivateShell`
- [x] 3.3 `(private)/actions.ts`: `logoutAction` → `signOut({ redirectTo: '/' })`

## 4. Form de login em /join — skill `frontend-form-schema`

- [x] 4.1 Reescrever `(public)/join/page.tsx` como form de login (email + senha) com React Hook Form + validador custom do projeto (`src/components/form/validator`)
- [x] 4.2 Server Action `loginAction` envolvendo `signIn('credentials', { email, password, redirectTo: '/dashboard' })`
- [x] 4.3 Erros de campo inline (obrigatório/formato de email); erro de submissão (credenciais inválidas) via `toast.error(...)` genérico (sem `setError('root')`)
- [x] 4.4 Estados de loading/disabled no submit; usar componentes shadcn existentes (`Input`, `Button`, `Card`)

## 5. Cliente HTTP autenticado

- [x] 5.1 `src/lib/http` (ou `src/lib/api`): wrapper de `fetch` sobre `NEXT_PUBLIC_API_URL` anexando `Authorization: Bearer <accessToken>` lido de `auth()`
- [x] 5.2 Tratar 401 como falha de autenticação (pronto para os data layers de módulos)

## 6. Verificação — skill `verify`

- [x] 6.1 Build do web verde (`next build`) e sem erro de tipos NextAuth
- [ ] 6.2 Com o backend rodando: login com credenciais do seed (MASTER) → redireciona para `/dashboard` e mostra o usuário real
- [ ] 6.3 Credenciais inválidas → toast genérico, permanece em `/join`
- [ ] 6.4 Acesso a `/dashboard` sem sessão → redireciona para `/join`; usuário logado em `/join` → `/dashboard`
- [ ] 6.5 Logout encerra a sessão e bloqueia `(private)` novamente
- [ ] 6.6 Expiração do access token dispara refresh transparente; falha de refresh manda para `/join`
