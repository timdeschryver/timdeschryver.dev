```ts:main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
	provideAuth,
	authInterceptor,
	autoLoginPartialRoutesGuard,
} from 'angular-auth-oidc-client';
import { AppComponent } from './app/app.component';
import { ProtectedComponent } from './protected/protected.component';

bootstrapApplication(AppComponent, {
	providers: [
		provideAuth({
			config: {
				/* Config options comes here */
			},
		}),
		provideHttpClient(withInterceptors([authInterceptor()])),
		provideRouter([
			{
				path: 'protected',
				component: ProtectedComponent,
				canActivate: [autoLoginPartialRoutesGuard],
			},
			{
				path: 'feature',
				loadChildren: () => import('./feature/feature.routes').then((m) => m.routes),
				canMatch: [autoLoginPartialRoutesGuard],
			},
		]),
	],
});
```

You can a working example [here](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-standalone).

To have an overview of all the new APIs, check out the [migration guide](https://angular-auth-oidc-client.com/docs/migrations/v15-to-v16).
