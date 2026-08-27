// client/src/app/features/groups/consequence-dialog.ts
// Wireframe 16 dialog 4: names who will be removed if the age limit rises,
// before the admin commits.

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import type { User } from '../../core/models';

export interface ConsequenceDialogContext {
  title: string;
  subtitle: string;
  body: string;
  affected: User[];
  confirmLabel: string;
  confirmDisabled?: boolean;
  notice?: string;
}

@Component({
  selector: 'app-consequence-dialog',
  imports: [HlmButton, HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>{{ ctx.title }}</h2>
      <p hlmDialogDescription>{{ ctx.subtitle }}</p>
    </div>

    <p class="text-sm">{{ ctx.body }}</p>
    <ul class="mt-4 flex flex-col gap-1 text-sm">
      @for (user of ctx.affected; track user.id) {
        <li>{{ user.firstName }} {{ user.lastName }} (Age {{ user.age }})</li>
      }
    </ul>

    @if (ctx.notice) {
      <p class="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{{ ctx.notice }}</p>
    }

    <div hlmDialogFooter>
      <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
      <button hlmBtn type="button" [disabled]="ctx.confirmDisabled" (click)="confirm()">
        {{ ctx.confirmLabel }}
      </button>
    </div>
  `,
})
export class ConsequenceDialog {
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<ConsequenceDialogContext>();

  protected confirm(): void {
    if (this.ctx.confirmDisabled) return;
    this.dialogRef.close(true);
  }
}
