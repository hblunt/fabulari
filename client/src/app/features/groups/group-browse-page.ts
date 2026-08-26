// client/src/app/features/groups/group-browse-page.ts
// Stage 0 placeholder for GroupBrowsePage (wireframe 04): every group in the
// system with its four join states. Built in Stage 3 (feat/groups-and-rooms).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-group-browse-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">Groups</h1>
      <p class="mt-2 text-muted-foreground">GroupBrowsePage — built in Stage 3 (feat/groups-and-rooms).</p>
    </section>
  `,
})
export class GroupBrowsePage {}
