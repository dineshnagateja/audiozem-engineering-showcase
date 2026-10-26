/** Standalone showcase example inspired by AudioZem's long-document workflow. */
export interface TextChunk {
  index: number;
  start: number;
  end: number;
  text: string;
  bytes: number;
}

/**
 * Split plain text into UTF-8 byte-limited requests without dropping content.
 * Offsets use JavaScript's UTF-16 indexing; end is exclusive.
 * Prefer paragraph/sentence boundaries, then whitespace, then a code point.
 * This is not a tokenizer, PDF parser, or audio concatenation utility.
 */
export function chunkText(text: string, maxBytes = 4000): TextChunk[] {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 4) {
    throw new RangeError('maxBytes must be a safe integer of at least 4');
  }
  const encoder = new TextEncoder();
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start;
    let bytes = 0;
    while (end < text.length) {
      const point = String.fromCodePoint(text.codePointAt(end)!);
      const size = encoder.encode(point).length;
      if (bytes + size > maxBytes) break;
      bytes += size;
      end += point.length;
    }

    if (end < text.length) {
      const window = text.slice(start, end);
      // Avoid tiny chunks: only consider boundaries in the latter half.
      const floor = Math.floor(window.length / 2);
      const boundary = (pattern: RegExp): number | undefined => {
        let candidate: number | undefined;
        for (const match of window.matchAll(pattern)) {
          const offset = match.index + match[0].length;
          if (offset >= floor) candidate = offset;
        }
        return candidate;
      };
      const cut = boundary(/\n\s*\n/gu)
        ?? boundary(/[.!?][ \t\r\n]+/gu)
        ?? boundary(/\s+/gu);
      if (cut !== undefined) end = start + cut;
    }

    const part = text.slice(start, end);
    chunks.push({ index: chunks.length, start, end, text: part,
      bytes: encoder.encode(part).length });
    start = end;
  }
  return chunks;
}
