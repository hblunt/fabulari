// client/src/app/core/services/group-service.ts
// The two GETs from Stage 2, plus edit and delete for Stage 3.
// Groups are still never created here — that stays a request approval.

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { Group, GroupSummary, User } from '../models';

export interface GroupDetail {
  group: Group;
  memberList: User[];
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);

  list(): Observable<GroupSummary[]> {
    return this.http.get<{ groups: GroupSummary[] }>('/api/groups').pipe(map((res) => res.groups));
  }

  get(id: string): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`/api/groups/${id}`);
  }

  patch(
    id: string,
    body: Partial<Pick<Group, 'title' | 'description' | 'ageLimit' | 'theme'>>,
  ): Observable<{ group: Group; removedMembers: User[] }> {
    return this.http.patch<{ group: Group; removedMembers: User[] }>(`/api/groups/${id}`, body);
  }

  // Super admin only. Requires an approved GROUP_DELETE for this group.
  delete(id: string, requestId: string): Observable<void> {
    return this.http.delete<void>(`/api/groups/${id}`, { body: { requestId } });
  }
}
