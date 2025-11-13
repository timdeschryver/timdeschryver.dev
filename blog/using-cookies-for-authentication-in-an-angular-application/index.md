---
title: Using cookies for authentication in an Angular application
slug: using-cookies-for-authentication-in-an-angular-application
description: Learn how to simplify authentication in Angular applications by leveraging secure, cookie-based authentication through a Backend for Frontend (BFF) pattern. This approach eliminates the complexity of client-side token management while improving the security of your client-side code.
date: 2025-11-13
tags: Angular, BFF, Aspire, .NET
series:
  name: 'Building a secure application'
---

In the prevous posts of this series, we've already seen how to set up a Backend for Frontend (BFF) using Aspire and how to implement a secure authentication flow for the .NET backend of the application. In this post, we will focus on the Angular frontend, and how to properly handle authentication.

## Code flow with PKCE

When building a secure Angular, or any SPA , application, there are two main approaches to handle authentication: using the Authorization Code flow with PKCE or using cookies.
With the Authorization Code flow with PKCE, the frontend application is responsible for the entire authentication process. The process starts to redirect the user to the identity provider, handles the authorization code exchange, and manages tokens (access and refresh tokens) on the client side.

Because this is very specific (complex) code, but yet very important to get right, many choose to use libraries that abstract away the complexity.
In Angular, we can use libraries like [angular-auth-oidc-client](https://angular-auth-oidc-client.com/) which simplifies the implementation of the Authorization Code flow with PKCE.

However, this approach has some downsides:

- **Security risks**: Storing tokens in the browser (e.g., in local storage or session storage) can expose them to XSS attacks.
- **Token management**: Handling token refresh and expiration can be challenging on the client side.
- **CORS issues**: Making API calls to a backend from a different origin can lead to CORS issues that need to be managed.
- **Bigger bundle size**: Including authentication libraries can increase the size of the frontend application.

## Using cookies for authentication

An alternative approach is to use cookies for authentication. In this approach, the backend (BFF) handles the authentication process and manages the authentication state.

While it's possible to read the cookies' content using JavaScript, it's generally not recommended to have the frontend application directly access (authentication) cookies. That's why I mentioned in the previous post to set the cookies as [`HttpOnly`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) and [`Secure`](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies), which prevents JavaScript from accessing them, enhancing the security.

Instead, the cookie should not be directly consumed by the frontend application. The backend is responsible for setting and reading the authentication cookies. The frontend application simply makes requests to the backend to access the authenticated state, just as it would with any other API resource.

While doing so, we avoid the downsides of the Authorization Code flow with PKCE. The only prerequisite is that the frontend and backend are served from the same domain, or that the cookie is configured to be sent across domains (using the [`SameSite=None; Secure` attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)).

## Implementing authentication in Angular

The good news is that implementing cookie-based authentication in an Angular application is straightforward. The main idea is to create an authentication service that communicates with the backend to determine the user's authentication status.
Let's take a look at how we can implement this in an Angular application.

The main concerns of the authentication implementation are the login and logout methods, and a way to fetch the authenticated user's information.
From a technical side, these can all be implemented within a single service that communicates with the backend.
In the example below, this service communicates with the `/bff` endpoints to perform these actions.
The `login` and `logout` methods simply redirect the user to the corresponding backend endpoints, while the `user` property fetches the authenticated user's information.

:::code-group

```ts [name=authentication.ts] [title=Authentication Service] [source=https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.AngularWorkspace/projects/sandbox-app/src/app/authentication/authentication.ts]
@Injectable({
	providedIn: 'root',
})
export class Authentication {
	private document = inject(DOCUMENT);

	private _user = httpResource(() => '/bff/user', {
		parse: parse(User),
	}).asReadonly();

	public readonly user = computed(() => this._user.value());

	public login(redirectUrl: string): void {
		this.document.location.href = `/bff/login?returnUrl=${redirectUrl}`;
	}

	public logout(redirectUrl: string): void {
		this.document.location.href = `/bff/logout?returnUrl=${redirectUrl}`;
	}
}
```

```ts [name=user.ts] [title=User Model] [source=https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.AngularWorkspace/projects/sandbox-app/src/app/authentication/user.ts]
export const User = z.strictObject({
	isAuthenticated: z.boolean(),
	name: z.nullable(z.string()),
	claims: z.array(
		z.strictObject({
			type: z.string(),
			value: z.string(),
		}),
	),
});
export type User = z.infer<typeof User>;
```

:::

Another important part of the authentication is to protect routes that require an authenticated user. We can achieve this by creating a [route guard](https://angular.dev/guide/routing/route-guards) that checks the user's authentication status before allowing access to certain routes, this is also a feature that's commonly provided by authentication libraries. If the user is not authenticated, the following guard will redirect the user to the login page.

:::code-group

```ts [name=authenticated-guard.ts] [title=Guard] [source=https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.AngularWorkspace/projects/sandbox-app/src/app/authentication/authenticated-guard.ts]
export const authenticatedGuard: CanActivateFn = (
	_next: ActivatedRouteSnapshot,
	state: RouterStateSnapshot,
) => {
	const authenticationService = inject(Authentication);

	return toObservable(authenticationService.user).pipe(
		filterNullish(),
		map((user) => {
			if (user.isAuthenticated) {
				return true;
			}
			authenticationService.login(state.url);
			return false;
		}),
	);
};
```

```ts [title=Routes] [name=app.routes.ts] [source=https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.AngularWorkspace/projects/sandbox-app/src/app/app.routes.ts]
export const routes: Routes = [
	{
		path: '',
		canActivateChild: [authenticatedGuard],
		children: [
			{
				path: 'customers',
				loadChildren: () => import('@sandbox-app/customer-management/customer-management.routes'),
				title: 'Customers',
			},
		],
	},
];
```

:::

For the completeness of the implementation, here are the three corresponding backend endpoints that the Angular application communicates with for authentication. Most of the heavy lifting is done by ASP.NET itself.

```cs [name=UserEndpoints.cs] [source=https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.Gateway/UserModule/UserModule.cs]
builder.MapGet("user", (ClaimsPrincipal principal) =>
{
    var user = principal switch
    {
        { Identity.IsAuthenticated: true } => new User
        {
            IsAuthenticated = true,
            Name = principal.FindFirstValue("name"),
            Claims = principal.Claims.Select(c => new UserClaim { Type = c.Type, Value = c.Value }),
        },
        _ => new User
        {
            IsAuthenticated = false,
            Name = null
        }
    };

    return TypedResults.Ok(user);
});

builder.MapGet("login", (string? returnUrl, string? claimsChallenge, HttpContext context) =>
{
    var properties = new AuthenticationProperties
    {
        RedirectUri = context.BuildRedirectUrl(returnUrl),
    };

    if (claimsChallenge != null)
    {
        string jsonString = claimsChallenge.Replace("\\", "", StringComparison.Ordinal).Trim(['"']);
        properties.Items["claims"] = jsonString;
    }

    return TypedResults.Challenge(properties);
});

builder.MapGet("logout", (string? redirectUrl, HttpContext context) =>
{
    var properties = new AuthenticationProperties
    {
        RedirectUri = context.BuildRedirectUrl(redirectUrl),
    };

    return TypedResults.SignOut(properties, [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]);
});
```

## Conclusion

Using cookies for authentication in an Angular application is a secure and straightforward approach. By delegating the authentication process to the backend, we can avoid many of the complexity and security risks associated with client-side token management.

In this post we've seen the most basic implementation of an authentication service in Angular that communicates with the backend to manage the user's authentication state, along with route guards to protect authenticated routes. This approach can further be extended with additional features such as role-based access control, or custom directives to show UI elements based on the user's authentication status.

The code samples provided in this post can be found in my [Sandbox repository on GitHub](https://github.com/timdeschryver/Sandbox).
