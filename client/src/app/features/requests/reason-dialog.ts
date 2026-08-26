// client/src/app/features/requests/reason-dialog.ts
// Wireframe 16 dialog 2: confirm stays disabled until a reason is typed.
// Used for every rejection and for raising a USER_REPORT / SYSTEM_BAN.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';

export interface ReasonDialogContext {
  title: string;
  subtitle: string;
  notice?: string;
  confirmLabel: string;
}

@Component({
  selector: 'app-reason-dialog',
  imports: [
    FormsModule,
    HlmButton,
    HlmDialogClose,
    HlmDialogDescription,
    HlmDialogFooter,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmLabel,
    HlmTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>{{ ctx.title }}</h2>
      <p hlmDialogDescription>{{ ctx.subtitle }}</p>
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <label hlmLabel for="reason">Reason</label>
        <span class="text-xs text-muted-foreground">Required</span>
      </div>
      <textarea
        hlmTextarea
        id="reason"
        rows="4"
        [ngModel]="reason()"
        (ngModelChange)="reason.set($event)"
        [ngModelOptions]="{ standalone: true }"
      ></textarea>
    </div>

    <p class="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
      {{ ctx.notice ?? 'Shown to the submitter on their requests page.' }}
    </p>

    <div hlmDialogFooter>
      <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
      <button hlmBtn type="button" [disabled]="!reason().trim()" (click)="confirm()">
        {{ ctx.confirmLabel }}
      </button>
    </div>
  `,
})
export class ReasonDialog {
  private readonly dialogRef = inject<BrnDialogRef<string>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<ReasonDialogContext>();
  protected readonly reason = signal('');

  protected confirm(): void {
    const value = this.reason().trim();
    if (!value) return;
    this.dialogRef.close(value);
  }
}
