// client/src/app/features/rooms/room-page.ts
// Chat view (wf-07/08). Last five messages come from GET; the rest of the
// stream is this browser's local history plus live socket events.

import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import type { Group, Message, PresencePerson, Room } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { GroupService } from '../../core/services/group-service';
import { forgetMessage, rememberMessages } from '../../core/services/message-history';
import { NotificationService } from '../../core/services/notification-service';
import { RoomService } from '../../core/services/room-service';
import { SocketService } from '../../core/services/socket-service';
import { messagesToRows, type ChatRow } from './chat-row';
import { MessageComposer, type ComposerSend } from './message-composer';
import { MessageList } from './message-list';
import { RoomPresenceList } from './room-presence-list';

@Component({
  selector: 'app-room-page',
  imports: [NgClass, RouterLink, HlmButton, MessageList, MessageComposer, RoomPresenceList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (group(); as group) {
      <section
        class="flex h-[calc(100vh-4rem)] flex-col overflow-hidden px-10 pb-6 pt-3"
        [ngClass]="'theme-' + group.theme"
      >
        <p class="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a routerLink="/groups" class="hover:underline">Groups</a>
          <span>/</span>
          <a [routerLink]="['/groups', group.id]" class="hover:underline">{{ group.title }}</a>
          <span>/</span>
          <span># {{ room()?.name }}</span>
        </p>

        <div class="mb-3 flex items-center gap-2 lg:hidden">
          <p class="min-w-0 flex-1 font-medium"># {{ room()?.name }}</p>
          <button hlmBtn variant="outline" size="sm" type="button" (click)="toggleRooms()">Rooms ▼</button>
          <button hlmBtn variant="outline" size="sm" type="button" (click)="togglePresence()">
            In room {{ presence().length }}
          </button>
        </div>

        <div class="relative flex min-h-0 flex-1 gap-4">
          @if (roomsOpen() || presenceOpen()) {
            <button
              class="absolute inset-0 z-10 rounded-xl bg-black/20 lg:hidden"
              type="button"
              aria-label="Close panel"
              (click)="closePanels()"
            ></button>
          }

          <aside [class]="sideClass(roomsOpen(), 'left')">
            <a [routerLink]="['/groups', group.id]" class="text-sm font-medium hover:underline">{{ group.title }}</a>
            <p class="text-xs text-muted-foreground">{{ rooms().length }} rooms</p>
            <ul class="mt-3 flex flex-col gap-1">
              @for (item of rooms(); track item.id) {
                <li>
                  <a
                    class="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    [class.bg-muted]="item.id === roomId()"
                    [routerLink]="['/groups', group.id, 'rooms', item.id]"
                    (click)="roomsOpen.set(false)"
                  >
                    # {{ item.name }}
                  </a>
                </li>
              }
            </ul>
          </aside>

          <div class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
            <div class="hidden border-b px-4 py-2 lg:block">
              <p class="font-medium"># {{ room()?.name }}</p>
              <p class="text-sm text-muted-foreground">{{ room()?.description }}</p>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <app-message-list
                [rows]="rows()"
                [currentUserId]="currentUserId()"
                (remove)="removeMessage($event)"
              />
            </div>
            <div class="border-t px-4 py-3">
              <app-message-composer (sent)="onSend($event)" />
            </div>
          </div>

          <aside [class]="sideClass(presenceOpen(), 'right')">
            <app-room-presence-list [people]="presence()" [currentUserId]="currentUserId()" />
          </aside>
        </div>
      </section>
    }
  `,
})
export class RoomPage {
  private readonly groupsApi = inject(GroupService);
  private readonly roomsApi = inject(RoomService);
  private readonly sockets = inject(SocketService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly group = signal<Group | null>(null);
  protected readonly rooms = signal<Room[]>([]);
  protected readonly roomId = signal('');
  protected readonly rows = signal<ChatRow[]>([]);
  protected readonly presence = signal<PresencePerson[]>([]);
  protected readonly roomsOpen = signal(false);
  protected readonly presenceOpen = signal(false);
  protected readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');
  protected readonly room = computed(() => this.rooms().find((r) => r.id === this.roomId()) ?? null);

  private loadGen = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.sockets.leave());

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const groupId = params.get('groupId') ?? '';
      const roomId = params.get('roomId') ?? '';
      this.sockets.leave();
      this.roomId.set(roomId);
      this.rows.set([]);
      this.presence.set([]);
      this.closePanels();
      this.sockets.join(roomId);
      this.load(groupId, roomId);
    });

    this.sockets.messageNew$.pipe(takeUntilDestroyed()).subscribe(({ message }) => {
      if (message.roomId !== this.roomId()) return;
      this.appendMessage(message);
    });
    this.sockets.messageDeleted$.pipe(takeUntilDestroyed()).subscribe(({ messageId }) => {
      forgetMessage(this.roomId(), messageId);
      this.rows.update((rows) => rows.filter((row) => row.kind === 'notice' || row.message.id !== messageId));
    });
    this.sockets.presenceUpdate$.pipe(takeUntilDestroyed()).subscribe((payload) => {
      if (payload.roomId === this.roomId()) this.presence.set(payload.users);
    });
    this.sockets.presenceJoined$.pipe(takeUntilDestroyed()).subscribe((payload) => {
      this.appendNotice(payload, 'joined the room');
    });
    this.sockets.presenceLeft$.pipe(takeUntilDestroyed()).subscribe((payload) => {
      this.appendNotice(payload, 'left the room');
    });
  }

  protected toggleRooms(): void {
    this.roomsOpen.update((open) => !open);
    this.presenceOpen.set(false);
  }

  protected togglePresence(): void {
    this.presenceOpen.update((open) => !open);
    this.roomsOpen.set(false);
  }

  protected closePanels(): void {
    this.roomsOpen.set(false);
    this.presenceOpen.set(false);
  }

  protected sideClass(open: boolean, side: 'left' | 'right'): string {
    const place = side === 'left' ? 'left-0' : 'right-0';
    const width = side === 'left' ? 'w-56' : 'w-72';
    const card = `flex ${width} shrink-0 flex-col overflow-hidden rounded-xl border bg-background p-4`;
    if (open) {
      return `absolute inset-y-0 z-20 shadow-lg ${place} ${card} lg:static lg:shadow-none`;
    }
    return `hidden ${card} lg:flex`;
  }

  protected onSend(payload: ComposerSend): void {
    if (payload.type !== 'TEXT') return;
    this.sockets.send(this.roomId(), 'TEXT', payload.content);
  }

  protected removeMessage(id: string): void {
    this.sockets.delete(this.roomId(), id);
  }

  private load(groupId: string, roomId: string): void {
    const gen = ++this.loadGen;
    forkJoin({
      detail: this.groupsApi.get(groupId),
      rooms: this.roomsApi.list(groupId),
      messages: this.roomsApi.listMessages(roomId),
    }).subscribe({
      next: ({ detail, rooms, messages }) => {
        if (gen !== this.loadGen || this.roomId() !== roomId) return;
        this.group.set(detail.group);
        this.rooms.set(rooms);
        this.mergeMessages(messages);
      },
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load this room.'),
    });
  }

  private mergeMessages(incoming: Message[]): void {
    const merged = rememberMessages(this.roomId(), incoming);
    const notices = this.rows().filter((row) => row.kind === 'notice');
    this.rows.set([...messagesToRows(merged, this.group()?.admins ?? []), ...notices]);
  }

  private appendMessage(message: Message): void {
    rememberMessages(this.roomId(), [message]);
    const already = this.rows().some((row) => row.kind === 'message' && row.message.id === message.id);
    if (already) return;
    const isAdmin = this.group()?.admins.includes(message.authorId) ?? false;
    this.rows.update((rows) => [...rows, { kind: 'message', message, isAdmin }]);
  }

  private appendNotice(payload: { roomId: string; userName: string }, verb: string): void {
    if (payload.roomId !== this.roomId()) return;
    const notice = { id: `n-${Date.now()}-${payload.userName}`, text: `${payload.userName} ${verb}` };
    this.rows.update((rows) => [...rows, { kind: 'notice', notice }]);
  }
}
