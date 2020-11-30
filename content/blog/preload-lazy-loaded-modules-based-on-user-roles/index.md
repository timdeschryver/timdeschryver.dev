---
title: Preload lazy-loaded modules based on user roles
slug: preload-lazy-loaded-modules-based-on-user-roles
description: Let's create a custom Angular preload strategy that loads all modules for the authenticated user
author: Tim Deschryver
date: 2020-11-30
tags: Angular, Performance
banner: ./images/banner.jpg
bannerCredit: Photo by [ramil dinapo](https://unsplash.com/@ramuzic) on [Unsplash](https://unsplash.com)
published: true
---

To improve the user's experience Angular provides the option to [lazy load modules](https://angular.io/guide/lazy-loading-ngmodules). In short, this means that several parts (features) of the application will only be loaded when the user navigates to a feature that is lazy loaded.

Lazy loading benefits users because the initial application will load faster (less to download), but it also comes with a small cost. Because the code isn't loaded, it must be downloaded when the user navigates to that feature, which might take a couple of milliseconds or even seconds depending on the size of the feature and the users' bandwidth.

Depending on the type of the application, this behavior is not desired.

When you know that most of the lazy-loaded modules will be loaded eventually and when the bandwidth isn't a problem, it might be better to load all of the modules. For example, for business applications that are used in offices.

We can change this default implementation by using a different [preloading strategy](https://angular.io/guide/lazy-loading-ngmodules#preloading).
Angular provides two built-in strategies:

- `NoPreloading`, the default strategy, which loads the feature when a module is loaded ([docs](https://angular.io/api/router/NoPreloading))
- `PreloadAllModules`, which loads all of the lazy-loaded modules after the initial load ([docs](https://angular.io/api/router/PreloadAllModules))

To use a different strategy, set the `preloadingStrategy` config option while importing the Angular router module.

```ts{7}:app-routing.module.ts
import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule } from '@angular/router'

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

The two strategies have their pros and cons, but they are the entire opposite of each other.
To offer the best experience, we must create a custom strategy.
A strategy that uses lazy loading, to only load specific modules.

On the application that I'm currently working on, we've written a strategy that only loads the modules that the user has access to.
You might think, at least we did, that using the `PreloadAllModules` strategy in combination with a [`canLoad` guard](https://angular.io/api/router/CanLoad) results in the same result. But it does not. When a route has a `canLoad` guard, Angular skips this route, and thus the module won't be loaded.

To write a custom preloader, you must create a class that implements the [`PreloadingStrategy` interface](https://angular.io/api/router/PreloadingStrategy).
The `PreloadingStrategy` interface has a `preload` method declaration that we must implement.
The `preload` method is invoked with the to-be loaded route and a factory method `load` that you must invoke to load the route.
When you don't invoke the `load` method, the lazy-loaded route won't load.

In the example below, we invoke a service to retrieve the users' roles.
Depending on the roles, we decide if the lazy-loaded route must be loaded or not.

```ts:role-based-preloading.ts
import { Injectable } from '@angular/core'
import { PreloadingStrategy, Route } from '@angular/router'
import { Observable, of } from 'rxjs'
import { concatMap } from 'rxjs/operators'
import { RolesService } from '../shared/auth/roles.service'

@Injectable({
  providedIn: 'root',
})
export class RoleBasedPreloader implements PreloadingStrategy {
  constructor(private roles: RolesService) {}

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const requiredRole = route.data && route.data['requiredRole']

    if (requiredRole) {
      // Note, while using NgRx this can be replaces with a selector
      return this.roles().pipe(
        concatMap((roles) => {
          if (roles.some((r) => r.name === requiredRole)) {
            // The user has the required role, load the module
            return load()
          }
          // The user doesn't have the required role, ignore the module
          return of(null)
        }),
      )
    }

    // The route doesn't have a required role, load the module
    return load()
  }
}
```

In the snippet above, we use the `requiredRole` from the route.
To assign a role to a route, we must do so while declaring the route.
To use the custom `RoleBasedPreloader` strategy, assign it to the `preloadingStrategy` config option.

```ts{11, 19, 33}:app-routing.module.ts
import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: 'feature-one',
    loadChildren: () =>
      import('../feature-one/feature-one.module').then(
        (m) => m.FeatureOneModule,
      ),
    data: { requiredRole: 'RoleOne' },
  },
  {
    path: 'feature-two',
    loadChildren: () =>
      import('../feature-two/feature-two.module').then(
        (m) => m.FeatureTwoModule,
      ),
    data: { requiredRole: 'RoleTwo' },
  },
  {
    path: 'feature-three',
    loadChildren: () =>
      import('../feature-three/feature-three.module').then(
        (m) => m.FeatureThreeModule,
      ),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: RoleBasedPreloader,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

Using this practice will make the application a tiny bit snappier.
For applications that use the NgRx global store, it also has the additional benefit that you can preload feature modules with their state. This can be useful for when you want to [share state between modules](/blog/sharing-data-between-modules-is-peanuts), without having to move the feature state to the root state.

Thanks to [Juri Strumpflohner](https://twitter.com/juristr)'s, [Angular Performance Series](https://juristr.com/blog/2019/08/ngperf-route-level-code-splitting/) I discovered this technique.
