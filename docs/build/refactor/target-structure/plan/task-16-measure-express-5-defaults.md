# Task 16: Measure the Express 5 defaults

Read this file to learn the steps of Task 16, which measures the Express 5.2.1 defaults that can change the HTTP contract, and then stops.

The report of Task 10 compares the current server with a list of Express 5 defaults (E1 to E10). The planner wrote the list without a run of Express. The Express tasks of Revision 2c configure Express from this list, so each item needs a measurement first. This task runs one script against Express 5.2.1 in a temporary folder outside the repository. It changes no file in the repository other than the plan and report files. It does not design the Express app.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/target-structure/plan/task-10-diagnose-shared-http-behavior.md` (section `## Express 5 defaults`)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-16-measure-express-5-defaults.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-16-measure-express-5-defaults.md`
- Outside the repository: the temporary folder from Step 2, with `package.json`, `node_modules/` and `spike.mjs`

**Interfaces:**

- Uses: the package `express` at version `5.2.1` from the npm registry.
- Produces: a report table `ID | Planner expectation | Observed line | Match`, with one row for each line that `spike.mjs` prints.

**STOP when:**

- The output of a command does not match `Expected`. A row with `Match` = `no` is not a STOP condition. It is the result of this task.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The install in Step 2 needs a network that is not available.
- `git status --short` shows a change outside the four repository files in `Files`.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Install a package in the repository, or add `express` to a `package.json` in the repository.
- Change `spike.mjs`. When a line does not match, record it. Do not try to make it match.
- Propose an Express configuration or a middleware.

## Planner expectations

| ID | Planner expectation |
| --- | --- |
| E1 | `E1 x-powered-by=Express` |
| E2 | `E2 etag=present` |
| E3 | `E3 HEAD status=200` |
| E4 | `E4 /API/sessions status=200` and `E4 /api/sessions/ status=200` |
| E5 | `E5 status=404 type=text/html; charset=utf-8 body-has-Cannot-GET=true` |
| E6 | `E6 status=500 type=text/html; charset=utf-8` |
| E7 | `E7 %20 status=200 body={"id":"a b"}` and `E7 101 chars status=200` |
| E8 | `E8 query body={"a":["1","2"],"b[c]":"1"}` |
| E9 | `E9 status=200 allow=GET, HEAD` |
| E10 | `E10 status=503 body={"caught":"spike failure"}` |
| E11 | `E11 inline parameter pattern=rejected (PathError)` |
| C1 | `C1 x-powered-by=absent` |
| C2 | `C2 etag=absent` |
| C3 | `C3 /API/sessions status=404` |
| C4 | `C4 /api/sessions/ status=404` |

The planner ran `spike.mjs` one time on 2026-11-26 with Express 5.2.1 and Node.js v22.23.5. The expectations are the output of that run. E11 checks whether a route path can hold a regular expression for a parameter, for example `:id([0-9]+)`. C1 to C4 check the four settings `x-powered-by`, `etag`, `case sensitive routing` and `strict routing`.

- [ ] **Step 1: Check the start state**

Run: `git status --short && node --version`

Expected: PASS. `git status --short` prints no line. The Node.js version starts with `v22.` or a major version of 24 or higher.

- [ ] **Step 2: Create the temporary folder and install Express**

Run: `SPIKE=$(mktemp -d) && echo "$SPIKE" && cd "$SPIKE" && printf '{ "name": "express-spike", "private": true, "type": "module" }\n' > package.json && corepack pnpm@11.28.5 add express@5.2.1`

Expected: PASS. The first line is a folder path outside `C:/Users/Duy/Desktop/DeckAgent`. The output contains `+ express 5.2.1`. Write the folder path in the report.

- [ ] **Step 3: Write `spike.mjs` in the temporary folder**

Write the text below as the complete file `spike.mjs` in the folder from Step 2. Do not copy the outer fence.

```js
import { once } from 'node:events'
import { request } from 'node:http'
import express from 'express'

function send(port, method, path) {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method, path }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }),
      )
    })
    req.on('error', reject)
    req.end()
  })
}

async function listen(app) {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  return { server, port: server.address().port }
}

function routes(app) {
  app.get('/api/sessions', (_req, res) => res.json([]))
  app.get('/api/sessions/:id/history', (req, res) => res.json({ id: req.params.id }))
  app.get('/q', (req, res) => res.json(req.query))
  app.get('/fail', async () => {
    throw new Error('spike failure')
  })
}

const plain = express()
routes(plain)
const a = await listen(plain)
const sessions = await send(a.port, 'GET', '/api/sessions')
console.log(`E1 x-powered-by=${sessions.headers['x-powered-by'] ?? 'absent'}`)
console.log(`E2 etag=${sessions.headers.etag === undefined ? 'absent' : 'present'}`)
console.log(`E3 HEAD status=${(await send(a.port, 'HEAD', '/api/sessions')).status}`)
console.log(`E4 /API/sessions status=${(await send(a.port, 'GET', '/API/sessions')).status}`)
console.log(`E4 /api/sessions/ status=${(await send(a.port, 'GET', '/api/sessions/')).status}`)
const missing = await send(a.port, 'GET', '/missing')
console.log(`E5 status=${missing.status} type=${missing.headers['content-type']} body-has-Cannot-GET=${missing.text.includes('Cannot GET /missing')}`)
const failed = await send(a.port, 'GET', '/fail')
console.log(`E6 status=${failed.status} type=${failed.headers['content-type']}`)
const encoded = await send(a.port, 'GET', '/api/sessions/a%20b/history')
console.log(`E7 %20 status=${encoded.status} body=${encoded.text}`)
const long = await send(a.port, 'GET', `/api/sessions/${'a'.repeat(101)}/history`)
console.log(`E7 101 chars status=${long.status}`)
console.log(`E8 query body=${(await send(a.port, 'GET', '/q?a=1&a=2&b[c]=1')).text}`)
const options = await send(a.port, 'OPTIONS', '/api/sessions')
console.log(`E9 status=${options.status} allow=${options.headers.allow ?? 'absent'}`)
a.server.close()

const handled = express()
routes(handled)
handled.use((error, _req, res, _next) => res.status(503).json({ caught: error.message }))
const b = await listen(handled)
const caught = await send(b.port, 'GET', '/fail')
console.log(`E10 status=${caught.status} body=${caught.text}`)
b.server.close()

try {
  express.Router().get('/api/sessions/:id([0-9]+)/history', (_req, res) => res.end())
  console.log('E11 inline parameter pattern=accepted')
} catch (error) {
  console.log(`E11 inline parameter pattern=rejected (${error.constructor.name})`)
}

const configured = express()
configured.disable('x-powered-by')
configured.set('etag', false)
configured.set('case sensitive routing', true)
configured.set('strict routing', true)
routes(configured)
const c = await listen(configured)
const strict = await send(c.port, 'GET', '/api/sessions')
console.log(`C1 x-powered-by=${strict.headers['x-powered-by'] ?? 'absent'}`)
console.log(`C2 etag=${strict.headers.etag === undefined ? 'absent' : 'present'}`)
console.log(`C3 /API/sessions status=${(await send(c.port, 'GET', '/API/sessions')).status}`)
console.log(`C4 /api/sessions/ status=${(await send(c.port, 'GET', '/api/sessions/')).status}`)
c.server.close()
```

- [ ] **Step 4: Run the script**

Run: `cd "<folder from Step 2>" && node spike.mjs 2>/dev/null`

Expected: PASS. The command exits with code 0. The output has 17 lines. Express writes the stack of `spike failure` to stderr, and `2>/dev/null` hides it. The lines start with `E1`, `E2`, `E3`, `E4`, `E4`, `E5`, `E6`, `E7`, `E7`, `E8`, `E9`, `E10`, `E11`, `C1`, `C2`, `C3` and `C4`, in this order.

Copy the full output into the report. For each line, compare it with the [Planner expectations](#planner-expectations) and write `yes` or `no` in `Match`.

- [ ] **Step 5: Check that the repository did not change**

Run: `cd C:/Users/Duy/Desktop/DeckAgent && git status --short`

Expected: PASS. The output names only files in `docs/build/refactor/target-structure/`.

- [ ] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 16 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-16-measure-express-5-defaults.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-16-measure-express-5-defaults.md` with:
   - H1 `# Task 16: Measure the Express 5 defaults report` and the purpose line `Read this file to learn how Express 5.2.1 behaves for each default that can change the HTTP contract of the Local Host.`
   - Files changed: the list of files, and the temporary folder.
   - Commands run, with exit codes and key output of each command.
   - The full output of Step 4.
   - The table `ID | Planner expectation | Observed line | Match`.
   - What the commands do not prove: the script runs one request for each default on Express 5.2.1 with no middleware. A later version of Express can behave differently. The script does not run the Local Host.
3. Add a row for Task 16 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-16-measure-express-5-defaults.md`. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

**STOP** and send the report summary. Revision 2c starts after a person approves the reports of Tasks 13 to 16.
