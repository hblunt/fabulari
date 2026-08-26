// client/src/app/features/admin/audit-log-page.ts
// Administrative action history (wf-15). Filter chips are categories over
// the stored type strings; date bounds go to GET /api/audit.

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import type { AuditEntry } from '../../core/models';
import { AuditService } from '../../core/services/audit-service';
import { NotificationService } from '../../core/services/notification-service';

type Chip = 'ALL' | 'GROUPS' | 'ROOMS' | 'MEMBERS' | 'BANS';

const CHIPS: { id: Chip; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'GROUPS', label: 'Groups' },
  { id: 'ROOMS', label: 'Rooms' },
  { id: 'MEMBERS', label: 'Members' },
  { id: 'BANS', label: 'Bans' },
];

const CATEGORIES: Record<Exclude<Chip, 'ALL'>, string[]> = {
  GROUPS: ['GROUP_CREATED', 'GROUP_DELETED', 'GROUP_DELETE_APPROVED', 'GROUP_CREATE_REJECTED', 'GROUP_DELETE_REJECTED'],
  ROOMS: ['ROOM_CREATED', 'ROOM_CREATE_REJECTED'],
  MEMBERS: ['GROUP_JOIN_APPROVED', 'GROUP_JOIN_REJECTED'],
  BANS: [
    'SYSTEM_BAN_APPROVED',
    'SYSTEM_BAN_REJECTED',
    'USER_DELETED',
    'USER_REPORT_APPROVED',
    'USER_REPORT_REJECTED',
    'GROUP_BAN',
  ],
};

const ACTION_LABELS: Record<string, string> = {
  GROUP_CREATED: 'Group created',
  GROUP_DELETED: 'Group deleted',
  GROUP_DELETE_APPROVED: 'Group deletion approved',
  GROUP_CREATE_REJECTED: 'Group creation rejected',
  GROUP_DELETE_REJECTED: 'Group deletion rejected',
  ROOM_CREATED: 'Room created',
  ROOM_CREATE_REJECTED: 'Room proposal rejected',
  GROUP_JOIN_APPROVED: 'Join approved',
  GROUP_JOIN_REJECTED: 'Join rejected',
  SYSTEM_BAN_APPROVED: 'System ban approved',
  SYSTEM_BAN_REJECTED: 'System ban rejected',
  USER_DELETED: 'Account deleted',
  USER_REPORT_APPROVED: 'Report approved',
  USER_REPORT_REJECTED: 'Report rejected',
  GROUP_BAN: 'User banned from group',
};

@Component({
  selector: 'app-audit-log-page',
  imports: [HlmButton, HlmInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-2xl font-semibold">Audit log</h1>
      <p class="mt-1 text-sm text-muted-foreground">Administrative actions across the system.</p>

      <div class="mt-4 flex flex-wrap items-center gap-2">
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
        <input hlmInput class="ml-auto w-36" type="date" [value]="from()" (change)="setFrom($event)" aria-label="From" />
        <input hlmInput class="w-36" type="date" [value]="to()" (change)="setTo($event)" aria-label="To" />
      </div>

      <div class="mt-6 overflow-x-auto rounded-xl border">
        <table class="w-full text-left text-sm">
          <thead class="border-b text-muted-foreground">
            <tr>
              <th class="px-4 py-2 font-medium">Action</th>
              <th class="px-4 py-2 font-medium">Administrator</th>
              <th class="px-4 py-2 font-medium">Target</th>
              <th class="px-4 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (entry of visible(); track entry.id) {
              <tr>
                <td class="px-4 py-2">{{ actionLabel(entry.type) }}</td>
                <td class="px-4 py-2">{{ entry.actorName }}</td>
                <td class="px-4 py-2">{{ entry.targetLabel }}</td>
                <td class="px-4 py-2 text-muted-foreground">{{ whenLabel(entry.timestamp) }}</td>
              </tr>
            } @empty {
              <tr>
                <td class="px-4 py-3 text-muted-foreground" colspan="4">No entries match those filters.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="mt-6 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        Entries store the administrator's name and email as written, not a
        reference, so history survives account deletion.
      </p>
    </section>
  `,
})
export class AuditLogPage {
  private readonly audit = inject(AuditService);
  private readonly notify = inject(NotificationService);

  protected readonly chips = CHIPS;
  protected readonly filter = signal<Chip>('ALL');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly rows = signal<AuditEntry[]>([]);

  protected readonly visible = computed(() => {
    const chip = this.filter();
    if (chip === 'ALL') return this.rows();
    const types = CATEGORIES[chip];
    return this.rows().filter((e) => types.includes(e.type));
  });

  constructor() {
    this.reload();
  }

  protected actionLabel(type: string): string {
    return ACTION_LABELS[type] ?? type;
  }

  protected whenLabel(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  protected setFrom(event: Event): void {
    this.from.set((event.target as HTMLInputElement).value);
    this.reload();
  }

  protected setTo(event: Event): void {
    this.to.set((event.target as HTMLInputElement).value);
    this.reload();
  }

  private reload(): void {
    this.audit.list({ from: this.from() || undefined, to: this.to() || undefined }).subscribe({
      next: (rows) => this.rows.set(rows),
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load the audit log.'),
    });
  }
}
