// client/src/app/features/auth/bootstrap-page.ts
// Stage 0 placeholder for BootstrapPage (wireframe 03): first-run onboarding
// that creates the single super admin. Built in Stage 1 (feat/auth) — exists
// now so the /bootstrap route resolves.

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-bootstrap-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-md p-8">
      <h1 class="text-2xl font-semibold">First-time setup</h1>
      <p class="mt-2 text-muted-foreground">BootstrapPage — built in Stage 1 (feat/auth).</p>
    </section>
  `,
})
export class BootstrapPage {}
