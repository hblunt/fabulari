// client/src/app/features/groups/group-detail-page.ts
// Group landing (wireframes 05/06). Stage 2 ships the request actions and
// embeds RequestQueue for admins; room lists and member menus wait for Stage 3.

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import type { Group, User } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';
import { ConfirmDialog, type ConfirmDialogContext } from '../requests/confirm-dialog';
import { ReasonDialog, type ReasonDialogContext } from '../requests/reason-dialog';
import { ReportUserForm, type ReportUserFormContext } from '../requests/report-user-form';
import { RequestQueue } from '../requests/request-queue';
import { RoomRequestForm, type RoomRequestFormContext } from '../requests/room-request-form';

@Component({
  selector: 'app-group-detail-page',
  imports: [RouterLink, HlmBadge, HlmButton, RequestQueue],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (group(); as group) {
      <section class="mx-auto max-w-6xl px-4 py-8">
        <p class="text-sm text-muted-foreground">
          <a routerLink="/groups" class="hover:underline">Groups</a>
          <span> / {{ group.title }}</span>
        </p>

        <div class="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold">{{ group.title }}</h1>
            <p class="mt-1 text-muted-foreground">{{ group.description }}</p>
            @if (isAdmin()) {
              <span hlmBadge variant="secondary" class="mt-2">You administer this group</span>
            }
          </div>
          <div class="flex flex-wrap gap-2">
            <button hlmBtn variant="outline" type="button" (click)="openReport()">Report a member</button>
            <button hlmBtn type="button" (click)="openRoom()">Add room</button>
            @if (isAdmin()) {
              <button hlmBtn variant="outline" type="button" (click)="requestDeletion()">Request deletion</button>
            }
          </div>
        </div>

        @if (isAdmin()) {
          <div class="mt-8">
            <app-request-queue [groupId]="group.id" [groupTitle]="group.title" />
          </div>
        }

        <div class="mt-8">
          <h2 class="text-lg font-medium">Members</h2>
          <ul class="mt-3 divide-y rounded-xl border">
            @for (member of members(); track member.id) {
              <li class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span>
                  {{ member.firstName }} {{ member.lastName }}
                  @if (group.admins.includes(member.id)) {
                    <span class="text-muted-foreground"> · Group admin</span>
                  }
                </span>
                @if (isAdmin() && member.id !== currentUserId()) {
                  <button hlmBtn variant="ghost" size="sm" type="button" (click)="requestSystemBan(member)">
                    Request system ban
                  </button>
                }
              </li>
            }
          </ul>
        </div>
      </section>
    }
  `,
})
export class GroupDetailPage {
  private readonly groupsApi = inject(GroupService);
  private readonly requests = inject(RequestService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);
  private readonly groupId = inject(ActivatedRoute).snapshot.paramMap.get('groupId') ?? '';

  protected readonly group = signal<Group | null>(null);
  protected readonly members = signal<User[]>([]);
  protected readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');
  protected readonly isAdmin = computed(() => {
    const group = this.group();
    const id = this.currentUserId();
    return Boolean(group && id && group.admins.includes(id));
  });

  constructor() {
    this.reload();
  }

  protected openRoom(): void {
    const ref = this.dialog.open<boolean, RoomRequestFormContext>(RoomRequestForm, {
      context: { groupId: this.groupId },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (ok) this.notify.success('Room request submitted.');
    });
  }

  protected openReport(): void {
    const ref = this.dialog.open<boolean, ReportUserFormContext>(ReportUserForm, {
      context: {
        groupId: this.groupId,
        members: this.members(),
        currentUserId: this.currentUserId(),
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (ok) this.notify.success('Report submitted.');
    });
  }

  protected requestDeletion(): void {
    const group = this.group();
    if (!group) return;
    const ref = this.dialog.open<boolean, ConfirmDialogContext>(ConfirmDialog, {
      context: {
        title: `Request deletion of ${group.title}?`,
        subtitle: 'The super admin must approve before the group and its rooms are removed.',
        confirmLabel: 'Submit request',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (!ok) return;
      this.requests.create({ type: 'GROUP_DELETE', targetId: group.id }).subscribe({
        next: () => this.notify.success('Deletion request submitted.'),
        error: (err) => this.notify.error(err.error?.error ?? 'Could not submit the request.'),
      });
    });
  }

  protected requestSystemBan(member: User): void {
    const ref = this.dialog.open<string, ReasonDialogContext>(ReasonDialog, {
      context: {
        title: `Request a system-wide ban?`,
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

  private reload(): void {
    this.groupsApi.get(this.groupId).subscribe({
      next: ({ group, memberList }) => {
        this.group.set(group);
        this.members.set(memberList);
      },
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load this group.'),
    });
  }
}
