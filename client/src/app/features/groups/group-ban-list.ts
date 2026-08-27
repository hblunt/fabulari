// client/src/app/features/groups/group-ban-list.ts
// Users banned from this group (wf-06). Bans are permanent — there is no
// un-ban action.

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmAvatar, HlmAvatarFallback } from '@spartan-ng/helm/avatar';
import type { User } from '../../core/models';

@Component({
  selector: 'app-group-ban-list',
  imports: [HlmAvatar, HlmAvatarFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="text-lg font-medium">Banned from this group</h2>
    <ul class="mt-3 divide-y rounded-xl border">
      @for (user of banned(); track user.id) {
        <li class="flex items-center gap-3 px-3 py-2 text-sm">
          <hlm-avatar size="sm">
            <span hlmAvatarFallback>{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</span>
          </hlm-avatar>
          <span>{{ user.firstName }} {{ user.lastName }}</span>
        </li>
      } @empty {
        <li class="px-4 py-3 text-sm text-muted-foreground">No one is banned.</li>
      }
    </ul>
  `,
})
export class GroupBanList {
  readonly banned = input.required<User[]>();
}
