---
title: Start using ngrx/effects for this
slug: start-using-ngrx-effects-for-this
description: You're probably only using ngrx/effects to handle the communication to an external source by triggering an effect with a NgRx action.
author: Tim Deschryver
date: 2018-07-09T13:09:18.090Z
tags: Angular, NgRx, Redux, Effects
banner: ./images/banner.jpg
bannerCredit: Photo by [Clément Gerbaud](https://unsplash.com/@clement_gerbaud) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
publish_url: https://blog.angularindepth.com/start-using-ngrx-effects-for-this-e0b2bd9da165
---

You’re probably only using ngrx/effects to handle the communication to an external source by triggering an effect with an NgRx action. But did you know ngrx/effects can be used for more than this?

### Effects

The [@ngrx/effects](https://github.com/ngrx/platform/tree/master/docs/effects) library provides a way to isolate side effects into its own model, outside the NgRx store and the Angular components. It provides us an Observable `actions` which is basically a stream of all the dispatched actions, for every dispatched action it emits a new value (after every reducer has been called). It also has a RxJS operator `ofType`, which is used to filter actions based on their action type.

A typical effect uses the `actions` Observable as its source and uses the `ofType` operator to only perform its side effect when the corresponding action is dispatched. For instance if we would want to retrieve customers from a web service, we would need to create a `getCustomers` effect. The effect listens to every action that gets dispatched and when it retrieves an action with the action type `[Customers Page] Get`, it will make an HTTP request. Depending on the response the effect will either dispatch a `GetCustomersSuccess` action, if the request was successful, or a `GetCustomersFailed` action, if the request was failed. In order to retrieve the customers within the application, we have to dispatch the `GetCustomers` action. Inside our component where we want to show a list of all the customers, we have to use a selector to select all the customers from the store state.

```ts
// to define an effect, we use the @Effect decorator
@Effect()
getCustomers = this.actions.pipe(
  // filter out the actions, except `[Customers Page] Get`
  ofType(CustomerActionTypes.Get),
  switchMap(() =>
    // call the service
    this.service.get().pipe(
      // return a Success action when everything went OK
      map(customers => new GetCustomersSuccess(customers)),
      // return a Failed action when something went wrong
      catchError(error => of(new `GetCustomersFailed`(error))),
    ),
  ),
);
```

### 1. External sources

While the `actions` Observable is the most known and the most used source for your effects, it is not the only one. In fact we can use every Observable as a source.

#### Using RxJS Observables

```ts
@Effect()
ping = interval(1000)_._pipe(mapTo(new Ping()));
```

#### Using the JavaScript API with RxJS

```ts
@Effect()
online = merge(
  of(navigator.onLine),
  fromEvent(window, 'online').pipe(mapTo(true)),
  fromEvent(window, 'offline').pipe(mapTo(false)),
).pipe(map(online => online ? new IsOnline() : new IsOffline()));
```

#### Using the Angular Material CDK

```ts
@Effect()
breakpoint = this.breakpointObserver
  .observe([Breakpoints.HandsetLandscape])
  .pipe(
    map(result => result.matches
      ? new ChangedToLandscape()
      : new ChangedToPortrait())
  );
```

### 2. Handling the flow of a ([Angular Material](https://material.angular.io/components/dialog/overview)) dialog

Instead of handling a dialog inside a component, it is possible to use an effect. The effect handles when to open and close the dialog and it dispatches an action with the dialog result.

```ts
@Effect()
openDialog = this.actions.pipe(
  ofType(LoginActionTypes.OpenLoginDialog),
  exhaustMap(_ => {
    let dialogRef = this.dialog.open(LoginDialog);
    return dialogRef.afterClosed();
  }),
  map((result: any) => {
    if (result === undefined) {
      return new CloseDialog();
    }
    return new LoginDialogSuccess(result);
  }),
);
```

### 3. Showing notifications

Just like the dialog example, I like to handle my notifications within an effect. Doing this keeps the rest of your application pure and more understandable in my opinion. In the example below we’ll be using the [Angular Material Snackbar](https://material.angular.io/components/snack-bar/overview) but the same can be applied to any other notification system.

```ts
@Effect({ dispatch: false })
reminder = this.actions.pipe(
  ofType<Reminder>(ActionTypes.Reminder),
  map(({ payload }) => {
    this.snackBar.openFromComponent(ReminderComponent, {
      data: payload,
    });
  })
)
```

Or if there is some kind of error:

```ts
@Effect({ dispatch: false })
error = this.actions.pipe(
 ofType<ServerError>(ActionTypes.ServerError),
 map(({ payload }) => {
   this.snackBar.open(payload.message, 'Close');
 })
)
```

### 4. Using a selector inside your effects

There are some times were you would need to access some store state inside your effect. For this, we can the use the RxJS `withLatestFrom` operator in combination with a selector to retrieve a slice of the store state.

```ts
@Effect()
shipOrder = this.actions.pipe(
  ofType<ShipOrder>(ActionTypes.ShipOrder),
  map(action => action.payload),
  concatMap(action =>
    of(action).pipe(
      withLatestFrom(store.pipe(select(getUserName)))
    )
  ),
  map([payload, username] => {
    ...
  })
)
```

To take it a step further, we can use the data retrieved by the selector in order to check if an entity already exists in the store. This gives us the power to block unnecessary GET requests if the entity already is stored in the store, if not we can fetch the entity.

```ts
@Effect()
getOrder = this.actions.pipe(
  ofType<GetOrder>(ActionTypes.GetOrder),
  withLatestFrom(action =>
    of(action).pipe(
      this.store.pipe(select(getOrders))
    )
  ),
  filter(([{payload}, orders]) => !!orders[payload.orderId])
  mergeMap([{payload}] => {
    ...
  })
)
```

### 5. Navigate based on actions

By injecting the Angular router into the effects it’s possible to redirect the user based on certain actions. In the example below we’re sending the user to the homepage when he or she logs out. Notice that we’re passing `dispatch: false` to the Effect decorator because we’re not dispatching any event. If we wouldn’t do this, we would be stuck in a infinite loop because the effect is dispatching the same action over and over again.

```ts
@Effect({ dispatch: false })
logOut = this.actions.pipe(
  ofType(ActionTypes.LogOut),
  tap([payload, username] => {
    this.router.navigate(['/']);
  })
)
```

### 6. Analytics/monitoring

Because every dispatched action emits a new value to the `actions` source, we can use this source in order to gain statistics of the application. For instance, we could log every dispatched action or only log the actions important to you by filtering the non-important actions with the `ofType` operator. In the example below we’re logging every action to [Application Insights](https://azure.microsoft.com/en-us/services/application-insights/).

```ts
@Effect({ dispatch: false })
trackEvents = this.actions.pipe(
  ofType(...),
  tap(({ type, payload }) => {
    appInsights.trackEvent(type, payload);
  })
)
```

### Conclusion

Knowing this, we can refactor some code that now lives inside our components or inside our NgRx store, into the ngrx/effects model. By doing this, it makes our components more pure and it keeps the side effects of our application separated. Resulting in code that is easier to reason about and also easier to test, in my opinion.

Now that you know for which cases you could use effects, you should also check out when to not to use effects.

[Stop using ngrx/effects for that](https://medium.com/@m3po22/stop-using-ngrx-effects-for-that-a6ccfe186399)

Not found what you were looking for? Try a similar post:

[Angular.Schule → 5 useful NgRx effects that don't rely on actions](https://angular.schule/blog/2018-06-5-useful-effects-without-actions)
