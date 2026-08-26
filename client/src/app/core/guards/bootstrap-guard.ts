// client/src/app/core/guards/bootstrap-guard.ts
// Permits /bootstrap only while the system reports that no users exist, and
// redirects away once onboarding is complete (Phase1.md §5 "Guards"). The
// check must ask the server — the client cannot know locally whether the
// super admin has been created. AuthService owns the bootstrap check (§5).

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const bootstrapGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.checkBootstrap().pipe(
    map((required) => (required ? true : router.parseUrl('/login'))),
    // Server unreachable: fail towards login rather than stranding the user
    // on an onboarding screen that can't work.
    catchError(() => of(router.parseUrl('/login'))),
  );
};
