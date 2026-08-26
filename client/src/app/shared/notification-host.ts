// client/src/app/shared/notification-host.ts
// Renders the transient notifications raised through NotificationService
// (Phase1.md §5 "Shell and shared"). Hosted once in the App shell; wraps the
// spartan toaster so the shell doesn't depend on the toast library directly.

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmToaster } from '@spartan-ng/helm/sonner';

@Component({
  selector: 'app-notification-host',
  imports: [HlmToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hlm-toaster position="top-right" />`,
})
export class NotificationHost {}
