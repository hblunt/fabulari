// client/src/app/core/services/auth-service.ts
// Owns authentication end to end (Phase1.md §5 "Services"): the bootstrap
// check, registration, login and logout, plus the signed-in user state. This
// is the ONLY file that touches the `currentUser` local storage key — every
// other service and guard reads the signal, so there is one definition of who
// is signed in.

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import type { SessionUser, User } from '../models';

const STORAGE_KEY = 'currentUser';

// Payload for the two account-creation endpoints (bootstrap and register).
export interface NewUserDetails {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // Restored from local storage at construction so a page refresh keeps the
  // session (§4 "Client-side storage").
  readonly currentUser = signal<SessionUser | null>(readStoredUser());

  // "Does the system need first-run onboarding?" Asked by bootstrapGuard and
  // by LoginPage, which redirects to /bootstrap while no users exist.
  checkBootstrap(): Observable<boolean> {
    return this.http
      .get<{ required: boolean }>('/api/bootstrap')
      .pipe(map((res) => res.required));
  }

  // Creates the single super admin. The flow map sends them to /login
  // afterwards rather than auto-signing them in, so no session is written.
  bootstrap(details: NewUserDetails): Observable<User> {
    return this.http
      .post<{ user: User }>('/api/bootstrap', details)
      .pipe(map((res) => res.user));
  }

  // Registration also returns to /login (storyboard flow map) — the user
  // proves their password works by signing in with it.
  register(details: NewUserDetails): Observable<User> {
    return this.http
      .post<{ user: User }>('/api/auth/register', details)
      .pipe(map((res) => res.user));
  }

  // Login stores the reduced SessionUser, not the full user record: local
  // storage drives guards and the NavBar, which only need identity and role.
  login(email: string, password: string): Observable<SessionUser> {
    return this.http.post<{ user: User }>('/api/auth/login', { email, password }).pipe(
      map((res) => toSessionUser(res.user)),
      tap((sessionUser) => this.setSession(sessionUser)),
    );
  }

  // Logout: the spec requires the key to be removed, not just the signal cleared.
  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
  }

  private setSession(user: SessionUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }
}

// The stored shape (§4 "Client-side storage"): identity and role only —
// editable fields like age stay server-side so they can't go stale here.
function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    profilePicture: user.profilePicture,
    groups: user.groups,
  };
}

// Module-level helper rather than a method so the signal can be initialised
// inline. A corrupt stored value falls back to signed-out instead of crashing
// the app at boot.
function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}
