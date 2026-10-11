import { readFileSync } from 'node:fs';

interface StorageStateFile {
  origins?: { origin: string; localStorage: { name: string; value: string }[] }[];
}

/** A localStorage value saved for `origin` in a Playwright storage-state file, if present. */
export function readStoredValue(
  filePath: string,
  origin: string,
  name: string,
): string | undefined {
  const state = JSON.parse(readFileSync(filePath, 'utf8')) as StorageStateFile;
  const entry = state.origins?.find((candidate) => candidate.origin === new URL(origin).origin);
  return entry?.localStorage.find((item) => item.name === name)?.value;
}
