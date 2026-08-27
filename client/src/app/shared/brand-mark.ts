// client/src/app/shared/brand-mark.ts
// PNG lockup. Two sizes so the nav bar stays h-16 and the auth screens can
// show the full stacked mark without inventing widths per page.

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      src="/fabulari-logo.png"
      alt="Fabulari"
      [class]="
        variant() === 'auth'
          ? 'block h-28 w-auto object-contain md:h-36'
          : 'block h-10 w-auto shrink-0 object-contain lg:h-11'
      "
    />
  `,
})
export class BrandMark {
  readonly variant = input<'nav' | 'auth'>('nav');
}
