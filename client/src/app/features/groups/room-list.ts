// client/src/app/features/groups/room-list.ts
// Rooms in this group (wf-05/06). Membership opens every room. Admins add
// rooms immediately; members propose via a ROOM_CREATE request.

import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import type { Room } from '../../core/models';
import { NotificationService } from '../../core/services/notification-service';
import { RoomService } from '../../core/services/room-service';
import { ConfirmDialog, type ConfirmDialogContext } from '../requests/confirm-dialog';
import { RoomRequestForm, type RoomRequestFormContext } from '../requests/room-request-form';
import { RoomEditForm, type RoomEditFormContext } from './room-edit-form';

@Component({
  selector: 'app-room-list',
  imports: [RouterLink, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-medium">Rooms</h2>
      <button hlmBtn [variant]="isAdmin() ? 'outline' : 'default'" size="sm" type="button" (click)="propose()">
        {{ isAdmin() ? 'Add room' : 'Propose a room' }}
      </button>
    </div>

    <ul class="mt-3 divide-y rounded-xl border">
      @for (room of rooms(); track room.id) {
        <li class="flex items-center justify-between gap-3 px-4 py-2.5">
          <a [routerLink]="['/groups', groupId(), 'rooms', room.id]" class="min-w-0 hover:underline">
            <p class="font-medium"># {{ room.name }}</p>
            @if (room.description) {
              <p class="text-sm text-muted-foreground">{{ room.description }}</p>
            }
          </a>
          @if (isAdmin()) {
            <div class="flex shrink-0 gap-2">
              <button hlmBtn variant="outline" size="sm" type="button" (click)="edit(room)">Edit</button>
              <button hlmBtn variant="outline" size="sm" type="button" (click)="remove(room)">Delete</button>
            </div>
          }
        </li>
      } @empty {
        <li class="px-4 py-3 text-sm text-muted-foreground">No rooms yet.</li>
      }
    </ul>
  `,
})
export class RoomList {
  private readonly roomsApi = inject(RoomService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  readonly groupId = input.required<string>();
  readonly rooms = input.required<Room[]>();
  readonly isAdmin = input(false);
  readonly changed = output<void>();

  protected propose(): void {
    const ref = this.dialog.open<boolean, RoomRequestFormContext>(RoomRequestForm, {
      context: { groupId: this.groupId(), asAdmin: this.isAdmin() },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (!ok) return;
      this.notify.success(this.isAdmin() ? 'Room added.' : 'Room request submitted.');
      this.changed.emit();
    });
  }

  protected edit(room: Room): void {
    const ref = this.dialog.open<boolean, RoomEditFormContext>(RoomEditForm, { context: { room } });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (ok) this.changed.emit();
    });
  }

  protected remove(room: Room): void {
    const ref = this.dialog.open<boolean, ConfirmDialogContext>(ConfirmDialog, {
      context: {
        title: `Delete # ${room.name}?`,
        subtitle: 'The room is removed immediately. This cannot be undone.',
        confirmLabel: 'Delete room',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (!ok) return;
      this.roomsApi.delete(room.id).subscribe({
        next: () => this.changed.emit(),
        error: (err) => this.notify.error(err.error?.error ?? 'Could not delete the room.'),
      });
    });
  }
}
