---
title: Polling with a NgRx Effect
slug: polling-with-a-ngrx-effect
description: A snippet on how to poll a service by using a NgRx Effect.
date: 2020-05-25
tags: ngrx, angular
---

## Polling with a NgRx Effect

### Use case

You want to periodically the refresh data in the NgRx Store.

### Solution

Create a NgRx Effect that retrieves the data via a service every x minutes, this can be done with the RxJS [timer](https://rxjs.dev/api/index/function/timer) operator.

```ts
refresh$ = createEffect(() => {
	// every 10 minutes
	return timer(0, 600000).pipe(
		switchMap(() =>
			this.customersService.get().pipe(
				map((data) => refreshSuccess(data)),
				catchError((response) => refreshFailed(response)),
			),
		),
	);
});
```
