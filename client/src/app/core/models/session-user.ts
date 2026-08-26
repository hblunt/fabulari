// client/src/app/core/models/session-user.ts
// The reduced user object written to browser local storage on login
// (Phase1.md §4 "Client-side storage"). It exists to restore the session and
// drive guards and conditional UI — so it carries identity and role, never
// the password hash and nothing editable like age.

import type { Role } from './types';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profilePicture: string | null;
  groups: string[]; // Group IDs, read by groupMemberGuard.
}
