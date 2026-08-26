// client/src/app/core/services/group-service.ts
// The two GETs pulled forward so join/create requests have groups to target.
// Mutations wait for Stage 3.

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
}
