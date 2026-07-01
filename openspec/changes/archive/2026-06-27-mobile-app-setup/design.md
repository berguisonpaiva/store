## Context

O monorepo `store` tem `apps/web` (Next.js) e `apps/backend` (NestJS/Fastify com auth JWT em `/api/auth`). Falta o app mobile. O padrão do projeto para Flutter é Clean Architecture + DDD + MVVM (camadas `app/core/domain/data/ui`, get_it, GoRouter, flutter_bloc/Cubit, fpdart, Drift, design system, Failure vs Exception). Este design registra como montar a **fundação** do app mobile (sem telas de negócio), com wrapper HTTP/auth já apontando para o backend.

Decisões já tomadas com o usuário: app em `apps/mobile` (fora dos workspaces do Turbo), escopo de fundação completa, e preparar a camada HTTP/auth contra `/api/auth` do `@repo/backend`.

## Goals / Non-Goals

**Goals:**

- App Flutter compilável em `apps/mobile` com as 5 camadas e direção de dependência aplicada.
- Composition root funcional: bootstrap + DI (get_it por camada) + GoRouter.
- Core técnico atrás de interfaces (HTTP, logger, secure storage, clock) + hierarquia de Exception.
- Design system base (Material 3, tokens, dark mode, widgets compartilhados, AppToast, l10n).
- Contrato de auth no domain + implementação no data consumindo `/api/auth/*`, com Either e Failure.
- Harness de testes com exemplos passando por camada.

**Non-Goals:**

- Sem telas/feature de login ou qualquer tela de negócio.
- Sem contextos DDD de negócio (definidos em changes futuras por feature).
- Sem CI/CD, publicação em store, ou assinaturas/RevenueCat.
- Sem incluir o app nos workspaces do Turbo nem orquestrar Flutter pelo Bun/turbo.

## Decisions

### Decision: `apps/mobile` fora dos workspaces do Turbo

O Flutter usa pub e não tem `package.json` compatível; mantê-lo fora dos globs (`apps/*` do Turbo) evita que `turbo run build/test` tente gerenciá-lo.

- **Por quê**: toolchains independentes; evita falsos erros no pipeline JS.
- **Alternativa considerada**: criar um wrapper `package.json` para integrar no Turbo — rejeitado por acoplar duas toolchains sem ganho real agora.

### Decision: DI manual com get_it em módulos por camada

Registrar dependências em módulos (`core`, `data`, `domain`, `ui`) chamados em ordem no bootstrap.

- **Por quê**: padrão do projeto (flutter-app-composition); previsível e testável.
- **Alternativa considerada**: injectable/codegen — rejeitado para manter DI explícita e simples na fundação.

### Decision: GoRouter na camada `app/`

Roteamento declarativo no composition root, com rota inicial placeholder.

- **Por quê**: padrão do projeto; suporta guards/deep links futuros.

### Decision: fpdart `Either` + Failure (domain) vs Exception (core/data)

Data sources lançam Exception técnica; repositórios convertem em Failure e retornam `Either<Failure, T>`.

- **Por quê**: regra central da arquitetura; UI traduz Failures em mensagens localizadas.

### Decision: HTTP via cliente único configurável

Um cliente HTTP (ex.: dio ou http atrás de interface) com `API_BASE_URL` e injeção de bearer token a partir do secure storage.

- **Por quê**: ponto único para base URL, headers e refresh; mantém `data` sem detalhes de transporte espalhados.

### Decision: Drift como base de persistência local

Database + 1 DAO de exemplo vazio, para padronizar a persistência futura sem criar tabelas de negócio agora.

- **Por quê**: padrão do projeto (flutter-data-drift-layer); evita decisão posterior sobre ORM.

### Decision: Auth preparado sem UI

Entregar contrato (domain) + repositório (data) + persistência de token, mas nenhuma tela.

- **Por quê**: o usuário pediu wrapper HTTP/auth agora; telas viram change de feature depois.

## Risks / Trade-offs

- **Backend de auth ainda não tem endpoints `/api/auth` implementados** (o `config-shared-backend` entregou guard/strategy, não os controllers de login) → o repositório mobile é codificado contra o contrato esperado; testes usam fakes/mocks; integração real fica validável quando os endpoints existirem.
- **Flutter fora do Turbo** significa que `flutter analyze/test` não roda no pipeline JS → documentar comandos próprios; opcionalmente um script auxiliar futuro.
- **Escolha de pacote HTTP (dio vs http)** → seguir o padrão do core do projeto; encapsular atrás de interface para trocar sem afetar `data`.
- **Versões de SDK Flutter/Dart na máquina** → fixar constraints no `pubspec.yaml` e verificar `flutter --version` antes de gerar.
- **Vazamento de Flutter no domain** → CI/local lint e revisão; testes de domínio rodam sem framework.

## Migration Plan

Greenfield; a "migração" é a montagem inicial:

1. Verificar Flutter SDK; criar `apps/mobile` via `flutter create` (org/nome definidos no apply).
2. Adicionar dependências (get_it, go_router, flutter_bloc, fpdart, drift, http client, secure storage, mocktail, bloc_test).
3. Criar as 5 camadas e o composition root (bootstrap + DI + GoRouter).
4. Implementar core (HTTP, logger, storage, clock) + Exceptions.
5. Design system (tema/tokens/dark mode/widgets/AppToast/l10n).
6. Contrato de auth (domain) + repo (data) contra `/api/auth/*` + token storage.
7. Drift base + harness de testes + exemplos por camada.
8. `flutter analyze` e `flutter test` verdes.

Rollback: remover `apps/mobile` (isolado; não afeta web/backend).

## Open Questions

- Org/bundle id do app (ex.: `com.poupig.mobile`) — definir no apply.
- Pacote HTTP preferido (dio vs http) — seguir padrão do core ou confirmar.
- Os endpoints `/api/auth/*` do backend ainda serão implementados em change separada? (impacta teste de integração real).
