// client/src/app/app.routes.ts
// Route table (Phase1.md §5 "Routes"). Every route is lazily loaded with
// loadComponent, so a component's code is fetched only when its route is
// first visited. Guards gate navigation only — the server re-checks every
// permission (§5 "Guards").

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { bootstrapGuard } from './core/guards/bootstrap-guard';
import { groupMemberGuard } from './core/guards/group-member-guard';
import { guestGuard } from './core/guards/guest-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  // Default: /groups when signed in; authGuard bounces the signed-out to /login.
  { path: '', pathMatch: 'full', redirectTo: 'groups' },

  {
    path: 'bootstrap',
    canActivate: [bootstrapGuard],
    loadComponent: () => import('./features/auth/bootstrap-page').then((m) => m.BootstrapPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
  },

  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-browse-page').then((m) => m.GroupBrowsePage),
  },
  {
    path: 'groups/:groupId',
    canActivate: [authGuard, groupMemberGuard],
    loadComponent: () => import('./features/groups/group-detail-page').then((m) => m.GroupDetailPage),
  },
  {
    // Room routes sit beneath the group so groupMemberGuard covers them too.
    path: 'groups/:groupId/rooms/:roomId',
    canActivate: [authGuard, groupMemberGuard],
    loadComponent: () => import('./features/rooms/room-page').then((m) => m.RoomPage),
  },

  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'requests',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/my-requests-page').then((m) => m.MyRequestsPage),
  },

  // Super admin area. RequestQueue is the same component group admins reach
  // through their group pages — the API scopes what each caller sees.
  {
    path: 'admin/requests',
    canActivate: [authGuard, roleGuard('SUPER_ADMIN')],
    loadComponent: () => import('./features/requests/request-queue').then((m) => m.RequestQueue),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard('SUPER_ADMIN')],
    loadComponent: () => import('./features/admin/admin-users-page').then((m) => m.AdminUsersPage),
  },
  {
    path: 'admin/banned',
    canActivate: [authGuard, roleGuard('SUPER_ADMIN')],
    loadComponent: () => import('./features/admin/banned-accounts-page').then((m) => m.BannedAccountsPage),
  },
  {
    path: 'admin/audit',
    canActivate: [authGuard, roleGuard('SUPER_ADMIN')],
    loadComponent: () => import('./features/admin/audit-log-page').then((m) => m.AuditLogPage),
  },

  {
    path: '**',
    loadComponent: () => import('./shared/not-found-page').then((m) => m.NotFoundPage),
  },
];
