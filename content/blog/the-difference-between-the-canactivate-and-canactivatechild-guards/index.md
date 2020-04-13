---
title: The difference between the canActivate and canActivateChild guards
slug: the-difference-between-the-canactivate-and-canactivatechild-guards
description: How do the canActivate and canActivateChild guards work in Angular and how to these guards compare?
author: Tim Deschryver
date: 2020-04-13
tags: Angular, Router
banner: ./images/banner.jpg
bannerCredit: Photo by [Franck V.](https://unsplash.com/@franckinjapan) on [Unsplash](https://unsplash.com)
published: true
---

## canActivate

> Interface that a class can implement to be a guard deciding if a route can be activated. If all guards return true, navigation will continue. If any guard returns false, navigation will be cancelled. If any guard returns a UrlTree, current navigation will be cancelled and a new navigation will be kicked off to the UrlTree returned from the guard.

The `canActivate` guard decides if route can be navigated to, which results in the creation of the route's component.

To implement the guard, create a new class and implement the [`CanActivate` interface](https://angular.io/api/router/CanActivate#canactivate-1).
The interface can return a boolean (as a boolean, a promise, or an Observable) or the guard can navigate to another route.
If it returns a truthy value, the component will be created, otherwise it will not and the navigation gets canceled.

```ts
@Injectable({
  providedIn: "root",
})
export class OnlyDigitsGuard implements CanActivate {
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ){
    return /^\d+$/.test(next.params.id);
  }
```

To guard a route, add the guard to the `canActivate` property while declaring the routes in the application.

```ts
const routes: Routes = [
  {
    path: 'parent',
    component: ParentComponent,
    canActivate: [OnlyDigitsGuard],
  },
]
```

## canActivateChild

> Interface that a class can implement to be a guard deciding if a child route can be activated. If all guards return true, navigation will continue. If any guard returns false, navigation will be cancelled. If any guard returns a UrlTree, current navigation will be cancelled and a new navigation will be kicked off to the UrlTree returned from the guard.

The `canActivateChild` guard, serves the same purpose as the `canActivate` guard and can prevent a route navigation.
The API to create the guard is the same, but for the `canActivateChild` guard you have to implement the [`CanActivateChild` interface](https://angular.io/api/router/CanActivateChild#canactivatechild-1).

```ts
@Injectable({
  providedIn: "root",
})
export class OnlyDigitsGuard implements CanActivateChild {
  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ){
    return /^\d+$/.test(next.params.id);
  }
```

To add the guard to the routes, use the `canActivateChild` property.
Doing this will guard all the children's routes.

```ts
const routes: Routes = [
  {
    path: "parent",
    component: ParentComponent,
    canActivateChild: [OnlyDigitsGuard],
    children: [...],
  },
];
```

## The differences

- `canActivate` will only execute when the parent component is not yet created. For example, if we navigate to the parent route it will be called, if we then navigate to a child route it will not. If we directly navigate to the child route, the `canActivate` guard will also be executed.
- `canActivateChild` will always be executed while navigating to/between child routes. For example, if we're at a child route `child/1` and we navigate to `child/2`, the guard will get executed. If we directly navigate to a child route, the guard will also get called. If we navigate to the parent route, the `canActivateChild` guard will not be fired.
- because `canActivate` is guarding the parent route, the child parameters (and data) are not available on the `ActivatedRouteSnapshot` of the `canActivate` guard. To be able to access the child parameters, we have to drill down the child components on the `RouterStateSnapshot`.

## Nice to knows

- because the parent component gets created first, the `canActivate` guard will always be called first.
- if we directly navigate to a child component and the child guard returns a falsy value then the parent component will also not be created, because the navigation is cancelled when one of the guards return a falsy value.
- when the `canActivate` guard returns a falsy value, then the `canActivateChild` guard will not be called.
- the `canActivateChild` guard can be rewritten as a `canActivate` guard on every child route.

## Example application

<iframe src="https://stackblitz.com/github/timdeschryver/router-guards?ctl=1&embed=1" title="router-guards"></iframe>
