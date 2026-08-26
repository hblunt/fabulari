// client/src/app/core/services/auth-service.ts
// Owns the signed-in user. This is the ONLY file that touches the
// `currentUser` local storage key (Phase1.md §5 "Services") — every other
// service and guard reads the signal, so there is one definition of who is
// signed in.
//
// Stage 0 provides the session state the guards and NavBar depend on.
// Stage 1 adds the HTTP calls: bootstrap check, register, login.

import { Injectable, signal } from '@angular/core';
import type { SessionUser } from '../models';

const STORAGE_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Restored from local storage at construction so a page refresh keeps the
  // session (§4 "Client-side storage").
  readonly currentUser = signal<SessionUser | null>(readStoredUser());

  // Called by login (and bootstrap) once the API returns the user object.
  setSession(user: SessionUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  // Logout: the spec requires the key to be removed, not just the signal cleared.
  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
  }
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
