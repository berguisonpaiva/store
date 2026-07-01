> Frontend-only (`apps/web`, layout simple + NextAuth). Leituras no servidor com Bearer; mutações via Server Actions. **Usar as skills `config-new-module`, `config-frontend-layout`, `frontend-form-schema`.** Sem deleção. Consultar docs do Next 16 in-repo antes de codar.

## 1. Pré-requisitos

- [x] 1.1 Confirmar `catalog-backend` acessível em `NEXT_PUBLIC_API_URL` e `web-auth` aplicado (`lib/http`, sessão)
- [x] 1.2 Criar `src/modules/catalog/` (pastas `components`, `data`, `schemas`)

## 2. Data layer — skill `frontend-form-schema`

- [x] 2.1 Leituras (server) com `apiJson`: `listProducts(params)`, `getProduct(id)`, `findVariationBySku/Barcode`, `listCategories`
- [x] 2.2 Server Actions (mutações) com `apiFetch`: create/update product, add/update variation, set-active (product/variation), create/update/set-active category
- [x] 2.3 Mapear erros do backend (409/400/404) → erro de campo (sku/barcode/nome) ou toast; `revalidatePath`/redirect no sucesso
- [x] 2.4 Helpers de preço (decimal ↔ cents) e parsing de filtros

## 3. Rotas e navegação — skill `config-frontend-layout`

- [x] 3.1 Rotas `(private)/products/page.tsx` (lista) e `(private)/products/[id]/page.tsx` + `new` (form)
- [x] 3.2 Rotas `(private)/categories/page.tsx` (lista + form)
- [x] 3.3 Registrar “Produtos” (`/products`) e “Categorias” (`/categories`) em `NAVIGATION_SECTIONS` (não destrutivo)

## 4. Produtos — skills `config-new-module` / `frontend-form-schema`

- [x] 4.1 Lista: busca por nome + filtros categoria/status + paginação via `nuqs`; ações ativar/desativar
- [x] 4.2 Form de produto (RHF): nome, descrição, select de categoria (de `listCategories`)
- [x] 4.3 Editor de variações (`useFieldArray`, ≥1): SKU, barcode, atributos key/value, preço (>0), minStock (≥0)
- [x] 4.4 Validação inline; erros de submissão via toast; sem controle de delete

## 5. Categorias — skills `config-new-module` / `frontend-form-schema`

- [x] 5.1 Lista de categorias + ativar/desativar
- [x] 5.2 Form de categoria (nome único) com erro de campo no 409

## 6. Verificação — skill `verify`

- [x] 6.1 `next build` verde, sem erro de tipos (TS limpo; rotas /products, /products/[id], /products/new, /categories geradas)
- [x] 6.2 Com backend + Postgres reais: sessão NextAuth (MASTER), leituras server-side com Bearer renderizam dados reais (produto 'Coca', categoria 'Bebidas'), busca por nome via URL e estado vazio OK, paginação por param; mutações (Server Actions) apontam para os endpoints já verificados ponta-a-ponta no catalog-backend (409 SKU/nome, 400, ativar/desativar). Click-through interativo do RHF no browser não dirigido headless.
- [x] 6.3 Acesso sem sessão → 307 para `/join` (/products e /categories); itens 'Produtos' e 'Categorias' registrados em NAVIGATION_SECTIONS
- [x] 6.4 Sem deleção de produto/categoria na UI (só remoção local de linhas de variação/atributo no form); leituras via apiJson/apiFetch (Bearer da sessão)
