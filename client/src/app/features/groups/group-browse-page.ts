// client/src/app/features/groups/group-browse-page.ts
// Every group in the system (wireframe 04). Pulled forward so GROUP_CREATE
// and GROUP_JOIN can be raised in Stage 2; room/member admin stays Stage 3.

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard, HlmCardContent, HlmCardDescription, HlmCardHeader, HlmCardTitle } from '@spartan-ng/helm/card';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import type { GroupSummary } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';
import { GroupRequestForm } from '../requests/group-request-form';

@Component({
  selector: 'app-group-browse-page',
  imports: [
    RouterLink,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmCardContent,
    HlmCardDescription,
    HlmCardHeader,
    HlmCardTitle,
    HlmInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Groups</h1>
          <p class="mt-1 text-sm text-muted-foreground">Every group in the system. Request to join.</p>
        </div>
        <button hlmBtn type="button" (click)="openCreate()">Request a new group</button>
      </div>

      <input
        hlmInput
        class="mt-6 max-w-sm"
        placeholder="Search groups"
        [value]="query()"
        (input)="onSearch($event)"
      />

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        @for (group of filtered(); track group.id) {
          <article hlmCard size="sm" class="px-4">
            <div hlmCardHeader class="p-0">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 hlmCardTitle>{{ group.title }}</h2>
                  <p hlmCardDescription class="mt-1">{{ group.description }}</p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-2">
                  @switch (group.joinState) {
                    @case ('member') {
                      <a hlmBtn variant="outline" size="sm" [routerLink]="['/groups', group.id]">Open</a>
                      <span hlmBadge variant="secondary">Member</span>
                    }
                    @case ('joinable') {
                      <button hlmBtn size="sm" type="button" [disabled]="busyId() === group.id" (click)="join(group)">
                        Request to join
                      </button>
                    }
                    @case ('requested') {
                      <button hlmBtn variant="outline" size="sm" type="button" disabled>Requested</button>
                      <span class="text-xs text-muted-foreground">Awaiting group admin</span>
                    }
                    @case ('blocked') {
                      <button hlmBtn variant="outline" size="sm" type="button" disabled>
                        Age limit {{ ageLabel(group.ageLimit) }}
                      </button>
                      <span class="text-xs text-muted-foreground">You do not meet the limit</span>
                    }
                  }
                </div>
              </div>
            </div>
            <div hlmCardContent class="flex gap-3 p-0 pt-3 text-xs text-muted-foreground">
              <span>{{ ageLabel(group.ageLimit) }}</span>
              <span>{{ group.memberCount }} member{{ group.memberCount === 1 ? '' : 's' }}</span>
            </div>
          </article>
        } @empty {
          <p class="text-sm text-muted-foreground">No groups match that search.</p>
        }
      </div>
    </section>
  `,
})
export class GroupBrowsePage {
  private readonly groupsApi = inject(GroupService);
  private readonly requests = inject(RequestService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  protected readonly query = signal('');
  protected readonly groups = signal<GroupSummary[]>([]);
  protected readonly busyId = signal<string | null>(null);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const groups = this.groups();
    if (!q) return groups;
    return groups.filter(
      (g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q),
    );
  });

  constructor() {
    this.reload();
  }

  protected ageLabel(limit: number): string {
    return limit === 0 ? 'All ages' : `${limit}+`;
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected openCreate(): void {
    const ref = this.dialog.open<boolean>(GroupRequestForm);
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (ok) this.notify.success('Group request submitted.');
    });
  }

  protected join(group: GroupSummary): void {
    this.busyId.set(group.id);
    this.requests.create({ type: 'GROUP_JOIN', targetId: group.id }).subscribe({
      next: (request) => {
        this.busyId.set(null);
        if (request.status === 'REJECTED') {
          this.notify.error(request.reason ?? 'You cannot join this group.');
        } else {
          this.notify.success('Join request submitted.');
        }
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.notify.error(err.error?.error ?? 'Could not request to join.');
      },
    });
  }

  private reload(): void {
    this.groupsApi.list().subscribe({
      next: (groups) => {
        this.groups.set(groups);
        for (const group of groups) {
          if (group.joinState === 'member') this.auth.rememberGroup(group.id);
        }
      },
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load groups.'),
    });
  }
}
