// client/src/app/features/profile/profile-picture-upload.ts
// Profile picture (wf-11). Upload and remove call the picture endpoints.
// A bad type or a file over 2MB is rejected here before the request.

import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { imageFileError } from '../../core/services/picture';
import { NotificationService } from '../../core/services/notification-service';
import { AvatarFace } from '../../shared/avatar-face';

@Component({
  selector: 'app-profile-picture-upload',
  imports: [HlmButton, AvatarFace],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="rounded-xl border p-4">
      <h2 class="font-medium">Profile picture</h2>
      <div class="mt-4 flex items-center gap-4">
        <app-avatar-face [filename]="filename()" [initials]="initials()" alt="Profile picture" />
        <div class="flex gap-2">
          <input
            #fileInput
            class="hidden"
            type="file"
            accept="image/png,image/jpeg,image/gif"
            (change)="onFile($event)"
          />
          <button hlmBtn type="button" (click)="fileInput.click()">Upload</button>
          <button hlmBtn variant="outline" type="button" [disabled]="!filename()" (click)="removed.emit()">
            Remove
          </button>
        </div>
      </div>
      <p class="mt-3 text-sm text-muted-foreground">PNG, JPEG or GIF · 2MB maximum</p>
    </div>
  `,
})
export class ProfilePictureUpload {
  private readonly notify = inject(NotificationService);

  readonly initials = input.required<string>();
  readonly filename = input<string | null>(null);
  readonly picked = output<File>();
  readonly removed = output<void>();

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
    this.picked.emit(file);
  }
}
