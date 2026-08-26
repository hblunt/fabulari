// client/src/app/app.ts
// Root shell (Phase1.md §5): hosts the role-aware NavBar, the router outlet
// and the notification host. There is exactly one shell — screens differ by
// what the NavBar shows and what guards allow, not by separate layouts.

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './shared/nav-bar';
import { NotificationHost } from './shared/notification-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, NotificationHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
