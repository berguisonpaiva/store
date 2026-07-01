---
name: backend-controller
description: 'Criar, revisar ou orientar controllers HTTP do backend NestJS no padrão Genérico com Fastify e documentação OpenAPI. Usar quando o pedido envolver arquivos `*.controller.ts`, definição de rotas e verbos HTTP, aplicação de guards/permissões, binding de `@Body/@Param/@Query`, uploads multipart, decorators Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`), orquestração de use cases e mapeamento de falhas para exceções HTTP (`BadRequestException`, `NotFoundException`, etc.).'
---

# Backend Controller

## Overview

Aplicar o padrão de controller como camada de entrada HTTP: receber request, validar parâmetros básicos, chamar use case e traduzir `Result` para resposta/exceção HTTP.

## Guidelines

- Controller não implementa regra de domínio; delega para use case/query/repository conforme o fluxo existente.
- Definir rota e verbo com decorators (`@Get`, `@Post`, `@Patch`, `@Delete`).
- Documentar endpoints com Swagger/OpenAPI (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, `@ApiConsumes` para multipart) porque a API é publicada em Scalar `/docs` e Swagger `/swagger`.
- Usar `@UseGuards(JwtAuthGuard, RequirePermissionGuard)` e `@RequirePermission(...)` quando endpoint protegido.
- Extrair input com `@Body`, `@Param`, `@Query`; normalizar tipos quando necessário (ex.: `Number(...)`, boolean por string).
- Mapear falhas de `Result` para exceção HTTP adequada.
- Retornar payload esperado pelo contrato; para operações sem corpo, retornar `void` com `@HttpCode(204|201)` quando aplicável.
- Seguir nomenclatura global: arquivos `*.controller.ts`, pastas em kebab-case e nomes em minúsculo.

## Workflow

1. Definir rota base (`@Controller('...')`) e segurança global por controller (quando fizer sentido).
2. Criar método por endpoint com decorators HTTP e permissões.
3. Adicionar decorators Swagger suficientes para que Scalar/Swagger descrevam operação, auth, status e payload.
4. Instanciar/chamar use case com dependências injetadas no controller.
5. Tratar `result.isFailure` e lançar exceção HTTP coerente.
6. Retornar `result.instance` ou `void` conforme contrato.
7. Revisar consistência de status code, formato de erro e documentação gerada.

## References

Consultar `references/controller-pattern.md` para exemplos reais, checklist e armadilhas.
Consultar `../skills-standards.md` para convenção global de nomenclatura.

## Global Standards

- Consultar `../skills-standards.md` para padroes globais de nomenclatura e convencoes gerais entre skills.
