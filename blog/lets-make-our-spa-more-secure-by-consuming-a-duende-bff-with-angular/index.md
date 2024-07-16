---
title: "Let's make our SPA more secure by consuming a Duende BFF with Angular"
slug: lets-make-our-spa-more-secure-by-consuming-a-duende-bff-with-angular
description: Let's take a look at how shifting the auth responsibility from a front-end application to a Backend For Frontend (BFF) affects our Angular applications.
date: 2023-04-24
tags: Angular, BFF, Architecture, Auth0, Duende
---

This post is a follow-up to [Let's make our SPA more secure by setting up a .NET BFF with Duende and Auth0](../lets-make-our-spa-more-secure-by-setting-up-a-net-bff-with-duende-and-auth0/index.md).
In that post, we've seen why and how to set up a .NET Backend For Frontend (BFF) using the [Duende.BFF](https://duendesoftware.com/) NuGet package.
With the backend in the correct state, it's time to consume it from our frontend Angular application.

Traditionally, Angular applications that need some sort of authentication (and authorization) use an access token to identify the user.
To retrieve this token, the frontend application redirects the user to the authentication provider, and after a successful login then gets redirected back to the application. While redirecting back the user's token is included in the URL query parameters, and the Angular application stores this token within the browser (in the local or session storage) so it can be added to HTTP requests by using the Authorization header.
Because the token ideally has a short-lived lifetime, the token gets refreshed behind the scenes by using a hidden iframe.
This whole process is called the [Implicit flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow).

While this works fine, the browser context is not that secure to store sensitive information. The token is available for everyone that wants to access it.
Also important to note is that many browser vendors are starting to restrict the use of third-party cookies across site boundaries because of the extra vulnerabilities they bring.
This has a big impact on the current flow because many implementations of the Implicit flow make use of third-party cookies to refresh the token via the hidden iframe.

As a counter, we're starting to move away from the Implicit flow and are starting to move the authentication process to the backend using the more secure [PKCE flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow).
In this post, let's take a look at how this affects our Angular applications.

## Responsibilities

Before we get into the details we first need to take a look at the impact when we shift the responsibility from the front-end to the backend.
When the backend is in charge of the authentication process and its state, the front-end doesn't need to retrieve, store, and refresh the access token.
Instead, the backend redirects the user to the identity provider and then stores the user's session information in a server-side cookie when it gets redirected back.
You can also configure Duende to store the [server-side session](https://docs.duendesoftware.com/identityserver/v6/bff/session/server_side_sessions/) in-memory or in the database, but that's for another time.

This shift in responsibilities means that the front-end becomes more secure, and also a lot simpler to comprehend and maintain.

## A change in Request Headers

As mentioned earlier, the frontend application doesn't hold the authentication state anymore.
This means that we can't add the access token to the request header anymore.
But you don't need to worry, this step isn't required anymore to invoke a request that requires authorization.
With the server-side session, the backend already knows your identity; what resources you can access, and what you can do with these resources.

As a security measure, the backend can be configured to only accept requests coming from our application that contain an [anti-forgery token](https://learn.microsoft.com/en-us/aspnet/web-api/overview/security/preventing-cross-site-request-forgery-csrf-attacks#anti-forgery-tokens) in the form of a request header.
When you're using the `Duende.BFF` package, the [default configuration](https://docs.duendesoftware.com/identityserver/v6/bff/apis/local/) uses the `X-CSRF`header (with `1` as value) to protect the local API endpoints.

In the Angular application you can create a simple HTTP interceptor that adds this header to all HTTP requests, just like previously we added the access token to the request header.
A simple implementation of this interceptor can look like this:

The `includeAntiforgeryTokenInterceptor` HTTP interceptor adds the `X-CSRF` header to all requests.
This looks simpler than the previous implementation because we don't [have to worry to expose access tokens to 3rd parties](../watch-out-what-you-expose-with-angular-interceptors/index.md).

```ts{5-7}:interceptors/include-antiforgery-token.interceptor.ts
import type { HttpHandlerFn, HttpRequest } from '@angular/common/http';

export function includeAntiforgeryTokenInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
    const clonedRequest = request.clone({
        setHeaders: {
            'x-csrf': '1',
        },
    });
    return next(clonedRequest);
}
```

To use the `includeAntiforgeryTokenInterceptor` interceptor we need to register it to the HTTP interceptors:

```ts{8}:main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { includeAntiforgeryTokenInterceptor } from './app/interceptors/include-antiforgery-token.interceptor';

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(
        withInterceptors([includeAntiforgeryTokenInterceptor])
    )],
});
```

When the request header is not present, the backend returns a `401 (Unauthorized)` response code.

## Less code in the frontend

With the shift of responsibilities, it's clear that the front-end becomes simpler.
Because doing authentication right is hard, I think most of us are currently using a 3rd party library to handle the authentication process (including the logic to refresh the token) for us.

But with reduced, or even evaporated, the complexity of the front-end because we don't have to deal with this anymore, and we can remove this dependency.
As a direct result of this action, we ship less code to our users.

## Running on localhost

Because cookies are now used to authenticate the user instead of a token, we have to host the front-end and the back-end on the same domain.
While running this locally means that we need to create a proxy to forward the HTTP requests to the BFF backend.
Luckily we don't have to write this ourselves or use a package for this because Angular supports [proxying to a backend server](https://angular.io/guide/build#proxying-to-a-backend-server).

To set up the proxy for our BFF server first, create a `proxy.conf.json` file and configure the following API endpoints:

- The `bff` endpoints are used to consume the endpoints that are provided by the Duende BFF
- The sign in and sign out endpoints are used as a callback when the user logs in or out
- The `api` endpoint is used to consume our created local API endpoints. A local API is an endpoint that is particularly consumed by the Angular frontend

```json:proxy.conf.json
{
    "/bff": {
        "target": "https://localhost:7012",
        "secure": false
    },
    "/signin-oidc": {
        "target": "https://localhost:7012",
        "secure": false
    },
    "/signout-callback-oidc": {
        "target": "https://localhost:7012",
        "secure": false
    },
    "/api": {
        "target": "https://localhost:7012",
        "secure": false
    }
}
```

When that's done, start your Angular application with `ng serve` and use the `proxy-config` option to start the proxy server.
Point the `proxy-config` flag to the created config file.

```bash
ng serve --proxy-config proxy.conf.json
```

Or, to make things easy add the config to the `serve` options of the `angular.json` configuration file:

```json{6}:angular.json
{
    "serve": {
        "builder": "@angular-devkit/build-angular:dev-server",
            "development": {
                "browserTarget": "ng-bff:build:development",
                "proxyConfig": "proxy.conf.json"
            }
        },
        "defaultConfiguration": "development"
    }
}
```

You can now start the proxy server with the default `ng serve` command.

```bash
# uses the proxy config to start the proxy server
ng serve
```

Now, when the Angular application calls an endpoint that starts with the configured paths, the request gets forwarded to the BFF server.

## Useful endpoints that Duende provides

### /bff/login

To log in we can redirect the user to the `/bff/login` endpoint of the BFF.

```html
<a href="/bff/login">Login</a>
```

When the user is not logged in, this redirects the user to the IDP with the `redirect_uri` set to the `/signin-oidc`.
After the user is logged in, the user is redirected to the redirect URL.
Because the front-end initiates the login procedure, the redirect URL is set to the front-end's origin.
So, don't forget to add this URL to the list of allowed redirect URLs in the IDP otherwise you will get the "Invalid redirect URI" error.

If everything is set up correctly, after the user is logged in you should be redirected back to the frontend application and you should see the same cookie within the Angular application as on the BFF.

### /bff/user

To get the user information we can call the `/bff/user` endpoint of the BFF.

```ts{5-7}:app.component.ts
export class AppComponent {
    results: any[] = [];
    constructor(private http: HttpClient) {}
    user() {
        this.http.get('/bff/user').subscribe((res) => {
            this.results.push(res);
        });
    }
}
```

In my case using Auth0 as the identity provider, this results in the following output:

```json:user.json
[
    {
        "type": "nickname",
        "value": "timdeschryver"
    },
    {
        "type": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        "value": "Tim Deschryver"
    },
    {
        "type": "picture",
        "value": "https://avatars.githubusercontent.com/u/28659384?v=4"
    },
    {
        "type": "updated_at",
        "value": "2023-04-22T13:31:33.4890000Z"
    },
    {
        "type": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
        "value": "github|28659384"
    },
    {
        "type": "sid",
        "value": "tZzc2kUMTzl914v14p0M0L1DA795caTn"
    },
    {
        "type": "bff:logout_url",
        "value": "/bff/logout?sid=tZzc2kUMTzl914v14p0M0L1DA795caTn"
    },
    {
        "type": "bff:session_expires_in",
        "value": 28254
    }
]
```

## Conclusion

In this article, we've seen how to consume the .NET BFF endpoints from an Angular application.
This was straightforward because the authentication is handled by the BFF and the Angular application only has to consume the endpoints, just like any other API.

There's just one small change that was needed. The BFF is secured and only accepts requests that have an anti-forgery header, which is why we had to include the `X-CSRF` request header when an API endpoint is invoked.

While developing locally, we have to proxy the requests to the BFF server, but this is a one-time setup and we can use the Angular proxy configuration for this.

We end up with an application that has increased security.
With this refactor we also reduce the complexity of the front-end, which results in less client-side code.

[You can play with the demo BackendForFrontend application on Github.](https://github.com/timdeschryver/BackendForFrontend)
