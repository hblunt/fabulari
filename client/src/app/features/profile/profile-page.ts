// client/src/app/features/profile/profile-page.ts
// Own account (wf-11). Email is read-only. Picture upload is shown disabled.
// Date of birth is editable; age is calculated on the server. Users (not the
// super admin) can delete their own account from here.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import type { User } from '../../core/models';
import { AuthService } from '../../core/services/auth-service';
import { NotificationService } from '../../core/services/notification-service';
import { UserService } from '../../core/services/user-service';
import { ConfirmDialog, type ConfirmDialogContext } from '../requests/confirm-dialog';
import { ChangePasswordForm } from './change-password-form';
import { ProfilePictureUpload } from './profile-picture-upload';

function todayLocalIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
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
        <div class="mt-6 grid items-start gap-6 md:grid-cols-2">
          <div class="flex flex-col gap-6">
            <app-profile-picture-upload [initials]="initials(user)" />
            <app-change-password-form />
          </div>

          <div class="flex flex-col gap-6">
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
              <div class="mt-3 flex w-1/2 flex-col gap-1.5">
                <label hlmLabel for="dateOfBirth">Date of birth</label>
                <input hlmInput id="dateOfBirth" type="date" formControlName="dateOfBirth" [max]="maxDob" />
                <span class="text-xs text-muted-foreground">Age {{ user.age }}.</span>
              </div>
              <div class="mt-3 flex flex-col gap-1.5">
                <label hlmLabel for="email">Email</label>
                <input hlmInput id="email" [value]="user.email" disabled />
                <span class="text-xs text-muted-foreground">Cannot be changed.</span>
              </div>
              <button hlmBtn class="mt-4" type="submit" [disabled]="form.invalid || isSaving()">Save changes</button>
            </form>

            @if (user.role !== 'SUPER_ADMIN') {
              <div class="rounded-xl border p-4">
                <h2 class="font-medium">Delete account</h2>
                <p class="mt-2 text-sm text-muted-foreground">
                  Removes your account. You can register again with the same email.
                </p>
                <button
                  hlmBtn
                  variant="destructive"
                  class="mt-4"
                  type="button"
                  [disabled]="isDeleting()"
                  (click)="confirmDelete()"
                >
                  Delete my account
                </button>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class ProfilePage {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly user = signal<User | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly maxDob = todayLocalIso();

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
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
    this.users.patchMe(this.form.getRawValue()).subscribe({
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

  protected confirmDelete(): void {
    if (this.isDeleting()) return;
    const ref = this.dialog.open<boolean, ConfirmDialogContext>(ConfirmDialog, {
      context: {
        title: 'Delete your account?',
        subtitle: 'This cannot be undone. You can register again with the same email.',
        notice:
          'If you are the only admin of a group that still has members, the next member alphabetically becomes admin. Groups left empty are removed.',
        confirmLabel: 'Delete account',
      },
    });
    ref.closed$.pipe(take(1)).subscribe((ok) => {
      if (!ok) return;
      this.isDeleting.set(true);
      this.users.deleteMe().subscribe({
        next: () => {
          this.auth.clearSession();
          this.notify.success('Your account has been deleted.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isDeleting.set(false);
          this.notify.error(err.error?.error ?? 'Could not delete your account.');
        },
      });
    });
  }

  private show(user: User): void {
    this.user.set(user);
    this.form.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
    });
  }
}
