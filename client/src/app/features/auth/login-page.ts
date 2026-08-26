// client/src/app/features/auth/login-page.ts
// Stage 0 placeholder for LoginPage (wireframe 01): email and password
// sign-in. Built in Stage 1 (feat/auth) — exists now so /login resolves.

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-md p-8">
      <h1 class="text-2xl font-semibold">Sign in</h1>
      <p class="mt-2 text-muted-foreground">LoginPage — built in Stage 1 (feat/auth).</p>
    </section>
  `,
})
export class LoginPage {}
