---
name: frontend-form-schema
description: 'Criar, revisar ou orientar forms frontend e schemas de validação no padrão Genérico Web/Next.js App Router. Usar quando o pedido envolver componentes de formulário React Hook Form, Server Actions para mutações simples, schemas de validação com Zod (`*.schema.ts`), tipagem com `z.infer`, resolver via `zodResolver` (`@hookform/resolvers/zod`), campos opcionais/refinamentos/arrays, campos monetários/numéricos e mascarados com `react-number-format` (`NumericFormat`/`PatternFormat`) via `Controller`, selects com busca/autocomplete usando `@headlessui/react` (`Combobox`) via `Controller`, query string com `nuqs` para busca/filtros e integração de erro com componentes de form compartilhados.'
---

# Frontend Form Schema

## Next.js App Router baseline

- Preferir Server Actions para submissões simples de create/update/delete quando a mutação pertence à rota e não exige cliente complexo.
- Manter validação compartilhada no schema (`*.schema.ts`) e reutilizar tipos derivados por `z.infer`.
- Para listagens com busca, filtros, paginação, ordenação ou abas, usar URL state como fonte de verdade.
- Usar `nuqs` para parsing tipado, defaults e serialização dos search params.
- Usar Zustand apenas quando o formulário ou fluxo tiver estado client-only compartilhado que não deve ir para a URL nem para o servidor.
- Não colocar `"use client"` em arquivos que só exportam schema, tipos, Server Actions ou funções server-side.

## Listas e tabelas (padrão)

Padrão único para telas de listagem com filtros + tabela:

- **Filtros sempre via `nuqs`** (URL state como fonte de verdade). Cada filtro é um `useQueryState` tipado (`parseAsString`/`parseAsInteger`/`parseAsBoolean`) com defaults.
  - Filtro que o **backend** resolve (paginação, status, categoria, busca server-side) usa `.withOptions({ shallow: false })` para disparar refetch do Server Component; a página (server) lê `searchParams` (Promise no App Router) e repassa ao data layer.
  - Filtro resolvido no **client** (ex.: busca por nome sobre a lista já carregada) usa `nuqs` com `shallow: true` (default) e filtra em memória.
  - Ao alterar um filtro, resetar `page` para 1.
- **Tabelas sempre com TanStack Table** (`@tanstack/react-table`, headless) através do componente compartilhado `components/ui/data-table.tsx`, que combina o TanStack com os primitives shadcn (`Table`/`TableRow`/...). Colunas declaradas como `ColumnDef<T>[]` em `useMemo`; paginação/filtros ficam **externos** (URL state), então passar para o `DataTable` apenas as linhas já filtradas/paginadas (modo manual). Alinhamento por coluna via `meta.headClassName`/`meta.cellClassName`.
- **Ações de linha minimalistas**: apenas ícones (`Button variant="ghost" size="icon"` + `aria-label`/`title`). Padrão: **Editar** (`Pencil`) e **Excluir** (`Trash2`).
- **Sem hard delete quando o domínio preserva histórico**: a lixeira faz **soft delete = desativar** (`PATCH .../deactivate`) com confirmação via `components/ui/confirm-dialog.tsx` (confirmação leve, sem digitar palavra — a ação é reversível). Itens inativos trocam a lixeira por **Reativar** (`RotateCcw`). Reservar o `DeleteConfirmationDialog` (type-to-confirm) só para hard delete irreversível.
- **Cadastro/edição em `Dialog`** aberto pela própria lista (botão no `PageSectionHeader` `aside` para criar; ícone `Pencil` para editar), evitando navegação quando o form é curto. Forms longos podem manter rota dedicada como fallback deep-link.

## Overview

Aplicar o padrão de formulários do projeto com React Hook Form + Zod, mantendo schema tipado, validação consistente e renderização padronizada de erros. O resolver `zodResolver` conecta o schema ao `useForm`, e o tipo do form é sempre derivado do schema com `z.infer` — uma única fonte de verdade para validação e tipagem.

## Guidelines

- Usar `zod` para definir o schema e `@hookform/resolvers/zod` para o resolver.
- Definir schema com `z.object({...})`, arrays com `z.array(...)` e validação cruzada com `.refine`/`.superRefine`.
- Tipar o payload do form com `z.infer<typeof schema>` (nunca declarar a interface à mão).
- Integrar com RHF via `resolver: zodResolver(schema)`.
- Inputs nativos: usar `register("campo")`. Componentes controlados (Radix/shadcn como `Checkbox`, `Select`, `RadioGroup`) usar `Controller`.
- Campos monetários, numéricos formatados e mascarados (CPF/CNPJ/telefone/CEP): usar `react-number-format` (`NumericFormat`/`PatternFormat`). São controlados → sempre via `Controller`. Guardar no form o **valor de dado**, não o formatado: `NumericFormat` → `field.onChange(values.floatValue)` (schema `z.number()`); `PatternFormat` → `field.onChange(values.value)` com `valueIsNumericString` (schema `z.string()` com `.length`/`.regex`). Reaproveitar o `Input` compartilhado via `customInput`.
- Selects com busca/autocomplete (escolher item de lista): usar `Combobox` do `@headlessui/react`. É controlado → via `Controller`. Guardar no form o **id** selecionado (primitivo), não o objeto: `value={field.value}` + `onChange={field.onChange}` (schema `z.string()`/`z.number()`). O texto de busca (`query`) é estado local de UI, **fora** do form; `displayValue` resolve o id → label.
- Mensagens de erro de **campo** (validação) renderizam inline via `formState.errors.<campo>?.message`, ao lado do input. Erros de **submissão** (servidor, credenciais inválidas, falha de rede, conflito) usam o **toaster** — `toast.error(mensagem)` do `sonner` — e **não** `setError("root")` nem um bloco de erro no topo do form. A razão: o erro de campo pertence àquele input e ajuda o usuário a corrigir ali; já o resultado da submissão é global e efêmero, então o toast comunica sem empurrar o layout do form. O `<Toaster />` precisa estar montado no root layout (a skill `config-frontend-layout` já o monta).
- Sempre passar `defaultValues` coerentes com o schema para manter os campos controlados desde o primeiro render.
- Em update forms, tornar campos opcionais quando o endpoint aceita parcial (`.optional()` / `.partial()`).

## Workflow

1. Definir o tipo de form (create/update/profile/filter).
2. Criar ou ajustar o schema Zod em `*.schema.ts` (colocado na rota ou em `data/`).
3. Exportar o tipo `FormData` com `z.infer`.
4. Conectar o schema ao `useForm` com `zodResolver`.
5. Revisar `defaultValues`, parse de campos (ex.: `string` -> `number`) e mensagens de erro.
6. Atualizar `index.ts`/barrel de schemas quando necessário.

## References

Consultar `references/form-schema-pattern.md` para exemplos concretos, checklist e armadilhas.

## Global Standards

- Consultar `../skills-standards.md` para padroes globais de nomenclatura e convencoes gerais entre skills.
