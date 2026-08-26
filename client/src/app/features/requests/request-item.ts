// client/src/app/features/requests/request-item.ts
// One row in My requests or an admin queue. Actions are omitted on the
// submitter's page — requests cannot be withdrawn.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard } from '@spartan-ng/helm/card';
import type { AppRequest, RequestStatus } from '../../core/models';
import { TYPE_LABELS, awaitingLabel, queueDetail, queueTitle, relativeTime } from './request-labels';

@Component({
  selector: 'app-request-item',
  imports: [HlmBadge, HlmButton, HlmCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let r = request();

    <article hlmCard size="sm" class="px-4">
      @if (mode() === 'mine') {
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-medium">{{ labels[r.type] }}</span>
          <span class="text-muted-foreground">{{ r.targetName }}</span>
          <span hlmBadge [variant]="badgeVariant(r.status)" class="ml-auto">{{ statusLabel(r.status) }}</span>
          <span class="text-xs text-muted-foreground">
            {{ r.status === 'PENDING' ? awaitingLabel(r.type) : relativeTime(r.actionedAt ?? r.createdAt) }}
          </span>
        </div>
        @if (r.status === 'REJECTED' && r.reason) {
          <p class="mt-2 text-sm text-muted-foreground">Reason: {{ r.reason }}</p>
        }
      } @else {
        <div class="flex flex-wrap items-start gap-3">
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ queueTitle(r) }}</p>
            <p class="mt-0.5 text-sm text-muted-foreground">{{ queueDetail(r) }}</p>
          </div>
          @if (r.wasBanned) {
            <span hlmBadge variant="destructive">Cannot rejoin</span>
          }
          <span class="text-xs text-muted-foreground">{{ relativeTime(r.createdAt) }}</span>
          <div class="flex gap-2">
            <button hlmBtn variant="outline" size="sm" type="button" [disabled]="busy()" (click)="reject.emit()">
              Reject
            </button>
            <button
              hlmBtn
              size="sm"
              type="button"
              [disabled]="busy() || r.wasBanned"
              (click)="approve.emit()"
            >
              Approve
            </button>
          </div>
        </div>
      }
    </article>
  `,
})
export class RequestItem {
  readonly request = input.required<AppRequest>();
  readonly mode = input<'mine' | 'queue'>('mine');
  readonly busy = input(false);

  readonly approve = output<void>();
  readonly reject = output<void>();

  protected readonly labels = TYPE_LABELS;
  protected readonly awaitingLabel = awaitingLabel;
  protected readonly relativeTime = relativeTime;
  protected readonly queueDetail = queueDetail;
  protected readonly queueTitle = queueTitle;

  protected badgeVariant(status: RequestStatus): 'secondary' | 'default' | 'destructive' {
    if (status === 'APPROVED') return 'default';
    if (status === 'REJECTED') return 'destructive';
    return 'secondary';
  }

  protected statusLabel(status: RequestStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }
}
