// client/src/app/core/guards/role-guard.ts
// Requires the signed-in user to hold the given system role (Phase1.md §5
// "Guards"). A factory rather than a plain guard so the route table can say
// roleGuard('SUPER_ADMIN') — the role is data on the route, not a new guard
// per role.

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import type { Role } from '../models';
import { AuthService } from '../services/auth-service';

export function roleGuard(role: Role): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!user) return router.parseUrl('/login');
    // Wrong role: send them to their own home rather than an error page.
    return user.role === role ? true : router.parseUrl('/groups');
  };
}
