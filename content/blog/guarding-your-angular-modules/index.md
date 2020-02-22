---
title: Guarding your Angular modules 💂‍
slug: guarding-your-angular-modules
description: A lot of Angular modules need to be imported with a static forRoot() function, via this function it allows us to configure the module. But sometimes we make the mistake to use the forRoot function more than once throughout an application. We might not notice it when this happens but often it is the cause of unexpected behavior, which is sadly hard to debug. In this post, we'll look into a solution.
author: Tim Deschryver
date: 2019-09-16T12:00:00.000Z
tags: Angular, forRoot, NgModule, Module
banner: ./images/banner.jpg
bannerCredit: Photo by [Roméo A.](https://unsplash.com/@gronemo) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
---

A lot of Angular modules need to be imported with a static `forRoot()` function, via this function it allows us to configure the module.
An example, perhaps the most known, is the Angular Router Module that needs a collection of routes, another example is the NgRx Store that needs the root reducers of the application.
Internally, these modules will initialize the needed services and it will set up the orchestration between these services to be able to do its job.

But sometimes we make the mistake to use the `forRoot()` function more than once throughout an application. We might not notice it when this happens but often it is the cause of unexpected behavior, which is sadly hard to debug.

The reason why this is a problem is that these modules must be treated as [singletons](https://en.wikipedia.org/wiki/Singleton_pattern).
When a module is being lazy-loaded and is also using the `forRoot()` function, the lazy-loaded module will create a second instance of the module services. These instances are used in the context where they are created. A lazy-loaded module will use the instances it has created instead of using the root instances.

If we take the `forRoot()` function of the NgRx `StoreModule` as an example to set up the NgRx Store. It would mean that we end up with multiple store instances, all configured differently. If a feature module would dispatch an action it wouldn't reach the "real" root reducer, it will only reach the reducers configured by the lazy module. If the same action is dispatched from within the root module, it does reach the "real" root reducer.

A second problem is that when the same module is eagerly loaded multiple times when Angular is bootstrapping the application. Only one module will be registered and used, depending on how the modules are loaded. This could lead to a misconfigured module if you're not aware that this is happening.

Personally, I would waste a lot of time to be able to track and solve the problems caused by it and in this post, we'll look into a solution to prevent this.

> [Why is it bad if a shared module provides a service to a lazy-loaded module?](https://angular.io/guide/ngmodule-faq#q-why-bad)

## An example

For instance, imagine we have a `ThemeModule` to set a theme of an application.
The theme of the application can be set with `ThemeModule.forRoot(color)` and is configured at the start of the project.
Some time passes and our `ThemeModule` gets extracted to a library to make it reusable in multiple applications, our `ThemeModule` is such a great success that it's heavily used across multiple codebases. Suddenly it happens, in our application our theme color is magically changed when we import another module, we're now in one big color-fiesta, all because we didn't guard the `ThemeModule`.

So, how can we avoid this?
The answer to this question are root guards and in the next code snippets, we'll see how we can set them up.

## Show me the code

Let's implement the `ThemeModule` first, by adding a static `forRoot()` function to be able to set up the `ThemeModule`.

```ts
@NgModule()
export class ThemeModule {
  static forRoot(themeConfig: ThemeConfig): ModuleWithProviders<ThemeModule> {
    return {
      ngModule: ThemeModule,
      providers: [{ provide: Theme, useValue: themeConfig }],
    }
  }
}
```

The above snippet creates a `Theme` with the `themeConfig` parameter, the `Theme` looks as follows.

```ts
@Injectable()
export class Theme {
  constructor(config: ThemeConfig) {}
}
```

To use the `ThemeModule` we can use the `forRoot()` function in the `AppModule`.

```ts
@NgModule({
  imports: [ThemeModule.forRoot({ color: '#dd0031' })],
})
export class AppModule {}
```

Our `ThemeModule` is now ready to use but if it's imported for a second time, it's also creating a second instance of the theme.
This has the outcome that when the feature module is loaded, the module will use this theme instead of the root theme.

<iframe src="https://stackblitz.com/edit/angular-theme-guard-start?embed=1&file=src/app/theme.module.ts&hideExplorer=1" title="guard-start"></iframe>

## This can be prevented with 3 easy steps

### 1. Create an `InjectionToken`

```ts
export const THEME_ROOT_GUARD = new InjectionToken<void>(
  'Internal Theme ForRoot Guard',
)
```

First of all, we need to create an [`InjectionToken`](https://angular.io/api/core/InjectionToken) for our guard.

### 2. Provide the `ROOT_MODULE_GUARD` in the providers of the module

```ts
@NgModule()
export class ThemeModule {
  static forRoot(themeOptions): ModuleWithProviders<ThemeRootModule> {
    return {
      ngModule: ThemeRootModule,
      provides: [
        {
          provide: Theme,
          useFactory: createTheme,
          deps: [themeOptions],
        },
        {
          provide: THEME_ROOT_GUARD,
          useFactory: createThemeRootGuard,
          deps: [[Theme, new Optional(), new SkipSelf()]],
        },
      ],
    }
  }
}

export function createThemeRootGuard(theme) {
  if (theme) {
    throw new TypeError(
      `ThemeModule.forRoot() called twice. Feature modules should use ThemeModule.forFeature() instead.`,
    )
  }
  return 'guarded'
}
```

With the factory function `createThemeRootGuard` we provide a value for the `THEME_ROOT_GUARD` token.
This factory function expects a `theme` argument to check if the theme is already created, and if it's it will throw an error.
With `deps` we can provide the `Theme`, the first time the function is called the `Theme` isn't initialized yet so we use `Optional` to mark the parameter as optional otherwise the Dependency Injection container would throw an error because it isn't able to find a value for `Theme`.
To not instantiate the `Theme` we can use `SkipSelf`. If we wouldn't do this, we would directly end up with 2 instances of `Theme`.

More information on [`Optional`](https://angular.io/api/core/Optional) [`SkipSelf`](https://angular.io/api/core/SkipSelf) can be found on [angular.io](angular.io).

### 3. Inject the guard token in the module

```ts
@NgModule()
export class ThemeModule {
  constructor(
    @Optional()
    @Inject(THEME_ROOT_GUARD)
    guard: any,
  ) {}
}
```

We inject the `InjectionToken` in `ThemeModule` to create the `THEME_ROOT_GUARD` when the module is imported.
Every time a new instance of the `ThemeModule` is created, the `createThemeRootGuard` factory function will be called to create the `THEME_ROOT_GUARD`. The second time this occurs, the parameter `theme` will have a value and will thus result in an exception.

<iframe src="https://stackblitz.com/edit/angular-theme-guard?embed=1&file=src/app/theme.module.ts&hideExplorer=1" title="guard-end"></iframe>

By doing this we can guard the developers using the `ThemeModule` by not accidentally importing our module more than once via the `forRoot()` function.
We make it very clear we didn't expect this to happen, and we can save some time and frustrations for the developers using our module if our module is badly used.

## A second solution but different

There's a second solution to treat your module as a singleton which requires less setup but behaves a bit differently.
If we inject the `ThemeModule` in itself, we can simply check if the `ThemeModule` is already initialized.

```ts
@NgModule()
export class ThemeModule {
  constructor(@Optional() @SkipSelf() themeModule: ThemeModule) {
    if (themeModule) {
      throw new TypeError(`ThemeModule is imported twice.`)
    }
  }
}
```

> More information on this solution can be found in the [Angular docs](https://angular.io/guide/singleton-services#the-forroot-pattern)

<iframe src="https://stackblitz.com/edit/angular-theme-guard-end-2?embed=1&file=src/app/theme.module.ts&hideExplorer=1" title="guard-ctor"></iframe>

## The difference

A drawback to the second approach is that if we want to add the ability to load the `ThemeModule` for a second time with for example a `forChild` function this would throw the same error.

This happens because we have the guard in the constructor of the module. In comparison to the first solution where we have the guard inside the `createThemeRootGuard()` function which is only provided in the `forRoot()` function, meaning that it will only be checked if we import the module with `forRoot()`.

Depending on your use case you can choose the best solution to fit your needs.

For a real-world example, you can take a look at the implementation of the [Angular Router](https://github.com/angular/angular/blob/master/packages/router/src/router_module.ts).
