---
title: Multiple service calls from an Effect
date: 2019-12-18
tags: ngrx, effects, angular
---

## Multiple service calls from an Effect

### Use case

An action to fetch multiple entities at once, but the service has only an endpoint to fetch one entity at a time.

### Solution

Use the RxJS [merge](https://rxjs-dev.firebaseapp.com/api/index/function/merge) operator to flatten all request streams and concurrently emit all values to a single output stream.

```ts
refresh$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CustomerActions.refresh),
    exhaustMap(({ customerIds }) =>
      merge(
        ...ids.map(id =>
          this.customersService.getCustomer(id).pipe(
            map(CustomerActions.getCustomerSuccess),
            catchError(err =>
              of(CustomerActions.getCustomerFailed(id, err.message)),
            ),
          ),
        ),
      ),
    ),
  ),
)
```
