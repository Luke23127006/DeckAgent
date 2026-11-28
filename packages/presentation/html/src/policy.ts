import { parseFragment, serialize, parse } from 'parse5'
import type { DefaultTreeAdapterMap } from 'parse5'
import { parse as parseCss, walk, generate, lexer } from 'css-tree'
import { FormatError as DeckError } from '@deckagent/presentation-document'
import type { DesignSnapshot } from '@deckagent/design'

type ArtifactAsset = { readonly assetId: string; readonly byteSize: number }

type Node = DefaultTreeAdapterMap['node']

const tags = new Set(
  'div section article header footer main h1 h2 h3 h4 h5 h6 p span strong em b i small ul ol li dl dt dd blockquote table thead tbody tr th td img figure figcaption br hr style'.split(
    ' ',
  ),
)

const geometry = new Set(
  'display position top right bottom left width height min-width max-width min-height max-height margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left gap row-gap column-gap grid-template-columns grid-template-rows grid-auto-flow grid-column grid-row align-items align-content align-self justify-items justify-content justify-self flex flex-direction flex-wrap flex-grow flex-shrink flex-basis order overflow overflow-x overflow-y box-sizing text-align vertical-align white-space word-break overflow-wrap font-weight font-style letter-spacing border-width border-style border-radius border-top-width border-right-width border-bottom-width border-left-width object-fit object-position'.split(
    ' ',
  ),
)

export const htmlCapabilities = Object.freeze({
  tags: [...tags],
  geometry: [...geometry],
  attributes: ['class', 'style', 'alt', 'src', 'colspan', 'rowspan', 'data-node-id'],
})

const roleVar = (value: string, roles: readonly string[]) =>
  roles.some(r => value === `var(--${r.replaceAll('.', '-')})`)

function css(source: string, inline: boolean, design: DesignSnapshot) {
  try {
    const ast = parseCss(source, {
      context: inline ? 'declarationList' : 'stylesheet',
      onParseError: () => {
        throw new DeckError('ARTIFACT_UNSAFE_CSS')
      },
    })
    walk(ast, node => {
      if (['Raw', 'Atrule', 'Url'].includes(node.type)) throw new DeckError('ARTIFACT_UNSAFE_CSS')
      if (
        node.type === 'Function' &&
        !['var', 'calc', 'min', 'max', 'clamp', 'repeat', 'minmax'].includes(node.name.toLowerCase())
      )
        throw new DeckError('ARTIFACT_UNSAFE_CSS')
      if (node.type === 'Declaration') {
        const property = node.property.toLowerCase(),
          value = generate(node.value)
        if (node.important || property.startsWith('--')) throw new DeckError('ARTIFACT_UNSAFE_CSS')
        if (
          [
            'color',
            'background-color',
            'border-color',
            'border-top-color',
            'border-right-color',
            'border-bottom-color',
            'border-left-color',
          ].includes(property)
        ) {
          if (
            !roleVar(
              value,
              Object.keys(design.theme).filter(k => k.startsWith('color.')),
            ) &&
            !['transparent', 'currentColor'].includes(value)
          )
            throw new DeckError('ARTIFACT_THEME_MISMATCH')
        } else if (property === 'font-family') {
          if (!roleVar(value, ['font.heading', 'font.body'])) throw new DeckError('ARTIFACT_THEME_MISMATCH')
        } else if (property === 'font-size') {
          if (!roleVar(value, ['type.display', 'type.heading', 'type.body', 'type.caption']))
            throw new DeckError('ARTIFACT_THEME_MISMATCH')
        } else if (property === 'line-height') {
          if (!roleVar(value, ['type.lineHeight'])) throw new DeckError('ARTIFACT_THEME_MISMATCH')
        } else if (!geometry.has(property))
          throw new DeckError('ARTIFACT_UNSAFE_CSS', [
            {
              code: 'ARTIFACT_UNSAFE_CSS',
              path: `style.${property.slice(0, 80)}`,
              message: 'Unsupported CSS property.',
              expected: [...geometry].join(', '),
            },
          ])
        // css-tree cannot type-check unresolved CSS variables. Resolve only the declared,
        // immutable roles for syntax checking; retain variables in the actual artifact.
        let resolved = value
        for (const [role, token] of Object.entries(design.theme))
          resolved = resolved.replaceAll(
            `var(--${role.replaceAll('.', '-')})`,
            `${token}${typeof token === 'number' && role !== 'type.lineHeight' ? 'px' : ''}`,
          )
        const match = lexer.matchProperty(property, parseCss(resolved, { context: 'value' }))
        if (match.error)
          throw new DeckError('ARTIFACT_UNSAFE_CSS', [
            {
              code: 'ARTIFACT_UNSAFE_CSS',
              path: `style.${property.slice(0, 80)}`,
              message: 'Invalid CSS value.',
              expected: 'A valid value for the supported property',
            },
          ])
      }
      if (node.type === 'Function' && node.name === 'var') {
        const value = generate(node)
        if (!roleVar(value, Object.keys(design.theme))) throw new DeckError('ARTIFACT_THEME_MISMATCH')
      }
    })
  } catch (error) {
    throw error instanceof DeckError ? error : new DeckError('ARTIFACT_UNSAFE_CSS')
  }
}

function visit(node: Node, operation: (node: Node) => void): void {
  operation(node)
  if ('childNodes' in node) for (const child of node.childNodes) visit(child, operation)
}

export function compileArtifact(source: string, design: DesignSnapshot, assets: readonly ArtifactAsset[]): string {
  try {
    if (!source.trim() || !source.isWellFormed() || source.includes('\0') || Buffer.byteLength(source) > 256 * 1024)
      throw new DeckError('ARTIFACT_SOURCE_INVALID')
    const root = parseFragment(source, {
      onParseError: () => {
        throw new DeckError('ARTIFACT_UNSAFE_HTML')
      },
    })
    let imageBytes = 0
    const usedAssets = new Set<string>()
    visit(root, node => {
      if (!('tagName' in node)) return
      if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !tags.has(node.tagName))
        throw new DeckError('ARTIFACT_UNSAFE_HTML')
      for (const a of node.attrs) {
        if (a.namespace || !htmlCapabilities.attributes.includes(a.name))
          throw new DeckError('ARTIFACT_UNSAFE_HTML', [
            {
              code: 'ARTIFACT_UNSAFE_HTML',
              path: `${node.tagName}@${a.name.slice(0, 80)}`,
              message: 'Unsupported HTML attribute.',
              expected: htmlCapabilities.attributes.join(', '),
            },
          ])
        if (a.name === 'style') css(a.value, true, design)
        if (a.name === 'src' && (node.tagName !== 'img' || !assets.some(asset => a.value === `asset:${asset.assetId}`)))
          throw new DeckError('ARTIFACT_ASSET_INVALID')
      }
      if (node.tagName === 'img' && !node.attrs.some(a => a.name === 'src'))
        throw new DeckError('ARTIFACT_ASSET_INVALID')
      if (node.tagName === 'img') {
        const asset = assets.find(a =>
          node.attrs.some(attr => attr.name === 'src' && attr.value === `asset:${a.assetId}`),
        )
        imageBytes += asset?.byteSize ?? 0
        if (asset) usedAssets.add(asset.assetId)
        if (imageBytes > 1024 * 1024) throw new DeckError('ARTIFACT_ASSET_INVALID')
      }
      if (node.tagName === 'style') css(node.childNodes.map(n => ('value' in n ? n.value : '')).join(''), false, design)
    })
    if (assets.some(asset => !usedAssets.has(asset.assetId))) throw new DeckError('ARTIFACT_ASSET_INVALID')
    const vars = Object.entries(design.theme)
      .map(
        ([role, value]) =>
          `--${role.replaceAll('.', '-')}:${value}${typeof value === 'number' && role !== 'type.lineHeight' ? 'px' : ''}`,
      )
      .join(';')
    const theme = `:root{${vars}}*{box-sizing:border-box}html,body{margin:0;width:1280px;height:720px;background:var(--color-background);color:var(--color-text);font-family:var(--font-body);font-size:var(--type-body);line-height:var(--type-lineHeight)}body{padding:calc(var(--space-unit)*4)}h1{font-family:var(--font-heading);font-size:var(--type-display)}h2,h3{font-family:var(--font-heading);font-size:var(--type-heading)}small,figcaption{font-size:var(--type-caption)}img{max-width:100%;max-height:100%;object-fit:contain}`
    const layoutPolicy =
      design.template.id === 'html-basic' && design.template.version === 3
        ? '<meta name="deckagent-layout-policy" content="html-layout-v3">'
        : ''
    return `<!doctype html><html><head><meta charset="utf-8">${layoutPolicy}<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>${theme}</style></head><body>${serialize(root)}</body></html>`
  } catch (error) {
    throw error instanceof DeckError ? error : new DeckError('ARTIFACT_UNSAFE_HTML')
  }
}

export function materializeArtifact(
  document: string,
  assets: readonly { readonly assetId: string; readonly bytes: Uint8Array }[],
): string {
  const root = parse(document)
  visit(root, node => {
    if (!('tagName' in node) || node.tagName !== 'img') return
    const src = node.attrs.find(a => a.name === 'src')
    const asset = assets.find(a => src?.value === `asset:${a.assetId}`)
    if (!src || !asset) throw new DeckError('ARTIFACT_ASSET_INVALID')
    src.value = `data:image/png;base64,${Buffer.from(asset.bytes).toString('base64')}`
  })
  return serialize(root)
}
