// client/src/app/core/models/presence.ts
// Occupant of a room (Phase2.md §6 presence:update). Not a User record —
// just what the presence panel needs, including whether they admin this group.

export interface PresencePerson {
  id: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  profilePicture: string | null;
}
