// client/src/app/features/auth/register-page.ts
// Self-registration (wireframe 02) — administrators cannot create accounts on
// a user's behalf (§3). Password rules are shown before submission and
// validated on both sides (frame note 2); age is self-reported and checked
// against group age limits later (frame note 1). Success returns to /login
// (storyboard flow map) — no auto sign-in.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { AuthService } from '../../core/services/auth-service';
import { NotificationService } from '../../core/services/notification-service';

// Mirror of the server rule (server/users.js): 8+ characters, letters and
// digits only, at least one uppercase and one digit. Client-side validation
// is a courtesy; the server check is the real gate.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{8,}$/;

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, HlmButton, HlmCardImports, HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col items-center bg-muted/40 px-4 pt-20">
      <h1 class="text-3xl font-bold tracking-tight">Fabulari</h1>

      <section hlmCard class="mt-10 w-full max-w-md">
        <div hlmCardHeader>
          <h2 hlmCardTitle class="text-center text-xl">Create an account</h2>
        </div>

        <form hlmCardContent class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label hlmLabel for="firstName">First name</label>
              <input hlmInput id="firstName" formControlName="firstName" placeholder="Holly" autocomplete="given-name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label hlmLabel for="lastName">Last name</label>
              <input hlmInput id="lastName" formControlName="lastName" placeholder="Blunt" autocomplete="family-name" />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label hlmLabel for="email">Email</label>
            <input hlmInput id="email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
          </div>

          <div class="flex w-1/2 flex-col gap-1.5 pr-2">
            <label hlmLabel for="age">Age</label>
            <input hlmInput id="age" type="number" formControlName="age" placeholder="22" min="1" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label hlmLabel for="password">Password</label>
            <input hlmInput id="password" type="password" formControlName="password" autocomplete="new-password" />
            <p class="text-xs text-muted-foreground">At least 8 characters, one uppercase, alphanumeric</p>
          </div>

          <button hlmBtn type="submit" class="mt-2 w-full" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Creating account…' : 'Create account' }}
          </button>

          <p class="text-center text-sm text-muted-foreground">
            Already registered?
            <a routerLink="/login" class="text-foreground underline">Sign in</a>
          </p>
        </form>
      </section>
    </div>
  `,
})
export class RegisterPage {
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
    this.auth.register({ ...value, age: Number(value.age) }).subscribe({
      next: () => {
        this.notify.success('Account created. Sign in with your new password.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not create the account.');
      },
    });
  }
}
