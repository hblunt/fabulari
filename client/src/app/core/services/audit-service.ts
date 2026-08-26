// client/src/app/core/services/audit-service.ts
// Read-only audit log (Phase1.md §6). Entries are written server-side as a
// side effect of other actions; this service never creates them.

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { AuditEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);

  list(filters?: { type?: string; from?: string; to?: string }): Observable<AuditEntry[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return this.http.get<{ entries: AuditEntry[] }>('/api/audit', { params }).pipe(map((res) => res.entries));
  }
}
