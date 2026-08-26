// client/src/app/core/services/notification-service.ts
// Transient in-application notifications (Phase1.md §5 "Services"). Wraps the
// sonner toast function so feature code depends on this service, not on the
// toast library — if the library changes, only this file does.

import { Injectable } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(message: string): void {
    toast.success(message);
  }

  // Every error path must surface here rather than the console (build plan
  // "Definition of done").
  error(message: string): void {
    toast.error(message);
  }

  info(message: string): void {
    toast.info(message);
  }
}
