// client/src/app/features/profile/profile-page.ts
// Stage 0 placeholder for ProfilePage (wireframe 11): the signed-in user's
// own details, email read-only, picture upload rendered but disabled in
// Phase 1. Built in Stage 5.

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">Profile</h1>
      <p class="mt-2 text-muted-foreground">ProfilePage — built in Stage 5.</p>
    </section>
  `,
})
export class ProfilePage {}
