// client/src/app/features/admin/banned-accounts-page.ts
// Tombstone records (wf-14). There is no un-ban — the email stays blacklisted.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { BannedAccount } from '../../core/models';
import { NotificationService } from '../../core/services/notification-service';
import { UserService } from '../../core/services/user-service';

@Component({
  selector: 'app-banned-accounts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-2xl font-semibold">Banned accounts</h1>
      <p class="mt-1 text-sm text-muted-foreground">Permanently removed. Emails cannot be registered again.</p>

      <ul class="mt-6 divide-y rounded-xl border">
        @for (row of rows(); track row.id) {
          <li class="px-4 py-3 text-sm">
            <div class="flex flex-wrap gap-x-6 gap-y-1">
              <span class="min-w-36 font-medium">{{ row.firstName }} {{ row.lastName }}</span>
              <span class="min-w-40 text-muted-foreground">{{ row.email }}</span>
              <span class="text-muted-foreground">{{ dateLabel(row.bannedAt) }}</span>
              <span class="text-muted-foreground">{{ row.requestedBy }}</span>
            </div>
            <p class="mt-1 text-muted-foreground">{{ row.reason }}</p>
          </li>
        } @empty {
          <li class="px-4 py-3 text-sm text-muted-foreground">No banned accounts.</li>
        }
      </ul>
    </section>
  `,
})
export class BannedAccountsPage {
  private readonly usersApi = inject(UserService);
  private readonly notify = inject(NotificationService);

  protected readonly rows = signal<BannedAccount[]>([]);

  constructor() {
    this.usersApi.bannedAccounts().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load banned accounts.'),
    });
  }

  protected dateLabel(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
