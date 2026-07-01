# Frontend Form + Schema Pattern (Genérico)

## Stack padrão

- `react-hook-form` + `zod` + `@hookform/resolvers/zod`
- `react-number-format` para campos monetários, numéricos formatados e mascarados.
- `@headlessui/react` (`Combobox`) para selects com busca/autocomplete.
- Schema é a fonte única de verdade: define validação E tipo do form.

## Paths de referência

- Componentes compartilhados de form/erro:
  - `apps/web/shared/components/ui/form-error-message.tsx`
  - `apps/web/shared/components/ui/input.tsx`, `label.tsx`, `checkbox.tsx`
- Exemplo concreto no projeto (login + cadastro com tabs):
  - `apps/web/app/(public)/auth/schemas.ts`
  - `apps/web/app/(public)/auth/page.tsx`
  - `apps/web/app/(public)/auth/actions.ts` (Server Action de mutação)

## Schema

```ts
// schemas.ts  (sem "use client" — só exporta schema/tipos)
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o email').pipe(z.email('Email inválido')),
  password: z.string().min(1, 'Informe a senha'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

- Objeto: `z.object({...})`
- Array: `z.array(item)` (use `.min`/`.max` quando precisar)
- Validação cruzada: `.refine(fn, message)` ou `.superRefine` para múltiplos erros
- Tipagem: `type XxxFormData = z.infer<typeof xxxSchema>`
- Resolver: `resolver: zodResolver(xxxSchema)`

## Conectando ao useForm

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { loginSchema, type LoginFormData } from './schemas';

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
});

const onSubmit = handleSubmit(async (data) => {
  const result = await loginAction(data);
  if (!result.ok) {
    toast.error('Email ou senha inválidos.');
  }
});
```

- Erro de **campo** (validação): `errors.<campo>?.message`, renderizado inline ao lado do input.
- Erro de **submissão** (servidor/credenciais/rede): `toast.error(mensagem)` do `sonner` — não `setError("root")`. O erro de campo guia a correção no próprio campo; o resultado da submissão é global e efêmero, então vai pro toast. Requer `<Toaster />` montado no root layout (provido por `config-frontend-layout`).
- Loading: usar `isSubmitting` (não criar `useState(loading)` paralelo)
- `<form noValidate>` para que a validação do Zod (e não a do navegador) controle as mensagens.

## Inputs nativos vs. controlados

- Native (`<input>`/`Input`): espalhar `{...register("campo")}`.
- Controlados (Radix/shadcn: `Checkbox`, `Select`, `RadioGroup`, date picker): usar `Controller`.

```tsx
<Controller
  control={control}
  name="termosAceitos"
  render={({ field }) => (
    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
  )}
/>
```

## Campos formatados/mascarados (react-number-format)

`NumericFormat` (moeda/quantidades) e `PatternFormat` (CPF, CNPJ, telefone, CEP) são **componentes controlados** → sempre via `Controller`. Regra de ouro: o form guarda o **valor de dado** (número ou dígitos limpos), nunca a string formatada com `R$`, ponto ou traço.

### Moeda / número → `NumericFormat`

Guardar `floatValue` (number). O schema valida `z.number()`.

```ts
// schema
export const produtoSchema = z.object({
  preco: z
    .number({ error: 'Informe o preço' }) // floatValue é undefined com input vazio
    .positive('Preço deve ser maior que zero'),
});
```

```tsx
'use client';
import { Controller } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/shared/components/ui/input';

<Controller
  control={control}
  name="preco"
  render={({ field }) => (
    <NumericFormat
      customInput={Input} // reaproveita o Input compartilhado
      getInputRef={field.ref}
      value={field.value} // number; vazio => undefined
      onValueChange={(v) => field.onChange(v.floatValue)} // grava number, não string
      onBlur={field.onBlur}
      prefix="R$ "
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      aria-invalid={Boolean(errors.preco)}
    />
  )}
/>;
```

### Máscara (CPF/CNPJ/telefone/CEP) → `PatternFormat`

Guardar `value` (dígitos limpos) com `valueIsNumericString`. O schema valida `z.string()` por tamanho/regex.

```ts
export const clienteSchema = z.object({
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  telefone: z.string().min(10, 'Telefone inválido'),
});
```

```tsx
import { PatternFormat } from 'react-number-format';

<Controller
  control={control}
  name="cpf"
  render={({ field }) => (
    <PatternFormat
      customInput={Input}
      getInputRef={field.ref}
      value={field.value}
      onValueChange={(v) => field.onChange(v.value)} // "12345678901" sem máscara
      onBlur={field.onBlur}
      format="###.###.###-##"
      mask="_"
      valueIsNumericString
      aria-invalid={Boolean(errors.cpf)}
    />
  )}
/>;
```

- `customInput={Input}` mantém o estilo do design system; demais props (`placeholder`, etc.) são repassadas.
- `floatValue` é `undefined` quando o input está vazio — bom para `z.number()` acusar campo obrigatório; em update opcional, usar `.optional()`.
- Não usar `register` nem `z.coerce.number()` aqui: o valor já chega tipado pelo `onValueChange`.

## Select com busca / autocomplete (@headlessui/react Combobox)

Para escolher um item de uma lista com filtro por texto. O `Combobox` é **controlado** → via `Controller`. Regra: o form guarda **o id** (primitivo), não o objeto inteiro; o texto digitado (`query`) é estado local de UI e **não** entra no form.

```ts
// schema
export const produtoSchema = z.object({
  categoriaId: z.string().min(1, 'Selecione uma categoria'),
});
```

```tsx
'use client';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';

const categorias = [
  { id: '1', nome: 'Bebidas' },
  { id: '2', nome: 'Limpeza' },
];

function CategoriaField({ control, errors }) {
  const [query, setQuery] = useState(''); // estado de UI, fora do form
  const filtradas =
    query === '' ? categorias : categorias.filter((c) => c.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <Controller
      control={control}
      name="categoriaId"
      render={({ field }) => (
        <Combobox
          value={field.value} // guarda o id
          onChange={field.onChange} // recebe o novo id
          immediate
        >
          <ComboboxInput
            aria-invalid={Boolean(errors.categoriaId)}
            displayValue={(id) => categorias.find((c) => c.id === id)?.nome ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={field.onBlur}
            placeholder="Buscar categoria..."
          />
          <ComboboxButton aria-label="Abrir opções">▼</ComboboxButton>
          <ComboboxOptions>
            {filtradas.length === 0 && query !== '' ? (
              <div className="px-3 py-2 text-sm">Nenhuma categoria.</div>
            ) : (
              filtradas.map((c) => (
                <ComboboxOption key={c.id} value={c.id}>
                  {c.nome}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Combobox>
      )}
    />
  );
}
```

- `value`/`onChange` operam sobre o **id** → schema simples (`z.string()`/`z.number()`); evita guardar objeto e ter que validar shape aninhado.
- `displayValue` resolve id → label para o texto do input; `query` filtra só a lista exibida.
- Guardar o objeto inteiro só quando precisar de mais campos no submit — nesse caso usar `by="id"` no `<Combobox>` e schema com `z.object({...})`.
- Multi-seleção: `<Combobox multiple>` com `field.value` array (schema `z.array(...)`).
- Imports planos (`ComboboxInput`, `ComboboxOptions`, …) são o padrão do Headless UI v2; a notação `Combobox.Input` ainda funciona, mas prefira a plana.

## Create vs Update

- Create schema: campos geralmente obrigatórios.
- Update schema: campos opcionais quando o endpoint aceita parcial.
  - Por campo: `nome: z.string().optional()`
  - Schema inteiro parcial: `createSchema.partial()`

## Campos complexos

- Senha com regras: encadear `.min().regex(...)`.
  ```ts
  z.string().min(8, 'Mínimo 8 caracteres').regex(/[A-Z]/, 'Inclua uma maiúscula').regex(/[0-9]/, 'Inclua um número');
  ```
- Checkbox obrigatório (aceite de termos):
  ```ts
  z.boolean().refine((v) => v, 'Você precisa aceitar os termos.');
  ```
- Confirmação de senha (cross-field):
  ```ts
  z.object({ password: z.string(), confirm: z.string() }).refine((d) => d.password === d.confirm, {
    message: 'As senhas não conferem',
    path: ['confirm'],
  });
  ```
- Conversão de tipo na entrada: `z.coerce.number()` para inputs numéricos.

## Composição de UI

- Campo: `Label` + `Input`/controlado + `FormErrorMessage` condicional.
- Marcar `aria-invalid={Boolean(errors.campo)}` no input para acessibilidade.
- Renderizar `FormErrorMessage` apenas quando há erro no campo.

## Checklist

- [ ] Schema Zod criado/atualizado no local correto (`*.schema.ts`).
- [ ] `FormData` inferido com `z.infer` (sem interface manual).
- [ ] `resolver: zodResolver(schema)` aplicado.
- [ ] `defaultValues` coerentes com schema e modo (create/update).
- [ ] Inputs nativos via `register`; controlados via `Controller`.
- [ ] Campos monetários/numéricos com `NumericFormat` gravando `floatValue` (schema `z.number()`); mascarados com `PatternFormat` + `valueIsNumericString` gravando `value` limpo (schema `z.string()`).
- [ ] Select com busca via `Combobox` (`@headlessui/react`) gravando o id no form (schema `z.string()`/`z.number()`); `query` mantido como estado local de UI, fora do form.
- [ ] Erros de campo via `errors.campo?.message` (inline); erro de submit via `toast.error(...)` do `sonner` (não `setError("root")`).
- [ ] `isSubmitting` controla estado de loading do botão.
- [ ] Barrel `index.ts` atualizado quando novo schema é adicionado.

## Armadilhas comuns

- Declarar a interface do form à mão em vez de derivar de `z.infer` (duas fontes de verdade que divergem).
- Usar `register` em componentes controlados (Radix/shadcn) — eles precisam de `Controller`.
- Em `react-number-format`, gravar no form a string formatada (`R$ 1.234,56`) em vez do dado: gravar `floatValue` (`NumericFormat`) ou `value` limpo (`PatternFormat`). Esquecer `valueIsNumericString` no `PatternFormat` quando o `value` é dígitos sem máscara.
- No `Combobox`, jogar o texto de busca (`query`) dentro do form ou guardar o objeto inteiro quando só o id basta — manter `query` como estado de UI local e gravar o id. Sem `displayValue`, o input não mostra o item já selecionado.
- Esquecer `.optional()`/`.partial()` em update forms.
- Não converter tipo de input antes de enviar (use `z.coerce.number()`).
- Não usar `.refine`/`.superRefine` para regras entre campos (ex.: confirmação de senha) e lembrar do `path` para direcionar o erro ao campo certo.
- Misturar o validador legado `v` (`@namespace/shared`) com Zod no mesmo fluxo — o padrão atual é Zod; ao manter forms legados, migrar para Zod quando alterá-los.
