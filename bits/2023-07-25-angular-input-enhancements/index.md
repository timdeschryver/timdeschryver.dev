---
title: Angular Input enhancements
slug: angular-input-enhancements
date: 2023-07-25
tags: angular
---

## Angular Input enhancements

The [Angular 16 release](https://blog.angular.io/angular-v16-is-here-4d7a28ec680d) adds useful enhancements to the `@Input` decorator.
We can make an input required, we can transform the input value, and we can bind inputs route data (parameters, query parameters, and the route data property).

We can transform the input value by providing a `transform` method, which is invoked with the input value.
Angular already provides the `numberAttribute` and `booleanAttribute` transform methods, but you can also implement your own.

```typescript:child.component.ts
import { Input, numberAttribute, booleanAttribute } from '@angular/core';

@Component()
export class ChildComponent {
	// Required when a parent component renders this component
	// <child-component [componentParam]="parameterValue" />
	// If the param is not provided, this turns into the following compile error
	// Required input 'param' from component ChildComponent must be specified.
	@Input({ required: true })
	componentParam = '';

	// Parameter based on the :paramKey route parameter
	// /child-route/abc
	@Input()
	paramKey = '';

	// Parameter based on the :paramKey query parameter ?queryId
	// /child-route/abc?queryId=123
	// When the query parameter is not provided, or is not a number
	// then the fallback value (3) is assigned to the property
	@Input({
		transform: (value: unknown) => numberAttribute(value, 3),
	})
	queryId = 0;

	// Parameter based on the data `dataParam` property of the route
	// data: { dataParam: { layout: 'medium' } }
	@Input()
	dataParam?: { layout: string };
}
```

To be able to bind the route data to component inputs, you need to configure the Angular router by including the new `withComponentInputBinding()`.

```typescript{17-18}:app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(
			[
					{
						path: 'child-route/:paramKey',
						loadComponent: () =>
							import('./child/child.component').then((mod) => mod.ChildComponent),
						data: {
							dataParam: { layout: 'medium' },
						},
					}
			],
			// 👇 Add this line to enable component input binding
			withComponentInputBinding(),
		),
	],
};
```
