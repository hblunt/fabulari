// client/src/app/core/models/audit-entry.ts
// A logged administrative action (Phase1.md §4 "Audit entry"). Everything is
// a snapshot rather than a reference: if entries held IDs, deleting a user
// would blank their history in the very log the super admin reviews.

export interface AuditEntry {
  id: string;
  type: string; // Action performed, used as the filter key.
  actorName: string; // Snapshotted administrator name.
  actorEmail: string; // Snapshotted administrator email.
  targetLabel: string; // Human-readable description of what was acted on.
  detail?: string; // Free text, e.g. a rejection reason.
  timestamp: string; // ISO date string, the log's ordering key.
}
