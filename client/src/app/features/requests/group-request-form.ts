// client/src/app/features/requests/group-request-form.ts
// Wireframe 16 dialog 1 / GroupRequestForm: GROUP_CREATE payload. Super admin
// actions it; the submitter becomes first admin if approved.

import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { GROUP_THEMES, type GroupTheme } from '../../core/models';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';

@Component({
  selector: 'app-group-request-form',
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
      <h2 hlmDialogTitle>Request a new group</h2>
      <p hlmDialogDescription>Sent to the super admin for approval.</p>
    </div>

    <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="title">Title</label>
        <input hlmInput id="title" formControlName="title" placeholder="Board Games" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="description">Description</label>
        <textarea hlmTextarea id="description" formControlName="description" placeholder="Tabletop gaming, sessions and reviews."></textarea>
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
              class="size-8 rounded-md ring-offset-background"
              [ngClass]="'theme-' + theme"
              [class.ring-2]="form.controls.theme.value === theme"
              [class.ring-foreground]="form.controls.theme.value === theme"
              [style.background]="'var(--primary)'"
              (click)="form.controls.theme.setValue(theme)"
              [attr.aria-label]="theme"
            ></button>
          }
        </div>
        <p class="text-xs text-muted-foreground">Presets only — contrast is guaranteed across all themes.</p>
      </div>

      <p class="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        You will become this group's first admin if approved.
      </p>

      <div hlmDialogFooter>
        <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
        <button hlmBtn type="submit" [disabled]="form.invalid || isSubmitting()">
          {{ isSubmitting() ? 'Submitting…' : 'Submit request' }}
        </button>
      </div>
    </form>
  `,
})
export class GroupRequestForm {
  private readonly requests = inject(RequestService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  private readonly fb = inject(FormBuilder);

  protected readonly themes = GROUP_THEMES;
  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    ageLimit: [0, [Validators.required, Validators.min(0)]],
    theme: ['moss' as GroupTheme, Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const payload = this.form.getRawValue();
    this.requests.create({ type: 'GROUP_CREATE', payload }).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not submit the request.');
      },
    });
  }
}
