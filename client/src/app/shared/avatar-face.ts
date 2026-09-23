// client/src/app/shared/avatar-face.ts
// Initials, or the uploaded picture when there is one. Used on profile,
// chat, presence, members and the admin user list.

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmAvatar, HlmAvatarFallback, HlmAvatarImage } from '@spartan-ng/helm/avatar';
import { pictureUrl } from '../core/services/picture';

@Component({
  selector: 'app-avatar-face',
  imports: [HlmAvatar, HlmAvatarFallback, HlmAvatarImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-avatar [size]="size()">
      @if (src(); as src) {
        <img hlmAvatarImage [src]="src" [alt]="alt()" />
      }
      <span hlmAvatarFallback>{{ initials() }}</span>
    </hlm-avatar>
  `,
})
export class AvatarFace {
  readonly filename = input<string | null>(null);
  readonly initials = input.required<string>();
  readonly alt = input('');
  readonly size = input<'default' | 'sm' | 'lg'>('default');

  protected readonly src = computed(() => pictureUrl(this.filename()));
}
