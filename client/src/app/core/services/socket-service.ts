// client/src/app/core/services/socket-service.ts
// Live room connection (Phase2.md §5 SocketService). Incoming events are
// observables; outgoing calls are typed emits. Connects when a chat user is
// signed in and drops on logout. Super admin never connects.

import { Injectable, effect, inject, untracked } from '@angular/core';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import type { Message, PresencePerson, SessionUser } from '../models';
import { AuthService } from './auth-service';
import { NotificationService } from './notification-service';

export interface PresenceUpdate {
  roomId: string;
  users: PresencePerson[];
}

export interface PresenceNotice {
  roomId: string;
  userName: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  private socket: Socket | null = null;
  private connectedUserId: string | null = null;
  private joinedRoomId: string | null = null;
  private lastConnectError: string | null = null;

  private readonly messageNew = new Subject<{ message: Message }>();
  private readonly messageDeleted = new Subject<{ messageId: string }>();
  private readonly presenceUpdate = new Subject<PresenceUpdate>();
  private readonly presenceJoined = new Subject<PresenceNotice>();
  private readonly presenceLeft = new Subject<PresenceNotice>();

  readonly messageNew$ = this.messageNew.asObservable();
  readonly messageDeleted$ = this.messageDeleted.asObservable();
  readonly presenceUpdate$ = this.presenceUpdate.asObservable();
  readonly presenceJoined$ = this.presenceJoined.asObservable();
  readonly presenceLeft$ = this.presenceLeft.asObservable();

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => this.syncConnection(user));
    });
  }

  join(roomId: string): void {
    this.joinedRoomId = roomId;
    if (this.socket?.connected) this.emit('room:join', { roomId });
  }

  leave(): void {
    const roomId = this.joinedRoomId;
    this.joinedRoomId = null;
    if (roomId && this.socket?.connected) this.emit('room:leave', { roomId });
  }

  send(roomId: string, type: 'TEXT' | 'IMAGE', content: string): void {
    this.emit('message:send', { roomId, type, content });
  }

  delete(roomId: string, messageId: string): void {
    this.emit('message:delete', { roomId, messageId });
  }

  private syncConnection(user: SessionUser | null): void {
    if (!user || user.role === 'SUPER_ADMIN') {
      this.disconnect();
      return;
    }
    if (this.socket && this.connectedUserId === user.id) return;
    this.disconnect();
    this.connect(user.id);
  }

  private connect(userId: string): void {
    this.connectedUserId = userId;
    // Talk to the API host directly. Vite's SPA fallback on :4200 answers
    // /socket.io with index.html, which Engine.IO reports as "server error"
    // and retries forever.
    this.socket = io('http://localhost:3000', { auth: { userId } });
    this.socket.on('connect', () => {
      this.lastConnectError = null;
      if (this.joinedRoomId) this.emit('room:join', { roomId: this.joinedRoomId });
    });
    this.socket.on('connect_error', (err) => {
      const message = err.message || 'Could not connect to chat.';
      if (this.lastConnectError === message) return;
      this.lastConnectError = message;
      this.notify.error(message);
    });
    this.socket.on('message:new', (payload: { message: Message }) => this.messageNew.next(payload));
    this.socket.on('message:deleted', (payload: { messageId: string }) => this.messageDeleted.next(payload));
    this.socket.on('presence:update', (payload: PresenceUpdate) => this.presenceUpdate.next(payload));
    this.socket.on('presence:joined', (payload: PresenceNotice) => this.presenceJoined.next(payload));
    this.socket.on('presence:left', (payload: PresenceNotice) => this.presenceLeft.next(payload));
  }

  private emit(event: string, payload: object): void {
    this.socket?.emit(event, payload, (res?: { error?: string }) => {
      if (res?.error) this.notify.error(res.error);
    });
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedUserId = null;
    this.lastConnectError = null;
  }
}
