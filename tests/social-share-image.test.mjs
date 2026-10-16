import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const meta = (html, name) => {
  const tag = [...html.matchAll(/<meta\b[^>]*>/g)]
    .map(match => match[0])
    .find(item => item.includes(`property="${name}"`) || item.includes(`name="${name}"`))
  return tag?.match(/content="([^"]+)"/)?.[1]
}

for (const entry of ['index.html', 'h5.html']) {
  test(`${entry} uses a compact text-only share preview`, () => {
    const html = read(entry)
    assert.equal(meta(html, 'og:image'), undefined)
    assert.equal(meta(html, 'twitter:image'), undefined)
    assert.ok(meta(html, 'og:title'))
    assert.ok(meta(html, 'og:description'))
    assert.ok(meta(html, 'og:url'))
    assert.equal(meta(html, 'twitter:card'), 'summary')
  })
}
