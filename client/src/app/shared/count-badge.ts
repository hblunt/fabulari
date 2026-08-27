// client/src/app/shared/count-badge.ts
// Count immediately after a section title. A muted circle so the figure is
// not sitting on the heading's baseline or crowding its letters.

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-count-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground"
    >
      {{ value() }}
    </span>
  `,
})
export class CountBadge {
  readonly value = input.required<number>();
}
