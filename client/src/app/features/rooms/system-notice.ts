// client/src/app/features/rooms/system-notice.ts
// Join/leave line in the message stream (wf-07 note 1). Not a Message record.

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-system-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="mx-auto max-w-md rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
      {{ text() }}
    </p>
  `,
})
export class SystemNotice {
  readonly text = input.required<string>();
}
