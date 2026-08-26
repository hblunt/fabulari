// client/src/app/features/groups/group-detail-page.ts
// One group landing for members and admins (wf-05/06). Admin controls
// appear in place when the viewer administers the group.

import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, take } from 'rxjs';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import type { Group, Room, User } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';
import { RoomService } from '../../core/services/room-service';
import { ConfirmDialog, type ConfirmDialogContext } from '../requests/confirm-dialog';
import { RequestQueue } from '../requests/request-queue';
import { ConsequenceDialog, type ConsequenceDialogContext } from './consequence-dialog';
import { GroupBanList } from './group-ban-list';
import { GroupMemberList } from './group-member-list';
import { GroupSettingsForm, type GroupSettingsFormContext, type GroupSettingsResult } from './group-settings-form';
import { RoomList } from './room-list';

@Component({
  selector: 'app-group-detail-page',
  imports: [NgClass, RouterLink, HlmBadge, HlmButton, RequestQueue, RoomList, GroupMemberList, GroupBanList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (group(); as group) {
      <section class="mx-auto max-w-6xl px-4 py-8" [ngClass]="'theme-' + group.theme">
        <p class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a routerLink="/groups" class="hover:underline">Groups</a>
          <span> / {{ group.title }}</span>
          @if (isAdmin()) {
            <span hlmBadge variant="secondary">You administer this group</span>
          }
        </p>

        <div class="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold">{{ group.title }}</h1>
            <p class="mt-1 text-muted-foreground">{{ group.description }}</p>
          </div>
          @if (isAdmin()) {
            <div class="flex flex-wrap gap-2">
              <button hlmBtn variant="outline" type="button" (click)="requestDeletion()">Request deletion</button>
              <button hlmBtn type="button" (click)="editGroup()">Edit group</button>
            </div>
          }
        </div>

        <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div class="flex min-w-0 flex-col gap-8">
            @if (isAdmin()) {
              <app-request-queue
                [groupId]="group.id"
                [groupTitle]="group.title"
                [reloadToken]="reloadToken()"
                (approved)="reload()"
              />
            }
            <app-room-list
              [groupId]="group.id"
              [rooms]="rooms()"
              [isAdmin]="isAdmin()"
              (changed)="reload()"
            />
          </div>

          <aside class="flex flex-col gap-8">
            <app-group-member-list
              [group]="group"
              [members]="members()"
              [currentUserId]="currentUserId()"
              [isAdmin]="isAdmin()"
              (changed)="reload()"
              (left)="onLeft()"
            />
            @if (isAdmin()) {
              <app-group-ban-list [banned]="banned()" />
            }
          </aside>
        </div>
      </section>
    }
  `,
})
export class GroupDetailPage {
  private readonly groupsApi = inject(GroupService);
  private readonly roomsApi = inject(RoomService);
  private readonly requests = inject(RequestService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);
  private readonly router = inject(Router);
  private readonly groupId = inject(ActivatedRoute).snapshot.paramMap.get('groupId') ?? '';

  protected readonly group = signal<Group | null>(null);
  protected readonly members = signal<User[]>([]);
  protected readonly rooms = signal<Room[]>([]);
  protected readonly banned = signal<User[]>([]);
  protected readonly reloadToken = signal(0);
  protected readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');
  protected readonly isAdmin = computed(() => {
    const group = this.group();
    const id = this.currentUserId();
    return Boolean(group && id && group.admins.includes(id));
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.reloadToken.update((n) => n + 1);
    forkJoin({
      detail: this.groupsApi.get(this.groupId),
      rooms: this.roomsApi.list(this.groupId),
    }).subscribe({
      next: ({ detail, rooms }) => {
        this.group.set(detail.group);
        this.members.set(detail.memberList ?? []);
        this.rooms.set(rooms);
        if (detail.group.admins.includes(this.currentUserId())) {
          this.groupsApi.bans(this.groupId).subscribe((banned) => this.banned.set(banned));
        } else {
          this.banned.set([]);
        }
      },
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load this group.'),
    });
  }

  protected editGroup(): void {
    const group = this.group();
    if (!group) return;
    const ref = this.dialog.open<GroupSettingsResult, GroupSettingsFormContext>(GroupSettingsForm, {
      context: { group },
    });
    ref.closed$.pipe(take(1)).subscribe((result) => {
      if (!result) return;
      const affected =
        result.ageLimit > group.ageLimit
          ? this.members().filter((m) => m.age < result.ageLimit)
          : [];
      if (affected.length) {
        this.confirmAgeRise(group, result, affected);
        return;
      }
      this.saveGroup(result);
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

  protected onLeft(): void {
    this.auth.forgetGroup(this.groupId);
    this.router.navigate(['/groups']);
  }

  private confirmAgeRise(group: Group, result: GroupSettingsResult, affected: User[]): void {
    const remainingAdmins = group.admins.filter((id) => !affected.some((u) => u.id === id));
    const blocked = remainingAdmins.length === 0;
    const ref = this.dialog.open<boolean, ConsequenceDialogContext>(ConsequenceDialog, {
      context: {
        title: `Raise the age limit to ${result.ageLimit}+?`,
        subtitle: `Currently ${group.ageLimit}+ · ${group.title}`,
        body: `${affected.length} current member${affected.length === 1 ? '' : 's'} fall below the new limit and will be removed from the group immediately.`,
        affected,
        confirmLabel: 'Raise limit',
        confirmDisabled: blocked,
        notice: blocked ? 'This change would leave the group with no admin.' : undefined,
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (ok) this.saveGroup(result);
    });
  }

  private saveGroup(result: GroupSettingsResult): void {
    this.groupsApi.patch(this.groupId, result).subscribe({
      next: () => {
        this.notify.success('Group updated.');
        this.reload();
      },
      error: (err) => this.notify.error(err.error?.error ?? 'Could not update the group.'),
    });
  }
}
