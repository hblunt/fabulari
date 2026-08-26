// client/src/app/features/rooms/mock-messages.ts
// PHASE 1 PLACEHOLDER. There are no message endpoints and no sockets yet.
// RoomPage renders this static sample so frames 07/08 can be marked. Phase 2
// replaces it with the last-five GET plus socket events.

import type { Message } from '../../core/models';

export interface ChatNotice {
  id: string;
  text: string;
}

export interface PresencePerson {
  id: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export type ChatRow =
  | { kind: 'notice'; notice: ChatNotice }
  | { kind: 'message'; message: Message; isAdmin: boolean };

const ROOM = 'r-70efdf2e'; // Seed # new-releases

const MOCK_NEW_RELEASES: ChatRow[] = [
  { kind: 'notice', notice: { id: 'n-1', text: 'Ella Novak joined the room' } },
  { kind: 'notice', notice: { id: 'n-2', text: 'Ben Okafor left the room' } },
  {
    kind: 'message',
    isAdmin: true,
    message: {
      id: 'm-mock01',
      roomId: ROOM,
      authorId: 'u-mock-alice',
      authorName: 'Alice Chen',
      authorPicture: null,
      type: 'TEXT',
      content: 'Has anyone seen the new one yet? Worth the ticket price?',
      timestamp: '2026-08-24T09:14:00.000Z',
    },
  },
  {
    kind: 'message',
    isAdmin: false,
    message: {
      id: 'm-mock02',
      roomId: ROOM,
      authorId: 'u-mock-ben',
      authorName: 'Ben Okafor',
      authorPicture: null,
      type: 'TEXT',
      content: 'Saw it Friday. The first hour drags but the last act is genuinely good.',
      timestamp: '2026-08-24T09:16:00.000Z',
    },
  },
  {
    kind: 'message',
    isAdmin: false,
    message: {
      id: 'm-mock03',
      roomId: ROOM,
      authorId: 'u-mock-cara',
      authorName: 'Cara Diaz',
      authorPicture: null,
      type: 'IMAGE',
      content: 'image.png',
      timestamp: '2026-08-24T09:18:00.000Z',
    },
  },
  {
    kind: 'message',
    isAdmin: true,
    message: {
      id: 'm-mock04',
      roomId: ROOM,
      authorId: 'u-8f14e45f',
      authorName: 'Holly Bennett',
      authorPicture: null,
      type: 'TEXT',
      content: 'That poster is great. Booking for Thursday.',
      timestamp: '2026-08-24T09:21:00.000Z',
    },
  },
];

export const MOCK_PRESENCE: PresencePerson[] = [
  { id: 'u-mock-alice', firstName: 'Alice', lastName: 'Chen', isAdmin: true },
  { id: 'u-mock-cara', firstName: 'Cara', lastName: 'Diaz', isAdmin: false },
  { id: 'u-mock-dev', firstName: 'Dev', lastName: 'Patel', isAdmin: true },
  { id: 'u-mock-ella', firstName: 'Ella', lastName: 'Novak', isAdmin: false },
  { id: 'u-8f14e45f', firstName: 'Holly', lastName: 'Bennett', isAdmin: true },
];

export function mockRowsFor(roomId: string): ChatRow[] {
  if (roomId !== ROOM) return [];
  // Clone so a local delete in one visit does not mutate the placeholder.
  return MOCK_NEW_RELEASES.map((row) =>
    row.kind === 'notice'
      ? { kind: 'notice', notice: { ...row.notice } }
      : { kind: 'message', isAdmin: row.isAdmin, message: { ...row.message } },
  );
}
