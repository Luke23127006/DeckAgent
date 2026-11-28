import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const TARGET_PATTERN = /^(apps\/[^/]+|packages\/(?:[^/]+\/)*[^/]+)\/src\//

const TARGET_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.css', '.html', '.json']

// The Vietnamese letters: the Latin-1 vowels with a tone mark, ă â đ ê ô ơ ư, and the Latin Extended Additional block.
const VIETNAMESE = /[àáâãèéêìíòóôõùúýăđĩũơưÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠ-ỹ]/u

export const RULE = 'source-language'

export const MESSAGE =
  'Vietnamese text is not permitted in production source. Write strings, messages and comments in English. For a message that a user or an agent reads, use the asd-ste100 skill. See docs/conventions/code.md.'

const toPosix = value => value.replaceAll('\\', '/')

/** Production source is each file under the src folder of an app or a package. Tests and scripts can contain Vietnamese sample data. */
export const isSourceLanguageTarget = relativePath => {
  const normalized = toPosix(relativePath)
  return TARGET_PATTERN.test(normalized) && TARGET_EXTENSIONS.some(extension => normalized.endsWith(extension))
}

/** Returns one finding for each line that contains a Vietnamese letter. */
export const checkSourceLanguage = sourceText =>
  sourceText.split(/\r?\n/).flatMap((text, index) => (VIETNAMESE.test(text) ? [{ line: index + 1, rule: RULE }] : []))

export const formatFinding = (relativePath, finding) => `${relativePath}:${finding.line} ${finding.rule} ${MESSAGE}`

const main = () => {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
    .split('\n')
    .filter(isSourceLanguageTarget)
  const lines = files.flatMap(file => {
    try {
      return checkSourceLanguage(readFileSync(file, 'utf8')).map(finding => formatFinding(file, finding))
    } catch (error) {
      if (error?.code === 'ENOENT') return []
      throw error
    }
  })
  for (const line of lines) process.stderr.write(`${line}\n`)
  process.stdout.write(`check-source-language: ${files.length} file(s) checked, ${lines.length} finding(s)\n`)
  process.exit(lines.length === 0 ? 0 : 1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
