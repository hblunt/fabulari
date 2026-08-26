// client/src/app/features/requests/confirm-dialog.ts
// Wireframe 16 dialog 3: a yes/no shell for irreversible-feeling actions
// (approving group deletion, requesting deletion, requesting a system ban).

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';

export interface ConfirmDialogContext {
  title: string;
  subtitle: string;
  notice?: string;
  confirmLabel: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [HlmButton, HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>{{ ctx.title }}</h2>
      <p hlmDialogDescription>{{ ctx.subtitle }}</p>
    </div>

    @if (ctx.notice) {
      <p class="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{{ ctx.notice }}</p>
    }

    <div hlmDialogFooter>
      <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
      <button hlmBtn type="button" (click)="confirm()">{{ ctx.confirmLabel }}</button>
    </div>
  `,
})
export class ConfirmDialog {
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<ConfirmDialogContext>();

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
