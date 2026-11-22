import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const blank = text => text.replace(/[^\n]/g, ' ')

const normalize = text => text.replaceAll('\r\n', '\n')

const maskFences = text => {
  let inFence = false
  return text
    .split('\n')
    .map(line => {
      if (line.startsWith('```')) {
        inFence = !inFence
        return blank(line)
      }
      return inFence ? blank(line) : line
    })
    .join('\n')
}

const maskCode = text => maskFences(text).replace(/`[^`\n]*`/g, match => blank(match))

const lineOf = (text, index) => text.slice(0, index).split('\n').length

export const githubSlug = heading =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replaceAll(' ', '-')

export const isDocsTarget = relativePath =>
  relativePath === 'AGENTS.md' ||
  relativePath === 'LESSONS.md' ||
  (relativePath.startsWith('docs/') && relativePath.endsWith('.md') && !relativePath.startsWith('docs/00-old/'))

const collectAnchors = text => {
  const anchors = new Set()
  const seen = new Map()
  for (const line of maskFences(normalize(text)).split('\n')) {
    const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)
    if (!heading) continue
    const slug = githubSlug(heading[1])
    const count = seen.get(slug) ?? 0
    seen.set(slug, count + 1)
    anchors.add(count === 0 ? slug : `${slug}-${count}`)
  }
  for (const match of normalize(text).matchAll(/<a id="([^"]+)"/g)) anchors.add(match[1])
  return anchors
}

const linkPattern = /\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

const safeDecode = value => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const isExternal = target => /^(https?:|mailto:)/.test(target)

const purposeMessage =
  'The first line after the heading must be one sentence that starts with "Đọc file này để biết" or "Read this file to". See docs/conventions/docs.md#cấu-trúc-file.'

export const checkMarkdown = (relativePath, rawText, io) => {
  const text = normalize(rawText)
  const lines = text.split('\n')
  const masked = maskCode(text)
  const errors = []
  const add = (line, rule, message) => errors.push({ line, rule, message })

  if (!lines[0].startsWith('# ')) {
    add(1, 'h1-first-line', 'Line 1 must be a level-1 heading ("# Title"). See docs/conventions/docs.md#cấu-trúc-file.')
  }

  const purposeIndex = lines.findIndex((line, index) => index > 0 && line.trim() !== '')
  const purpose = purposeIndex === -1 ? '' : lines[purposeIndex].trim()
  const purposeOk =
    /^(Đọc file này (để biết|để|giúp)|Read this file to) .+\.$/.test(purpose) && !/\.\s+\S/.test(purpose)
  if (!purposeOk) add(purposeIndex === -1 ? 1 : purposeIndex + 1, 'purpose-line', purposeMessage)

  const cited = []
  for (const match of masked.matchAll(/\[\[[^\]]*\]\](\(#ref-(\d+)\))?/g)) {
    const line = lineOf(masked, match.index)
    if (!/^\[\[(\d+)\]\]\(#ref-\1\)$/.test(match[0])) {
      add(
        line,
        'citation-format',
        'Write a citation as [[n]](#ref-n), with the number only. See docs/conventions/docs.md#trích-dẫn-nguồn.',
      )
    }
    const number = /^\[\[\s*(\d+)/.exec(match[0])
    if (number && !cited.some(entry => entry.number === number[1])) cited.push({ number: number[1], line })
  }

  const entries = []
  masked.split('\n').forEach((line, index) => {
    const entry = /^(\d+)\. <a id="ref-\1"><\/a>/.exec(line)
    if (entry) entries.push({ number: entry[1], line: index + 1 })
  })

  for (const { number, line } of cited) {
    if (!entries.some(entry => entry.number === number)) {
      add(line, 'citation-undefined', `Citation [[${number}]] has no entry in "## References". Add the entry.`)
    }
  }
  for (const { number, line } of entries) {
    if (!cited.some(entry => entry.number === number)) {
      add(line, 'reference-unused', `Reference ${number} has no citation in the text. Cite it or remove it.`)
    }
  }
  const inOrder = cited.every((entry, index) => entry.number === String(index + 1))
  if (!inOrder) add(cited[0].line, 'citation-order', 'Number the citations 1, 2, 3 in the order of their first use.')

  const fenceMasked = maskFences(text).split('\n')
  const referencesIndex = fenceMasked.findIndex(line => line.trim() === '## References')
  if (referencesIndex !== -1) {
    fenceMasked.forEach((line, index) => {
      if (index > referencesIndex && line.startsWith('## ')) {
        add(index + 1, 'references-last', '"## References" must be the last section.')
      }
    })
  }

  const ownAnchors = collectAnchors(text)
  for (const match of masked.matchAll(linkPattern)) {
    const target = match[1]
    if (isExternal(target) || /^#ref-\d+$/.test(target)) continue
    const line = lineOf(masked, match.index)
    const hashIndex = target.indexOf('#')
    const filePart = safeDecode(hashIndex === -1 ? target : target.slice(0, hashIndex))
    const anchor = hashIndex === -1 ? '' : safeDecode(target.slice(hashIndex + 1)).toLowerCase()
    let targetAnchors = ownAnchors
    let targetName = relativePath
    if (filePart !== '') {
      const resolved = path.posix.join(path.posix.dirname(relativePath), filePart)
      if (!io.exists(resolved)) {
        add(line, 'link-file', `Link target "${filePart}" does not exist.`)
        continue
      }
      if (anchor === '' || !resolved.endsWith('.md')) continue
      targetAnchors = collectAnchors(io.readFile(resolved))
      targetName = filePart
    }
    if (anchor !== '' && !targetAnchors.has(anchor)) {
      add(line, 'link-anchor', `Link anchor "#${anchor}" does not exist in "${targetName}".`)
    }
  }

  return errors.toSorted((a, b) => a.line - b.line)
}

export const findUnlisted = (relativePaths, readFile) => {
  const known = new Set(relativePaths)
  const errors = []
  for (const file of relativePaths) {
    if (!isDocsTarget(file) || !file.startsWith('docs/') || path.posix.basename(file) === 'README.md') continue
    let directory = path.posix.dirname(file)
    let readme = null
    while (readme === null) {
      const candidate = `${directory}/README.md`
      if (known.has(candidate)) readme = candidate
      else if (directory === 'docs' || directory === '.') break
      else directory = path.posix.dirname(directory)
    }
    let listed = false
    if (readme !== null) {
      const readmeText = maskCode(normalize(readFile(readme)))
      for (const match of readmeText.matchAll(linkPattern)) {
        if (isExternal(match[1])) continue
        const filePart = safeDecode(match[1].split('#')[0])
        if (filePart !== '' && path.posix.join(path.posix.dirname(readme), filePart) === file) listed = true
      }
    }
    if (!listed) {
      errors.push({
        path: file,
        line: 1,
        rule: 'unlisted-file',
        message: 'No README.md links to this file. Add a link in the nearest README.md.',
      })
    }
  }
  return errors
}

const run = () => {
  const output = execFileSync(
    'git',
    ['-c', 'core.quotePath=false', 'ls-files', '--cached', '--others', '--exclude-standard'],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  )
  const targets = output
    .split('\n')
    .map(entry => entry.trim())
    .filter(entry => entry !== '' && isDocsTarget(entry) && existsSync(entry))
  const io = { exists: existsSync, readFile: file => readFileSync(file, 'utf8') }
  const failures = []
  for (const target of targets) {
    for (const error of checkMarkdown(target, io.readFile(target), io)) failures.push({ path: target, ...error })
  }
  failures.push(...findUnlisted(targets, io.readFile))
  for (const failure of failures) console.log(`${failure.path}:${failure.line} ${failure.rule} ${failure.message}`)
  const fileCount = new Set(failures.map(failure => failure.path)).size
  console.log(`check-docs: ${targets.length} file(s) checked, ${failures.length} error(s) in ${fileCount} file(s)`)
  process.exit(failures.length > 0 ? 1 : 0)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run()
