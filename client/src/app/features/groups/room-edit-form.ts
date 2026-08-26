// client/src/app/features/groups/room-edit-form.ts
// PATCH name and description. Rooms are created by request approval, not here.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import type { Room } from '../../core/models';
import { NotificationService } from '../../core/services/notification-service';
import { RoomService } from '../../core/services/room-service';

export interface RoomEditFormContext {
  room: Room;
}

@Component({
  selector: 'app-room-edit-form',
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
      <h2 hlmDialogTitle>Edit room</h2>
      <p hlmDialogDescription>Changes apply immediately.</p>
    </div>

    <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="name">Name</label>
        <input hlmInput id="name" formControlName="name" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="description">Description</label>
        <textarea hlmTextarea id="description" formControlName="description"></textarea>
      </div>
      <div hlmDialogFooter>
        <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
        <button hlmBtn type="submit" [disabled]="form.invalid || isSubmitting()">Save</button>
      </div>
    </form>
  `,
})
export class RoomEditForm {
  private readonly rooms = inject(RoomService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  private readonly ctx = injectBrnDialogContext<RoomEditFormContext>();
  private readonly fb = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.ctx.room.name, Validators.required],
    description: [this.ctx.room.description ?? ''],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const { name, description } = this.form.getRawValue();
    this.rooms.patch(this.ctx.room.id, { name, description: description.trim() }).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not save the room.');
      },
    });
  }
}
