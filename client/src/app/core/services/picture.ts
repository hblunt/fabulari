// client/src/app/core/services/picture.ts
// Shared image rules (Phase2.md §3). The server checks the same type and
// size again. pictureUrl only accepts a plain filename so a message cannot
// point the browser at another path.

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED = ['image/png', 'image/jpeg', 'image/gif'];

export function imageFileError(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'Images must be PNG, JPEG or GIF.';
  if (file.size > IMAGE_MAX_BYTES) return 'Images must be 2MB or smaller.';
  return null;
}

export function pictureUrl(filename: string | null | undefined): string | null {
  if (!filename || !/^[A-Za-z0-9._-]+$/.test(filename)) return null;
  return `/api/uploads/${filename}`;
}
