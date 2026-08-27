// client/src/app/features/requests/room-request-form.ts
// RoomRequestForm: members propose a room; group admins create one immediately.

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
import { RoomService } from '../../core/services/room-service';

export interface RoomRequestFormContext {
  groupId: string;
  asAdmin?: boolean;
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
      <h2 hlmDialogTitle>{{ ctx.asAdmin ? 'Add a room' : 'Propose a room' }}</h2>
      <p hlmDialogDescription>
        {{ ctx.asAdmin ? 'Added to this group immediately.' : 'Sent to the group admins for approval.' }}
      </p>
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
          {{ isSubmitting() ? 'Submitting…' : ctx.asAdmin ? 'Add room' : 'Submit request' }}
        </button>
      </div>
    </form>
  `,
})
export class RoomRequestForm {
  private readonly requests = inject(RequestService);
  private readonly roomsApi = inject(RoomService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<RoomRequestFormContext>();
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
    const payload = { name, description: description.trim() || undefined, groupId: this.ctx.groupId };
    const done = {
      next: () => this.dialogRef.close(true),
      error: (err: { error?: { error?: string } }) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not save this room.');
      },
    };
    if (this.ctx.asAdmin) {
      this.roomsApi.create(this.ctx.groupId, { name: payload.name, description: payload.description }).subscribe(done);
      return;
    }
    this.requests.create({ type: 'ROOM_CREATE', payload }).subscribe({
      next: done.next,
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error ?? 'Could not submit the request.');
      },
    });
  }
}
