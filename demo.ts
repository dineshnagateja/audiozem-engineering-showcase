import { chunkText } from './chunk-text.ts';

const document = [
  'AudioZem turns text, PDFs, and images into audio so people can listen while doing other tasks.',
  'Long documents need smaller speech requests. Each part must stay within the provider limit, preserve the original text, and keep its position.',
  'This offline example demonstrates that preparation step. తెలుగు మరియు English. 🎧',
].join('\n\n');

const chunks = chunkText(document, 120);
console.table(chunks.map(({ index, start, end, bytes }) => ({ index, start, end, bytes })));
chunks.forEach(chunk => console.log(`\nPart ${chunk.index + 1}:\n${chunk.text}`));
console.log('\nExact reconstruction:', chunks.map(c => c.text).join('') === document);
console.log('Offline demo: no speech API calls or audio files are generated.');
