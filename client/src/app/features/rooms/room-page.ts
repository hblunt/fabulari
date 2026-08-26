// client/src/app/features/rooms/room-page.ts
// Stage 0 placeholder for RoomPage (wireframes 07 and 08): the chat view —
// message list, composer and presence panel, rendering MOCK data only in
// Phase 1 (no sockets, no message endpoints). Built in Stage 5 (feat/chat-ui).

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-room-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-8">
      <h1 class="text-2xl font-semibold">Room</h1>
      <p class="mt-2 text-muted-foreground">RoomPage — built in Stage 5 (feat/chat-ui).</p>
    </section>
  `,
})
export class RoomPage {}
