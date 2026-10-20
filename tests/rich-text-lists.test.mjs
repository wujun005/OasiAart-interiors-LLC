import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeRichTextHtml } from '../src/modules/client/utils/richText.ts'

test('quill bullet indents stay nested bullets instead of one numbered list', () => {
  const html = [
    '<p>Intro</p>',
    '<ol>',
    '<li data-list="ordered">Bathroom Cleaning</li>',
    '<li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Cleaning Materials: products included.</li>',
    '<li data-list="bullet" class="ql-indent-1"><span class="ql-ui" contenteditable="false"></span>4-Visit Package</li>',
    '<li data-list="bullet" class="ql-indent-2"><span class="ql-ui" contenteditable="false"></span>Studio: 1 cleaner</li>',
    '<li data-list="bullet" class="ql-indent-2"><span class="ql-ui" contenteditable="false"></span>1 BHK: 2 cleaners</li>',
    '<li data-list="bullet" class="ql-indent-1"><span class="ql-ui" contenteditable="false"></span>8-Visit Package</li>',
    '<li data-list="bullet" class="ql-indent-2"><span class="ql-ui" contenteditable="false"></span>Studio: 2 cleaners</li>',
    '</ol>',
  ].join('')

  assert.equal(
    normalizeRichTextHtml(html),
    [
      '<p>Intro</p>',
      '<ol><li>Bathroom Cleaning</li></ol>',
      '<ul><li>Cleaning Materials: products included.',
      '<ul><li>4-Visit Package',
      '<ul><li>Studio: 1 cleaner</li><li>1 BHK: 2 cleaners</li></ul>',
      '</li><li>8-Visit Package',
      '<ul><li>Studio: 2 cleaners</li></ul>',
      '</li></ul></li></ul>',
    ].join(''),
  )
})

test('plain text stays escaped and ordinary lists stay untouched', () => {
  assert.equal(normalizeRichTextHtml('Line 1\nA < B'), '<p>Line 1<br>A &lt; B</p>')
  assert.equal(normalizeRichTextHtml('<ul><li>Keep me</li></ul>'), '<ul><li>Keep me</li></ul>')
})
