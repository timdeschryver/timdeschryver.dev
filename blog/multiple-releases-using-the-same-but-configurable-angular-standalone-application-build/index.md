---
title: Multiple releases using the same, but configurable, Angular Standalone Application build
slug: multiple-releases-using-the-same-but-configurable-angular-standalone-application-build
description: Configuring an Angular standalone application to be flexible enough to be released in different environments.
date: 2024-01-11
tags: Angular, DevOps
---

In an older post [Build once deploy to multiple environments](../angular-build-once-deploy-to-multiple-environments/index.md), I've already written on how to build an Angular application so it can be released in different environments.

But, in the last few iterations, Angular has evolved and has introduced new APIs to write applications.
One of the big changes is the transition to standalone components and "standalone applications".
This change affects the code examples that were used in the previous blog post, so this blog post is an updated version of the newer standalone Angular APIs.

## Environment specific configuration

When you're building an application it's probably a good idea to store some general settings in a central place.

An Angular application is no exception here.

As an example, let's say our Angular application communicates with a back-end API.
Instead of hard-coding the URL in different places where a request is made (which is hard to maintain), it's preferable to store the URL outside of the application logic within a variable that can be referenced in the codebase.
This makes it quick and easy to change in the future.
Instead of replacing all occurrences across the entire codebase, you can simply update the URL setting once.

Other settings can consist of feature flags, theme settings, keys, ...

These settings are often referred to as the environment configuration because these describe all the settings/variables that are required for the application to function properly.

Because you store the environment configuration outside of your application code, this practice allows you to create different versions of your settings.
That's a big benefit because you don't need to make any code-related changes before building/releasing the application.

You'll probably end up with a configuration variable for each of your environments (local, staging, production).

Within Angular, you don't need to roll your own implementation to cover this.
Angular already provides [environtment files](https://angular.dev/tools/cli/environments) to manage environment-specific configuration variables.
With the `build` command you can provide a configuration, which is used to determine the corresponding environment file.

```bash
ng build --configuration staging
```

## The problem with Angular environment files

While environment files are built into Angular and are also encouraged in the documentation, I find it not desirable in most cases as it lacks some flexibility.

The drawback is that an environment file is part of the source code, and is thus included within the build output - _you can find the settings of the environment file in the `main.js` file within the `dist` folder_.

Because it's part of the build output it means that these variables cannot be changed after a build, e.g. during a release.
Instead, you're required to create a new build for a different environment (or with updated variables).
In other words, **you're required to build the application multiple times, once for each environment** you want it to be released to.

Or in a worst-case scenario, a new version of the application is released and the team detects or a customer experiences that there's an issue because a variable is wrong.
Ideally, this doesn't happen, but trust me, it certainly will happen.
When that's the case, a new build needs to be queued up before it can be released, which can take some time to fix the issue.

## The solution

In order to resolve this problem, **the environment configuration needs to be extracted from the source code**.
This allows you to make changes to the environment variables during a release, either by swapping the entire file or by replacing specific properties (tokens) within the configuration.
I don't mention the release step within this blog post as this can be different depending on your infrastructure.

As you'll see in the next sections, extracting the environment configuration can be done in multiple ways.

### JSON Configuration files

The solution described in [Build once deploy to multiple environments](../angular-build-once-deploy-to-multiple-environments/index.md) uses a JSON file that's served as an asset.
This keeps the configuration within the Angular project, alternatively, you can also expose the configuration via an API endpoint (just make sure that an anonymous user can access the endpoint).
While this seems like two different things, the implementation from the Angular side is similar.

Before we make the changes, let's first define a type for the environment configuration so it can be accessed in a type-safe manner.
Additionally, also create an `InjectionToken` to access the configuration within the components and services of the application using the Angular DI.

```ts app/environment.config.ts
import { InjectionToken } from '@angular/core';

export type EnvironmentConfiguration = {
	apiUrl: string;
};
export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfiguration>(
	'Environment_Configuration',
);
```

Next, the `EnvironmentConfiguration` is used to create the [`ApplicationConfig`](https://angular.dev/api/platform-browser/ApplicationConfig).

The `appConfig` isn't defined inline anymore, instead, a factory function is used to create the config. The factory function `createAppConfig` receives the environment configuration as an argument (how we get access to the config is discussed later).

Based on the passed configuration, the `ApplicationConfig` is created.
The example below simply makes use of the config object to provide it as the injection token. You can also grab specific properties of the config to create more dependencies.

```ts app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { ENVIRONMENT_CONFIG, EnvironmentConfiguration } from './environment.config';

export const createAppConfig = (config: EnvironmentConfiguration): ApplicationConfig => {
	return {
		providers: [{ provide: ENVIRONMENT_CONFIG, useValue: config }],
	};
};
```

Finally, retrieve the environment configuration using the [`fetch` function](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
This needs to be done before bootstrapping the application, so the config can be passed to `createAppConfig`.

```ts main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { createAppConfig } from './app/app.config';

// 👇 this can also be an endpoint
// (just make sure that the endpoint is publically available, also for anonymous users)
fetch('./assets/environment-config.json')
	.then((resp) => resp.json())
	.then((config) => {
		bootstrapApplication(AppComponent, createAppConfig(config));
	});
```

The `environment-config.json` file is just a simple JSON file containing the environment variables, in this case solely the `apiUrl`.

```json assets/environment-config.json
{
	"apiUrl": "https://localhost:3000/api"
}
```

:::tip
Use Zod to [verify if the JSON adheres to the expected structure](../../bits/use-zod-to-parse-unknown-data/index.md).
:::

### JavaScript Configuration

An alternate solution relies on a JavaScript configuration instead of a JSON configuration file.
This configuration can be inlined within the `index.html` file, or it can be included using a JavaScript file as an asset.

The important part is that the config is loaded before the application loads.
To use the config within Angular it needs to be shared/available, e.g. it can be assigned to a property on the `window` object.

```html index.html {9-15, 17-18}
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Environment Configuration Sample</title>
		<base href="/" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link rel="icon" type="image/x-icon" href="favicon.ico" />

		<!-- option 1: inline -->
		<script>
			window.environmentConfiguration = {
				apiUrl: 'https://localhost:3000/api',
			};
		</script>

		<!-- option 2: load via config file -->
		<script src="assets/environment-config.js"></script>
	</head>
	<body>
		<app-root></app-root>
	</body>
</html>
```

During the release, the `index.html` or `environment-config.js` file can safely be replaced with the desired version as these files are just copied into the dist folder.

The `environmentConfiguration` property of the window instance can be accessed while bootstrapping the Angular application.

Because the configuration is already available, we don't need to await the retrieval of this config file anymore. Instead, we can simply access the `window.environmentConfiguration` to pass it to the `createAppConfig` function, which remains the same as within the previous implementation using the JSON file.

```ts main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { createAppConfig } from './app/app.config';

bootstrapApplication(AppComponent, createAppConfig(window.environmentConfiguration)).then(() => {
	// clean up
	delete window.environmentConfiguration;
});
```

Because the creation is now a synchronous step, this can be refactored further by leveraging the [`factory` method](https://angular.dev/api/core/InjectionToken?tab=description) of the `InjectionToken`.

```ts app/environment.config.ts
import { InjectionToken } from '@angular/core';

export type EnvironmentConfiguration = {
	apiUrl: string;
};

export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfiguration>(
	'Environment_Configuration',
	{
		factory: () => {
			if (!('environmentConfiguration' in window)) {
				throw new Error('No environment config found!');
			}
			const environmentConfiguration = window.environmentConfiguration;
			delete window.environmentConfiguration;
			return environmentConfiguration as EnvironmentConfiguration;
		},
	},
);
```

The `ENVIRONMENT_CONFIG` token behaves identically as it would be as it was explicitly defined in the application's root injector (and is thus also a singleton).

The changes to the `main.ts` file can now be reverted to the original implementation.
Instead of the `createAppConfig` factory method, the static `appConfig` variable can be reused as well.

```ts main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig);
```

In both implementations, you can notice that the `environmentConfiguration` is removed from the `window` instance.
This results that the config cannot be so easily accessed anymore from the `window` (by a developer or a visitor), this forces a developer to access the environment variables via the token.

### Usage

The discussed solutions all end up with the `ENVIRONMENT_CONFIG` token that stores the environment variables of the application.
To access the variables within the application, inject the token within your components or services.

```ts app/customers.service.ts {8, 12}
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT_CONFIG } from './environment.config';

@Injectable({ providedIn: 'root' })
export class CustomersService {
	private environmentConfig = inject(ENVIRONMENT_CONFIG);
	private http = inject(HttpClient);

	getCustomers(): Observable<Customer[]> {
		return this.http.get<Customer[]>(`${this.environmentConfig.apiUrl}/customers`);
	}
}
```

## Conclusion

An application usually relies on some kind of environment configuration in order to function properly.
Angular has the concept of environment files to manage environment-specific variables.
However, because the environment files are part of the source code, this makes it impossible to reuse a build so it can be released in different environments.

To be flexible, a better solution is to extract the configuration out of the source code.
In this blog post I've shown you two possible solutions:

- one creates a JSON file that contains the configuration, this file needs to be fetched to access the configuration;
- the second solution is to define the configuration with JavaScript, which is set to the `window` object before it can be accessed in the Angular context;

Personally, I prefer to use the JSON file because in my experience it's easier to edit/replace during a release.

:::warning
As a reminder, I want to emphasize that all configuration variables (either via environment files, JSON files, a public endpoint, via JavaScript) are publicly available to someone visiting your application/website.
**These environment variables should not contain sensitive data, as it can be abused by attackers.**
:::
