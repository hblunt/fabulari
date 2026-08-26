// client/src/app/features/rooms/room-page.ts
// Chat view (wf-07/08). Real rooms come from the API. Messages and presence
// are mock data — no sockets and no message endpoints in Phase 1.

import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import type { Group, Message, Room } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { RoomService } from '../../core/services/room-service';
import { MessageComposer, type ComposerSend } from './message-composer';
import { MessageList } from './message-list';
import { MOCK_PRESENCE, mockRowsFor, type ChatRow } from './mock-messages';
import { RoomPresenceList } from './room-presence-list';

@Component({
  selector: 'app-room-page',
  imports: [NgClass, RouterLink, HlmButton, MessageList, MessageComposer, RoomPresenceList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (group(); as group) {
      <section
        class="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden"
        [ngClass]="'theme-' + group.theme"
      >
        <div class="flex items-center gap-2 border-b px-4 py-2 lg:hidden">
          <div class="min-w-0 flex-1">
            <p class="font-medium"># {{ room()?.name }}</p>
            <p class="text-xs text-muted-foreground">{{ group.title }}</p>
          </div>
          <button hlmBtn variant="outline" size="sm" type="button" (click)="toggleRooms()">Rooms ▼</button>
          <button hlmBtn variant="outline" size="sm" type="button" (click)="togglePresence()">
            In room {{ presence.length }}
          </button>
        </div>

        <div class="relative flex min-h-0 flex-1">
          @if (roomsOpen() || presenceOpen()) {
            <button
              class="absolute inset-0 z-10 bg-black/20 lg:hidden"
              type="button"
              aria-label="Close panel"
              (click)="closePanels()"
            ></button>
          }

          <aside [class]="sideClass(roomsOpen(), 'left')">
            <p class="text-sm font-medium">{{ group.title }}</p>
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

          <div class="flex min-w-0 flex-1 flex-col">
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
            <app-room-presence-list [people]="presence" [currentUserId]="currentUserId()" />
          </aside>
        </div>
      </section>
    }
  `,
})
export class RoomPage {
  private readonly groupsApi = inject(GroupService);
  private readonly roomsApi = inject(RoomService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  protected readonly group = signal<Group | null>(null);
  protected readonly rooms = signal<Room[]>([]);
  protected readonly roomId = signal('');
  protected readonly rows = signal<ChatRow[]>([]);
  protected readonly roomsOpen = signal(false);
  protected readonly presenceOpen = signal(false);
  protected readonly presence = MOCK_PRESENCE;
  protected readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');

  protected readonly room = computed(() => this.rooms().find((r) => r.id === this.roomId()) ?? null);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const groupId = params.get('groupId') ?? '';
      const roomId = params.get('roomId') ?? '';
      this.roomId.set(roomId);
      this.rows.set(mockRowsFor(roomId));
      this.closePanels();
      this.load(groupId);
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
    const edge = side === 'left' ? 'left-0 border-r' : 'right-0 border-l';
    if (open) {
      return `absolute inset-y-0 z-20 flex w-56 flex-col bg-background p-3 shadow ${edge} lg:static lg:flex lg:shadow-none`;
    }
    return `hidden w-56 flex-col border-border p-3 lg:flex ${edge}`;
  }

  protected onSend(payload: ComposerSend): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const message: Message = {
      id: `m-local-${Date.now()}`,
      roomId: this.roomId(),
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorPicture: user.profilePicture,
      type: payload.type,
      content: payload.content,
      timestamp: new Date().toISOString(),
    };
    const isAdmin = this.group()?.admins.includes(user.id) ?? false;
    this.rows.update((rows) => [...rows, { kind: 'message', message, isAdmin }]);
  }

  protected removeMessage(id: string): void {
    this.rows.update((rows) => rows.filter((row) => row.kind === 'notice' || row.message.id !== id));
  }

  private load(groupId: string): void {
    forkJoin({
      detail: this.groupsApi.get(groupId),
      rooms: this.roomsApi.list(groupId),
    }).subscribe({
      next: ({ detail, rooms }) => {
        this.group.set(detail.group);
        this.rooms.set(rooms);
      },
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load this room.'),
    });
  }
}
