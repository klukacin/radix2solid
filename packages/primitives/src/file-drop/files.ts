export type AcceptToken = { kind: 'extension' | 'mime' | 'media'; value: string };
export type CandidateFailure = 'no-files' | 'too-many-files' | 'accept-mismatch';

const extensionPattern = /^\.[a-z0-9][a-z0-9.+_-]*$/i;
const mimePattern = /^[a-z0-9!#$%&'+.^_`|~-]+\/[a-z0-9!#$%&'+.^_`|~-]+$/i;
const mediaTypes: Record<string, true> = { 'image/*': true, 'audio/*': true, 'video/*': true };

export function parseAccept(accept: string | undefined): readonly AcceptToken[] {
  if (accept === undefined || accept.trim() === '') return [];
  const tokens: AcceptToken[] = [];
  for (const source of accept.split(',')) {
    const value = source.trim().toLowerCase();
    if (!value) continue;
    if (extensionPattern.test(value)) tokens.push({ kind: 'extension', value });
    else if (mediaTypes[value]) tokens.push({ kind: 'media', value });
    else if (mimePattern.test(value)) tokens.push({ kind: 'mime', value });
    else throw new TypeError(`FileDrop accept token is malformed: ${source.trim()}`);
  }
  return tokens;
}

export function rejectCandidate(files: readonly File[], source: 'picker' | 'drop', multiple: boolean,
  tokens: readonly AcceptToken[]): CandidateFailure | null {
  if (files.length === 0) return source === 'drop' ? 'no-files' : null;
  if (!multiple && files.length > 1) return 'too-many-files';
  if (tokens.length === 0) return null;
  for (const file of files) {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    const matches = tokens.some(token => {
      if (token.kind === 'extension') return name.endsWith(token.value);
      if (token.kind === 'media') return type.startsWith(token.value.slice(0, -1));
      return type === token.value;
    });
    if (!matches) return 'accept-mismatch';
  }
  return null;
}

export function sameFiles(a: readonly File[], b: readonly File[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index++) if (a[index] !== b[index]) return false;
  return true;
}
