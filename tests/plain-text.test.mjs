import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const source = readFileSync(new URL("../src/modules/client/utils/plain-text.ts", import.meta.url), "utf8")
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(code, { exports })
const { toPlainText } = exports

test("plain-text names remove rich markup while preserving language and block boundaries", () => {
  assert.equal(toPlainText("<p>柔式上门按摩3次</p>"), "柔式上门按摩3次")
  assert.equal(toPlainText("<p>Massage <strong>3 visits</strong></p>"), "Massage 3 visits")
  assert.equal(toPlainText("<div>Cleaning</div><p>3 visits<br>90 days</p>"), "Cleaning 3 visits 90 days")
  assert.equal(toPlainText("<p><br></p>"), "")
  assert.equal(toPlainText(null), "")
})

test("plain-text names decode entities and exclude hidden executable or style content", () => {
  assert.equal(toPlainText("<p>Massage&nbsp;&amp;&nbsp;Spa &#51; visits</p>"), "Massage & Spa 3 visits")
  assert.equal(toPlainText("&lt;p&gt;柔式按摩&lt;/p&gt;"), "柔式按摩")
  assert.equal(toPlainText('<script>alert("test")</script><style>p{color:red}</style><p>Massage</p><!-- note -->'), "Massage")
  assert.equal(toPlainText("<script>doNotExecute()</script>"), "")
})
