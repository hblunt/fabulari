// client/src/app/features/admin/banned-accounts-page.ts
// Tombstone records (wf-14). There is no un-ban — the email stays blacklisted.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HlmCard } from '@spartan-ng/helm/card';
import type { BannedAccount } from '../../core/models';
import { NotificationService } from '../../core/services/notification-service';
import { UserService } from '../../core/services/user-service';

@Component({
  selector: 'app-banned-accounts-page',
  imports: [HlmCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-2xl font-semibold">Banned accounts</h1>
      <p class="mt-1 text-sm text-muted-foreground">Permanently removed. Emails cannot be registered again.</p>

      <div class="mt-6 flex flex-col gap-3">
        @for (row of rows(); track row.id) {
          <article hlmCard size="sm" class="px-4">
            <div class="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p class="text-xs font-medium text-muted-foreground">Name</p>
                <p class="mt-0.5 font-medium">{{ row.firstName }} {{ row.lastName }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-muted-foreground">Email</p>
                <p class="mt-0.5">{{ row.email }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-muted-foreground">Banned</p>
                <p class="mt-0.5">{{ dateLabel(row.bannedAt) }}</p>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium text-muted-foreground">Requested by</p>
                <p class="mt-0.5">{{ row.requestedBy }}</p>
              </div>
            </div>
            @if (row.reason) {
              <div class="rounded-lg border bg-muted/50 px-3 py-2">
                <p class="text-xs font-medium text-muted-foreground">Reason</p>
                <p class="mt-1 text-sm">{{ row.reason }}</p>
              </div>
            }
          </article>
        } @empty {
          <p class="text-sm text-muted-foreground">No banned accounts.</p>
        }
      </div>
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
