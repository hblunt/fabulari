// client/src/app/features/profile/change-password-form.ts
// Current password plus new password twice (wf-11). The confirm field is
// client-only — the API takes currentPassword and newPassword.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { NotificationService } from '../../core/services/notification-service';
import { UserService } from '../../core/services/user-service';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{8,}$/;

@Component({
  selector: 'app-change-password-form',
  imports: [ReactiveFormsModule, HlmButton, HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form class="rounded-xl border p-4" [formGroup]="form" (ngSubmit)="submit()">
      <h2 class="font-medium">Change password</h2>
      <div class="mt-4 flex flex-col gap-3">
        <div class="flex flex-col gap-1.5">
          <label hlmLabel for="currentPassword">Current password</label>
          <input hlmInput id="currentPassword" type="password" formControlName="currentPassword" autocomplete="current-password" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label hlmLabel for="newPassword">New password</label>
          <input hlmInput id="newPassword" type="password" formControlName="newPassword" autocomplete="new-password" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label hlmLabel for="confirmPassword">Confirm new password</label>
          <input hlmInput id="confirmPassword" type="password" formControlName="confirmPassword" autocomplete="new-password" />
        </div>
      </div>
      <button hlmBtn class="mt-4" type="submit" [disabled]="form.invalid || isSubmitting()">
        Update password
      </button>
    </form>
  `,
})
export class ChangePasswordForm {
  private readonly users = inject(UserService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (group) =>
        group.get('newPassword')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true },
    },
  );

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.users.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.form.reset();
        this.notify.success('Password updated.');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not update the password.');
      },
    });
  }
}
