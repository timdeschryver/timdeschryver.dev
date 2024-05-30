---
title: Consuming .NET Feature Flags within an Angular Application
slug: consuming-net-feature-flags-within-an-angular-application
description: Learn how to consume feature flags from a .NET API (using Microsoft.FeatureManagement.AspNetCore) within an Angular application.
date: 2024-05-30
tags: Angular, .NET
---

In a previous post [Feature Flags in .NET, from simple to more advanced](../feature-flags-in-net-from-simple-to-more-advanced/), we discussed some ways to implement feature flags in a .NET Core application. To give the best user experience, these should be consumed by the front-end application as well to hide unreleased features. Within this post, I will show how to consume these feature flags within an Angular application.

The initial setup of feature flags is a one-time task, but once that's done they provide a lot of flexibility and control over features that are released to your users. Feature flags allow teams to decouple feature deployment from code deployment, and enable the possibility to enable a feature to a subset of users. From a DevOps perspective, they also ease the process of rolling out features incrementally without the need for feature branches that need to be synchronized.

## .NET API Endpoint

In order for a front-end application (Angular in our case) to consume the feature flags, the flags need to be exposed through an API endpoint.

The endpoint reads all the feature flags and iterates over them to verify which ones are enabled or disabled.
When a feature is enabled, it is added to a list of enabled features, which is returned to the client.

```cs
app.MapGet("features", async (IFeatureManager featureManager, CancellationToken token) =>
{
	// Retrieves all available features: ["FeatureA","FeatureB"]
	var featureNames = featureManager.GetFeatureNamesAsync();

	var enabledFeatures = new List<string>();
	await foreach (var featureName in featureNames.WithCancellation(token))
	{
		if (await featureManager.IsEnabledAsync(featureName))
		{
			enabledFeatures.Add(featureName);
		}
	}

	// Returns features that are enabled: ["FeatureA"]
	return TypedResults.Ok(enabledFeatures);
});
```

Next, the feature flags can be retrieved by the Angular application.

```ts:features.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class FeaturesService {
	private readonly http = inject(HttpClient);

	// Turn this into a typesafe string or something similar if needed
	// e.g. ('FeatureA' | 'FeatureB')[]
	public features(): Observable<string[]> {
		return this.http.get<string[]>('/api/features');
	}
}
```

:::note
The `FeaturesService` is just a very simple service that retrieves the feature flags from the API endpoint.
In a real-world application, you might want to turn this into a robust service with some helper methods, error handling, caching, or other features to this service (or NgRx Store).

Another implementation can just be an Injection Token wrapper around the features service.

```ts:features.config.ts
import { inject, InjectionToken, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FeaturesService } from './features.service';

export const FEATURE_FLAGS = new InjectionToken<Signal<string[]>>('feature-flags', {
	factory: () => {
		const featureService = inject(FeaturesService);
		return toSignal(featureService.features(), { initialValue: [] });
	},
});
```

:::

## Feature Flag Guard

To prevent users from accessing features that are disabled, we can create a guard that checks if the feature is enabled or not.
When the user tries to navigate to a route that requires a feature that isn't enabled, the guard cancels the navigation or redirects the user to a different route.

### `CanActivate` & `CanActivateChild`

The first option is to create a guard that adheres to the `CanActivateFn` type.
This guard can be used for entirely new features that are not yet released.

The implementation of the guard checks the state of a feature using the `data` property of the requested route (we'll see how this can be configured next).
Within the example below, the guard checks if the feature is enabled, if it is, the navigation is allowed, otherwise the user is redirected to the root route.

```ts:features.guard.ts
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { FeaturesService } from './features.service';

export const canActivateFeature: CanActivateFn = (
	next: ActivatedRouteSnapshot,
	state: RouterStateSnapshot,
) => {
	const featuresService = inject(FeaturesService);
	if (!next.data.hasOwnProperty('feature')) {
		return true;
	}
	const feature = next.data['feature'];
	return featuresService
		.features()
		.pipe(map((r) => (r.includes(feature) ? true : router.parseUrl('/'))));
};
```

The guard can be set while defining the routes.

```ts:routes.ts
const routes: Routes = [
	{
		path: 'feature-a',
		loadComponent: () => import('./feature-a.component').then((c) => c.FeatureAComponent),
		canActivate: [featureGuard],
		data: {
			feature: 'FeatureA',
		},
	},
];
```

To use the guard for multiple routes, you can also move the guard to the `canActivateChild` property of the parent route.
This way, the guard is applied to all child routes, which have the `data.feature` property set.

```ts:routes.ts
import { Routes } from '@angular/router';
import { canActivateFeature } from './canActivateFeature';

const routes: Routes = [
	{
		path: '',
		canActivateChild: [canActivateFeature],
		children: [
			{
				path: 'feature-a',
				loadComponent: () => import('./feature-a.component').then((c) => c.FeatureAComponent),
				data: {
					feature: 'FeatureA',
				},
			},
			{
				path: 'feature-b',
				loadComponent: () => import('./feature-b.component').then((c) => c.FeatureBComponent),
				data: {
					feature: 'FeatureB',
				},
			},
		],
	},
];
```

### `CanMatch`

The second option is to create a guard that adheres to the `CanMatchFn` type.
I find this useful when there's already an older implementation of the feature, and you want the new implementation behind the feature flag.

Instead of preventing the user from accessing a route, or redirecting the user to a different route when the feature condition is not met (guard returns `false`), the behavior of the guard skips the current navigation and continues to process the next route in the list.
If the condition is met (guard returns `true`), the navigation to the new page is allowed.

```ts
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { map } from 'rxjs';
import { inject } from '@angular/core';
import { FeaturesService } from './features.service';

export const canMatchFeature =
	(feature: string): CanMatchFn =>
	(route: Route, segments: UrlSegment[]) => {
		const featuresService = inject(FeaturesService);
		return featuresService.features().pipe(map((r) => r.includes(feature)));
	};
```

The power of using this guard lies in that it can be used for routes that share the same path, but have different components based on the feature flag.
In the example below, the `NewFeatureAComponent` will be loaded when the feature flag `FeatureA` is enabled, otherwise the `OldFeatureAComponent` is loaded.

```ts:features.guard.ts
import { Routes } from '@angular/router';
import { canMatchFeature } from './canMatchFeature';

const routes: Routes = [
	{
		path: 'feature-a',
		loadComponent: () => import('./new-feature-a.component').then((c) => c.NewFeatureAComponent),
		canMatch: [canMatchFeature('FeatureA')],
	},
	{
		path: 'feature-a',
		loadComponent: () => import('./old-feature-a.component').then((c) => c.OldFeatureAComponent),
	},
];
```

## Feature Flag Directive

I like to keep entire pages hidden based on a feature flag, but sometimes it's necessary to hide or show elements within a page.
To hide or show elements based on the feature flag, we can create a [Structural Ddirective](https://angular.dev/guide/directives/structural-directives) that checks if the feature is enabled or not.

```ts:features.directive.ts
import {
	Directive,
	inject,
	input,
	OnDestroy,
	OnInit,
	TemplateRef,
	ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FeaturesService } from './features.service';

@Directive({
	selector: '[feature]',
	standalone: true,
})
export class FeatureDirective implements OnInit, OnDestroy {
	private viewContainerRef = inject(ViewContainerRef);
	private templateRef = inject<TemplateRef<unknown>>(TemplateRef<unknown>);
	private featureService = inject(FeaturesService);
	private subscription?: Subscription;

	public feature = input.required<string>();

	public ngOnInit(): void {
		this.subscription = this.featureService
			.features()
			.subscribe((features) => this.updateView(features.includes(this.feature())));
	}

	public ngOnDestroy(): void {
		this.subscription?.unsubscribe();
	}

	private updateView(shouldCreate: boolean): void {
		if (shouldCreate) {
			this.viewContainerRef.createEmbeddedView(this.templateRef);
		} else {
			this.viewContainerRef.clear();
		}
	}
}
```

To use the `feature` directive, you can add it to an element in the template.

```html
<div>
	<div *feature="'FeatureA'">Feature A is enabled</div>
	<div *feature="'FeatureB'">Feature B is enabled</div>
</div>
```

## Conclusion

Feature flags are a powerful tool to control the release of features (progressively) to your users.
By exposing the feature flags through an API endpoint, the front-end application can consume these flags and hide or show features based on conditions, e.g. the user's permissions.

In this post, we've seen how to create a service to retrieve the feature flags, how to create a guard to prevent users from accessing pages that are disabled, and how to create a directive to hide or show elements based on the feature flag.
