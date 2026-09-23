// client/src/app/features/rooms/message-item.ts
// One chat row (wf-07 note 2): avatar, name, time. Delete only on own
// messages. There is no edit.

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Message } from '../../core/models';
import { pictureUrl } from '../../core/services/picture';
import { AvatarFace } from '../../shared/avatar-face';

@Component({
  selector: 'app-message-item',
  imports: [AvatarFace],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="flex gap-3 px-1 py-2">
      <app-avatar-face
        size="sm"
        [filename]="message().authorPicture"
        [initials]="initials()"
        [alt]="message().authorName"
      />
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
        @if (imageSrc(); as src) {
          <img class="mt-1 max-h-64 max-w-full rounded-md object-contain" [src]="src" alt="Shared image" />
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

  protected imageSrc(): string | null {
    return this.message().type === 'IMAGE' ? pictureUrl(this.message().content) : null;
  }

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
