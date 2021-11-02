---
title: Start using ngrx/effects for this
slug: start-using-ngrx-effects-for-this
description: You're probably only using ngrx/effects to handle the communication to an external source by triggering an effect with a NgRx action. But you can do more.
author: Tim Deschryver
date: 2018-07-09T13:09:18.090Z
tags: Angular, NgRx, Redux, Effects
banner: ./images/banner.jpg
bannerCredit: Photo by [Clément Gerbaud](https://unsplash.com/@clement_gerbaud) on [Unsplash](https://unsplash.com)
published: true
---

You’re probably only using [`@ngrx/effects`](https://ngrx.io/guide/effects) to handle the communication to an external source by triggering an Effect with an NgRx action. But did you know that Effects can be used for more than this?

## Effects Basic

The [`@ngrx/effects`](https://ngrx.io/guide/effects) package provides a way to isolate side effects into its model, outside the NgRx store and the Angular components.

It has an Observable `Actions`, which is a stream of all the dispatched actions to the NgRx Global Store. For every dispatched action, the `Actions` Observable emits a new value (after all of the reducers are invoked).

Because we don't want to trigger all the registered Effects when an action is dispatched, we can use the [`ofType` operator](https://ngrx.io/api/effects/ofType). This acts as a filter, and will only invoke the Effect when it receives the configured action(s).

A typical Effect uses the `Actions` Observable as its source and uses the `ofType` operator to only perform its side effect when the corresponding action is dispatched. For example, if we want to retrieve customers from a web service, we need to create an Effect.

The Effect listens to every action that gets dispatched and when it retrieves an action with the action type `[Customers Page] Loaded` (`CustomerPageActions.opened`), it will fetch the data over HTTP. Depending on the HTTP response, the Effect either dispatches a `[Customers Api] Load Success` action (`CustomerApiActions.loadCustomersSuccess`) if the request was successful or a `[Customers Api] Load Failed` action (`CustomerApiActions.loadCustomersFailed`) if the request has failed.

To retrieve the customers within the application, we have to dispatch the `[Customers Page] Get` action (`CustomerPageActions.opened`). Inside the component where we want to show a list of all the customers, we have to use a selector to select all the customers from the Global Store state.

```ts
import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { CustomersService } from '../services/customers.service';

@Injectable()
export class CustomersEffects {
	// to define an Effect, use the `createEffect` method
	loadCustomers = createEffect(() => {
		this.actions.pipe(
			// filter out the actions, except for `[Customers Page] Opened`
			ofType(CustomerPageActions.opened),
			exhaustMap(() =>
				// call the service
				this.customersService.getCustomers().pipe(
					// return a Success action when the HTTP request was successfull (`[Customers Api] Load Sucess`)
					map((customers) => CustomerApiActions.loadCustomersSuccess(customers)),
					// return a Failed action when something went wrong during the HTTP request (`[Customers Api] Load Failed`)
					catchError((error) => of(CustomerApiActions.loadCustomersFailed(error))),
				),
			),
		);
	});

	constructor(
		// inject Actions from @ngrx/effects
		private actions: Actions,
		private customersService: CustomersService,
	) {}
}
```

## External sources

Effects are not limited to be triggered by the `Actions` Observable.
While the `Actions` Observable is the most known and the most used source for an Effect, we can **use everything that is an Observables as the source**.
When that source emits a new value, the Effect is triggered.

### Using RxJS Observables

For example, with the [`interval` function](https://rxjs.dev/api/index/function/interval) we can dispatch an action every x milliseconds.

```ts
ping = createEffect(() => {
  return interval(1000)_._pipe(mapTo(PingActions.ping()))
});
```

### Using a selector

Every time when the selector emits a new value, the Effect is invoked.
Then you're using this, be careful that the Effect doesn't result in a state change because you might end up in a loop.

```ts
selectedIdChanged = createEffect(() => {
  return this.store.select(selectedId)
    switchMap(() => {
      ...
    })
})
```

### Using the JavaScript API with RxJS

We can use RxJS to create a reactive JavaScript API that dispatches actions to the NgRx Global Store, and the application.

> Bonus tip, [Jan-Niklas Wortmann](https://twitter.com/niklas_wortmann) created [rxjs-web](https://github.com/niklas-wortmann/rxjs-web) that wraps the web API with Observables.

```ts
online = createEffect(() => {
	return merge(
		of(navigator.onLine),
		fromEvent(window, 'online').pipe(mapTo(true)),
		fromEvent(window, 'offline').pipe(mapTo(false)),
	).pipe(map((online) => (online ? DeviceActions.online() : DeviceActions.offline())));
});
```

## Reusing Effects

An Effect can listen to multiple actions.
This makes it easy to reuse the logic of an Effect for different actions that have the same behavior.

To listen to more than one action, simply add more actions to the `ofType` operator.

```ts{3-6}
loadCustomers = createEffect(() => {
  return this.actions.pipe(
    ofType(
      CustomersPageActions.loaded,
      CustomersPageActions.refreshClicked,
    ),
    switchMap((_) => {
      ...
    }),
  )
})
```

## Handling the flow of a ([Angular Material](https://material.angular.io/components/dialog/overview)) dialog

Instead of handling a dialog inside a component, I find it easier to write the flow of the dialog as an Effect.
The Effect opens the dialog, and when the dialog closes it returns a corresponding action back to the Global Store.

```ts
openDialog = createEffect(() => {
	return this.actions.pipe(
		ofType(WelcomePageActions.loginClicked),
		exhaustMap((_) => {
			let dialogRef = this.dialog.open(LoginDialog);
			return dialogRef.afterClosed();
		}),
		map((result: any) => {
			if (result === undefined) {
				return LoginDialogActions.closed();
			}
			return LoginDialogActions.loggedIn(result);
		}),
	);
});
```

## Showing notifications

Just like the dialog example, I like to handle my notifications within an Effect. Doing this keeps the rest of the application pure and more understandable in my opinion. In the example below, we use the [Angular Material Snackbar](https://material.angular.io/components/snack-bar/overview) but the same can be applied to any other notification system.

For Effects that don't result in another action (like this one), it's important to set the `dispatch` option to `false`, otherwise, the incoming action will be re-dispatched resulting in an infinite loop (and in this case a lot of notifications). For more info about non-dispatching Effects, see the [docs](https://ngrx.io/guide/effects/lifecycle#non-dispatching-effects).

```ts
reminder = createEffect(
	() => {
		return this.actions.pipe(
			ofType(ReminderActions.reminder),
			map(({ payload }) => {
				this.snackBar.openFromComponent(ReminderComponent, {
					data: payload,
				});
			}),
		);
	},
	{ dispatch: false },
);
```

## Enhance your action with Global Store state

This is useful for when you want to enhance an action with data from within the store state.
This isn't a silver bullet, it's probably easier (to write/test/read) to add the data to the action when it's dispatched.
But when that data isn't available when the action is dispatched, use the [NgRx `concatLatestFrom` operator](https://ngrx.io/api/effects/concatLatestFrom) to retrieve the data with a selector. It's similar to RxJS's `withLatestFrom` operator with the exception that `concatLatestFrom` is lazy, meaning that it will only invoke the selector when the effect receives a filtered action.

```ts
checkout = createEffect(() => {
  return this.actions.pipe(
    ofType(CheckoutPageActions.submitted),
    concatLatestFrom(() => this.store.select(selectUserInfo)),
    map([action, user] => {
      ...
    })
  )
})
```

To take it a step further, the data retrieved by the selector can be used to check if an entity already exists in the store. Depending on the outcome we can abort the Effect early. This gives us the power to block unnecessary GET requests if the entity is already persisted in the store, if not we can fetch the entity.

```ts
detail = createEffect(() => {
  return this.actions.pipe(
    ofType(ProductDetailPage.loaded),
    concatLatestFrom(() => this.store.select(selectProducts)),
    filter(([{ payload }, products]) => !!products[payload.sku]),
    mergeMap(([{payload}]) => {
      ...
    })
  )
})
```

## Prefetch data

In [Making your application feel faster by prefetching data with NgRx](/blog/making-your-application-feel-faster-by-prefetching-data-with-ngrx) we saw how we can prefetch the details of entities with NgRx when an entity is visible or when the user hovers over a link.

With Effects, it's easier to achieve the same result but both serve a different purpose.

By using an Effect, we don't need a user interaction to prefetch the data. Instead, we chain multiple Effects together by using the result of another Effect.

I've used this approach in a calendar to fetch the data for the next week. This makes moving between weeks smoother and ensures that the initial load is fast.

To implement this behavior we need two Effects. The first Effect loads the initial set of data (the current week) when the page is loaded. The second Effect loads a different set of data (the next week) when the initial set is loaded. The second Effect does this by listening to the successful action of the first Effect.

```ts{6,15}
initialLoad = createEffect(() => {
  return this.actions.pipe(
    ofType(CalendarActions.calendarLoaded),
    mergeMap((action) => {
      return this.calendarService.load(action.date).pipe(
        map((resp) => CalendarApiActions.calendarDataLoaded(resp)),
        catchError(() => of(CalendarApiActions.calendarDataLoadFailed())),
      )
    }),
  )
})

prefetchLoad = createEffect(() => {
  return this.actions.pipe(
    ofType(CalendarApiActions.calendarDataLoaded),
    mergeMap((action) => {
      return this.calendarService.load(addWeek(action.date)).pipe(
        map((resp) => CalendarApiActions.calendarDataPrefetched(resp)),
        catchError(() => of(CalendarApiActions.calendarDataPrefetchFailed())),
      )
    }),
  )
})
```

## Analytics/monitoring

Because every dispatched action emits a new value to the `actions` source, we can use this source to gain statistics of the application. For instance, we could log every dispatched action or only log the actions important. You can filter out actions by using the `ofType` operator, or another filtering operator, for example, [the RxJS `filter` operator](https://rxjs.dev/api/operators/filter).

```ts
trackEvents = createEffect(
	() => {
		return this.actions.pipe(
			tap(({ type, payload }) => {
				appInsights.trackEvent(type, payload);
			}),
		);
	},
	{ dispatch: false },
);
```

## Listen to router

Listen to router changes with the `@ngrx/router-store` selectors and dispatch an action with the new route data.
An alternative would be to injected the `ActivatedRouterData` into the component and to dispatch an action on init. But this leaves us with duplicated logic to parse the route data.

```ts:calendar.effects.ts
@Injectable()
export class CalendarEffects {
	navigate$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(calendarActions.enter),
			concatMap(() => {
				return combineLatest([
					this.store.select(selectRouteCustomerIds),
					this.store.select(selectRoutedDate),
				]).pipe(
					filter(([customerIds, date]) => customerIds?.length > 0 && Boolean(date)),
					map(([customerIds, date]) => calendarEffectsActions.navigated({ customerIds, date })),
					takeUntil(this.actions$.pipe(ofType(calendarActions.leave))),
				);
			}),
		);
	});
}
```

```ts:routing.selectors.ts
import { getSelectors } from '@ngrx/router-store'

const routerSelectors = getSelectors()

export const selectRoutedCustomerIds = createSelector(
	routerSelectors.selectQueryParam('customerId'),
	(customerId) => {
		if (Array.isArray(customerId)) {
			return customerId.map((id) => parseInt(id, 10));
		}

		if (typeof customerId === 'string') {
			return [parseInt(customerId, 10)];
		}

		return [];
	},
);

export const selectRoutedDate = routerSelectors.selectQueryParam('date');
```

## Change the windows title

Add data to the route data and update the window title after navigation.

```ts:routing.effects.ts
@Injectable()
export class RoutingEffects {
	title$ = createEffect(
		() => {
			return this.router.events.pipe(
				filter((evt) => evt instanceof NavigationEnd),
				tap(() => {
					let route = this.route;
					let title = route.snapshot.data.title;

					while (route.firstChild) {
						route = route.firstChild;
						if ('title' in route.snapshot.data) {
							title = route.snapshot.data.title;
						}
					}

					if (title) {
						this.titleService.setTitle(route.snapshot.data.title);
					}
				}),
			);
		},
		{ dispatch: false },
	);

	constructor(private router: Router, private route: ActivatedRoute, private titleService: Title) {}
}
```

```ts:route-data.ts
export const routes: Routes = [
  {
    path: 'about',
    component: AboutComponent,
    data: { title: 'About' },
  },
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Home' },
  },
]

```

## Navigate based on actions

By injecting the Angular router into the Effects class it’s possible to redirect the user based on certain actions. In the example below, we redirect the user to the homepage when the user logs out.

Notice that in this example, we're also using a [non-dispatching Effect](https://ngrx.io/guide/effects/lifecycle#non-dispatching-effects).

```ts{10}
logOut = createEffect(
  () => {
    return this.actions.pipe(
      ofType(AuthenticationActions.logOutClicked),
      tap([payload, username] => {
        this.router.navigate(['/']);
      })
    )
  },
  { dispatch: false },
)
```

## Conclusion

Knowing this, we can refactor some code that now lives inside our components or inside our NgRx store, into the `ngrx/effects` model. By doing this, it makes our components more pure and it keeps the side effects of our application separated resulting in code that is easier to reason about and also easier to test.

Now that you know for which cases you could use effects, you should also check out when to [not to use effects](https://medium.com/@m3po22/stop-using-ngrx-effects-for-that-a6ccfe186399).

> Not found what you were looking for? Try a similar post, [Angular.Schule → 5 useful NgRx effects that don't rely on actions](https://angular.schule/blog/2018-06-5-useful-effects-without-actions), written by [Ferdinand Malcher](https://twitter.com/fmalcher01)
