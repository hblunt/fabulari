// client/src/app/features/groups/group-member-list.ts
// Full group roster (wf-05/06), sorted alphabetically. Admins get a row
// menu for promote, demote and remove. The last admin cannot be dropped.

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { take } from 'rxjs';
import { HlmAvatar, HlmAvatarFallback } from '@spartan-ng/helm/avatar';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import type { Group, User } from '../../core/models';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { ConfirmDialog, type ConfirmDialogContext } from '../requests/confirm-dialog';
import { ReasonDialog, type ReasonDialogContext } from '../requests/reason-dialog';
import { ReportUserForm, type ReportUserFormContext } from '../requests/report-user-form';
import { RequestService } from '../../core/services/request-service';
import { CountBadge } from '../../shared/count-badge';

@Component({
  selector: 'app-group-member-list',
  imports: [HlmAvatar, HlmAvatarFallback, HlmButton, CountBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2">
      <h2 class="text-lg font-medium">Members</h2>
      <app-count-badge [value]="sorted().length" />
    </div>

    <ul class="mt-3 divide-y rounded-xl border">
      @for (member of sorted(); track member.id) {
        <li class="flex items-center gap-3 px-3 py-2 text-sm">
          <hlm-avatar size="sm">
            <span hlmAvatarFallback>{{ initials(member) }}</span>
          </hlm-avatar>
          <span class="min-w-0 flex-1">
            {{ member.firstName }} {{ member.lastName }}
            @if (member.id === currentUserId()) {
              <span class="text-muted-foreground"> · You</span>
            }
            @if (isAdminMember(member.id)) {
              <span class="text-muted-foreground"> · Group admin</span>
            }
          </span>
          @if (isAdmin() && hasMenu(member)) {
            <details class="relative">
              <summary class="cursor-pointer list-none px-2 text-muted-foreground" aria-label="Member actions">⋯</summary>
              <div class="absolute right-0 z-10 mt-1 flex min-w-40 flex-col rounded-md border bg-popover p-1 shadow">
                @if (!isAdminMember(member.id)) {
                  <button class="rounded px-2 py-1.5 text-left text-sm hover:bg-muted" type="button" (click)="promote(member)">
                    Promote to admin
                  </button>
                }
                @if (isAdminMember(member.id) && !isSoleAdmin(member.id)) {
                  <button class="rounded px-2 py-1.5 text-left text-sm hover:bg-muted" type="button" (click)="demote(member)">
                    Demote
                  </button>
                }
                @if (!isSoleAdmin(member.id) && member.id !== currentUserId()) {
                  <button class="rounded px-2 py-1.5 text-left text-sm hover:bg-muted" type="button" (click)="remove(member)">
                    Remove
                  </button>
                }
                @if (member.id !== currentUserId()) {
                  <button class="rounded px-2 py-1.5 text-left text-sm hover:bg-muted" type="button" (click)="systemBan(member)">
                    Request system ban
                  </button>
                }
              </div>
            </details>
          }
        </li>
      }
    </ul>
    <p class="mt-2 text-xs text-muted-foreground">Sorted alphabetically.</p>

    <div class="mt-3 flex flex-col gap-2">
      <button hlmBtn variant="outline" type="button" [disabled]="isSoleAdmin(currentUserId())" (click)="leave()">
        Leave group
      </button>
      <button hlmBtn variant="outline" type="button" (click)="report()">Report a member</button>
    </div>
  `,
})
export class GroupMemberList {
  private readonly groupsApi = inject(GroupService);
  private readonly requests = inject(RequestService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  readonly group = input.required<Group>();
  readonly members = input.required<User[]>();
  readonly currentUserId = input.required<string>();
  readonly isAdmin = input(false);
  readonly changed = output<void>();
  readonly left = output<void>();

  protected readonly sorted = computed(() =>
    [...this.members()].sort(
      (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
    ),
  );

  protected initials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  protected isAdminMember(userId: string): boolean {
    return this.group().admins.includes(userId);
  }

  protected isSoleAdmin(userId: string): boolean {
    return this.isAdminMember(userId) && this.group().admins.length === 1;
  }

  // Hide ⋯ when every action in the menu would be skipped (own row as sole admin).
  protected hasMenu(member: User): boolean {
    const self = member.id === this.currentUserId();
    const canPromote = !this.isAdminMember(member.id);
    const canDemote = this.isAdminMember(member.id) && !this.isSoleAdmin(member.id);
    const canRemove = !this.isSoleAdmin(member.id) && !self;
    const canBan = !self;
    return canPromote || canDemote || canRemove || canBan;
  }

  protected promote(member: User): void {
    this.groupsApi.promote(this.group().id, member.id).subscribe({
      next: () => this.changed.emit(),
      error: (err) => this.notify.error(err.error?.error ?? 'Could not promote this member.'),
    });
  }

  protected demote(member: User): void {
    this.groupsApi.demote(this.group().id, member.id).subscribe({
      next: () => this.changed.emit(),
      error: (err) => this.notify.error(err.error?.error ?? 'Could not demote this member.'),
    });
  }

  protected remove(member: User): void {
    const ref = this.dialog.open<boolean, ConfirmDialogContext>(ConfirmDialog, {
      context: {
        title: `Remove ${member.firstName} ${member.lastName}?`,
        subtitle: 'They lose access to this group and its rooms immediately.',
        confirmLabel: 'Remove member',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (!ok) return;
      this.groupsApi.removeMember(this.group().id, member.id).subscribe({
        next: () => this.changed.emit(),
        error: (err) => this.notify.error(err.error?.error ?? 'Could not remove this member.'),
      });
    });
  }

  protected leave(): void {
    const ref = this.dialog.open<boolean, ConfirmDialogContext>(ConfirmDialog, {
      context: {
        title: 'Leave this group?',
        subtitle: 'You lose access to the group and all of its rooms immediately.',
        confirmLabel: 'Leave group',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (!ok) return;
      this.groupsApi.removeMember(this.group().id, this.currentUserId()).subscribe({
        next: () => this.left.emit(),
        error: (err) => this.notify.error(err.error?.error ?? 'Could not leave this group.'),
      });
    });
  }

  protected report(): void {
    const ref = this.dialog.open<boolean, ReportUserFormContext>(ReportUserForm, {
      context: {
        groupId: this.group().id,
        members: this.members(),
        currentUserId: this.currentUserId(),
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (ok) {
        this.notify.success('Report submitted.');
        this.changed.emit();
      }
    });
  }

  protected systemBan(member: User): void {
    const ref = this.dialog.open<string, ReasonDialogContext>(ReasonDialog, {
      context: {
        title: 'Request a system-wide ban?',
        subtitle: `${member.firstName} ${member.lastName} · sent to the super admin`,
        notice: 'This asks for permission to delete the account. It does not delete them yet.',
        confirmLabel: 'Submit request',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((reason) => {
      if (!reason) return;
      this.requests.create({ type: 'SYSTEM_BAN', targetId: member.id, reason }).subscribe({
        next: () => this.notify.success('System ban request submitted.'),
        error: (err) => this.notify.error(err.error?.error ?? 'Could not submit the request.'),
      });
    });
  }
}
