// client/src/app/core/models/user.ts
// Account record (Phase1.md §4 "User"). This client-side type deliberately
// omits passwordHash — the API never returns it, so typing it here would
// invite code that expects it.

import type { Role } from './types';

export interface User {
  id: string;
  email: string; // Unique and immutable; used to log in.
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD. Age is calculated from this, never stored.
  age: number; // Calculated on the server from dateOfBirth for display and gates.
  role: Role; // Group admin status lives on the group, not here.
  profilePicture: string | null; // Filename, or null for the default avatar.
  groups: string[]; // Group IDs, denormalised for the most frequent read.
  createdAt: string; // ISO date string.
}
