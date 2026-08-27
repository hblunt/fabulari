// client/src/app/features/profile/profile-picture-upload.ts
// Upload control rendered for wf-11. Phase 1 has no image endpoint, so both
// actions stay disabled (BUILD_PLAN 5.1, Phase 2 POST /api/users/me/picture).

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmAvatar, HlmAvatarFallback } from '@spartan-ng/helm/avatar';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-profile-picture-upload',
  imports: [HlmAvatar, HlmAvatarFallback, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="rounded-xl border p-4">
      <h2 class="font-medium">Profile picture</h2>
      <div class="mt-4 flex items-center gap-4">
        <hlm-avatar>
          <span hlmAvatarFallback>{{ initials() }}</span>
        </hlm-avatar>
        <div class="flex gap-2">
          <button hlmBtn type="button" disabled>Upload</button>
          <button hlmBtn variant="outline" type="button" disabled>Remove</button>
        </div>
      </div>
      <p class="mt-3 text-sm text-muted-foreground">PNG, JPEG or GIF · 2MB maximum</p>
    </div>
  `,
})
export class ProfilePictureUpload {
  readonly initials = input.required<string>();
}
