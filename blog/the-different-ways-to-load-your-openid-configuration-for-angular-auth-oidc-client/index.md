---
title: The different ways to load your OpenID configuration for Angular Auth OIDC Client
slug: the-different-ways-to-load-your-openid-configuration-for-angular-auth-oidc-client
description: How to configure the provideAuth function from the Angular Auth OIDC Client library to load your OpenID configuration synchronously or asynchronously.
date: 2024-06-24
tags: Angular, Angular Auth OIDC Client, authentication
---

In this article, we'll take a brief look at how to use the `provideAuth` function from the [Angular Auth OIDC Client](https://angular-auth-oidc-client.com) library to load your OpenID configuration. Either synchronously or asynchronously.

## Static configuration

Providing the configuration synchronously is straightforward, as you can pass the configuration object directly to the `provideAuth` function.
This is the simplest way to configure the library, but it doesn't allow for dynamic configuration based on the application's environment or other factors.

```ts:app.config.ts
import { provideAuth } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
	providers: [
		provideAuth({
			config: {
				authority: 'https://offeringsolutions-sts.azurewebsites.net',
				clientId: 'angularCodeRefreshTokens',
				triggerAuthorizationResultEvent: true,
				postLoginRoute: '/home',
				forbiddenRoute: '/forbidden',
				unauthorizedRoute: '/unauthorized',
				historyCleanupOff: true,
				redirectUrl: window.location.origin,
				postLogoutRedirectUri: window.location.origin,
				scope: 'openid profile email offline_access',
				responseType: 'code',
				silentRenew: true,
				useRefreshToken: true,
				secureRoutes: ['/api'],
			},
		}),
	],
};
```

:::info
See the [samples documentation page](https://angular-auth-oidc-client.com/docs/samples/) for a range of examples.
:::

## Configurable configuration

The above setup can be tweaked a bit to load the configuration via a (parameterized) function that returns the `OpenIdConfiguration`.
Together with the approach I've discussed in [Multiple releases using the same, but configurable, Angular Standalone Application build](../multiple-releases-using-the-same-but-configurable-angular-standalone-application-build/index.md), we can make the configurable depending on the environment. This allows us to have different configurations for different environments, for example, a development, a staging, and a production environment.

:::code-group

```ts:app.config.ts [title=app.config.ts]
import { provideAuth } from 'angular-auth-oidc-client';
import { EnvironmentConfiguration } from './environment.config';
import { openIdConfigurationFactory } from './open-id-configuration';

export const appConfig = (config: EnvironmentConfiguration): ApplicationConfig = {
 providers: [
    provideAuth({
        config: openIdConfigurationFactory(config),
    }),
  ],
};
```

```ts:open-id-configuration.ts [title=open-id-configuration.ts]
import { OpenIdConfiguration } from 'angular-auth-oidc-client';
import { openIdConfigurationFactory } from './open-id-configuration';

export const openIdConfigurationFactory = (
	config: EnvironmentConfiguration,
): OpenIdConfiguration => {
	return {
		// 👇 Use the environment configuration
		authority: config.openId.authority,
		clientId: config.openId.clientId,
		triggerAuthorizationResultEvent: true,
		postLoginRoute: '/home',
		forbiddenRoute: '/forbidden',
		unauthorizedRoute: '/unauthorized',
		historyCleanupOff: true,
		redirectUrl: window.location.origin,
		postLogoutRedirectUri: window.location.origin,
		scope: 'openid profile email offline_access',
		responseType: 'code',
		silentRenew: true,
		useRefreshToken: true,
		secureRoutes: ['/api'],
	};
};
```

:::

:::tip
Use `secureRoutes` to prevent the library from automatically adding the access token to each request. See [Watch out what you expose with Angular Interceptors](../watch-out-what-you-expose-with-angular-interceptors/index.md) for more information.
:::

## Asynchronous configuration (HTTP)

Sometimes, you might want to load the configuration from an external source, such as an HTTP request.
Using this solution, the client doesn't have ownership of the configuration, instead, it's retrieved from a server.

Storing the configuration on the server makes it possible to use an updated version of the configuration without the need to redeploy the client application. This offers the most flexibility, out of the three options, but it introduces a dependency on the server.

To achieve this, use the overload of the `provideAuth` function to use the `loader` property to provide a custom `StsConfigLoader`.
The `openIdConfigurationFactory` in the example below injects the `HttpClient` and retrieves the OpenID configuration from the server.

:::code-group

```ts:app.config.ts [title=app.config.ts]
import { provideAuth, StsConfigLoader } from 'angular-auth-oidc-client';
import { openIdConfigurationFactory } from './open-id-configuration';

export const appConfig: ApplicationConfig = {
	providers: [
		provideAuth({
			loader: {
				provide: StsConfigLoader,
				useFactory: openIdConfigurationFactory,
			},
		}),
	],
};
```

```ts:open-id-configuration.ts [title=open-id-configuration.ts]
import {
	OpenIdConfiguration,
	StsConfigLoader,
	StsConfigHttpLoader,
} from 'angular-auth-oidc-client';

export const openIdConfigurationFactory = (): StsConfigLoader => {
	const httpClient = inject(HttpClient);
	const config$ = httpClient.get<OpenIdConfiguration>(`/api/ClientOpenIdConfiguration`);
	return new StsConfigHttpLoader(config$);
};
```

:::

## Conclusion

In this article, we've seen how to configure the `provideAuth` function from the Angular Auth OIDC Client library to load your OpenID configuration synchronously or asynchronously. This allows you to have a static configuration, a configurable configuration, or a configuration that is loaded from an external source. Depending on your requirements you can choose the most suitable approach for your application.
