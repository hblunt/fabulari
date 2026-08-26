// client/src/app/core/models/room.ts
// Room record (Phase1.md §4 "Room"). Rooms carry no membership of their own —
// group membership grants access to every room in the group.

export interface Room {
  id: string; // Also the socket room name in Phase 2.
  groupId: string; // Owning group.
  name: string;
  description?: string;
  createdAt: string; // ISO date string.
}
