---
title: Signals in Angular Auth OIDC Client
slug: signals-in-angular-auth-oidc-client
description: Version 18 of the angular-auth-oidc-client library adds Signal support to access the authenticated state and user data.
date: 2024-06-13
tags: Angular, Angular Auth OIDC Client, authentication
---

Version 18 of the [Angular Auth OIDC Client (angular-auth-oidc-client)](https://angular-auth-oidc-client.com/) library adds Signal support to access the authenticated state and user data.
This makes it simpler to use authentication state and user data in Angular applications compared to the Observables' implementation.

## `authenticated`

The `authenticated` property wraps the [`isAuthenticated$`](https://angular-auth-oidc-client.com/docs/documentation/public-api#isauthenticated) Observable with a Signal that holds the authenticated state of a user's session.
You can use this signal to check if the user is authenticated, and it returns object containing `AuthenticatedResult`:

```ts
export interface AuthenticatedResult {
	isAuthenticated: boolean;
	allConfigsAuthenticated: ConfigAuthenticatedResult[];
}

export interface ConfigAuthenticatedResult {
	configId: string;
	isAuthenticated: boolean;
}
```

To use the `authenticated` Signal, inject the `OidcSecurityService` and optionally assign the signal to a property.
Then, you can use the property in the template or within the component as a Signal, as is shown in the following example:

```angular-ts{5-9, 15-18, 20-21}:app.component.ts
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
	template: `
		@if (authenticated().isAuthenticated) {
			<p>You are authenticated</p>
		} @else {
			<p>You are not authenticated</p>
		}

		<button (click)="logAuthenticatedState()">Log authenticated state</button>
	`,
})
export class AppComponent {
	private readonly oidcSecurityService = inject(OidcSecurityService);
	// Signal containing the authenticated state
	protected readonly authenticated = this.oidcSecurityService.authenticated;

	protected logAuthenticatedState() {
		console.log('Is authenticated:', this.authenticated().isAuthenticated);
		console.log(this.authenticated());
	}
}
```

## `userData`

`userData` is the Signal implementation of the [`userData$`](https://angular-auth-oidc-client.com/docs/documentation/public-api#userdata) Observable.
Accessing the signal returns the `UserDataResult` object:

```ts
export interface UserDataResult {
	userData: any;
	allUserData: ConfigUserDataResult[];
}

export interface ConfigUserDataResult {
	configId: string;
	userData: any;
}
```

You can use this to read the user data in your Angular application.
Just like the `authenticated` Signal, inject the `OidcSecurityService` and optionally assign the `userData` Signal to a property to use it in the template or within the component.

```angular-ts{5, 11, 14}:app.component.ts
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
	template: `
		<div>👋 Hello {{ oidcSecurityService.userData().userData?.name }}</div>

		<button (click)="logUserData()">Log user data</button>
	`,
})
export class AppComponent {
	private readonly oidcSecurityService = inject(OidcSecurityService);

	protected logUser() {
		console.log(this.oidcSecurityService.userData());
	}
}
```

## Example

The `authenticated` and `userData` Signals in the `angular-auth-oidc-client` library make it easier to use authentication state and user data in Angular applications.

```angular-ts
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
	selector: 'app-root',
	template: `
		<button (click)="log()">Log state</button>

		@if (authenticated().isAuthenticated) {
			<pre>{{ userData() | json }}</pre>
		} @else {
			<div>You are not authenticated.</div>
		}
	`,
})
export class AppComponent {
	private readonly oidcSecurityService = inject(OidcSecurityService);
	// Signal containing authenticated state
	protected readonly authenticated = this.oidcSecurityService.authenticated;
	// Signal containing user data
	protected readonly userData = this.oidcSecurityService.userData;

	log() {
		console.log({ authenticated: this.authenticated(), userData: this.userData() });
	}
}
```
