// client/src/app/core/services/user-service.ts
// Administrative user list, hard-delete and banned-account tombstones
// (Phase1.md §6). Profile GET/PATCH /me is Stage 5.

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { BannedAccount, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

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
