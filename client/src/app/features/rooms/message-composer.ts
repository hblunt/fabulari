// client/src/app/features/rooms/message-composer.ts
// Text plus optional image attach. Limits are stated here; nothing is uploaded
// (no message endpoints in Phase 1). A valid file still appears locally as an
// IMAGE row so the UI can be marked.

import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { NotificationService } from '../../core/services/notification-service';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/gif'];

export interface ComposerSend {
  type: 'TEXT' | 'IMAGE';
  content: string;
}

@Component({
  selector: 'app-message-composer',
  imports: [FormsModule, HlmButton, HlmInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-2" (ngSubmit)="sendText()">
      <div class="flex gap-2">
        <input
          hlmInput
          class="flex-1"
          placeholder="Write a message"
          [ngModel]="draft()"
          (ngModelChange)="draft.set($event)"
          name="draft"
          autocomplete="off"
        />
        <input
          #fileInput
          class="hidden"
          type="file"
          accept="image/png,image/jpeg,image/gif"
          (change)="onFile($event)"
        />
        <button hlmBtn variant="outline" type="button" (click)="fileInput.click()">+</button>
        <button hlmBtn type="submit" [disabled]="!draft().trim()">Send</button>
      </div>
      <p class="text-xs text-muted-foreground">PNG, JPEG or GIF · 2MB maximum</p>
    </form>
  `,
})
export class MessageComposer {
  private readonly notify = inject(NotificationService);

  readonly sent = output<ComposerSend>();

  protected readonly draft = signal('');

  protected sendText(): void {
    const content = this.draft().trim();
    if (!content) return;
    this.sent.emit({ type: 'TEXT', content });
    this.draft.set('');
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      this.notify.error('Images must be PNG, JPEG or GIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.notify.error('Images must be 2MB or smaller.');
      return;
    }
    this.sent.emit({ type: 'IMAGE', content: file.name });
  }
}
