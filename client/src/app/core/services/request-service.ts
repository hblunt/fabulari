// client/src/app/core/services/request-service.ts
// HTTP for the six request types (Phase1.md §6). The API scopes the list by
// role, so My requests and both admin queues share this one service.

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { AppRequest, GroupCreatePayload, RequestStatus, RequestType, RoomCreatePayload, UserReportPayload } from '../models';

export interface CreateRequestBody {
  type: RequestType;
  targetId?: string | null;
  payload?: GroupCreatePayload | RoomCreatePayload | UserReportPayload;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);

  list(filters?: { type?: RequestType; status?: RequestStatus }): Observable<AppRequest[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http
      .get<{ requests: AppRequest[] }>('/api/requests', { params })
      .pipe(map((res) => res.requests));
  }

  create(body: CreateRequestBody): Observable<AppRequest> {
    return this.http
      .post<{ request: AppRequest }>('/api/requests', body)
      .pipe(map((res) => res.request));
  }

  approve(id: string): Observable<AppRequest> {
    return this.http
      .post<{ request: AppRequest }>(`/api/requests/${id}/approve`, {})
      .pipe(map((res) => res.request));
  }

  reject(id: string, reason: string): Observable<AppRequest> {
    return this.http
      .post<{ request: AppRequest }>(`/api/requests/${id}/reject`, { reason })
      .pipe(map((res) => res.request));
  }
}
