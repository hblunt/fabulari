// client/src/app/features/auth/login-page.ts
// Email and password sign-in (wireframe 01). Email is the unique identifier —
// there is no username field, and no password recovery (frame notes 1 and 2).
// On load it asks whether bootstrap is required and redirects to /bootstrap
// while the system has no users (frame 03 note 1).

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { AuthService } from '../../core/services/auth-service';
import { NotificationService } from '../../core/services/notification-service';
import { BrandMark } from '../../shared/brand-mark';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, HlmButton, HlmCardImports, HlmInput, HlmLabel, BrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col items-center bg-muted/40 px-4 pt-16 md:pt-20">
      <h1 class="mb-3 md:mb-4">
        <app-brand-mark variant="auth" />
      </h1>

      <section hlmCard class="w-full max-w-sm">
        <div hlmCardHeader>
          <h2 hlmCardTitle class="text-center text-xl">Sign in</h2>
        </div>

        <form hlmCardContent class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <div class="flex flex-col gap-1.5">
            <label hlmLabel for="email">Email</label>
            <input hlmInput id="email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label hlmLabel for="password">Password</label>
            <input hlmInput id="password" type="password" formControlName="password" autocomplete="current-password" />
          </div>

          <button hlmBtn type="submit" class="mt-2 w-full" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Signing in…' : 'Sign in' }}
          </button>

          <p class="text-center text-sm text-muted-foreground">
            No account?
            <a routerLink="/register" class="text-foreground underline">Register</a>
          </p>
        </form>
      </section>
    </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    // First run: no users means no one can sign in, so send the visitor to
    // onboarding instead (§3 "System initialisation").
    this.auth.checkBootstrap().subscribe((required) => {
      if (required) this.router.navigate(['/bootstrap']);
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (user) => {
        // The flow map splits by role: super admin has no group views.
        const home = user.role === 'SUPER_ADMIN' ? '/admin/requests' : '/groups';
        this.router.navigate([home]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not sign in. Is the server running?');
      },
    });
  }
}
