import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as Vue from 'vue'

const source = readFileSync(new URL('../src/modules/admin/utils/documentPreview.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const loadModule = (fetch) => {
  const exports = {}
  runInNewContext(code, { exports, Blob, fetch })
  return exports
}
const pdf = '%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF'

test('an attachment response with generic binary MIME becomes a local PDF blob', async () => {
  const { loadPdfPreviewBlob } = loadModule(async () => new Response(pdf, {
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': 'attachment; filename="licence.pdf"',
    },
  }))
  const result = await loadPdfPreviewBlob('https://files.example/licence.pdf')
  assert.equal(result.type, 'application/pdf')
  assert.equal(await result.text(), pdf)
})

test('PDF recognition uses bytes even when the URL has no PDF extension', async () => {
  const { loadPdfPreviewBlob } = loadModule(async () => new Response(pdf))
  const result = await loadPdfPreviewBlob('https://files.example/object?id=42')
  assert.equal(result.type, 'application/pdf')
  assert.equal(await result.text(), pdf)
})

test('a PDF header within the first kilobyte is accepted and all original bytes are retained', async () => {
  const content = '\0'.repeat(16) + pdf
  const { loadPdfPreviewBlob } = loadModule(async () => new Response(content))
  assert.equal(await (await loadPdfPreviewBlob('/document')).text(), content)
})

test('HTML masquerading as a PDF and an empty response are rejected', async () => {
  for (const content of ['<!doctype html><title>Expired link</title>', '']) {
    const { loadPdfPreviewBlob, UnsupportedDocumentError } = loadModule(async () => new Response(content, {
      headers: { 'content-type': 'application/pdf' },
    }))
    await assert.rejects(loadPdfPreviewBlob('/licence.pdf'), UnsupportedDocumentError)
  }
})

test('a signature outside the inspected first kilobyte is rejected', async () => {
  const { loadPdfPreviewBlob, UnsupportedDocumentError } = loadModule(async () => new Response('x'.repeat(1024) + pdf))
  await assert.rejects(loadPdfPreviewBlob('/licence.pdf'), UnsupportedDocumentError)
})

test('an unsuccessful HTTP response is rejected before its body is read', async () => {
  let bodyRead = false
  const { loadPdfPreviewBlob } = loadModule(async () => ({
    ok: false,
    status: 403,
    blob: async () => { bodyRead = true; return new Blob([pdf]) },
  }))
  await assert.rejects(loadPdfPreviewBlob('/licence.pdf'), /HTTP 403/)
  assert.equal(bodyRead, false)
})

test('fetch receives the abort signal and only same-origin credentials', async () => {
  const controller = new AbortController()
  const calls = []
  const { loadPdfPreviewBlob } = loadModule(async (url, options) => {
    calls.push({ url, options })
    return new Response(pdf)
  })
  await loadPdfPreviewBlob('https://files.example/licence.pdf', controller.signal)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://files.example/licence.pdf')
  assert.equal(calls[0].options.signal, controller.signal)
  assert.equal(calls[0].options.credentials, 'same-origin')
  assert.equal(calls[0].options.headers, undefined)
  assert.equal(calls[0].options.mode, undefined)
})

test('request cancellation and network errors propagate unchanged', async () => {
  const aborted = new DOMException('The request was aborted.', 'AbortError')
  const network = new TypeError('Failed to fetch')
  for (const error of [aborted, network]) {
    const { loadPdfPreviewBlob } = loadModule(async () => { throw error })
    await assert.rejects(loadPdfPreviewBlob('/licence.pdf'), (received) => received === error)
  }
})

const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const filename = 'src/modules/admin/components/SupplierDocumentPreview.vue'
const { descriptor, errors } = parse(readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8'), { filename })
assert.deepEqual(errors, [])
const previewScript = compileScript(descriptor, { id: 'supplier-document-preview-test' })
const previewTemplate = compileTemplate({
  source: descriptor.template.content,
  filename,
  id: 'supplier-document-preview-test',
  compilerOptions: { bindingMetadata: previewScript.bindings },
})
assert.deepEqual(previewTemplate.errors, [])
const previewRender = {}
runInNewContext(transpile(previewTemplate.code), { exports: previewRender, require: () => Vue })
const flush = async () => {
  for (let index = 0; index < 32; index++) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const allNodes = (node) => [node, ...(node.children || []).flatMap(allNodes)]
const removeNode = (node) => {
  const children = node.parent?.children
  const index = children?.indexOf(node) ?? -1
  if (index >= 0) children.splice(index, 1)
  node.parent = null
}
const insertNode = (node, parent, anchor) => {
  if (node.parent) removeNode(node)
  const children = parent.children ||= []
  const index = anchor ? children.indexOf(anchor) : -1
  children.splice(index < 0 ? children.length : index, 0, node)
  node.parent = parent
}
const renderer = Vue.createRenderer({
  createElement: (type) => ({ type, props: {}, children: [] }),
  createText: (text) => ({ type: '#text', text }),
  createComment: () => ({ type: '#comment' }),
  insert: insertNode,
  remove: removeNode,
  setText: (node, text) => { node.text = text },
  setElementText(node, text) { node.text = text; node.children = [] },
  patchProp: (node, key, _before, after) => { node.props[key] = after },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  insertStaticContent(content, parent, anchor) {
    const node = { type: '#static', text: content.replace(/<[^>]+>/g, '') }
    insertNode(node, parent, anchor)
    return [node, node]
  },
})

async function previewHarness(t, overrides = {}) {
  const calls = { requests: [], created: [], revoked: [], renderErrors: [] }
  const control = { fetch: overrides.fetch || (async () => new Response(pdf)) }
  const props = Vue.reactive({
    url: 'https://files.example/licence.pdf', name: 'licence.pdf', kind: 'pdf', active: true,
    ...overrides.props,
  })
  const utilities = loadModule((url, options) => {
    calls.requests.push({ url, options })
    return control.fetch(url, options)
  })
  const exports = {}
  runInNewContext(transpile(previewScript.content), {
    exports,
    AbortController,
    URL: {
      createObjectURL: (blob) => {
        const url = `blob:document-${calls.created.length + 1}`
        calls.created.push({ blob, url })
        return url
      },
      revokeObjectURL: (url) => calls.revoked.push(url),
    },
    require: (name) => {
      if (name === 'vue') return Vue
      if (name === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) }
      if (name === '@/modules/admin/utils/documentPreview') return utilities
      throw new Error(`Unexpected document preview dependency: ${name}`)
    },
  })
  const component = { ...exports.default, render: previewRender.render }
  let instance
  const app = renderer.createApp({ setup: () => () => Vue.h(component, {
    ...props, ref: (value) => { if (value) instance = value },
  }) })
  app.component('ElButton', { setup: (_props, { slots }) => () => Vue.h('button', slots.default?.()) })
  app.config.warnHandler = () => {}
  app.config.errorHandler = (error) => calls.renderErrors.push(error)
  const container = { children: [] }
  app.mount(container)
  let disposed = false
  const unmount = () => { if (!disposed) { app.unmount(); disposed = true } }
  t.after(() => {
    unmount()
    assert.deepEqual(calls.renderErrors, [])
  })
  await flush()
  return { state: instance.$.setupState, props, control, calls, container, unmount }
}

test('the real preview renders a typed local blob and never puts the remote PDF URL in an iframe', async (t) => {
  const request = deferred()
  const { state, calls, container } = await previewHarness(t, { fetch: () => request.promise })
  assert.equal(state.loading, true)
  assert.equal(state.previewUrl, '')
  assert.equal(allNodes(container).some((node) => node.type === 'iframe'), false)
  request.resolve(new Response(pdf, { headers: { 'content-type': 'application/octet-stream' } }))
  await flush()
  assert.equal(state.loading, false)
  assert.equal(state.previewUrl, 'blob:document-1')
  const frame = allNodes(container).find((node) => node.type === 'iframe')
  assert.equal(frame.props.src, 'blob:document-1')
  assert.notEqual(frame.props.src, calls.requests[0].url)
  assert.equal(calls.created[0].blob.type, 'application/pdf')
})

test('switching files aborts the old request and a late result cannot replace the current PDF', async (t) => {
  const first = deferred(), second = deferred()
  const { state, props, calls, container } = await previewHarness(t, {
    fetch: (url) => url.includes('licence.pdf') ? first.promise : second.promise,
  })
  props.url = 'https://files.example/insurance.pdf'
  props.name = 'insurance.pdf'
  await flush()
  assert.equal(calls.requests[0].options.signal.aborted, true)
  assert.equal(calls.requests.length, 2)
  second.resolve(new Response(pdf))
  await flush()
  const currentUrl = state.previewUrl
  first.resolve(new Response(pdf))
  await flush()
  assert.equal(state.previewUrl, currentUrl)
  assert.equal(calls.created.length, 1)
  assert.equal(allNodes(container).find((node) => node.type === 'iframe').props.title, 'insurance.pdf')
})

test('closing and unmounting abort active work and revoke the displayed blob URL', async (t) => {
  for (const action of ['close', 'unmount']) {
    const { state, props, calls, unmount } = await previewHarness(t)
    assert.equal(state.previewUrl, 'blob:document-1')
    if (action === 'close') props.active = false
    else unmount()
    await flush()
    assert.equal(calls.requests[0].options.signal.aborted, true)
    assert.deepEqual(calls.revoked, ['blob:document-1'])
    if (action === 'close') assert.equal(state.previewUrl, '')
  }
})

test('closing or unmounting during a pending read cannot create a late blob URL', async (t) => {
  for (const action of ['close', 'unmount']) {
    const request = deferred()
    const { state, props, calls, unmount } = await previewHarness(t, { fetch: () => request.promise })
    if (action === 'close') props.active = false
    else unmount()
    await flush()
    assert.equal(calls.requests[0].options.signal.aborted, true)
    request.resolve(new Response(pdf))
    await flush()
    assert.equal(calls.created.length, 0)
    assert.equal(state.previewUrl, '')
  }
})

test('network or CORS failures render an error and an explicit download action without a remote iframe fallback', async (t) => {
  const { state, props, calls, container } = await previewHarness(t, {
    fetch: async () => { throw new TypeError('Failed to fetch') },
  })
  assert.equal(state.loading, false)
  assert.equal(state.error, 'load')
  assert.equal(state.previewUrl, '')
  assert.equal(calls.created.length, 0)
  assert.equal(allNodes(container).some((node) => node.type === 'iframe'), false)
  assert.ok(allNodes(container).some((node) => node.props?.role === 'alert'))
  const download = allNodes(container).find((node) => node.type === 'a')
  assert.equal(download.props.href, props.url)
  assert.equal(download.props.download, props.name)
})

test('images keep direct preview and do not fetch or create a blob', async (t) => {
  const { state, calls, container } = await previewHarness(t, {
    props: { kind: 'image', url: 'https://files.example/licence.jpg', name: 'licence.jpg' },
  })
  assert.equal(state.previewUrl, 'https://files.example/licence.jpg')
  assert.deepEqual(calls.requests, [])
  assert.deepEqual(calls.created, [])
  assert.equal(allNodes(container).find((node) => node.type === 'img').props.src, state.previewUrl)
})

test('the rendered retry action recovers from a failed load', async (t) => {
  const { state, calls, control, container } = await previewHarness(t, {
    fetch: async () => { throw new TypeError('Failed to fetch') },
  })
  assert.equal(state.error, 'load')
  const retry = allNodes(container).find((node) => node.type === 'button')
  assert.ok(retry)
  control.fetch = async () => new Response(pdf)
  retry.props.onClick()
  await flush()
  assert.equal(calls.requests.length, 2)
  assert.equal(state.error, '')
  assert.equal(state.previewUrl, 'blob:document-1')
  assert.equal(allNodes(container).find((node) => node.type === 'iframe').props.src, state.previewUrl)
})
