# Flutter CQRS Skills Design

## Goal

Atualizar as skills arquiteturais de Flutter para aplicar a mesma separacao CQRS ja documentada nas skills de modulo: Query para leitura/projecao e Repository para comandos e entidades necessarias a invariantes de escrita.

## Architecture

- Criar uma referencia canonica em `flutter-clean-architecture/references/cqrs-pattern.md`.
- Definir read models de dominio/aplicacao sem comportamento e sem tipos de infraestrutura.
- Definir contratos `*Query` no dominio, implementados em data por adapters de Drift/API.
- Reservar repositories para persistencia de agregados e leituras de entidade exigidas por comandos.
- Manter ViewModels dependentes de use cases; use cases de leitura podem ser finos para estabilizar a fronteira da aplicacao.
- Registrar adapters de query como lazy singletons e use cases como factories.

## Scope

Atualizar `SKILL.md`, checklist e prompt especializado de:

- flutter-clean-architecture
- flutter-feature-workflow
- flutter-domain-layer
- flutter-data-drift-layer
- flutter-app-composition
- flutter-ui-mvvm
- flutter-testing
- flutter-code-review

Skills de release, design system, performance, growth, RevenueCat e core permanecem fora do escopo porque nao definem a fronteira geral entre leitura e escrita.

## Verification

- O baseline deve demonstrar que os contratos CQRS ainda nao aparecem nas skills Flutter.
- A validacao final deve confirmar a referencia canonica, os contratos de Query/Repository, os tipos reativos e one-shot, DI, UI, testes e regras de review.
- Verificar links relativos, frontmatter e ausencia das contradicoes conhecidas.
