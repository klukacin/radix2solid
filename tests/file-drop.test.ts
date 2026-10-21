import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAccept, rejectCandidate, sameFiles } from '../packages/primitives/src/file-drop/files.ts';

const file = (name: string, type: string, contents = 'x') => new File([contents], name, { type });

test('file drop candidate parity and replacement policy', () => {
  const txt = new File(['x'], 'notes.TXT', { type: 'text/plain', lastModified: 0 });
  const pdf = file('report.pdf', 'application/pdf');
  const tokens = parseAccept(' .txt, TEXT/PLAIN ');
  assert.equal(rejectCandidate([txt], 'picker', false, tokens), null);
  assert.equal(rejectCandidate([txt], 'drop', false, tokens), null);
  assert.equal(rejectCandidate([txt, pdf], 'picker', true, tokens), 'accept-mismatch');
  assert.equal(rejectCandidate([txt, pdf], 'drop', true, tokens), 'accept-mismatch');
  assert.equal(rejectCandidate([txt, pdf], 'drop', false, tokens), 'too-many-files');
  assert.equal(rejectCandidate([], 'picker', false, []), null);
  assert.equal(rejectCandidate([], 'drop', false, []), 'no-files');
  assert.equal(rejectCandidate([file('empty.txt', 'text/plain', '')], 'picker', false, tokens), null);
  assert.equal(sameFiles([txt], [txt]), true);
  assert.equal(sameFiles([txt], [new File(['x'], 'notes.TXT', { type: 'text/plain', lastModified: 0 })]), false);
  assert.equal(sameFiles([txt, pdf], [pdf, txt]), false);
  assert.equal(sameFiles([], []), true);
});

test('file drop accept rules trim and case-fold extensions, exact MIME, and supported media wildcards', () => {
  const tokens = parseAccept(' .PNG , IMAGE/*, application/PDF, .png ');
  assert.equal(rejectCandidate([file('photo.PnG', '')], 'drop', false, tokens), null);
  assert.equal(rejectCandidate([file('another.png', '')], 'drop', false, parseAccept('.png,.PNG')), null);
  assert.equal(rejectCandidate([file('photo.bin', 'image/webp')], 'picker', false, tokens), null);
  assert.equal(rejectCandidate([file('report.bin', 'application/pdf')], 'picker', false, tokens), null);
  assert.equal(rejectCandidate([file('sound.bin', 'audio/mpeg')], 'drop', false, tokens), 'accept-mismatch');
  for (const [accept, candidate, expected] of [
    ['image/*', file('photo.bin', 'image/jpeg'), null],
    ['audio/*', file('song.bin', 'audio/ogg'), null],
    ['video/*', file('clip.bin', 'video/mp4'), null],
    ['text/plain', file('data.bin', 'TEXT/PLAIN'), null],
    ['text/plain', file('notes.txt', ''), 'accept-mismatch']
  ] as const) {
    assert.equal(rejectCandidate([candidate], 'drop', false, parseAccept(accept)), expected);
  }
});

test('file drop malformed accept tokens throw instead of permitting candidates', () => {
  for (const accept of ['txt', '*/*', 'image/', 'application/*', 'image/*;q=1', 'a,b']) {
    assert.throws(() => parseAccept(accept), TypeError, accept);
  }
  assert.equal(rejectCandidate([file('unrestricted.pdf', 'application/pdf')], 'drop', false, parseAccept(undefined)), null);
  assert.equal(rejectCandidate([file('also-unrestricted.pdf', 'application/pdf')], 'drop', false, parseAccept(' , , ')), null);
});
