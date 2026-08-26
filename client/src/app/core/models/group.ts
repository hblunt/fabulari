// client/src/app/core/models/group.ts
// Group record (Phase1.md §4 "Group"). Membership is three ID arrays; the
// only per-user state a group holds is expressed by which array an ID sits
// in. Admins are also listed in members.

import type { GroupTheme } from './types';

export interface Group {
  id: string;
  title: string;
  description: string;
  ageLimit: number; // Minimum self-reported age required to join.
  theme: GroupTheme; // Preset palette applied to the group and its rooms.
  members: string[]; // User IDs with access to the group.
  admins: string[]; // Must always contain at least one ID.
  bannedUsers: string[]; // User IDs permanently barred from this group.
  createdBy: string; // Requester who became the first admin.
  createdAt: string; // ISO date string (approval time).
}

// Four join states on wireframe 04. Computed server-side so the client
// does not have to keep age in localStorage.
export type GroupJoinState = 'member' | 'joinable' | 'requested' | 'blocked';

// Public row on the browse page (§6): no member/admin/banned IDs.
export interface GroupSummary {
  id: string;
  title: string;
  description: string;
  ageLimit: number;
  memberCount: number;
  joinState: GroupJoinState;
}
