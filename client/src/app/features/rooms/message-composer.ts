// client/src/app/features/rooms/message-composer.ts
// Text plus an image attachment. The file is checked here, uploaded over
// HTTP, then sent as an IMAGE socket message.

import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { imageFileError } from '../../core/services/picture';
import { NotificationService } from '../../core/services/notification-service';
import { RoomService } from '../../core/services/room-service';

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
        <button hlmBtn variant="outline" type="button" [disabled]="isUploading()" (click)="fileInput.click()">+</button>
        <button hlmBtn type="submit" [disabled]="!draft().trim()">Send</button>
      </div>
      <p class="text-xs text-muted-foreground">PNG, JPEG or GIF · 2MB maximum</p>
    </form>
  `,
})
export class MessageComposer {
  private readonly notify = inject(NotificationService);
  private readonly rooms = inject(RoomService);

  readonly roomId = input.required<string>();
  readonly sent = output<ComposerSend>();

  protected readonly draft = signal('');
  protected readonly isUploading = signal(false);

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
    const problem = imageFileError(file);
    if (problem) {
      this.notify.error(problem);
      return;
    }
    this.isUploading.set(true);
    this.rooms.uploadImage(this.roomId(), file).subscribe({
      next: (filename) => {
        this.isUploading.set(false);
        this.sent.emit({ type: 'IMAGE', content: filename });
      },
      error: (err) => {
        this.isUploading.set(false);
        this.notify.error(err.error?.error ?? 'Could not upload that image.');
      },
    });
  }
}
