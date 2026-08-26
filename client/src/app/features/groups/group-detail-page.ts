// client/src/app/features/groups/group-detail-page.ts
// Stage 0 placeholder for GroupDetailPage (wireframes 05 and 06): one
// component for both member and admin views — admin controls are conditional
// on administering the group. Built in Stage 3 (feat/groups-and-rooms).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-group-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">Group</h1>
      <p class="mt-2 text-muted-foreground">GroupDetailPage — built in Stage 3 (feat/groups-and-rooms).</p>
    </section>
  `,
})
export class GroupDetailPage {}
