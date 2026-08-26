// client/src/app/features/admin/admin-users-page.ts
// Every account (wf-13). Delete needs an approved SYSTEM_BAN and is blocked
// while the user is the sole admin of any group. Sole-admin is derived from
// GET /api/groups/:id — the users list does not include admin arrays.

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin, map, of, switchMap, take } from 'rxjs';
import { HlmAvatar, HlmAvatarFallback } from '@spartan-ng/helm/avatar';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import type { AppRequest, Group, User } from '../../core/models';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';
import { UserService } from '../../core/services/user-service';
import { ConfirmDialog, type ConfirmDialogContext } from '../requests/confirm-dialog';

@Component({
  selector: 'app-admin-users-page',
  imports: [HlmAvatar, HlmAvatarFallback, HlmBadge, HlmButton, HlmInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-2xl font-semibold">Users</h1>
      <p class="mt-1 text-sm text-muted-foreground">Every account in the system.</p>

      <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          hlmInput
          class="max-w-sm"
          placeholder="Search by name or email"
          [value]="query()"
          (input)="onSearch($event)"
        />
        <span class="text-sm text-muted-foreground">{{ visible().length }} accounts</span>
      </div>

      <ul class="mt-4 divide-y rounded-xl border">
        @for (user of visible(); track user.id) {
          <li class="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <hlm-avatar size="sm">
              <span hlmAvatarFallback>{{ initials(user) }}</span>
            </hlm-avatar>
            <span class="min-w-32 font-medium">{{ user.firstName }} {{ user.lastName }}</span>
            <span class="min-w-40 text-muted-foreground">{{ user.email }}</span>
            <span class="w-10 text-muted-foreground">{{ user.age }}</span>
            <span class="w-16 text-muted-foreground">{{ user.groups.length }}</span>
            <span class="flex min-w-36 items-center gap-2">
              {{ roleLabel(user) }}
              @if (isSoleAdmin(user.id)) {
                <span hlmBadge variant="secondary">Sole admin</span>
              }
            </span>
            <button
              hlmBtn
              variant="outline"
              size="sm"
              class="ml-auto"
              type="button"
              [disabled]="!canDelete(user)"
              (click)="remove(user)"
            >
              Delete
            </button>
          </li>
        } @empty {
          <li class="px-4 py-3 text-sm text-muted-foreground">No accounts match that search.</li>
        }
      </ul>

      <p class="mt-6 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        Deletion requires an approved system ban request and is blocked while the
        user is the sole admin of any group.
      </p>
    </section>
  `,
})
export class AdminUsersPage {
  private readonly usersApi = inject(UserService);
  private readonly groupsApi = inject(GroupService);
  private readonly requests = inject(RequestService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  protected readonly query = signal('');
  protected readonly users = signal<User[]>([]);
  protected readonly soleAdminIds = signal<Set<string>>(new Set());
  protected readonly groupAdminIds = signal<Set<string>>(new Set());
  protected readonly banByTarget = signal<Map<string, AppRequest>>(new Map());

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const rows = [...this.users()].sort(
      (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
    );
    if (!q) return rows;
    return rows.filter((u) => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      return name.includes(q) || u.email.toLowerCase().includes(q);
    });
  });

  constructor() {
    this.reload();
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected initials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  protected isSoleAdmin(userId: string): boolean {
    return this.soleAdminIds().has(userId);
  }

  protected roleLabel(user: User): string {
    if (user.role === 'SUPER_ADMIN') return 'Super admin';
    return this.groupAdminIds().has(user.id) ? 'Group admin' : 'User';
  }

  protected canDelete(user: User): boolean {
    return user.role !== 'SUPER_ADMIN' && !this.isSoleAdmin(user.id) && this.banByTarget().has(user.id);
  }

  protected remove(user: User): void {
    const request = this.banByTarget().get(user.id);
    if (!request || !this.canDelete(user)) return;
    const ref = this.dialog.open<boolean, ConfirmDialogContext>(ConfirmDialog, {
      context: {
        title: `Delete ${user.firstName} ${user.lastName}?`,
        subtitle: 'Their account is removed immediately. The email can never be registered again.',
        confirmLabel: 'Delete account',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (!ok) return;
      this.usersApi.delete(user.id, request.id).subscribe({
        next: () => {
          this.notify.success('Account deleted.');
          this.reload();
        },
        error: (err) => this.notify.error(err.error?.error ?? 'Could not delete this account.'),
      });
    });
  }

  private reload(): void {
    forkJoin({
      users: this.usersApi.list(),
      summaries: this.groupsApi.list(),
      bans: this.requests.list({ type: 'SYSTEM_BAN', status: 'APPROVED' }),
    })
      .pipe(
        switchMap(({ users, summaries, bans }) => {
          const groups$ = summaries.length
            ? forkJoin(summaries.map((s) => this.groupsApi.get(s.id).pipe(map((d) => d.group))))
            : of([] as Group[]);
          return groups$.pipe(map((groups) => ({ users, groups, bans })));
        }),
      )
      .subscribe({
        next: ({ users, groups, bans }) => {
          this.users.set(users);
          this.soleAdminIds.set(new Set(groups.filter((g) => g.admins.length === 1).map((g) => g.admins[0])));
          this.groupAdminIds.set(new Set(groups.flatMap((g) => g.admins)));
          this.banByTarget.set(new Map(bans.filter((r) => r.targetId).map((r) => [r.targetId as string, r])));
        },
        error: (err) => this.notify.error(err.error?.error ?? 'Could not load users.'),
      });
  }
}
