import assert from 'node:assert/strict';
import test from 'node:test';
import { chunkText } from './chunk-text.ts';

function check(text: string, limit: number): void {
  const chunks = chunkText(text, limit);
  assert.equal(chunks.map(c => c.text).join(''), text);
  let offset = 0;
  chunks.forEach((chunk, index) => {
    assert.equal(chunk.index, index);
    assert.equal(chunk.start, offset);
    assert.equal(chunk.text, text.slice(chunk.start, chunk.end));
    assert.ok(chunk.text.length > 0);
    assert.equal(chunk.bytes, Buffer.byteLength(chunk.text, 'utf8'));
    assert.ok(chunk.bytes <= limit);
    // No boundary through a valid UTF-16 surrogate pair.
    if (chunk.end < text.length) {
      const left = text.charCodeAt(chunk.end - 1);
      const right = text.charCodeAt(chunk.end);
      assert.ok(!(left >= 0xd800 && left <= 0xdbff && right >= 0xdc00 && right <= 0xdfff));
    }
    offset = chunk.end;
  });
  assert.equal(offset, text.length);
}

test('empty input has no requests', () => assert.deepEqual(chunkText(''), []));
test('exact byte limit stays in one request', () => assert.equal(chunkText('abcd', 4).length, 1));
test('preserves whitespace and paragraph boundaries', () => {
  const text = 'First paragraph.\n\nSecond paragraph has more words.';
  assert.equal(chunkText(text, 24)[0].text, 'First paragraph.\n\n');
  check(text, 24);
  check('   \n\n\t  '.repeat(15), 7);
});
test('prefers sentence boundaries', () => {
  assert.equal(chunkText('Hello world. Next sentence is longer.', 20)[0].text, 'Hello world. ');
});
test('long words fall back to bounded code points', () => check('x'.repeat(10001), 17));
test('multilingual text and emoji respect bytes', () => {
  for (const text of ['తెలుగు వాక్యం. '.repeat(20), '你好世界。'.repeat(20), '🎧🙂🚀'.repeat(20), 'e\u0301 👩‍💻\r\n'.repeat(20)]) {
    for (const limit of [4, 7, 16, 63]) check(text, limit);
  }
});
test('invalid budgets fail before processing', () => {
  for (const limit of [0, -1, 3, 4.5, NaN, Infinity]) {
    assert.throws(() => chunkText('hello', limit), RangeError);
  }
});
test('deterministic mixed-input stress coverage', () => {
  let seed = 17;
  const alphabet = ['a', ' ', '\n', '.', '🙂', 'తె', '中', '\t', '?'];
  for (let trial = 0; trial < 200; trial++) {
    let text = '';
    for (let i = 0; i < trial * 3; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      text += alphabet[seed % alphabet.length];
    }
    check(text, 4 + trial % 97);
  }
});
