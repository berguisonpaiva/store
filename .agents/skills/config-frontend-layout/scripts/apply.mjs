#!/usr/bin/env node
// Instalador unificado de layout de frontend.
//
// Aplica UM de dois layouts no app frontend de destino, escolhido por --layout:
//   simple   → menu único (shadcn sidebar-07), dashboard aberto, dark-only, sem auth.
//   modules  → shell de 3 colunas (rail de módulos), multi-módulo, NextAuth + guard.
//
// Uso (a partir da raiz do monorepo):
//   node scripts/apply.mjs --layout=simple
//   node scripts/apply.mjs --layout=modules --app=web
//
// O nome do app é opcional: autodetecta o único app Next.js em apps/. Suporta
// layout com ou sem `src/`. Detecta o package manager (bun/pnpm/yarn/npm).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const root = process.cwd()
const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appsDir = path.join(root, 'apps')

// ── utilitários de FS ────────────────────────────────────────────────────────
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyDirContent(source, target) {
  ensureDir(target)
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name)
    const to = path.join(target, entry.name)
    if (entry.isDirectory()) copyDirContent(from, to)
    else fs.copyFileSync(from, to)
  }
}

function copyTemplate(from, to) {
  ensureDir(path.dirname(to))
  fs.copyFileSync(from, to)
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

// ── parsing de argumentos ────────────────────────────────────────────────────
function getArg(...names) {
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    for (const name of names) {
      if (a === name) return args[i + 1]
      if (a.startsWith(`${name}=`)) return a.slice(name.length + 1)
    }
  }
  return null
}

function parseLayout() {
  const layout = getArg('--layout', '-l')
  if (layout) return layout.trim().toLowerCase()
  // posicional: primeiro argumento "simple" | "modules"
  const positional = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  for (const p of positional) {
    if (p === 'simple' || p === 'modules') return p
  }
  return null
}

function parseAppArg() {
  const explicit = getArg('--app', '--target')
  if (explicit) return explicit
  // posicional que não seja o layout
  const positional = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  for (const p of positional) {
    if (p !== 'simple' && p !== 'modules') return p
  }
  return null
}

// ── resolução do app de destino ──────────────────────────────────────────────
function isNextApp(dir) {
  const pkgPath = path.join(dir, 'package.json')
  const hasNextDep = fs.existsSync(pkgPath) && /"next"\s*:/.test(fs.readFileSync(pkgPath, 'utf8'))
  const hasAppDir = fs.existsSync(path.join(dir, 'src', 'app')) || fs.existsSync(path.join(dir, 'app'))
  return hasNextDep || hasAppDir
}

function listNextApps() {
  if (!fs.existsSync(appsDir)) return []
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => isNextApp(path.join(appsDir, name)))
}

function resolveFrontendDir() {
  const requested = parseAppArg()
  if (requested) {
    const dir = path.join(appsDir, requested)
    if (!fs.existsSync(dir)) {
      throw new Error(
        `App "${requested}" não encontrado em apps/. Apps disponíveis: ${listNextApps().join(', ') || '(nenhum)'}`,
      )
    }
    return dir
  }
  const candidates = listNextApps()
  if (candidates.length === 0) {
    throw new Error(
      'Nenhum app frontend (Next.js) encontrado em apps/. Rode config-project antes, ou informe o nome: --app=<nome>',
    )
  }
  if (candidates.length > 1) {
    throw new Error(
      `Múltiplos apps frontend em apps/: ${candidates.join(', ')}. Informe qual usar: --app=<nome>`,
    )
  }
  return path.join(appsDir, candidates[0])
}

// srcRoot suporta layout com ou sem `src/`.
function resolveSrcRoot(frontendDir) {
  return fs.existsSync(path.join(frontendDir, 'src')) ? path.join(frontendDir, 'src') : frontendDir
}

function getPkgName(frontendDir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf8'))
  return pkg.name
}

function getAppRelativePath(frontendDir, targetPath) {
  return path.relative(frontendDir, targetPath).replace(/\\/g, '/')
}

function toAppName(packageName) {
  const raw = packageName.includes('/') ? packageName.split('/').pop() : packageName
  return raw
    .split(/[-_]/g)
    .filter(Boolean)
    .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    .join('')
}

// ── package manager ──────────────────────────────────────────────────────────
function run(command) {
  execSync(command, { stdio: 'inherit', cwd: root })
}

function runIn(command, cwd) {
  execSync(command, { stdio: 'inherit', cwd })
}

function resolvePackageManager(projectDir) {
  const packagePath = path.join(root, 'package.json')
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const fromField = typeof pkg.packageManager === 'string' ? pkg.packageManager.split('@')[0] : ''
    if (['bun', 'pnpm', 'yarn', 'npm'].includes(fromField)) return fromField
  }
  if (fs.existsSync(path.join(root, 'bun.lock')) || fs.existsSync(path.join(root, 'bun.lockb'))) return 'bun'
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(projectDir, 'bun.lock')) || fs.existsSync(path.join(projectDir, 'bun.lockb'))) return 'bun'
  return 'npm'
}

function workspaceInstallDeps(packageManager, frontendDir, workspaceName, deps) {
  const list = deps.join(' ')
  if (packageManager === 'bun') {
    // bun add --filter dá erro de dependency-loop quando o nome do workspace bate
    // com um pacote do registry. Rodar a partir do diretório do app evita isso.
    runIn(`bun add ${list}`, frontendDir)
  } else if (packageManager === 'pnpm') {
    run(`pnpm add --filter ${workspaceName} ${list}`)
  } else if (packageManager === 'yarn') {
    run(`yarn workspace ${workspaceName} add ${list}`)
  } else {
    run(`npm install ${list} --workspace ${workspaceName}`)
  }
}

function formatCommand(packageManager) {
  if (packageManager === 'bun') return 'bun run format'
  if (packageManager === 'pnpm') return 'pnpm run format'
  if (packageManager === 'yarn') return 'yarn format'
  return 'npm run format'
}

function tryFormat(packageManager) {
  try {
    run(formatCommand(packageManager))
  } catch {
    console.log('⚠️  Não foi possível rodar o format (script ausente?). Pulei a formatação.')
  }
}

// ── config de Tailwind/Next compartilhada ────────────────────────────────────
function ensurePostcssConfig(frontendDir) {
  const configPath = path.join(frontendDir, 'postcss.config.js')
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      `export default {\n  plugins: {\n    '@tailwindcss/postcss': {},\n  },\n};\n`,
      'utf8',
    )
    console.log('Criado postcss.config.js')
  }
}

function ensurePathAlias(frontendDir, srcRoot) {
  const tsconfigPath = path.join(frontendDir, 'tsconfig.json')
  if (!fs.existsSync(tsconfigPath)) return
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
  const hasSrc = srcRoot !== frontendDir
  const aliasTarget = hasSrc ? ['./src/*'] : ['./*']
  if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {}
  if (!tsconfig.compilerOptions.paths) tsconfig.compilerOptions.paths = {}
  if (!tsconfig.compilerOptions.paths['@/*']) {
    tsconfig.compilerOptions.paths['@/*'] = aliasTarget
    writeJson(tsconfigPath, tsconfig)
    console.log(`Adicionado @/* → ${aliasTarget[0]} em tsconfig.json`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT SIMPLES — menu único, dashboard aberto, dark-only, shadcn sidebar-07.
// ─────────────────────────────────────────────────────────────────────────────
const SIMPLE_DEPS = [
  'tailwindcss',
  '@tailwindcss/postcss',
  'lucide-react',
  'clsx',
  'tailwind-merge',
  'class-variance-authority',
  'radix-ui',
  'react-hook-form',
  'react-day-picker',
  'date-fns',
  'recharts',
  'sonner',
  'nuqs',
  'zustand',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-label',
  '@radix-ui/react-popover',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-separator',
  '@radix-ui/react-slot',
  '@radix-ui/react-tabs',
]

function shadcnAddCommand(packageManager) {
  if (packageManager === 'bun') return 'bunx --bun shadcn@latest add sidebar-07 --yes --overwrite'
  if (packageManager === 'pnpm') return 'pnpm dlx shadcn@latest add sidebar-07 --yes --overwrite'
  return 'npx shadcn@latest add sidebar-07 --yes --overwrite'
}

function ensureShadcnConfigSimple(frontendDir, appDir) {
  const configPath = path.join(frontendDir, 'components.json')
  const cssPath = getAppRelativePath(frontendDir, path.join(appDir, 'globals.css'))
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {}
  writeJson(configPath, {
    $schema: existing.$schema ?? 'https://ui.shadcn.com/schema.json',
    style: existing.style ?? 'new-york',
    rsc: existing.rsc ?? true,
    tsx: existing.tsx ?? true,
    tailwind: {
      ...(existing.tailwind ?? {}),
      config: existing.tailwind?.config ?? '',
      css: cssPath,
      baseColor: existing.tailwind?.baseColor ?? 'neutral',
      cssVariables: true,
      prefix: existing.tailwind?.prefix ?? '',
    },
    aliases: {
      ...(existing.aliases ?? {}),
      components: '@/components',
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
      utils: '@/lib/utils',
    },
    iconLibrary: existing.iconLibrary ?? 'lucide',
  })
}

function patchAppLogoSimple(srcDir, appName) {
  const logoPath = path.join(srcDir, 'components', 'branding', 'app-logo.tsx')
  if (!fs.existsSync(logoPath)) return
  let content = fs.readFileSync(logoPath, 'utf8')
  content = content.replace(/const APP_NAME = ".*?";/, `const APP_NAME = "${appName}";`)
  fs.writeFileSync(logoPath, content, 'utf8')
}

// O simples é dark-only: garante a classe `dark` no <html> do root layout. Idempotente.
function patchRootLayoutDark(appDir) {
  const layoutPath = path.join(appDir, 'layout.tsx')
  if (!fs.existsSync(layoutPath)) return false
  const content = fs.readFileSync(layoutPath, 'utf8')
  const htmlMatch = content.match(/<html\b[^>]*>/)
  if (!htmlMatch) return false
  const htmlTag = htmlMatch[0]
  if (/\bdark\b/.test(htmlTag)) return false
  let patchedTag
  if (/className=\{`/.test(htmlTag)) patchedTag = htmlTag.replace(/className=\{`/, 'className={`dark ')
  else if (/className=("|')/.test(htmlTag)) patchedTag = htmlTag.replace(/className=("|')/, 'className=$1dark ')
  else patchedTag = htmlTag.replace(/<html\b/, '<html className="dark"')
  fs.writeFileSync(layoutPath, content.replace(htmlTag, patchedTag), 'utf8')
  return true
}

// `shadcn add sidebar-07` despeja um scaffold de DEMONSTRAÇÃO (componentes de
// bloco + página de exemplo) que não faz parte do nosso shell. A página
// `app/dashboard/page.tsx` do bloco, em particular, resolve para `/dashboard` e
// COLIDE com a nossa rota `(private)/dashboard`. Removemos esse demo após o add.
// Idempotente. Os primitives em `components/ui/` (sidebar, sheet, …) NÃO são
// tocados — só os arquivos de exemplo no topo de `components/` e a rota demo.
function removeSidebar07Demo(srcDir, appDir) {
  const demoComponents = [
    'app-sidebar.tsx',
    'nav-main.tsx',
    'nav-projects.tsx',
    'nav-user.tsx',
    'team-switcher.tsx',
  ]
  for (const name of demoComponents) {
    const file = path.join(srcDir, 'components', name)
    if (fs.existsSync(file)) {
      fs.rmSync(file)
      console.log(`Removido demo do sidebar-07: components/${name}`)
    }
  }
  const demoDashboard = path.join(appDir, 'dashboard')
  if (fs.existsSync(demoDashboard)) {
    fs.rmSync(demoDashboard, { recursive: true, force: true })
    console.log('Removido demo do sidebar-07: app/dashboard (colidia com (private)/dashboard)')
  }
}

// Monta o <Toaster /> (sonner) no root layout para os toasts — padrão de
// erro de submissão dos forms (ver skill frontend-form-schema). Idempotente.
function patchRootLayoutToaster(appDir) {
  const layoutPath = path.join(appDir, 'layout.tsx')
  if (!fs.existsSync(layoutPath)) return false
  let content = fs.readFileSync(layoutPath, 'utf8')
  if (content.includes('<Toaster')) return false
  if (!content.includes('@/components/ui/toaster')) {
    const firstImport = content.match(/^import[^\n]*\n/m)
    const importLine = 'import { Toaster } from "@/components/ui/toaster";\n'
    content = firstImport ? content.replace(firstImport[0], firstImport[0] + importLine) : importLine + content
  }
  if (!content.includes('</body>')) return false
  content = content.replace('</body>', '<Toaster />\n      </body>')
  fs.writeFileSync(layoutPath, content, 'utf8')
  return true
}

function applySimple(ctx) {
  const { frontendDir, srcDir, appDir, frontendPkg, appName, packageManager } = ctx
  const assets = path.join(skillDir, 'assets', 'simple')
  const publicDir = path.join(frontendDir, 'public')

  console.log(`→ Layout SIMPLES em ${path.relative(root, frontendDir)} (pacote: ${frontendPkg})`)

  workspaceInstallDeps(packageManager, frontendDir, frontendPkg, SIMPLE_DEPS)
  ensurePathAlias(frontendDir, srcDir)
  ensurePostcssConfig(frontendDir)

  // globals.css precisa existir antes do shadcn add (ele lê o caminho do components.json).
  copyTemplate(path.join(assets, 'app', 'globals.css'), path.join(appDir, 'globals.css'))
  ensureShadcnConfigSimple(frontendDir, appDir)
  runIn(shadcnAddCommand(packageManager), frontendDir)

  // Código compartilhado nas pastas convencionais do Next.js (sem umbrella `shared/`).
  // A navegação NÃO mora aqui — vive na casca client do layout (private-shell.tsx).
  // Copiado DEPOIS do shadcn add para os primitives embarcados prevalecerem.
  copyDirContent(path.join(assets, 'components'), path.join(srcDir, 'components'))
  copyDirContent(path.join(assets, 'lib'), path.join(srcDir, 'lib'))
  copyDirContent(path.join(assets, 'hooks'), path.join(srcDir, 'hooks'))
  patchAppLogoSimple(srcDir, appName)

  const publicAssets = path.join(assets, 'public')
  if (fs.existsSync(publicAssets)) copyDirContent(publicAssets, publicDir)

  // Rotas + globals.css (nossos tokens dark-only prevalecem sobre o shadcn add).
  // copyDirContent não toca o `layout.tsx` raiz (não existe nos assets), só o
  // patcha depois. Grupos (public)/(private) e page.tsx entram como código real.
  copyDirContent(path.join(assets, 'app'), appDir)
  patchRootLayoutDark(appDir)
  patchRootLayoutToaster(appDir)

  // Limpa o scaffold de exemplo do `shadcn add sidebar-07` (ver função).
  removeSidebar07Demo(srcDir, appDir)

  tryFormat(packageManager)
  printDoneSimple(appName)
}

function printDoneSimple(appName) {
  console.log(`
✅ config-frontend-layout (SIMPLES) concluído para ${appName}

📁 Estrutura padrão Next.js: components/ · lib/ · hooks/ (sem umbrella shared/)
🎨 globals.css dark-only + <html className="dark">
🧩 shadcn sidebar-07 instalado, aliases → @/components, @/lib, @/hooks
🧱 (private)/layout.tsx é Server Component; interatividade isolada em private-shell.tsx
🔔 <Toaster /> (sonner) montado no root layout → erros de submissão de form via toast.error()
🗺️  Rotas: / (landing) · (public)/join · (private)/dashboard

⚠️  Próximos passos:
   1. Editar NAVIGATION_SECTIONS em app/(private)/private-shell.tsx
   2. Implementar o formulário real em app/(public)/join/page.tsx
   3. (Opcional) Adicionar guard de auth se as rotas privadas precisarem proteção`)
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT MÓDULOS — shell de 3 colunas, multi-módulo, NextAuth + guard.
// ─────────────────────────────────────────────────────────────────────────────
const MODULES_DEPS = [
  'tailwindcss',
  '@tailwindcss/postcss',
  'tw-animate-css',
  'next-auth@5.0.0-beta.30',
  '@base-ui/react',
  '@headlessui/react',
  '@hookform/resolvers',
  '@radix-ui/react-slot',
  '@tanstack/react-table',
  'class-variance-authority',
  'clsx',
  'date-fns',
  'lucide-react',
  'nuqs',
  'react-day-picker',
  'react-hook-form',
  'react-imask',
  'react-number-format',
  'recharts',
  'sonner',
  'tailwind-merge',
  'vaul',
  'zod',
]

// Patch da marca: troca `const APP_NAME = 'App'` (qualquer aspas) pelo nome real
// em todos os pontos onde o scaffold codifica a marca.
function patchAppNameModules(srcDir, appName) {
  const targets = [
    path.join(srcDir, 'components', 'logo.tsx'),
    path.join(srcDir, 'components', 'app-shell.tsx'),
    path.join(srcDir, 'app', 'layout.tsx'),
    path.join(srcDir, 'app', '(auth)', 'login', 'page.tsx'),
  ]
  for (const file of targets) {
    if (!fs.existsSync(file)) continue
    let content = fs.readFileSync(file, 'utf8')
    const next = content.replace(/const APP_NAME = (["'])App\1/g, `const APP_NAME = '${appName}'`)
    if (next !== content) {
      fs.writeFileSync(file, next, 'utf8')
      console.log(`Marca aplicada em ${getAppRelativePath(srcDir, file)}`)
    }
  }
}

function ensureComponentsJsonModules(frontendDir, appDir) {
  const configPath = path.join(frontendDir, 'components.json')
  const cssPath = getAppRelativePath(frontendDir, path.join(appDir, 'globals.css'))
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {}
  writeJson(configPath, {
    $schema: existing.$schema ?? 'https://ui.shadcn.com/schema.json',
    style: existing.style ?? 'new-york',
    rsc: existing.rsc ?? true,
    tsx: existing.tsx ?? true,
    tailwind: {
      ...(existing.tailwind ?? {}),
      config: existing.tailwind?.config ?? '',
      css: cssPath,
      baseColor: existing.tailwind?.baseColor ?? 'neutral',
      cssVariables: true,
      prefix: existing.tailwind?.prefix ?? '',
    },
    aliases: {
      ...(existing.aliases ?? {}),
      components: '@/components',
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
      utils: '@/lib/utils',
    },
    iconLibrary: existing.iconLibrary ?? 'lucide',
  })
}

function copyEnvExample(frontendDir) {
  const from = path.join(skillDir, 'assets', 'modules', 'env.example')
  if (!fs.existsSync(from)) return
  const to = path.join(frontendDir, '.env.example')
  fs.copyFileSync(from, to)
  console.log('Criado .env.example (configure NEXT_PUBLIC_SERVER_URL e AUTH_SECRET)')
}

function applyModules(ctx) {
  const { frontendDir, srcDir, appDir, frontendPkg, appName, packageManager } = ctx
  const assets = path.join(skillDir, 'assets', 'modules')
  const publicDir = path.join(frontendDir, 'public')

  console.log(`→ Layout MÓDULOS em ${path.relative(root, frontendDir)} (pacote: ${frontendPkg})`)

  workspaceInstallDeps(packageManager, frontendDir, frontendPkg, MODULES_DEPS)
  ensurePathAlias(frontendDir, srcDir)
  ensurePostcssConfig(frontendDir)

  // O scaffold inteiro (shell + auth/sessão/http + páginas genéricas + 4 módulos
  // vazios) vai direto pra srcRoot. Os `ui/` já vêm embarcados — não roda shadcn.
  copyDirContent(path.join(assets, 'src'), srcDir)

  const publicAssets = path.join(assets, 'public')
  if (fs.existsSync(publicAssets)) copyDirContent(publicAssets, publicDir)

  patchAppNameModules(srcDir, appName)
  ensureComponentsJsonModules(frontendDir, appDir)
  copyEnvExample(frontendDir)

  tryFormat(packageManager)
  printDoneModules(appName)
}

function printDoneModules(appName) {
  console.log(`
✅ config-frontend-layout (MÓDULOS) concluído para ${appName}

🧱 Shell de 3 colunas: rail de módulos + sidebar do módulo + conteúdo
🔐 NextAuth v5 + guard (proxy.ts) + filtro por módulo/alias de permissão
🗺️  Rotas: / · (auth)/login · (modules)/{home,perfil,cadastro,estoque,financeiro,configuracao}
🧩 4 módulos com dashboards iniciais (catalog/inventory/sales/settings)

⚠️  Próximos passos (este layout assume um backend com auth JWT):
   1. Configurar .env: NEXT_PUBLIC_SERVER_URL (backend) e AUTH_SECRET
   2. Backend precisa expor: POST /api/auth/login, /refresh, /logout,
      GET /api/auth/profile (retornando modules + permissionAliases + status)
   3. Adicionar itens de menu em src/lib/navigation.tsx e criar as páginas
   4. Trocar os logos placeholder em public/ (logo.png, logo-completa.png)`)
}

// ── entrypoint ───────────────────────────────────────────────────────────────
function main() {
  const layout = parseLayout()
  if (layout !== 'simple' && layout !== 'modules') {
    console.error(`
Escolha o layout com --layout:

  --layout=simple   Menu único (shadcn sidebar-07), dashboard aberto, dark-only, sem auth.
                    Ideal para apps internos/admin simples, sem controle de acesso.

  --layout=modules  Shell de 3 colunas com rail de módulos, multi-módulo, NextAuth +
                    guard por módulo/permissão. Assume backend com auth JWT.

Exemplos:
  node scripts/apply.mjs --layout=simple
  node scripts/apply.mjs --layout=modules --app=web
`)
    process.exit(2)
  }

  const frontendDir = resolveFrontendDir()
  const srcDir = resolveSrcRoot(frontendDir)
  const ctx = {
    frontendDir,
    srcDir,
    appDir: path.join(srcDir, 'app'),
    frontendPkg: getPkgName(frontendDir),
    packageManager: resolvePackageManager(frontendDir),
  }
  ctx.appName = toAppName(ctx.frontendPkg)

  if (layout === 'simple') applySimple(ctx)
  else applyModules(ctx)
}

main()
