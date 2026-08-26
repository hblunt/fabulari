// client/src/app/core/models/app-request.ts
// A request or report of any type (Phase1.md §4 "Request"). Named AppRequest
// rather than Request because Request is a built-in browser type, and
// shadowing it in a project that also uses HttpClient invites confusion.
// All types share one shape, distinguished by `type`; type-specific fields
// live in `payload` (§4 payload table).

import type { GroupTheme, RequestStatus, RequestType } from './types';

// Payload contents per request type. GROUP_JOIN, GROUP_DELETE and SYSTEM_BAN
// carry no payload — their meaning is fully expressed by type + targetId.
export interface GroupCreatePayload {
  title: string;
  description: string;
  ageLimit: number;
  theme: GroupTheme;
}

export interface RoomCreatePayload {
  name: string;
  description?: string;
  groupId: string;
}

export interface UserReportPayload {
  groupId: string; // The shared group whose admins receive the report.
}

export interface AppRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  submittedBy: string; // User ID of the requester.
  targetId: string | null; // Group, room or user the request concerns.
  payload?: GroupCreatePayload | RoomCreatePayload | UserReportPayload;
  reason: string | null; // Requester's reason for reports, or the admin's rejection reason.
  actionedBy: string | null; // Administrator who approved or rejected.
  createdAt: string; // ISO date string.
  actionedAt: string | null; // ISO date string, null while pending.
  // Display-only fields filled by GET/POST, not stored on disk.
  submitterName?: string;
  submitterAge?: number | null;
  targetName?: string;
  groupName?: string;
  groupId?: string | null;
  groupAgeLimit?: number | null;
  memberCount?: number | null;
  roomCount?: number | null;
  wasBanned?: boolean;
}
