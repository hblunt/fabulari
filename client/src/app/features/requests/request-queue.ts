// client/src/app/features/requests/request-queue.ts
// Stage 0 placeholder for RequestQueue (wireframes 10 and 12): ONE component
// for the administrator's pending queue — the API scopes the contents, so
// group admins and the super admin reuse it. Built in Stage 2 (feat/requests).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-request-queue',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">Request queue</h1>
      <p class="mt-2 text-muted-foreground">RequestQueue — built in Stage 2 (feat/requests).</p>
    </section>
  `,
})
export class RequestQueue {}
