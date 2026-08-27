// client/src/app/features/auth/bootstrap-page.ts
// First-run onboarding (wireframe 03): creates the single super admin while
// the system has no users. Reached only via bootstrapGuard; the server's 409
// makes the one-time rule real even if the guard is bypassed. Success goes to
// /login (flow map) — the super admin signs in like everyone else.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { AuthService } from '../../core/services/auth-service';
import { NotificationService } from '../../core/services/notification-service';
import { BrandMark } from '../../shared/brand-mark';

// Same rule as the server (server/users.js) and RegisterPage.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{8,}$/;

@Component({
  selector: 'app-bootstrap-page',
  imports: [ReactiveFormsModule, HlmButton, HlmCardImports, HlmInput, HlmLabel, BrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col items-center bg-muted/40 px-4 pt-8 md:pt-10">
      <app-brand-mark variant="auth" />
      <section hlmCard class="mt-3 w-full max-w-md md:mt-4">
        <div hlmCardHeader class="text-center">
          <h1 hlmCardTitle class="text-xl">Set up Fabulari</h1>
          <p hlmCardDescription>No users found. Create the super admin account.</p>
        </div>

        <form hlmCardContent class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label hlmLabel for="firstName">First name</label>
              <input hlmInput id="firstName" formControlName="firstName" placeholder="System" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label hlmLabel for="lastName">Last name</label>
              <input hlmInput id="lastName" formControlName="lastName" placeholder="Administrator" />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label hlmLabel for="email">Email</label>
            <input hlmInput id="email" type="email" formControlName="email" placeholder="admin@example.com" />
          </div>

          <div class="flex w-1/2 flex-col gap-1.5 pr-2">
            <label hlmLabel for="age">Age</label>
            <input hlmInput id="age" type="number" formControlName="age" placeholder="30" min="1" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label hlmLabel for="password">Password</label>
            <input hlmInput id="password" type="password" formControlName="password" autocomplete="new-password" />
            <p class="text-xs text-muted-foreground">At least 8 characters, one uppercase, alphanumeric</p>
          </div>

          <button hlmBtn type="submit" class="mt-2 w-full" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Creating…' : 'Create super admin' }}
          </button>
        </form>
      </section>
    </div>
  `,
})
export class BootstrapPage {
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    age: [null as number | null, [Validators.required, Validators.min(1)]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const value = this.form.getRawValue();
    this.auth.bootstrap({ ...value, age: Number(value.age) }).subscribe({
      next: () => {
        this.notify.success('Super admin created. Sign in to continue.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not complete setup.');
      },
    });
  }
}
