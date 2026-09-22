// client/src/app/core/services/message-history.ts
// Per-room chat history in local storage (Phase2.md §4). Keyed
// messages:<roomId> → { <messageId>: Message } so a delete is a key removal
// and opening a room does not scan every other room. AuthService still owns
// the currentUser key; this file is only the chat history.

import type { Message } from '../models';

function storageKey(roomId: string): string {
  return `messages:${roomId}`;
}

function readMap(roomId: string): Record<string, Message> {
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    return raw ? (JSON.parse(raw) as Record<string, Message>) : {};
  } catch {
    return {};
  }
}

function writeMap(roomId: string, map: Record<string, Message>): void {
  localStorage.setItem(storageKey(roomId), JSON.stringify(map));
}

export function rememberMessages(roomId: string, messages: Message[]): Message[] {
  const map = readMap(roomId);
  for (const message of messages) map[message.id] = message;
  writeMap(roomId, map);
  return Object.values(map).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function forgetMessage(roomId: string, messageId: string): void {
  const map = readMap(roomId);
  delete map[messageId];
  writeMap(roomId, map);
}
