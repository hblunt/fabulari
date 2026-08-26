// client/src/app/app.config.ts
// Application-wide providers. Angular 22 zoneless default: UI state lives in
// signals, so no zone.js is registered here.

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

import { routes } from './app.routes';
import { userIdInterceptor } from './core/interceptors/user-id-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Every HTTP call carries X-User-Id via the interceptor (§6 conventions),
    // so no service constructs headers itself.
    provideHttpClient(withInterceptors([userIdInterceptor])),
    // spartan default CDK overlay config (dialogs/selects above fixed elements).
    provideSpartanHlm(),
  ],
};
