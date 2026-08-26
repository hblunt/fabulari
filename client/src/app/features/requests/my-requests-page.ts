// client/src/app/features/requests/my-requests-page.ts
// Stage 0 placeholder for MyRequestsPage (wireframe 09): the user's own
// submissions with filter chips and inline rejection reasons. Built in
// Stage 2 (feat/requests).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-my-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">My requests</h1>
      <p class="mt-2 text-muted-foreground">MyRequestsPage — built in Stage 2 (feat/requests).</p>
    </section>
  `,
})
export class MyRequestsPage {}
