// client/src/app/features/requests/room-request-form.ts
// RoomRequestForm: a member proposes a room; a group admin actions it.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';

export interface RoomRequestFormContext {
  groupId: string;
}

@Component({
  selector: 'app-room-request-form',
  imports: [
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
      <h2 hlmDialogTitle>Propose a room</h2>
      <p hlmDialogDescription>Sent to the group admins for approval.</p>
    </div>

    <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="name">Name</label>
        <input hlmInput id="name" formControlName="name" placeholder="documentaries" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="description">Description</label>
        <textarea hlmTextarea id="description" formControlName="description" placeholder="Feature docs and series."></textarea>
      </div>

      <div hlmDialogFooter>
        <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
        <button hlmBtn type="submit" [disabled]="form.invalid || isSubmitting()">
          {{ isSubmitting() ? 'Submitting…' : 'Submit request' }}
        </button>
      </div>
    </form>
  `,
})
export class RoomRequestForm {
  private readonly requests = inject(RequestService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  private readonly ctx = injectBrnDialogContext<RoomRequestFormContext>();
  private readonly fb = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const { name, description } = this.form.getRawValue();
    this.requests
      .create({
        type: 'ROOM_CREATE',
        payload: { name, description: description.trim() || undefined, groupId: this.ctx.groupId },
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error ?? 'Could not submit the request.');
        },
      });
  }
}
