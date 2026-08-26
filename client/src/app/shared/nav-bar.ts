// client/src/app/shared/nav-bar.ts
// Primary navigation (Phase1.md §5 "Shell and shared"). One NavBar for every
// role — destinations are shown or hidden from the signed-in user's role
// rather than swapping layouts (§7 "One shell, role-aware navigation").
// Renders nothing while signed out: login/register/bootstrap stand alone.
//
// The super admin sees NO groups or rooms entries — they take no part in chat
// (§3 "No chat access").

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { AuthService } from '../core/services/auth-service';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user(); as user) {
      <header class="border-b bg-background">
        <nav class="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span class="font-semibold tracking-tight">Fabulari</span>

          @if (isSuperAdmin()) {
            <a routerLink="/admin/requests" routerLinkActive="text-primary" class="text-sm hover:text-primary">Requests</a>
            <a routerLink="/admin/users" routerLinkActive="text-primary" class="text-sm hover:text-primary">Users</a>
            <a routerLink="/admin/banned" routerLinkActive="text-primary" class="text-sm hover:text-primary">Banned accounts</a>
            <a routerLink="/admin/audit" routerLinkActive="text-primary" class="text-sm hover:text-primary">Audit log</a>
          } @else {
            <a routerLink="/groups" routerLinkActive="text-primary" class="text-sm hover:text-primary">Groups</a>
            <a routerLink="/requests" routerLinkActive="text-primary" class="text-sm hover:text-primary">My requests</a>
            <a routerLink="/profile" routerLinkActive="text-primary" class="text-sm hover:text-primary">Profile</a>
          }

          <span class="ml-auto text-sm text-muted-foreground">{{ user.firstName }} {{ user.lastName }}</span>
          <button hlmBtn variant="outline" size="sm" (click)="signOut()">Sign out</button>
        </nav>
      </header>
    }
  `,
})
export class NavBar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly isSuperAdmin = computed(() => this.auth.currentUser()?.role === 'SUPER_ADMIN');

  protected signOut(): void {
    // Logout must clear the local storage key (§4 "Client-side storage").
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
