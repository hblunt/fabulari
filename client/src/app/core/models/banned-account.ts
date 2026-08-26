// client/src/app/core/models/banned-account.ts
// Tombstone for a permanently banned account (Phase1.md §4). The user record
// is hard-deleted; this preserves the two things that must survive: the email
// can never be re-registered, and the super admin keeps visibility of bans.

export interface BannedAccount {
  id: string;
  email: string; // Blacklisted at registration forever.
  firstName: string; // Snapshot taken before deletion.
  lastName: string; // Snapshot taken before deletion.
  bannedAt: string; // ISO date string.
  reason: string; // From the originating SYSTEM_BAN request.
  requestedBy: string; // Name and email of the requesting group admin, snapshotted.
}
