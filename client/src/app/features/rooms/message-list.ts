// client/src/app/features/rooms/message-list.ts
// Ordered stream of messages and join/leave notices.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ChatRow } from './chat-row';
import { MessageItem } from './message-item';
import { SystemNotice } from './system-notice';

@Component({
  selector: 'app-message-list',
  imports: [MessageItem, SystemNotice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      @for (row of rows(); track trackId(row)) {
        @if (row.kind === 'notice') {
          <app-system-notice [text]="row.notice.text" />
        } @else {
          <app-message-item
            [message]="row.message"
            [isAdmin]="row.isAdmin"
            [isYou]="row.message.authorId === currentUserId()"
            (remove)="remove.emit(row.message.id)"
          />
        }
      } @empty {
        <p class="px-1 py-6 text-sm text-muted-foreground">No messages yet.</p>
      }
    </div>
  `,
})
export class MessageList {
  readonly rows = input.required<ChatRow[]>();
  readonly currentUserId = input.required<string>();
  readonly remove = output<string>();

  protected trackId(row: ChatRow): string {
    return row.kind === 'notice' ? row.notice.id : row.message.id;
  }
}
