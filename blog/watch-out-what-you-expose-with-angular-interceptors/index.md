---
title: Watch out what you expose with Angular Interceptors
slug: watch-out-what-you-expose-with-angular-interceptors
description: Your Angular Interceptor might leak sensitive data to the outside world. Here's how to prevent that.
date: 2022-09-28
tags: Angular, security
---

You're probably already using Angular Interceptors.
Even if you can't find one in the application you're working in, there is a big chance that one of the added libraries makes use of an interceptor, especially if you're dealing with Authentication headers.

You can compare an [Angular Interceptor](https://angular.io/guide/http#intercepting-requests-and-responses) with the entrance door of your favorite conference.
When you arrive at the conference you need go to through the entrance, and you can pick up some swag before entering the venue.
After the day is over and you want to exit the venue, you need to pass through the door again and you might pick up some more swag.

Going back to Angular interceptors, all HTTP requests that are initiated through the HTTP client are handled by the registered interceptors right before they're sent to the server, and again when the server answers with a response.
This makes interceptors the ideal place to put common logic to work with HTTP traffic.

Interceptors come in different flavors, and they're often responsible for a specific task.
For example, you can write an interceptor that acts as a caching layer, an interceptor that's responsible for showing and hiding a loader indicator, or another one to handle HTTP errors unanimously.
But, the most popular interceptor is the one that adds request headers to the HTTP request, for example adding an Authentication header to the request headers with the token of the user.

It's about these interceptors that I want to talk to you about.
A typical interceptor that does this is often implemented like one of the below.

From the Angular docs:

```ts:auth.interceptor.ts
import { AuthService } from '../auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(private auth: AuthService) {}

	intercept(req: HttpRequest<any>, next: HttpHandler) {
		// Get the auth token from the service.
		const authToken = this.auth.getAuthorizationToken();

		// Clone the request and replace the original headers with
		// cloned headers, updated with the authorization.
		const authReq = req.clone({
			headers: req.headers.set('Authorization', authToken),
		});

		// send cloned request with header to the next handler.
		return next.handle(authReq);
	}
}
```

From an article that comes as one of the first google results:

```ts:auth.interceptor.ts
export class AuthInterceptorService implements HttpInterceptor {
	constructor(private authService: AuthService) {}
	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const token = this.authService.getAuthToken();

		if (token) {
			// If we have a token, we set it to the header
			request = request.clone({
				setHeaders: { Authorization: `Authorization token ${token}` },
			});
		}

		return next.handle(request).pipe(
			catchError((err) => {
				if (err instanceof HttpErrorResponse) {
					if (err.status === 401) {
						// redirect user to the logout page
					}
				}
				return throwError(err);
			}),
		);
	}
}
```

From the top [Stack Overflow](https://stackoverflow.com/questions/48683476/how-to-add-multiple-headers-in-angular-5-httpinterceptor) question and the corresponding answer:

```ts:question.ts
import { Injectable } from '@angular/core';

import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';


@Injectable()
export class fwcAPIInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const authReq = req.clone({
      headers: req.headers.set('Content-Type', 'application/json')
    });

    console.log('Intercepted HTTP call', authReq);

    return next.handle(authReq);
  }
}
```

```ts:answer
const authReq = req.clone({
    headers: req.headers.set('Content-Type', 'application/json')
    .set('header2', 'header 2 value')
    .set('header3', 'header 3 value')
});
```

Do you notice what might go wrong here?

Let me give you a hint, what if the application sends an HTTP request to a 3rd party API?

Correct, then all the additional headers that are added by the interceptor are also sent to the 3rd party API.
Ideally, this shouldn't be happening, but when it does - by accident or not - you don't want to leak (sensitive) information to a 3rd party.

There are several solutions to prevent this from happening.
Let's take a look at them.

The easiest, and most secure, is verifying the host of the outgoing request.
Only when it's a trusted host, the headers are appended to the request.

When we apply this to the example of the Angular docs, the interceptor now looks like this.

```ts{8-11}:auth.interceptor.ts
import { AuthService } from '../auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(private auth: AuthService) {}

	intercept(req: HttpRequest<any>, next: HttpHandler) {
		const uri = new URL(req.url);
		if(uri.hostname !== 'trusted-domain.com') {
			return next.handle(req);
		}

		// Get the auth token from the service.
		const authToken = this.auth.getAuthorizationToken();

		// Clone the request and replace the original headers with
		// cloned headers, updated with the authorization.
		const authReq = req.clone({
			headers: req.headers.set('Authorization', authToken),
		});

		// send cloned request with header to the next handler.
		return next.handle(authReq);
	}
}
```

A variant of the above solution is more flexible and uses a configurable collection of host names.

> Because practice makes the check configurable, many libraries use this technique.
> For example, the [Angular Auth OIDC Client](https://angular-auth-oidc-client.com) uses configurable [secure routes](https://angular-auth-oidc-client.com/docs/documentation/configuration#secureroutes) to only append the Authorization header to requests that are sent to the configured host names (secure routes).

```ts{9-12}:auth.interceptor.ts
import { AuthService } from '../auth.service';
import { Config } from '../config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(private auth: AuthService, private config: Config) {}

	intercept(req: HttpRequest<any>, next: HttpHandler) {
		const uri = new URL(req.url);
		if(!config.trustedHostNames.includes(uri.hostname)) {
			return next.handle(req);
		}

		// Get the auth token from the service.
		const authToken = this.auth.getAuthorizationToken();

		// Clone the request and replace the original headers with
		// cloned headers, updated with the authorization.
		const authReq = req.clone({
			headers: req.headers.set('Authorization', authToken),
		});

		// send cloned request with header to the next handler.
		return next.handle(authReq);
	}
}
```

Another solution uses the [`HttpContext`](https://angular.io/api/common/http/HttpContext) to ignore specific requests.
But, this makes it also easy to forget to add the context to a request, which is not ideal.

This looks as follows.

First define a `HttpContextToken`.

```ts{9-11}:token.ts
const IS_UNTRUSTED = new HttpContextToken<boolean>(() => false);
```

Then set the token for a request.

```ts{9-11}:some.service.ts
import { IS_UNTRUSTED } from './token.ts';

@Injectable()
export class Some3rdPartyService {
	constructor(private http: HttpClient) {}

	getData() {
		return this.http.get('3rd-party-api',
			{
				context: new HttpContext().set(IS_UNTRUSTED, true),
			}
		)
	}
}
```

Lastly, verify if the token is set in the interceptor.

```ts{9-11}:auth.interceptor.ts
import { AuthService } from '../auth.service';
import { IS_UNTRUSTED } from './token.ts';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(private auth: AuthService) {}

	intercept(req: HttpRequest<any>, next: HttpHandler) {
		if (req.context.get(IS_UNTRUSTED)) {
			return next.handle(req);
		}

		// Get the auth token from the service.
		const authToken = this.auth.getAuthorizationToken();

		// Clone the request and replace the original headers with
		// cloned headers, updated with the authorization.
		const authReq = req.clone({
			headers: req.headers.set('Authorization', authToken),
		});

		// send cloned request with header to the next handler.
		return next.handle(authReq);
	}
}
```

## Conclusion

All HTTP requests that are initiated by the HTTP client are intercepted by your Angular interceptors.
This is a powerful feature that allows you to add logic to all outgoing HTTP requests.

But, this makes it also easy to leak (sensitive) information to 3rd party APIs.
These requests are also intercepted by the same interceptors.
This way you can accidentally add more information to the request that you would want, even without knowing it.
The most common violation is adding an Authorization header to the requests.

As a best practice, always verify if the outgoing request is sent to a trusted host before appending headers to the request.
