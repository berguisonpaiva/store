# Flutter CQRS Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconciliar as skills arquiteturais Flutter com a separacao CQRS adotada pelas skills de modulo.

**Architecture:** Uma referencia canonica define Query, read model, Repository e use cases. Cada skill recebe apenas as regras de sua camada, e checklists/prompts especializados repetem os pontos que precisam ser executados sem depender de interpretacao implicita.

**Tech Stack:** Markdown, Agent Skills, Flutter Clean Architecture, DDD, MVVM, Drift, fpdart.

---

### Task 1: Establish the failing CQRS baseline

**Files:**
- Test: verificacao PowerShell executada contra `.claude/skills/flutter-*`

- [ ] Executar assercoes para referencia canonica, Query/Repository, read models, DI, UI e testes.
- [ ] Confirmar falha causada pela ausencia do novo contrato.

### Task 2: Add the canonical Flutter CQRS reference

**Files:**
- Create: `.claude/skills/flutter-clean-architecture/references/cqrs-pattern.md`
- Modify: `.claude/skills/flutter-clean-architecture/SKILL.md`
- Modify: `.claude/skills/flutter-clean-architecture/references/review-checklist.md`
- Modify: `.claude/skills/flutter-clean-architecture/agents/architecture-specialist.md`

- [ ] Documentar classificacao de operacoes, contratos, tipos de retorno, data flow e armadilhas.
- [ ] Integrar a referencia na skill guarda-chuva, checklist e especialista.

### Task 3: Apply CQRS to feature, domain and data skills

**Files:**
- Modify: `.claude/skills/flutter-feature-workflow/**`
- Modify: `.claude/skills/flutter-domain-layer/**`
- Modify: `.claude/skills/flutter-data-drift-layer/**`

- [ ] Planejar queries/read models separadamente dos repositories.
- [ ] Permitir use cases de leitura finos como fronteira estavel.
- [ ] Implementar adapters de query em data sem reconstruir entidades desnecessariamente.

### Task 4: Apply CQRS to app, UI, testing and review skills

**Files:**
- Modify: `.claude/skills/flutter-app-composition/**`
- Modify: `.claude/skills/flutter-ui-mvvm/**`
- Modify: `.claude/skills/flutter-testing/**`
- Modify: `.claude/skills/flutter-code-review/**`

- [ ] Documentar registro DI de queries e use cases.
- [ ] Manter ViewModels na fronteira de use cases.
- [ ] Separar fakes/testes de Query e Repository.
- [ ] Adicionar findings para mistura leitura/escrita.

### Task 5: Verify the completed skill set

**Files:**
- Test: verificacao PowerShell executada contra todos os arquivos alterados

- [ ] Reexecutar as assercoes CQRS e confirmar sucesso.
- [ ] Verificar links Markdown, frontmatter, diff e whitespace.
- [ ] Revisar o escopo final contra este plano e o design aprovado.
