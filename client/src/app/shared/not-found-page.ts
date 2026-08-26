// client/src/app/shared/not-found-page.ts
// Wildcard route target (Phase1.md §5 route table, `**`). Lives in shared/
// because it belongs to no feature.

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-md p-8 text-center">
      <h1 class="text-2xl font-semibold">Page not found</h1>
      <p class="mt-2 text-muted-foreground">That address doesn't match any screen.</p>
      <a routerLink="/groups" class="mt-4 inline-block text-primary underline">Back to groups</a>
    </section>
  `,
})
export class NotFoundPage {}
