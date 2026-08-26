// client/src/app/features/admin/admin-users-page.ts
// Stage 0 placeholder for AdminUsersPage (wireframe 13): full user listing
// with deletion on an approved ban request, Delete disabled with a "Sole
// admin" badge where blocked. Built in Stage 4 (feat/admin).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">Users</h1>
      <p class="mt-2 text-muted-foreground">AdminUsersPage — built in Stage 4 (feat/admin).</p>
    </section>
  `,
})
export class AdminUsersPage {}
