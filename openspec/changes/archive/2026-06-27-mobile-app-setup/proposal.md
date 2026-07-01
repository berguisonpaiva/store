## Why

O monorepo `store` já tem web (`apps/web`) e backend (`apps/backend`, NestJS/Fastify com auth JWT em `/api/auth`), mas não tem app mobile. Precisamos de uma base mobile padronizada — um app Flutter com Clean Architecture + DDD + MVVM — antes de qualquer feature de negócio, para que todo trabalho futuro parta de uma estrutura, DI, navegação, tema e integração HTTP/auth conhecidas e testáveis.

## What Changes

- Criar um app **Flutter** em `apps/mobile`, dentro do monorepo mas **fora dos workspaces do Turbo** (toolchain pub/Flutter isolada do Bun).
- Estabelecer o esqueleto **Clean Architecture** em `lib/` com as camadas `app/`, `core/`, `domain/`, `data/`, `ui/` e a direção de dependência apontando para dentro (`ui→domain`, `data→domain`, `data→core`, `app→todas`, `domain→nenhuma`).
- Configurar a **composition root**: bootstrap em `app/`, **injeção de dependência com get_it** (módulos por camada), e **roteamento com GoRouter**.
- Adicionar a base de **UI/MVVM**: `flutter_bloc`/Cubit, ViewModels/States, e um **design system base** (tema Material 3, tokens, dark mode, widgets compartilhados, `AppToast`).
- Adicionar wrappers técnicos de **core**: cliente **HTTP**, logger, storage seguro (tokens), clock — atrás de interfaces.
- Preparar a **integração de auth** com o backend: contrato de auth no `domain` e implementação no `data` consumindo `POST /api/auth/login`, `/refresh`, `/logout` e `GET /api/auth/profile` — **sem telas de login ainda**.
- Estabelecer o padrão de erros **Failure (domain) vs Exception (core/data)** e o uso de **fpdart `Either`** nos contratos.
- Configurar o **harness de testes** (flutter_test, bloc_test, mocktail, `pumpApp`) e helpers base.
- Definir a base de **Drift** (database + 1 DAO de exemplo vazio) para persistência local futura.

Sem telas de negócio: este change entrega apenas a fundação.

## Capabilities

### New Capabilities

- `mobile-project-scaffold`: App Flutter em `apps/mobile` com estrutura Clean Architecture (`app/core/domain/data/ui`) e direção de dependência aplicada.
- `mobile-composition-root`: Bootstrap, DI com get_it por camada e roteamento GoRouter na camada `app/`.
- `mobile-core-infrastructure`: Wrappers técnicos em `core/` (HTTP, logger, secure storage, clock) atrás de interfaces, com hierarquia de Exceptions técnica.
- `mobile-design-system`: Tema Material 3 + tokens, dark mode, widgets compartilhados e `AppToast` na camada `ui/`.
- `mobile-auth-integration`: Contrato de auth no `domain` e repositório no `data` consumindo os endpoints `/api/auth` do `@repo/backend`, com Failure vs Exception e `Either`.
- `mobile-testing-foundation`: Harness de testes (flutter_test, bloc_test, mocktail) com helpers (`pumpApp`, fakes) e exemplos por camada.

### Modified Capabilities

<!-- Nenhuma — não há specs mobile existentes; é uma fundação greenfield. -->

## Impact

- **Arquivos/dirs criados**: `apps/mobile/**` (`pubspec.yaml`, `lib/{app,core,domain,data,ui}/**`, `test/**`, plataformas android/ios), wrappers core, contrato+repo de auth, base Drift, harness de testes.
- **Toolchain**: Flutter/Dart, get_it, go_router, flutter_bloc, fpdart, drift, dio/http, flutter_secure_storage, mocktail, bloc_test.
- **Integração**: consome a API de auth do `apps/backend` (`/api/auth/*`) via `NEXT`-equivalente de config (`API_BASE_URL`).
- **Restrições**: `domain/` livre de Flutter; Exceptions convertidas em Failures na fronteira de repositório; `apps/mobile` fora dos globs de workspace do Turbo.
- **Downstream**: base para todas as features mobile futuras (módulos DDD, telas MVVM, persistência Drift).
