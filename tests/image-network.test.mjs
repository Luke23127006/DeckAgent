import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchPublicImage, isPublicAddress } from '../apps/local-web/lib/types/image-assets/network.js'

test('image egress rejects private/mapped/credential URLs before transport and rechecks every redirect', async () => {
  for (const address of [
    '127.0.0.1',
    '10.1.2.3',
    '169.254.169.254',
    '100.64.1.1',
    '192.168.1.1',
    '224.0.0.1',
    '::1',
    '::ffff:8.8.8.8',
    'fc00::1',
    '2001:db8::1',
    '2002:7f00:1::1',
  ])
    assert.equal(isPublicAddress(address), false, address)
  assert.equal(isPublicAddress('8.8.8.8'), true)
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true)
  let calls = 0
  const network = {
    async resolve() {
      return [{ address: '127.0.0.1', family: 4 }]
    },
    async request() {
      calls++
      throw Error('MUST_NOT_CONNECT')
    },
  }
  for (const url of [
    'file:///secret',
    'http://public.example/a.png',
    'https://u:p@public.example/a.png',
    'https://127.1/a.png',
    'https://public.example:8443/a.png',
    'https://public.example/a.png?api_key=SECRET',
    'https://public.example/a.png',
  ])
    await assert.rejects(fetchPublicImage(url, new AbortController().signal, network))
  assert.equal(calls, 0)
  const redirect = {
    async resolve(host) {
      return [{ address: host === 'public.example' ? '8.8.8.8' : '127.0.0.1', family: 4 }]
    },
    async request(_url, address) {
      calls++
      assert.equal(address.address, '8.8.8.8')
      return { status: 302, location: 'https://private.example/a.png', mime: '', bytes: new Uint8Array() }
    },
  }
  await assert.rejects(fetchPublicImage('https://public.example/a.png', new AbortController().signal, redirect))
  assert.equal(calls, 1)
})

test('checked address is pinned, mixed DNS fails closed, and late DNS cannot start transport after cancellation', async () => {
  let requests = 0,
    lookups = 0
  const network = {
    async resolve() {
      lookups++
      return [{ address: '8.8.8.8', family: 4 }]
    },
    async request(url, address) {
      requests++
      assert.equal(url.hostname, 'public.example')
      assert.deepEqual(address, { address: '8.8.8.8', family: 4 })
      return { status: 200, mime: 'image/png', bytes: new Uint8Array([1]) }
    },
  }
  await fetchPublicImage('https://public.example/image.png', new AbortController().signal, network)
  assert.equal(lookups, 1)
  assert.equal(requests, 1)
  await assert.rejects(
    fetchPublicImage('https://public.example/a', new AbortController().signal, {
      ...network,
      async resolve() {
        return [
          { address: '8.8.8.8', family: 4 },
          { address: '127.0.0.1', family: 4 },
        ]
      },
    }),
    /IMAGE_URL_DENIED/,
  )
  assert.equal(requests, 1)
  let resolveDns
  const abort = new AbortController(),
    waiting = new Promise(resolve => {
      resolveDns = resolve
    })
  const work = fetchPublicImage('https://public.example/a', abort.signal, { ...network, resolve: () => waiting })
  abort.abort()
  await assert.rejects(work)
  resolveDns([{ address: '8.8.8.8', family: 4 }])
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(requests, 1)
  for (const response of [
    { status: 200, mime: 'image/svg+xml', bytes: new Uint8Array([1]) },
    { status: 200, mime: 'image/png', bytes: new Uint8Array(5242881) },
  ])
    await assert.rejects(
      fetchPublicImage('https://public.example/a', new AbortController().signal, {
        ...network,
        request: async () => response,
      }),
      /IMAGE_FORMAT|IMAGE_LIMIT/,
    )
})
