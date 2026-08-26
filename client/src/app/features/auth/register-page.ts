// client/src/app/features/auth/register-page.ts
// Stage 0 placeholder for RegisterPage (wireframe 02): self-registration with
// client-side password rule validation. Built in Stage 1 (feat/auth).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-md p-8">
      <h1 class="text-2xl font-semibold">Create an account</h1>
      <p class="mt-2 text-muted-foreground">RegisterPage — built in Stage 1 (feat/auth).</p>
    </section>
  `,
})
export class RegisterPage {}
