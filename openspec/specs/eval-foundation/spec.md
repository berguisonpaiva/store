# eval-foundation Specification

## Purpose

Define the evals base maintained with the `config-project` standard so the bootstrap can be validated as a product, owned by the skill rather than scaffolded into generated application workspaces.

## Requirements

### Requirement: Evals base maintained with the bootstrap standard

The `config-project` standard SHALL maintain an evals base (prompts and objective checks) so the bootstrap can be validated as a product. In this repository the evals base lives with the skill at `.claude/skills/config-project/evals/evals.json` and is NOT scaffolded into the generated application workspace.

#### Scenario: Evals base exists with the standard

- **WHEN** the bootstrap standard is installed
- **THEN** an `evals/evals.json` exists under `.claude/skills/config-project/` describing bootstrap evals (empty-repo bootstrap, idempotent re-run, backend Fastify/docs/`/api`, frontend Server Actions/`nuqs`/Zustand usage)

#### Scenario: No stray project-level evals directory

- **WHEN** the bootstrap completes in the application workspace
- **THEN** no project-level `evals/` directory is created in the generated app (evals are owned by the standard, not each generated project)
