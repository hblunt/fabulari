// client/src/app/features/requests/my-requests-page.ts
// The signed-in user's own submissions (wireframe 09). Filter chips; reasons
// sit in a nested card on the row; no withdraw action — the spec forbids it.

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import type { AppRequest, RequestType } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';
import { RequestItem } from './request-item';

interface Chip {
  id: RequestType | 'ALL';
  label: string;
}

const CHIPS: Chip[] = [
  { id: 'ALL', label: 'All' },
  { id: 'GROUP_CREATE', label: 'Group creation' },
  { id: 'GROUP_JOIN', label: 'Join' },
  { id: 'ROOM_CREATE', label: 'Room' },
  { id: 'USER_REPORT', label: 'Reports' },
];

@Component({
  selector: 'app-my-requests-page',
  imports: [HlmButton, RequestItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-2xl font-semibold">My requests</h1>
      <p class="mt-1 text-sm text-muted-foreground">Pending and past submissions.</p>

      <div class="mt-4 flex flex-wrap gap-2">
        @for (chip of chips; track chip.id) {
          <button
            hlmBtn
            size="sm"
            class="rounded-full"
            [variant]="filter() === chip.id ? 'default' : 'outline'"
            type="button"
            (click)="filter.set(chip.id)"
          >
            {{ chip.label }}
          </button>
        }
      </div>

      <div class="mt-6 flex flex-col gap-3">
        @for (request of visible(); track request.id) {
          <app-request-item [request]="request" mode="mine" />
        } @empty {
          <p class="text-sm text-muted-foreground">You have not submitted any requests.</p>
        }
      </div>
    </section>
  `,
})
export class MyRequestsPage {
  private readonly requests = inject(RequestService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  protected readonly chips = CHIPS;
  protected readonly filter = signal<RequestType | 'ALL'>('ALL');
  protected readonly rows = signal<AppRequest[]>([]);

  protected readonly visible = computed(() => {
    const chip = this.filter();
    const me = this.auth.currentUser()?.id;
    return this.rows()
      .filter((r) => r.submittedBy === me)
      .filter((r) => chip === 'ALL' || r.type === chip)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  constructor() {
    this.requests.list().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load your requests.'),
    });
  }
}
