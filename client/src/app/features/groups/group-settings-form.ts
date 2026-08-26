// client/src/app/features/groups/group-settings-form.ts
// Direct edit of title, description, age limit and theme (wf-06). Raising
// the age limit is confirmed in ConsequenceDialog by the parent, because
// that change can remove members.

import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { GROUP_THEMES, type Group, type GroupTheme } from '../../core/models';

export interface GroupSettingsFormContext {
  group: Group;
}

export interface GroupSettingsResult {
  title: string;
  description: string;
  ageLimit: number;
  theme: GroupTheme;
}

@Component({
  selector: 'app-group-settings-form',
  imports: [
    NgClass,
    ReactiveFormsModule,
    HlmButton,
    HlmDialogClose,
    HlmDialogDescription,
    HlmDialogFooter,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmInput,
    HlmLabel,
    HlmTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>Edit group</h2>
      <p hlmDialogDescription>Changes apply immediately. Raising the age limit can remove members.</p>
    </div>

    <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="title">Title</label>
        <input hlmInput id="title" formControlName="title" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="description">Description</label>
        <textarea hlmTextarea id="description" formControlName="description"></textarea>
      </div>

      <div class="flex w-1/3 flex-col gap-1.5">
        <label hlmLabel for="ageLimit">Minimum age</label>
        <input hlmInput id="ageLimit" type="number" min="0" formControlName="ageLimit" />
      </div>

      <div class="flex flex-col gap-1.5">
        <span hlmLabel>Colour theme</span>
        <div class="flex flex-wrap gap-2">
          @for (theme of themes; track theme) {
            <button
              type="button"
              class="size-8 rounded-md"
              [ngClass]="'theme-' + theme"
              [class.ring-2]="form.controls.theme.value === theme"
              [class.ring-foreground]="form.controls.theme.value === theme"
              [style.background]="'var(--primary)'"
              (click)="form.controls.theme.setValue(theme)"
              [attr.aria-label]="theme"
            ></button>
          }
        </div>
      </div>

      <div hlmDialogFooter>
        <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
        <button hlmBtn type="submit" [disabled]="form.invalid">Save changes</button>
      </div>
    </form>
  `,
})
export class GroupSettingsForm {
  private readonly dialogRef = inject<BrnDialogRef<GroupSettingsResult>>(BrnDialogRef);
  private readonly ctx = injectBrnDialogContext<GroupSettingsFormContext>();
  private readonly fb = inject(FormBuilder);

  protected readonly themes = GROUP_THEMES;

  protected readonly form = this.fb.nonNullable.group({
    title: [this.ctx.group.title, Validators.required],
    description: [this.ctx.group.description, Validators.required],
    ageLimit: [this.ctx.group.ageLimit, [Validators.required, Validators.min(0)]],
    theme: [this.ctx.group.theme, Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.dialogRef.close({ ...value, ageLimit: Number(value.ageLimit) });
  }
}
