// client/src/app/features/requests/report-user-form.ts
// ReportUserForm: a member reports someone in a shared group. Approval only
// grants permission to ban — the ban itself is a later endpoint.

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogClose, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import type { User } from '../../core/models';
import { NotificationService } from '../../core/services/notification-service';
import { RequestService } from '../../core/services/request-service';

export interface ReportUserFormContext {
  groupId: string;
  members: User[];
  currentUserId: string;
}

@Component({
  selector: 'app-report-user-form',
  imports: [
    ReactiveFormsModule,
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
      <h2 hlmDialogTitle>Report a member</h2>
      <p hlmDialogDescription>Sent to the admins of this group.</p>
    </div>

    <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex flex-col gap-1.5">
        <label hlmLabel for="targetId">Member</label>
        <select
          id="targetId"
          formControlName="targetId"
          class="border-input h-9 w-full rounded-md border bg-transparent px-2.5 text-sm shadow-xs outline-none"
        >
          <option value="" disabled>Choose a member</option>
          @for (member of reportable; track member.id) {
            <option [value]="member.id">{{ member.firstName }} {{ member.lastName }}</option>
          }
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label hlmLabel for="reason">Reason</label>
          <span class="text-xs text-muted-foreground">Required</span>
        </div>
        <textarea hlmTextarea id="reason" formControlName="reason" rows="4"></textarea>
      </div>

      <div hlmDialogFooter>
        <button hlmBtn variant="outline" type="button" hlmDialogClose>Cancel</button>
        <button hlmBtn type="submit" [disabled]="form.invalid || isSubmitting()">
          {{ isSubmitting() ? 'Submitting…' : 'Submit report' }}
        </button>
      </div>
    </form>
  `,
})
export class ReportUserForm {
  private readonly requests = inject(RequestService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  private readonly ctx = injectBrnDialogContext<ReportUserFormContext>();
  private readonly fb = inject(FormBuilder);

  protected readonly reportable = this.ctx.members.filter((m) => m.id !== this.ctx.currentUserId);
  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    targetId: ['', Validators.required],
    reason: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const { targetId, reason } = this.form.getRawValue();
    this.requests
      .create({
        type: 'USER_REPORT',
        targetId,
        payload: { groupId: this.ctx.groupId },
        reason: reason.trim(),
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error ?? 'Could not submit the report.');
        },
      });
  }
}
