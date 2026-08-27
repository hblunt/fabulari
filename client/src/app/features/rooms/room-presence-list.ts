// client/src/app/features/rooms/room-presence-list.ts
// Who is in this room (wf-07), not the group's full roster. Mock data in
// Phase 1 — sockets will drive this list later.

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmAvatar, HlmAvatarFallback } from '@spartan-ng/helm/avatar';
import { CountBadge } from '../../shared/count-badge';
import type { PresencePerson } from './mock-messages';

@Component({
  selector: 'app-room-presence-list',
  imports: [HlmAvatar, HlmAvatarFallback, CountBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full min-h-0 flex-1 flex-col overflow-y-auto' },
  template: `
    <div class="flex items-center gap-2">
      <h2 class="text-sm font-medium">In this room</h2>
      <app-count-badge [value]="sorted().length" />
    </div>
    <ul class="mt-3 flex flex-col gap-2">
      @for (person of sorted(); track person.id) {
        <li class="flex items-center gap-2 text-sm">
          <hlm-avatar size="sm">
            <span hlmAvatarFallback>{{ person.firstName.charAt(0) }}{{ person.lastName.charAt(0) }}</span>
          </hlm-avatar>
          <span class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {{ person.firstName }} {{ person.lastName }}
            @if (person.id === currentUserId()) {
              <span class="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">You</span>
            }
            @if (person.isAdmin) {
              <span class="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Group admin</span>
            }
          </span>
        </li>
      }
    </ul>
  `,
})
export class RoomPresenceList {
  readonly people = input.required<PresencePerson[]>();
  readonly currentUserId = input.required<string>();

  protected readonly sorted = computed(() =>
    [...this.people()].sort(
      (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
    ),
  );
}
