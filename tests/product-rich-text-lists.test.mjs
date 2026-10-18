import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileStyle } from "@vue/compiler-sfc"

const root = new URL("../", import.meta.url)
const pages = [
  {
    name: "Web",
    path: "src/modules/client/pages/product-detail.vue",
    container: ".product-rich-text",
  },
  {
    name: "H5",
    path: "src/modules/h5/pages/product-detail.vue",
    container: ".h5-detail-html",
  },
]

for (const page of pages) {
  test(`${page.name} preserves Quill 2 bullet and ordered list markers`, () => {
    const filename = new URL(page.path, root)
    const source = readFileSync(filename, "utf8")
    const { descriptor } = parse(source, { filename: page.path })
    const style = descriptor.styles[0]
    const styleSource = style.src
      ? readFileSync(new URL(style.src, filename), "utf8")
      : style.content
    const result = compileStyle({
      source: styleSource,
      filename: page.path,
      id: "data-v-rich-text-test",
      scoped: style.scoped,
      preprocessLang: style.lang,
    })

    assert.deepEqual(result.errors, [])
    assert.ok(
      result.code.includes(
        `${page.container}[data-v-rich-text-test] li[data-list="bullet"] {\n  list-style-type: disc;\n}`,
      ),
    )
    assert.ok(
      result.code.includes(
        `${page.container}[data-v-rich-text-test] li[data-list="ordered"] {\n  list-style-type: decimal;\n}`,
      ),
    )
    assert.ok(
      result.code.includes(
        `${page.container}[data-v-rich-text-test] li[data-list] > .ql-ui {\n  display: none;\n}`,
      ),
    )
  })
}
