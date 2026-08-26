// client/src/app/features/requests/request-queue.ts
// Administrator pending queue (wireframes 10 and 12). One component: the API
// scopes the rows, and `groupId` embeds it on a group page vs the super
// admin route.

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { take } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import type { AppRequest, RequestType } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';
import { ConfirmDialog, type ConfirmDialogContext } from './confirm-dialog';
import { ReasonDialog, type ReasonDialogContext } from './reason-dialog';
import { RequestItem } from './request-item';
import { TYPE_LABELS } from './request-labels';

interface Chip {
  id: RequestType | 'ALL';
  label: string;
}

const GROUP_CHIPS: Chip[] = [
  { id: 'ALL', label: 'All' },
  { id: 'GROUP_JOIN', label: 'Join' },
  { id: 'ROOM_CREATE', label: 'Room' },
  { id: 'USER_REPORT', label: 'Reports' },
];

const ADMIN_CHIPS: Chip[] = [
  { id: 'ALL', label: 'All' },
  { id: 'GROUP_CREATE', label: 'Group creation' },
  { id: 'GROUP_DELETE', label: 'Group deletion' },
  { id: 'SYSTEM_BAN', label: 'System ban' },
];

@Component({
  selector: 'app-request-queue',
  imports: [HlmButton, RequestItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="groupId() ? '' : 'mx-auto max-w-6xl px-4 py-8'">
      @if (groupId()) {
        <h2 class="text-xl font-semibold">
          Pending requests
          <span class="text-base font-normal text-muted-foreground">{{ visible().length }}</span>
        </h2>
      } @else {
        <h1 class="text-2xl font-semibold">Pending requests</h1>
      }
      <p class="mt-1 text-sm text-muted-foreground">{{ subtitle() }}</p>

      <div class="mt-4 flex flex-wrap gap-2">
        @for (chip of chips(); track chip.id) {
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
          <app-request-item
            [request]="request"
            mode="queue"
            [busy]="busyId() === request.id"
            (approve)="onApprove(request)"
            (reject)="onReject(request)"
          />
        } @empty {
          <p class="text-sm text-muted-foreground">No pending requests.</p>
        }
      </div>

      <p class="mt-6 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        @if (groupId()) {
          Rejecting any request opens a dialog requiring a written reason.
        } @else {
          Approving a system ban grants permission to delete the account. Deletion
          happens from the Users page; the email can never be registered again.
        }
      </p>
    </section>
  `,
})
export class RequestQueue {
  private readonly requests = inject(RequestService);
  private readonly groupsApi = inject(GroupService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  readonly groupId = input<string | null>(null);
  readonly groupTitle = input('');
  // Parent bumps this after a local submit (propose room, report) so the
  // queue refetches — groupId itself has not changed.
  readonly reloadToken = input(0);
  readonly approved = output<AppRequest>();

  protected readonly filter = signal<RequestType | 'ALL'>('ALL');
  protected readonly rows = signal<AppRequest[]>([]);
  protected readonly busyId = signal<string | null>(null);

  protected readonly chips = computed(() => (this.groupId() ? GROUP_CHIPS : ADMIN_CHIPS));

  protected readonly subtitle = computed(() =>
    this.groupId()
      ? `${this.groupTitle()} · you administer this group`
      : 'Group creation, group deletion and system bans.',
  );

  protected readonly visible = computed(() => {
    const chip = this.filter();
    const groupId = this.groupId();
    const me = this.auth.currentUser()?.id;
    return this.rows()
      .filter((r) => r.status === 'PENDING')
      .filter((r) => r.submittedBy !== me)
      .filter((r) => !groupId || r.groupId === groupId)
      .filter((r) => chip === 'ALL' || r.type === chip)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  constructor() {
    effect(() => {
      this.groupId();
      this.reloadToken();
      untracked(() => this.reload());
    });
  }

  protected onApprove(request: AppRequest): void {
    if (request.type === 'GROUP_DELETE' || request.type === 'SYSTEM_BAN' || request.type === 'USER_REPORT') {
      const ctx = this.confirmContext(request);
      if (!ctx) return;
      const ref = this.dialog.open<boolean, ConfirmDialogContext>(ConfirmDialog, { context: ctx });
      ref.closed$.pipe(take(1)).subscribe((ok) => {
        if (ok) this.approve(request);
      });
      return;
    }
    this.approve(request);
  }

  private confirmContext(request: AppRequest): ConfirmDialogContext | null {
    if (request.type === 'GROUP_DELETE') {
      return {
        title: `Delete ${request.targetName}?`,
        subtitle: 'The group and its rooms are removed immediately. This cannot be undone.',
        confirmLabel: 'Delete group',
      };
    }
    if (request.type === 'SYSTEM_BAN') {
      return {
        title: `Approve system ban of ${request.targetName}?`,
        subtitle: 'This grants permission to delete the account. Deletion happens from the Users page.',
        notice: 'The email can never be registered again after deletion.',
        confirmLabel: 'Approve',
      };
    }
    // USER_REPORT: confirm the ban before approve, so cancel leaves the
    // report pending (approve only grants permission; POST /bans does it).
    return {
      title: `Ban ${request.targetName} from this group?`,
      subtitle: 'They lose access to the group and all of its rooms immediately. This cannot be undone.',
      notice: `Their account and other group memberships are unaffected. Acting on report from ${request.submitterName}.`,
      confirmLabel: 'Ban member',
    };
  }

  protected onReject(request: AppRequest): void {
    const ref = this.dialog.open<string, ReasonDialogContext>(ReasonDialog, {
      context: {
        title: 'Reject this request',
        subtitle: `${TYPE_LABELS[request.type]} · ${request.submitterName}`,
        confirmLabel: 'Reject request',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((reason) => {
      if (!reason) return;
      this.busyId.set(request.id);
      this.requests.reject(request.id, reason).subscribe({
        next: () => {
          this.busyId.set(null);
          this.notify.success('Request rejected.');
          this.reload();
        },
        error: (err) => {
          this.busyId.set(null);
          this.notify.error(err.error?.error ?? 'Could not reject this request.');
        },
      });
    });
  }

  private approve(request: AppRequest): void {
    this.busyId.set(request.id);
    this.requests.approve(request.id).subscribe({
      next: () => {
        // GROUP_DELETE approval only grants permission; the group is removed
        // by DELETE /api/groups/:id so the cascade lives in one place.
        if (request.type === 'GROUP_DELETE' && request.targetId) {
          this.groupsApi.delete(request.targetId, request.id).subscribe({
            next: () => this.finishApprove(request),
            error: (err) => this.failApprove(err),
          });
          return;
        }
        if (request.type === 'USER_REPORT' && request.targetId) {
          const groupId = this.groupId() ?? request.groupId;
          if (!groupId) {
            this.failApprove({ error: { error: 'Could not ban this member.' } });
            return;
          }
          this.groupsApi.ban(groupId, request.targetId, request.id).subscribe({
            next: () => this.finishApprove(request),
            error: (err) => this.failApprove(err),
          });
          return;
        }
        this.finishApprove(request);
      },
      error: (err) => this.failApprove(err),
    });
  }

  private finishApprove(request: AppRequest): void {
    this.busyId.set(null);
    this.notify.success(request.type === 'USER_REPORT' ? 'Member banned.' : 'Request approved.');
    this.approved.emit(request);
    this.reload();
  }

  private failApprove(err: { error?: { error?: string } }): void {
    this.busyId.set(null);
    this.notify.error(err.error?.error ?? 'Could not approve this request.');
  }

  private reload(): void {
    this.requests.list({ status: 'PENDING' }).subscribe({
      next: (rows) => this.rows.set(rows),
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load requests.'),
    });
  }
}
