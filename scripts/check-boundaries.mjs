import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const PACKAGE_SCOPE = '@deckagent/'

const NODE_BUILTINS = new Set([
  'child_process',
  'crypto',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'sqlite',
  'stream',
  'tls',
  'url',
  'worker_threads',
])

const BROWSER_ALLOWED_PACKAGES = new Set([
  '@deckagent/design',
  '@deckagent/host-contracts',
  '@deckagent/presentation-document',
])

const CONTRACTS_ALLOWED_PACKAGES = new Set(['@deckagent/design', '@deckagent/presentation-document'])

const BROWSER_DIRECTORIES = ['apps/web/src/browser', 'packages/client/runtime/src']

const DOMAIN_DIRECTORIES = ['packages/presentation']

const FORMAT_ADAPTER_DIRECTORIES = ['packages/presentation/html', 'packages/presentation/pptx']

const CONCRETE_ADAPTER_PACKAGES = new Set(['@deckagent/html-format', '@deckagent/pptx-format'])

const RUNTIME_PACKAGES = new Set(['@deckagent/host', '@deckagent/browser-runtime'])

const LIFECYCLE_DIRECTORIES = ['apps/host/src/runs']

const ROLE_FILE_MODULES = ['chats']

const ROLE_FILE_EXPORTS = {
  service: [
    {
      kind: 'classes',
      pattern: /^[A-Z]\w*Service$/,
      message:
        'must export a class with a name that ends with "Service". Rename the main export to the role of the file.',
    },
  ],
  store: [
    {
      kind: 'classes',
      pattern: /^(?:Sqlite|Memory)[A-Z]\w*Store$|^[A-Z]\w*FileStore$/,
      message:
        'must export a class "Sqlite<Name>Store", "Memory<Name>Store" or "<Name>FileStore". Rename the main export to the role of the file.',
    },
  ],
  routes: [
    {
      kind: 'functions',
      pattern: /^create[A-Z]\w*Routes$/,
      message: 'must export a function "create<Name>Routes". Rename the main export to the role of the file.',
    },
  ],
  errors: [
    {
      kind: 'classes',
      pattern: /^[A-Z]\w*Error$/,
      message: 'must export a class "<Name>Error". Rename the error class to the module.',
    },
    {
      kind: 'functions',
      pattern: /^map[A-Z]\w*Error$/,
      message: 'must export a function "map<Name>Error". Rename the status map to the module.',
    },
  ],
}

const ROLE_SUFFIXES = [
  { suffix: 'Service', role: 'service' },
  { suffix: 'Store', role: 'store' },
]

const roleOfPath = value => {
  const match = /\.(service|store|routes|errors)\.ts$/.exec(value)
  return match === null ? null : match[1]
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs'])

const toPosix = value => value.replaceAll('\\', '/').replace(/\/$/, '')

const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0)

const isUnder = (filePath, directory) => filePath === directory || filePath.startsWith(`${directory}/`)

const isRelativeSpecifier = specifier =>
  specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../')

const resolveSpecifier = (filePath, specifier) =>
  path.posix.normalize(path.posix.join(path.posix.dirname(filePath), specifier))

const parsePackageSpecifier = specifier => {
  if (!specifier.startsWith(PACKAGE_SCOPE)) return null
  const [name, ...rest] = specifier.slice(PACKAGE_SCOPE.length).split('/')
  if (name === undefined || name === '') return null
  return { name: `${PACKAGE_SCOPE}${name}`, subpath: rest.length > 0 ? rest.join('/') : null }
}

const isNodeBuiltin = specifier => specifier.startsWith('node:') || NODE_BUILTINS.has(specifier)

const stripExtension = value => {
  const extension = path.posix.extname(value)
  return SOURCE_EXTENSIONS.has(extension) ? value.slice(0, -extension.length) : value
}

const featureOfPath = value => {
  const match = /^apps\/host\/src\/features\/([^/]+)\//.exec(value)
  return match === null ? null : match[1]
}

const browserFeatureOfPath = value => {
  const match = /^apps\/web\/src\/browser\/features\/([^/]+)\//.exec(value)
  return match === null ? null : match[1]
}

const moduleOfPath = value => {
  const match = /^apps\/host\/src\/modules\/([^/]+)\//.exec(value)
  return match === null ? null : match[1]
}

const integrationOfPath = value => {
  const match = /^apps\/host\/src\/integrations\/([^/]+)\//.exec(value)
  return match === null ? null : match[1]
}

const runtimeOfPath = value => {
  const match = /^apps\/host\/src\/runtimes\/([^/]+)\//.exec(value)
  return match === null ? null : match[1]
}

const lineOf = (sourceFile, node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

export const extractImports = (filePath, sourceText) => {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true)
  const imports = []
  const add = node => {
    imports.push({ line: lineOf(sourceFile, node), specifier: node.text })
  }
  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier)
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier)
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments
      if (argument !== undefined && ts.isStringLiteral(argument)) add(argument)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return imports
}

const canonicalCycle = cycle => {
  let first = 0
  for (let index = 1; index < cycle.length; index += 1) {
    if (compareText(cycle[index], cycle[first]) < 0) first = index
  }
  return [...cycle.slice(first), ...cycle.slice(0, first)].join(' > ')
}

const findCycles = (nodes, edges) => {
  const outgoing = new Map(nodes.map(node => [node, new Set()]))
  for (const [from, to] of edges) {
    const targets = outgoing.get(from)
    if (from === to || targets === undefined || !outgoing.has(to)) continue
    targets.add(to)
  }
  const adjacency = new Map([...outgoing].map(([node, targets]) => [node, [...targets].toSorted(compareText)]))
  const state = new Map()
  const stack = []
  const cycles = []
  const seen = new Set()
  const visit = node => {
    state.set(node, 'active')
    stack.push(node)
    for (const next of adjacency.get(node)) {
      if (state.get(next) === 'active') {
        const cycle = stack.slice(stack.indexOf(next))
        const key = canonicalCycle(cycle)
        if (!seen.has(key)) {
          seen.add(key)
          cycles.push(cycle)
        }
      } else if (!state.has(next)) {
        visit(next)
      }
    }
    stack.pop()
    state.set(node, 'done')
  }
  for (const node of [...nodes].toSorted(compareText)) {
    if (!state.has(node)) visit(node)
  }
  return cycles
}

const describeCycle = cycle => `${cycle.join(' -> ')} -> ${cycle[0]}`

const isTestFile = filePath => /(?:^|\/)tests\//.test(filePath) || isUnder(filePath, 'e2e')

const hasExportKeyword = node =>
  ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some(item => item.kind === ts.SyntaxKind.ExportKeyword)

export const extractDeclarations = (filePath, sourceText) => {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true)
  const enums = []
  const classes = []
  const functions = []
  const visit = node => {
    if (ts.isEnumDeclaration(node)) enums.push({ line: lineOf(sourceFile, node), name: node.name.text })
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  for (const statement of sourceFile.statements) {
    if (statement.name === undefined || !hasExportKeyword(statement)) continue
    const item = { line: lineOf(sourceFile, statement), name: statement.name.text }
    if (ts.isClassDeclaration(statement)) classes.push(item)
    if (ts.isFunctionDeclaration(statement)) functions.push(item)
  }
  return { enums, classes, functions }
}

export const checkBoundaries = snapshot => {
  const workspaces = snapshot.workspaces.map(workspace => ({
    dir: toPosix(workspace.dir),
    name: workspace.name,
    exports: workspace.exports ?? {},
  }))
  const workspacesByName = new Map(workspaces.map(workspace => [workspace.name, workspace]))
  const workspacesByDepth = [...workspaces].toSorted((left, right) => right.dir.length - left.dir.length)
  const ownerOf = filePath => workspacesByDepth.find(workspace => isUnder(filePath, workspace.dir))
  const files = snapshot.files.map(file => ({ path: toPosix(file.path), content: file.content }))
  const fileSet = new Set(files.map(file => file.path))
  const violations = []
  const add = (filePath, line, rule, message) => violations.push({ path: filePath, line, rule, message })
  const packageEdges = []
  const featureEdges = []
  const browserFeatureEdges = []
  const moduleEdges = []
  const roleFileModules = new Set(snapshot.roleFileModules ?? ROLE_FILE_MODULES)

  for (const file of files) {
    const declarations = extractDeclarations(file.path, file.content)
    for (const item of declarations.enums) {
      add(
        file.path,
        item.line,
        'typescript-enum',
        `Do not declare the TypeScript enum "${item.name}". Use a union of string literals, or an "as const" array and a type from it.`,
      )
    }
    const owner = ownerOf(file.path)
    const testSource = isTestFile(file.path)
    const productionSource = owner !== undefined && !testSource
    const sourceFeature = productionSource ? featureOfPath(file.path) : null
    const sourceBrowserFeature = productionSource ? browserFeatureOfPath(file.path) : null
    const sourceIntegration = productionSource ? integrationOfPath(file.path) : null
    const sourceRuntime = productionSource ? runtimeOfPath(file.path) : null
    const sourceModule = productionSource ? moduleOfPath(file.path) : null
    if (sourceModule !== null && roleFileModules.has(sourceModule)) {
      const role = roleOfPath(file.path)
      for (const expected of ROLE_FILE_EXPORTS[role] ?? []) {
        if (!declarations[expected.kind].some(item => expected.pattern.test(item.name))) {
          add(file.path, 1, 'role-file-symbol', `File "${file.path}" ${expected.message}`)
        }
      }
      for (const item of declarations.classes) {
        for (const { suffix, role: suffixRole } of ROLE_SUFFIXES) {
          if (item.name.endsWith(suffix) && role !== suffixRole) {
            add(
              file.path,
              item.line,
              'role-file-symbol',
              `Class "${item.name}" ends with "${suffix}", but its file is not a ${suffixRole} file. Rename the class, or move it to a "*.${suffixRole}.ts" file.`,
            )
          }
        }
      }
    }
    for (const entry of extractImports(file.path, file.content)) {
      const { line, specifier } = entry
      const packageSpecifier = parsePackageSpecifier(specifier)
      const targetWorkspace = packageSpecifier === null ? undefined : workspacesByName.get(packageSpecifier.name)
      const resolved = isRelativeSpecifier(specifier) ? resolveSpecifier(file.path, specifier) : null
      const resolvedOwner = resolved === null ? undefined : ownerOf(resolved)

      if (targetWorkspace !== undefined && packageSpecifier.subpath !== null) {
        const { subpath } = packageSpecifier
        const isPrivatePath = subpath.startsWith('src/') || subpath.startsWith('lib/')
        const isUndeclared = !Object.hasOwn(targetWorkspace.exports, `./${subpath}`)
        if (isPrivatePath || isUndeclared) {
          add(
            file.path,
            line,
            'private-package-import',
            `Import "${specifier}" uses a private path of ${packageSpecifier.name}. Import the package through a key in its package.json exports.`,
          )
        }
      }

      if (
        resolved !== null &&
        resolvedOwner !== undefined &&
        resolvedOwner !== owner &&
        (owner !== undefined || testSource)
      ) {
        const privateDirectory =
          isUnder(resolved, `${resolvedOwner.dir}/src`) || isUnder(resolved, `${resolvedOwner.dir}/lib`)
        if (privateDirectory) {
          add(
            file.path,
            line,
            'private-package-import',
            `Relative import resolves into the private source of ${resolvedOwner.name}. Import the package through its package.json exports.`,
          )
        }
      }

      if (!productionSource) continue

      if (resolved !== null && !fileSet.has(resolved)) {
        add(
          file.path,
          line,
          'unresolved-internal-import',
          `Relative import "${specifier}" does not resolve to a file in the repository snapshot.`,
        )
      }

      if (BROWSER_DIRECTORIES.some(directory => isUnder(file.path, directory))) {
        const importedPackage = packageSpecifier === null ? null : packageSpecifier.name
        const escapesBrowserIntoHost =
          resolved !== null &&
          isUnder(file.path, 'apps/web/src/browser') &&
          isUnder(resolved, 'apps/web/src') &&
          !isUnder(resolved, 'apps/web/src/browser')
        if (
          isNodeBuiltin(specifier) ||
          escapesBrowserIntoHost ||
          (importedPackage !== null && !BROWSER_ALLOWED_PACKAGES.has(importedPackage))
        ) {
          add(
            file.path,
            line,
            'browser-node-import',
            `Browser code must not import "${specifier}". Use the browser transport or a contract package.`,
          )
        }
      }

      if (isUnder(file.path, 'packages/host/contracts')) {
        const importedPackage = packageSpecifier === null ? null : packageSpecifier.name
        if (
          isNodeBuiltin(specifier) ||
          (importedPackage !== null && !CONTRACTS_ALLOWED_PACKAGES.has(importedPackage))
        ) {
          add(
            file.path,
            line,
            'contracts-runtime-import',
            `Host contracts must not import "${specifier}". Contracts stay independent of runtime implementations.`,
          )
        }
      }

      const isLifecycleSource = LIFECYCLE_DIRECTORIES.some(directory => isUnder(file.path, directory))
      if (isLifecycleSource) {
        const isTransportModule = resolved !== null && isUnder(resolved, 'apps/host/src/http')
        if (specifier === 'node:http' || specifier === 'node:https' || isTransportModule) {
          add(
            file.path,
            line,
            'lifecycle-transport-import',
            `Request Lifecycle must not import "${specifier}". Lifecycle calls public operations and stays independent of HTTP transport.`,
          )
        }
      }

      if (isUnder(file.path, 'packages/presentation/deck') && targetWorkspace !== undefined) {
        if (CONCRETE_ADAPTER_PACKAGES.has(targetWorkspace.name)) {
          add(
            file.path,
            line,
            'deck-concrete-adapter',
            `Deck must not import the concrete adapter "${specifier}". Deck depends on the FormatAdapter contract only.`,
          )
        }
      }

      if (
        FORMAT_ADAPTER_DIRECTORIES.some(directory => isUnder(file.path, directory)) &&
        targetWorkspace !== undefined
      ) {
        if (!CONTRACTS_ALLOWED_PACKAGES.has(targetWorkspace.name)) {
          add(
            file.path,
            line,
            'format-adapter-dependency',
            `Format adapter must not import "${specifier}". A format adapter depends only on @deckagent/design and @deckagent/presentation-document.`,
          )
        }
      }

      if (isUnder(file.path, 'packages')) {
        const importsApplication =
          (targetWorkspace !== undefined && targetWorkspace.dir.startsWith('apps/')) ||
          (resolvedOwner !== undefined && resolvedOwner.dir.startsWith('apps/'))
        if (importsApplication) {
          add(
            file.path,
            line,
            'package-app-dependency',
            `Package must not import the application workspace "${specifier}". A package never depends on an application.`,
          )
        }
      }

      if (DOMAIN_DIRECTORIES.some(directory => isUnder(file.path, directory)) && targetWorkspace !== undefined) {
        if (RUNTIME_PACKAGES.has(targetWorkspace.name)) {
          add(
            file.path,
            line,
            'domain-runtime-dependency',
            `Domain code must not import "${specifier}". Domain code stays independent of Local Host and browser runtime implementations.`,
          )
        }
      }

      const targetFeature = resolved === null ? null : featureOfPath(resolved)
      if (sourceFeature !== null && targetFeature !== null) {
        if (targetFeature !== sourceFeature) {
          const publicEntry = `apps/host/src/features/${targetFeature}/index`
          if (stripExtension(resolved) !== publicEntry) {
            add(
              file.path,
              line,
              'feature-private-import',
              `Feature "${sourceFeature}" must not import "${resolved}" of feature "${targetFeature}". Import the public operation of feature "${targetFeature}".`,
            )
          }
        }
        featureEdges.push([sourceFeature, targetFeature])
      }

      const targetBrowserFeature = resolved === null ? null : browserFeatureOfPath(resolved)
      if (sourceBrowserFeature !== null && targetBrowserFeature !== null) {
        if (targetBrowserFeature !== sourceBrowserFeature) {
          const publicEntry = `apps/web/src/browser/features/${targetBrowserFeature}/index`
          if (stripExtension(resolved) !== publicEntry) {
            add(
              file.path,
              line,
              'browser-feature-private-import',
              `Browser feature "${sourceBrowserFeature}" must not import "${resolved}" of browser feature "${targetBrowserFeature}". Import the public index of browser feature "${targetBrowserFeature}".`,
            )
          }
        }
        browserFeatureEdges.push([sourceBrowserFeature, targetBrowserFeature])
      }

      if (
        isUnder(file.path, 'apps/web/src/browser/transport') &&
        resolved !== null &&
        isUnder(resolved, 'apps/web/src/browser/features')
      ) {
        add(
          file.path,
          line,
          'browser-transport-ui-import',
          `Browser transport must not import "${specifier}" from browser UI features.`,
        )
      }

      const targetIntegration = resolved === null ? null : integrationOfPath(resolved)
      if (targetIntegration !== null && sourceIntegration !== targetIntegration) {
        const publicEntry = `apps/host/src/integrations/${targetIntegration}/index`
        if (stripExtension(resolved) !== publicEntry) {
          add(
            file.path,
            line,
            'integration-private-import',
            `Code outside integration "${targetIntegration}" must not import "${resolved}". Import the public index of integration "${targetIntegration}".`,
          )
        }
      }

      const targetRuntime = resolved === null ? null : runtimeOfPath(resolved)
      if (targetRuntime !== null && sourceRuntime !== targetRuntime) {
        const publicEntry = `apps/host/src/runtimes/${targetRuntime}/index`
        if (stripExtension(resolved) !== publicEntry) {
          add(
            file.path,
            line,
            'runtime-private-import',
            `Code outside runtime "${targetRuntime}" must not import "${resolved}". Import the public index of runtime "${targetRuntime}".`,
          )
        }
      }

      const targetModule = resolved === null ? null : moduleOfPath(resolved)
      if (targetModule !== null && sourceModule !== targetModule) {
        const publicEntry = `apps/host/src/modules/${targetModule}/index`
        if (stripExtension(resolved) !== publicEntry) {
          add(
            file.path,
            line,
            'module-private-import',
            `Code outside module "${targetModule}" must not import "${resolved}". Import the public index of module "${targetModule}".`,
          )
        }
        if (sourceModule !== null) moduleEdges.push([sourceModule, targetModule])
      }

      if (targetWorkspace !== undefined) {
        packageEdges.push([owner.name, targetWorkspace.name])
      }
    }
  }

  for (const [alias, targets] of Object.entries(snapshot.tsconfigPaths ?? {})) {
    const packageSpecifier = parsePackageSpecifier(alias)
    if (packageSpecifier === null) continue
    const workspace = workspacesByName.get(packageSpecifier.name)
    const exportKey = packageSpecifier.subpath === null ? '.' : `./${packageSpecifier.subpath}`
    if (workspace === undefined) {
      add(
        'tsconfig.base.json',
        1,
        'tsconfig-private-alias',
        `tsconfig.base.json maps "${alias}" but no workspace uses that name. Remove the alias or fix the workspace name.`,
      )
      continue
    }
    if (!Object.hasOwn(workspace.exports, exportKey)) {
      add(
        'tsconfig.base.json',
        1,
        'tsconfig-private-alias',
        `tsconfig.base.json maps "${alias}" but ${workspace.name} does not export "${exportKey}". Remove the alias or add the export.`,
      )
      continue
    }
    const expectedSources =
      packageSpecifier.subpath === null
        ? [`${workspace.dir}/src/index.ts`]
        : [
            `${workspace.dir}/src/${packageSpecifier.subpath}.ts`,
            `${workspace.dir}/src/${packageSpecifier.subpath}/index.ts`,
          ]
    const normalizedTargets = (Array.isArray(targets) ? targets : []).map(target =>
      toPosix(target).replace(/^\.\//, ''),
    )
    const mapsToSource =
      normalizedTargets.length > 0 && normalizedTargets.every(target => expectedSources.includes(target))
    if (!mapsToSource) {
      add(
        'tsconfig.base.json',
        1,
        'tsconfig-private-alias',
        `tsconfig.base.json maps "${alias}" to "${normalizedTargets.join('", "')}". The source entry for ${workspace.name} is "${expectedSources[0]}".`,
      )
    }
  }

  for (const cycle of findCycles(
    workspaces.map(workspace => workspace.name),
    packageEdges,
  )) {
    const directories = cycle.map(name => workspacesByName.get(name).dir).toSorted(compareText)
    add(
      directories[0],
      1,
      'package-cycle',
      `Package dependency cycle: ${describeCycle(cycle)}. Break the cycle by changing ownership.`,
    )
  }

  const features = [...new Set(files.map(file => featureOfPath(file.path)).filter(feature => feature !== null))]
  for (const cycle of findCycles(features, featureEdges)) {
    add(
      `apps/host/src/features/${cycle[0]}`,
      1,
      'feature-cycle',
      `Feature dependency cycle: ${describeCycle(cycle)}. Break the cycle by changing ownership.`,
    )
  }

  const browserFeatures = [
    ...new Set(files.map(file => browserFeatureOfPath(file.path)).filter(feature => feature !== null)),
  ]
  for (const cycle of findCycles(browserFeatures, browserFeatureEdges)) {
    add(
      `apps/web/src/browser/features/${cycle[0]}`,
      1,
      'browser-feature-cycle',
      `Browser feature dependency cycle: ${describeCycle(cycle)}. Change ownership to break the cycle.`,
    )
  }

  const modules = [...new Set(files.map(file => moduleOfPath(file.path)).filter(name => name !== null))]
  for (const cycle of findCycles(modules, moduleEdges)) {
    add(
      `apps/host/src/modules/${cycle[0]}`,
      1,
      'module-cycle',
      `Module dependency cycle: ${describeCycle(cycle)}. Break the cycle by changing ownership.`,
    )
  }

  return violations.toSorted(
    (left, right) => compareText(left.path, right.path) || left.line - right.line || compareText(left.rule, right.rule),
  )
}

export const formatReport = violations => {
  const lines = violations.map(
    violation => `${violation.path}:${violation.line} ${violation.rule} ${violation.message}`,
  )
  const counts = new Map()
  for (const violation of violations) counts.set(violation.rule, (counts.get(violation.rule) ?? 0) + 1)
  for (const rule of [...counts.keys()].toSorted(compareText)) lines.push(`${rule}: ${counts.get(rule)}`)
  lines.push(`check-boundaries: ${violations.length} violation(s)`)
  return `${lines.join('\n')}\n`
}

const WORKSPACE_MANIFEST = /^(?:apps\/[^/]+\/package\.json|packages\/[^/]+\/[^/]+\/package\.json)$/

const SOURCE_FILE = /^(?:apps|packages|tests|e2e)\//

const SOURCE_EXTENSION = /\.(?:ts|tsx|mts|cts|js|mjs|cjs)$/

const SKIPPED_DIRECTORIES = new Set(['lib', 'dist', 'node_modules'])

const isSourceFile = filePath =>
  SOURCE_FILE.test(filePath) &&
  SOURCE_EXTENSION.test(filePath) &&
  !filePath.split('/').some(segment => SKIPPED_DIRECTORIES.has(segment))

const readJson = filePath => JSON.parse(readFileSync(filePath, 'utf8'))

const listRepositoryFiles = () =>
  execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
    .split('\n')
    .map(entry => entry.trim())
    .filter(entry => entry !== '')

const run = () => {
  const repositoryFiles = listRepositoryFiles()
  const workspaces = repositoryFiles
    .filter(filePath => WORKSPACE_MANIFEST.test(filePath) && existsSync(filePath))
    .map(filePath => {
      const manifest = readJson(filePath)
      return { dir: path.posix.dirname(filePath), name: manifest.name, exports: manifest.exports }
    })
    .filter(workspace => typeof workspace.name === 'string')
  const files = repositoryFiles
    .filter(isSourceFile)
    .filter(filePath => existsSync(filePath))
    .map(filePath => ({ path: filePath, content: readFileSync(filePath, 'utf8') }))
  const tsconfigPaths = readJson('tsconfig.base.json').compilerOptions?.paths ?? {}
  const violations = checkBoundaries({ workspaces, files, tsconfigPaths })
  process.stdout.write(formatReport(violations))
  if (process.argv.includes('--report')) process.exit(0)
  process.exit(violations.length > 0 ? 1 : 0)
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) run()
