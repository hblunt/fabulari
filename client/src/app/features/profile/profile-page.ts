// client/src/app/features/profile/profile-page.ts
// Own account (wf-11). Email is read-only. Picture upload is shown disabled.
// Group names come from GET /api/groups/:id so admin vs member can be labelled.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import type { User } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { GroupService } from '../../core/services/group-service';
import { NotificationService } from '../../core/services/notification-service';
import { UserService } from '../../core/services/user-service';
import { ChangePasswordForm } from './change-password-form';
import { ProfilePictureUpload } from './profile-picture-upload';

interface GroupRow {
  id: string;
  title: string;
  role: string;
}

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, HlmButton, HlmInput, HlmLabel, ChangePasswordForm, ProfilePictureUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <h1 class="text-2xl font-semibold">Profile</h1>
      <p class="mt-1 text-sm text-muted-foreground">Your account details.</p>

      @if (user(); as user) {
        <div class="mt-6 grid gap-6 md:grid-cols-2">
          <app-profile-picture-upload [initials]="initials(user)" />

          <form class="rounded-xl border p-4" [formGroup]="form" (ngSubmit)="save()">
            <h2 class="font-medium">Details</h2>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label hlmLabel for="firstName">First name</label>
                <input hlmInput id="firstName" formControlName="firstName" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label hlmLabel for="lastName">Last name</label>
                <input hlmInput id="lastName" formControlName="lastName" />
              </div>
            </div>
            <div class="mt-3 flex w-1/3 flex-col gap-1.5">
              <label hlmLabel for="age">Age</label>
              <input hlmInput id="age" type="number" min="1" formControlName="age" />
            </div>
            <div class="mt-3 flex flex-col gap-1.5">
              <label hlmLabel for="email">Email</label>
              <input hlmInput id="email" [value]="user.email" disabled />
              <span class="text-xs text-muted-foreground">Cannot be changed.</span>
            </div>
            <button hlmBtn class="mt-4" type="submit" [disabled]="form.invalid || isSaving()">Save changes</button>
          </form>

          <app-change-password-form />

          <div class="rounded-xl border p-4">
            <h2 class="font-medium">Your groups</h2>
            <ul class="mt-3 flex flex-col gap-2 text-sm">
              @for (group of groups(); track group.id) {
                <li class="flex justify-between gap-3">
                  <span>{{ group.title }}</span>
                  <span class="text-muted-foreground">{{ group.role }}</span>
                </li>
              } @empty {
                <li class="text-muted-foreground">You are not in any groups.</li>
              }
            </ul>
          </div>
        </div>
      }
    </section>
  `,
})
export class ProfilePage {
  private readonly users = inject(UserService);
  private readonly groupsApi = inject(GroupService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly user = signal<User | null>(null);
  protected readonly groups = signal<GroupRow[]>([]);
  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    age: [1, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.users.me().subscribe({
      next: (user) => this.show(user),
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load your profile.'),
    });
  }

  protected initials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  protected save(): void {
    if (this.form.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    const value = this.form.getRawValue();
    this.users.patchMe({ ...value, age: Number(value.age) }).subscribe({
      next: (user) => {
        this.isSaving.set(false);
        this.auth.applyUser(user);
        this.show(user);
        this.notify.success('Profile updated.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notify.error(err.error?.error ?? 'Could not update your profile.');
      },
    });
  }

  private show(user: User): void {
    this.user.set(user);
    this.form.setValue({ firstName: user.firstName, lastName: user.lastName, age: user.age });
    this.loadGroups(user);
  }

  private loadGroups(user: User): void {
    if (!user.groups.length) {
      this.groups.set([]);
      return;
    }
    forkJoin(user.groups.map((id) => this.groupsApi.get(id))).subscribe({
      next: (details) => {
        this.groups.set(
          details.map((d) => ({
            id: d.group.id,
            title: d.group.title,
            role: d.group.admins.includes(user.id) ? 'Group admin' : 'Member',
          })),
        );
      },
      error: (err) => this.notify.error(err.error?.error ?? 'Could not load your groups.'),
    });
  }
}
