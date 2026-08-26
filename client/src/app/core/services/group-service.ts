// client/src/app/core/services/group-service.ts
// Group HTTP (Phase1.md §6). Groups are never created here — that stays a
// request approval. Membership writes both group.members and user.groups
// on the server.

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

  delete(id: string, requestId: string): Observable<void> {
    return this.http.delete<void>(`/api/groups/${id}`, { body: { requestId } });
  }

  members(id: string): Observable<User[]> {
    return this.http.get<{ members: User[] }>(`/api/groups/${id}/members`).pipe(map((res) => res.members));
  }

  removeMember(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`/api/groups/${groupId}/members/${userId}`);
  }

  promote(groupId: string, userId: string): Observable<void> {
    return this.http.post<void>(`/api/groups/${groupId}/admins/${userId}`, {});
  }

  demote(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`/api/groups/${groupId}/admins/${userId}`);
  }

  bans(id: string): Observable<User[]> {
    return this.http
      .get<{ bannedUsers: User[] }>(`/api/groups/${id}/bans`)
      .pipe(map((res) => res.bannedUsers));
  }

  ban(groupId: string, userId: string, requestId: string): Observable<void> {
    return this.http.post<void>(`/api/groups/${groupId}/bans/${userId}`, { requestId });
  }
}
