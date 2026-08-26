// client/src/app/core/interceptors/user-id-interceptor.ts
// Attaches the signed-in user's ID as an X-User-Id header on every outgoing
// request (Phase1.md §6 "Caller identification"). A functional interceptor so
// no service builds headers itself; when Phase 2 swaps the header for a
// signed token, this is the only client file that changes.

import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const userIdInterceptor: HttpInterceptorFn = (req, next) => {
  const user = inject(AuthService).currentUser();

  // Signed-out requests (login, register, bootstrap) go through unchanged.
  if (!user) return next(req);

  return next(req.clone({ setHeaders: { 'X-User-Id': user.id } }));
};
