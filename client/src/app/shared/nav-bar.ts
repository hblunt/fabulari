// client/src/app/shared/nav-bar.ts
// Primary navigation (Phase1.md §5 "Shell and shared"). One NavBar for every
// role — destinations are shown or hidden from the signed-in user's role
// rather than swapping layouts (§7 "One shell, role-aware navigation").
// Renders nothing while signed out: login/register/bootstrap stand alone.
//
// The super admin sees NO groups or rooms entries — they take no part in chat
// (§3 "No chat access"). Below lg the destinations collapse into a header
// menu (wf-08) instead of a persistent row.

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
        <nav class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 lg:gap-6">
          <button
            hlmBtn
            variant="outline"
            size="sm"
            class="lg:hidden"
            type="button"
            (click)="menuOpen.update((open) => !open)"
          >
            Menu
          </button>
          <span class="font-semibold tracking-tight">Fabulari</span>

          <div class="hidden items-center gap-6 lg:flex">
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
          </div>

          <span class="ml-auto text-sm text-muted-foreground">{{ user.firstName }} {{ user.lastName }}</span>
          <button hlmBtn variant="outline" size="sm" (click)="signOut()">Sign out</button>
        </nav>
        @if (menuOpen()) {
          <div class="flex flex-col gap-3 border-t px-4 py-3 lg:hidden">
            @if (isSuperAdmin()) {
              <a routerLink="/admin/requests" routerLinkActive="text-primary" class="text-sm hover:text-primary" (click)="menuOpen.set(false)">Requests</a>
              <a routerLink="/admin/users" routerLinkActive="text-primary" class="text-sm hover:text-primary" (click)="menuOpen.set(false)">Users</a>
              <a routerLink="/admin/banned" routerLinkActive="text-primary" class="text-sm hover:text-primary" (click)="menuOpen.set(false)">Banned accounts</a>
              <a routerLink="/admin/audit" routerLinkActive="text-primary" class="text-sm hover:text-primary" (click)="menuOpen.set(false)">Audit log</a>
            } @else {
              <a routerLink="/groups" routerLinkActive="text-primary" class="text-sm hover:text-primary" (click)="menuOpen.set(false)">Groups</a>
              <a routerLink="/requests" routerLinkActive="text-primary" class="text-sm hover:text-primary" (click)="menuOpen.set(false)">My requests</a>
              <a routerLink="/profile" routerLinkActive="text-primary" class="text-sm hover:text-primary" (click)="menuOpen.set(false)">Profile</a>
            }
          </div>
        }
      </header>
    }
  `,
})
export class NavBar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly isSuperAdmin = computed(() => this.auth.currentUser()?.role === 'SUPER_ADMIN');
  protected readonly menuOpen = signal(false);

  protected signOut(): void {
    // Logout must clear the local storage key (§4 "Client-side storage").
    this.menuOpen.set(false);
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
