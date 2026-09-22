// client/src/app/core/models/message.ts
// Chat message (Phase2.md §4 "Message"). Author name and picture are
// snapshotted at send time so old messages still render after the author is
// deleted.

import type { MessageType } from './types';

export interface Message {
  id: string; // Referenced by the delete broadcast in Phase 2.
  roomId: string;
  authorId: string;
  authorName: string; // Snapshot, not a lookup.
  authorPicture: string | null; // Snapshot of the filename at send time.
  type: MessageType;
  content: string; // Message body, or the stored filename for an image.
  timestamp: string; // ISO date string, displayed on every message.
}
