// client/src/app/core/services/room-service.ts
// Room HTTP (Phase1.md §6). No create method — rooms appear by approving
// a ROOM_CREATE request.

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

  patch(id: string, body: Partial<Pick<Room, 'name' | 'description'>>): Observable<Room> {
    return this.http.patch<{ room: Room }>(`/api/rooms/${id}`, body).pipe(map((res) => res.room));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/rooms/${id}`);
  }
}
