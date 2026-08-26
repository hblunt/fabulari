// client/src/app/core/guards/guest-guard.ts
// Redirects an already signed-in user away from the login and registration
// pages (Phase1.md §5 "Guards") — those screens make no sense mid-session.

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();
  if (!user) return true;
  return router.parseUrl(user.role === 'SUPER_ADMIN' ? '/admin/requests' : '/groups');
};
