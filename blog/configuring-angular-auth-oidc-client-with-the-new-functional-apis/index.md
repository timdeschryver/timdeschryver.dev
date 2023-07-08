---
title: Configuring angular-auth-oidc-client with the new functional APIs
slug: configuring-angular-auth-oidc-client-with-the-new-functional-apis
description: Recently the angular-auth-oidc-client library (v16) introduced new APIs to configure the library in a functional way. In this blog post, I'll show you how to use them.
date: 2023-07-03
tags: Angular, Security
---

The last versions of Angular included new APIs to configure your application(s) in a functional way.
Think of the new [functional guards](https://www.danywalls.com/how-to-use-functional-router-guards-in-angular), and the new APIs for the HTTP client including [functional interceptors](https://www.angulararchitects.io/aktuelles/the-refurbished-httpclient-in-angular-15-standalone-apis-and-functional-interceptors/).
Of course, there are also standalone components, which introduced [EnvironmentProviders](https://netbasal.com/how-to-keep-your-angular-providers-from-ending-up-in-the-wrong-injector-151bd095ff0d).

The latest version of [angular-auth-oidc-client](https://angular-auth-oidc-client.com/docs/intro) (v16.0.0) includes new functionality to support the new Angular APIs. In this blog post, I'll show you how to use them.

> If you prefer to just see the code, you can find the sample application [here](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-standalone). You can also run this example to see it in action.

## provideAuth

Let's start with configuring the authentication module, which is the first step towards using the library.

Instead of using the `AuthModule`, you can use the `provideAuth` method to configure the authentication flow.
Pass it the same configuration options as you would with the `AuthModule` (the config object is the same) while invoking the `provideAuth` method.

```ts{1, 5-9}:main.ts
import { provideAuth } from 'angular-auth-oidc-client';

bootstrapApplication(AppComponent, {
    providers: [
        provideAuth({
            config: {
                /* Config options comes here */
            },
        }),
    ],
});
```

## authInterceptor

To pass add the user's access token to the HTTP requests, you can now use the `authInterceptor` function.
Previously, you had to use the `HTTP_INTERCEPTORS` injection token to register the `AuthInterceptor` class provided by the library.
Using `authInterceptor` is easier as you'll see in a second.

To use `authInterceptor`, simply include it within the `withInterceptors` method while registering the HTTP client using `provideHttpClient`.

```ts{1, 5}:main.ts
import { authInterceptor } from 'angular-auth-oidc-client';

bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient(withInterceptors([authInterceptor()])),
    ],
});
```

## autoLoginPartialRoutesGuard

Lastly, to protect the Angular routes, you can use the `autoLoginPartialRoutesGuard` method.
Using the guard secures the route, and ensures that the user is authenticated before the route is activated.
A route that is protected by this guard will redirect the user to the login page if she's not authenticated.

With the previous version, you had to use the class-based guards `AutoLoginAllRoutesGuard` or `AutoLoginPartialRoutesGuard` to protect the Angular routes.

:::warning
The `AutoLoginAllRoutesGuard` guard is not migrated to the new functional APIs.
This is because the guard is [deprecated](https://angular-auth-oidc-client.com/docs/migrations/v15-to-v16#the-guard-autologinallroutesguard-is-deprecated-in-favor-of-autologinpartialroutesguard) and will be removed in a future version.
:::

To protect a route, append `autoLoginPartialRoutesGuard` to the `canActivate` or `canMatch` property of the route.

```ts{1, 9, 14}:main.ts
import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

bootstrapApplication(AppComponent, {
    providers: [
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
        ])
    ],
});
```

## Putting it all together

When putting all of this together, you'll end up with something like this:

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
