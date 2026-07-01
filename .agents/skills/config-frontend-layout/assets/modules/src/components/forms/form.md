# Prompt — Componentes de Formulário

Analise os arquivos em `@src/components/forms` e crie os componentes de input reutilizáveis para formulários.

## Requisitos

- Utilize os componentes do shadcn/ui como base (`Input`, `Select`, `Textarea`, etc.)
- Integre com `react-hook-form` usando `FormField` do shadcn/ui
- Cada componente deve encapsular: label, input, mensagem de erro e descrição opcional
- Siga o mesmo padrão do `ComboboxField` já existente no projeto:
  - `clsx` para classes condicionais
  - prop `hasError` para estilo de erro em vez de depender só do `FormField`
  - sem portal — posicionamento CSS puro
  - `"use client"` no topo

## Componentes a criar

| Componente      | Descrição                                     | Biblioteca            |
| --------------- | --------------------------------------------- | --------------------- |
| `TextField`     | Input de texto simples                        | shadcn/ui             |
| `SelectField`   | Select com options                            | shadcn/ui             |
| `TextareaField` | Textarea                                      | shadcn/ui             |
| `CheckboxField` | Checkbox                                      | `@headlessui/react`   |
| `NumberField`   | Input numérico (decimais, moeda, porcentagem) | `react-number-format` |
| `MaskedField`   | Input com máscara (CPF, CNPJ, telefone, CEP)  | `react-imask`         |

## Padrão esperado de uso

```tsx
<TextField
  name="nome"
  label="Nome"
  placeholder="Digite o nome"
  description="Texto de ajuda opcional"
/>

<CheckboxField
  name="ativo"
  label="Ativo"
  description="Marque para ativar o cadastro"
/>

<NumberField
  name="preco"
  label="Preço"
  prefix="R$ "
  decimalScale={2}
/>

<MaskedField
  name="cpf"
  label="CPF"
  mask="000.000.000-00"
/>
```

## Referência de estilo

Usar as mesmas classes do `ComboboxField` já existente:

```tsx
className={clsx(
  "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  hasError ? "border-destructive" : "border-input"
)}
```
