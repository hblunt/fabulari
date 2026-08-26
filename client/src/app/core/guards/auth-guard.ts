// client/src/app/core/guards/auth-guard.ts
// Requires a signed-in user, redirecting to /login otherwise (Phase1.md §5
// "Guards"). Guards are a usability layer only — every permission they
// enforce is checked again on the server.

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.currentUser() ? true : router.parseUrl('/login');
};
