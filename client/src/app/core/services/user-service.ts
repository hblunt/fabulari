// client/src/app/core/services/user-service.ts
// Profile reads/updates, password change, picture upload, self-delete, the
// admin user list and ban-deletion (Phase2.md §5).

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { BannedAccount, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  me(): Observable<User> {
    return this.http.get<{ user: User }>('/api/users/me').pipe(map((res) => res.user));
  }

  patchMe(body: Partial<Pick<User, 'firstName' | 'lastName' | 'dateOfBirth'>>): Observable<User> {
    return this.http.patch<{ user: User }>('/api/users/me', body).pipe(map((res) => res.user));
  }

  deleteMe(): Observable<void> {
    return this.http.delete<void>('/api/users/me');
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>('/api/users/me/password', { currentPassword, newPassword });
  }

  uploadPicture(file: File): Observable<string> {
    const body = new FormData();
    body.append('image', file);
    return this.http
      .post<{ profilePicture: string }>('/api/users/me/picture', body)
      .pipe(map((res) => res.profilePicture));
  }

  removePicture(): Observable<void> {
    return this.http.delete<void>('/api/users/me/picture');
  }

  list(groupId?: string): Observable<User[]> {
    let params = new HttpParams();
    if (groupId) params = params.set('groupId', groupId);
    return this.http.get<{ users: User[] }>('/api/users', { params }).pipe(map((res) => res.users));
  }

  delete(id: string, requestId: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`, { body: { requestId } });
  }

  bannedAccounts(): Observable<BannedAccount[]> {
    return this.http
      .get<{ bannedAccounts: BannedAccount[] }>('/api/banned-accounts')
      .pipe(map((res) => res.bannedAccounts));
  }
}
