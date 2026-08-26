// client/src/app/features/admin/audit-log-page.ts
// Stage 0 placeholder for AuditLogPage (wireframe 15): administrative action
// history, filterable by type and date. Built in Stage 4 (feat/admin).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-audit-log-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">Audit log</h1>
      <p class="mt-2 text-muted-foreground">AuditLogPage — built in Stage 4 (feat/admin).</p>
    </section>
  `,
})
export class AuditLogPage {}
