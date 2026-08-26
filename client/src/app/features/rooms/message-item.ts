// client/src/app/features/rooms/message-item.ts
// One chat row (wf-07 note 2): avatar, name, time. Delete only on own
// messages. There is no edit.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmAvatar, HlmAvatarFallback } from '@spartan-ng/helm/avatar';
import type { Message } from '../../core/models';

@Component({
  selector: 'app-message-item',
  imports: [HlmAvatar, HlmAvatarFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="flex gap-3 px-1 py-2">
      <hlm-avatar size="sm">
        <span hlmAvatarFallback>{{ initials() }}</span>
      </hlm-avatar>
      <div class="min-w-0 flex-1">
        <p class="text-sm">
          <span class="font-medium">{{ message().authorName }}</span>
          @if (isYou()) {
            <span class="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">You</span>
          }
          @if (isAdmin()) {
            <span class="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Group admin</span>
          }
          <span class="ml-2 text-xs text-muted-foreground">{{ timeLabel() }}</span>
        </p>
        @if (message().type === 'IMAGE') {
          <div class="mt-1 flex h-28 w-44 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
            {{ message().content }}
          </div>
        } @else {
          <p class="mt-0.5 text-sm">{{ message().content }}</p>
        }
      </div>
      @if (isYou()) {
        <button class="shrink-0 text-sm text-muted-foreground hover:underline" type="button" (click)="remove.emit()">
          Delete
        </button>
      }
    </article>
  `,
})
export class MessageItem {
  readonly message = input.required<Message>();
  readonly isAdmin = input(false);
  readonly isYou = input(false);
  readonly remove = output<void>();

  protected initials(): string {
    const parts = this.message().authorName.split(' ');
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts[parts.length - 1]?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  }

  protected timeLabel(): string {
    return new Date(this.message().timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
