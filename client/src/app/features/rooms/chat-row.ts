// client/src/app/features/rooms/chat-row.ts
// Stream rows for the room view: a stored Message, or a join/leave notice
// that is never persisted.

import type { Message } from '../../core/models';

export interface ChatNotice {
  id: string;
  text: string;
}

export type ChatRow =
  | { kind: 'notice'; notice: ChatNotice }
  | { kind: 'message'; message: Message; isAdmin: boolean };

export function messagesToRows(messages: Message[], adminIds: string[]): ChatRow[] {
  return messages.map((message) => ({
    kind: 'message' as const,
    message,
    isAdmin: adminIds.includes(message.authorId),
  }));
}
