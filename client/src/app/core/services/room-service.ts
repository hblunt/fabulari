// client/src/app/core/services/room-service.ts
// Room HTTP (Phase1.md §6). Group admins POST a room; members propose
// via ROOM_CREATE.

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { Room } from '../models';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);

  list(groupId: string): Observable<Room[]> {
    return this.http
      .get<{ rooms: Room[] }>(`/api/groups/${groupId}/rooms`)
      .pipe(map((res) => res.rooms));
  }

  create(groupId: string, body: { name: string; description?: string }): Observable<Room> {
    return this.http
      .post<{ room: Room }>(`/api/groups/${groupId}/rooms`, body)
      .pipe(map((res) => res.room));
  }

  patch(id: string, body: Partial<Pick<Room, 'name' | 'description'>>): Observable<Room> {
    return this.http.patch<{ room: Room }>(`/api/rooms/${id}`, body).pipe(map((res) => res.room));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/rooms/${id}`);
  }
}
