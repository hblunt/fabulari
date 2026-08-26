// client/src/app/core/guards/bootstrap-guard.ts
// Permits /bootstrap only while the system reports that no users exist, and
// redirects away once onboarding is complete (Phase1.md §5 "Guards"). The
// check must ask the server — the client cannot know locally whether the
// super admin has been created.

import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, type CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

export const bootstrapGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get<{ required: boolean }>('/api/bootstrap').pipe(
    map((res) => (res.required ? true : router.parseUrl('/login'))),
    // Server unreachable (or endpoint not yet built): fail towards login
    // rather than stranding the user on an onboarding screen that can't work.
    catchError(() => of(router.parseUrl('/login'))),
  );
};
