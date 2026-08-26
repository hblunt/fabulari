// client/src/app/core/guards/group-member-guard.ts
// Requires membership of the group named in the route parameter, covering the
// room routes beneath it (Phase1.md §5 "Guards"). Membership is read from the
// session's denormalised `groups` array — no HTTP call needed to gate
// navigation, and the server re-checks membership on every API call anyway.

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const groupMemberGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return router.parseUrl('/login');

  const groupId = route.paramMap.get('groupId');
  const isMember = groupId !== null && user.groups.includes(groupId);

  // Non-members land back on the browse page, where they can request to join.
  return isMember ? true : router.parseUrl('/groups');
};
