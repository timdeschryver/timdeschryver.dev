---
title: I tried the Angular Standalone migration, and here is the result
slug: i-tried-the-angular-standalone-migration-and-here-is-the-result
description: Let's migrate an Angular application using @NgModules to the standalone API. For this task, we use the automatic schematic that's available in Angular v15.2.0-next.2. We also take a look at the manual steps that are required to fully migrate the application to use the new functional APIs.
date: 2023-02-06
tags: Angular
---

Last week [Minko Gechev](https://twitter.com/mgechev/) tweeted about an Angular schematic to automate the migration from `@NgModules` to the standalone API. Of course, I had to try out this migration myself.

https://twitter.com/mgechev/status/1621307204002512897

To test the migration I created a small Angular application, which I will use as a starting point for the migration.
While the application is small, it contains a little bit of everything, child components, eager and lazy loaded modules, a pipe, a directive, a couple of tests, and a service.

The schematic is available starting from Angular version 15.2.0-next.2.
To update to this version or a later version, run the following command:

```bash
npx ng update --next
npx ng update @angular/core --next
```

You can take a look at the [before](https://github.com/timdeschryver/ng-standalone-migration/tree/before) branch on GitHub if you're interested in the code from the example project.

To run the migration open a new CLI terminal at the root of the Angular project and run the `@angular/core:standalone` schematic:

```bash
npx ng generate @angular/core:standalone
```

This gives you three options:

1. [Convert all components, directives, and pipes to standalone](#1-convert-all-components-directives-and-pipes-to-standalone)
2. [Remove unnecessary NgModule classes](#2-remove-unnecessary-ngmodule-classes)
3. [Bootstrap the application using standalone APIs](#3-bootstrap-the-application-using-standalone-apis)

To complete the migration, you need to run all three options.
Instead of migrating your whole codebase at once, you can also run the schematic on specific directories.

The first time I ran the schematic I tried to keep the application running and the tests green.
For this, I had to manually update some parts of the code and tests (see the steps below).
But while running the next options, I noticed that the schematic was also fixing some of the issues I had to fix manually.
That's why I decided to run the schematic from the start again, but this time I ran the schematics after each other without updating the code and tests.
Looking back at it, I think the latter is the way to go, although it seems not to be recommended in the [Angular docs](https://github.com/angular/angular/blob/main/packages/core/schematics/ng-generate/standalone-migration/README.md).

The schematic only migrates the code from `NgModule`s to the new standalone API syntax.
But, lately Angular also added a bunch of new functional APIs.
For the completeness of this migration, I also manually migrated some features that are not covered by the schematic to their new equivalent functional API version.

5. [Migrate to provideRouter](#5-migrate-to-providerouter)
6. [Migrate to provideHttpClient](#6-migrate-to-providehttpclient)
7. [Migrate to functional router guards](#7-migrate-to-functional-router-guards)
8. [Update tests, only import standalone components](#8-update-tests-only-import-standalone-components)

If you're not interested in the details, you can take a look at the migrated version on the [main](https://github.com/timdeschryver/ng-standalone-migration) branch (with manual changes between migration steps) or on the [after](https://github.com/timdeschryver/ng-standalone-migration/tree/after) branch (all migrations at once, and manual changes afterward).

## Why you should migrate

I think you should migrate to the standalone components because it has a few benefits.

The foremost is that Angular has a smoother learning curve for new developers.
For new and experienced developers, a big advantage is a simplified codebase, which is easier to understand and maintain.

It also has a few performance benefits, e.g. you can lazy load a component because it defines its own dependencies explicitly.

Another benefit is that your tests require less setup code.
In most cases, you only need to import the component you want to test and mock the external dependencies e.g. an HTTP service.

And who knows, perhaps somewhere in the future that Angular can automagically import the dependencies for you, and is step this step just an intermediate step to make that possible. But for now, you need to do it manually.

From the docs [docs](https://angular.io/guide/standalone-components#getting-started-with-standalone-components):

> Standalone components provide a simplified way to build Angular applications. Standalone components, directives, and pipes aim to streamline the authoring experience by reducing the need for `NgModule`s. Existing applications can optionally and incrementally adopt the new standalone style without any breaking changes.

## 1. Convert all components, directives, and pipes to standalone

Commit: [d32df876bebc4f1824589bca14799cc27d6ff602](https://github.com/timdeschryver/ng-standalone-migration/commit/d32df876bebc4f1824589bca14799cc27d6ff602):

### Command

```bash
npx ng generate @angular/core:standalone
Convert all components, directives, and pipes to standalone
```

### Results

- Components, directives, and pipes are migrated to the standalone version
- Dependencies are added to the standalone versions
- `NgModule`s are updated, e.g. components are moved from the `declarations` to the `imports`

### Manual changes

- A child component referenced in a Route was not migrated. This was fixed in the next migration while running all schematics at once.
- Update TestBed: move standalone components/directives/pipes from `declarations` to `imports`
- Declarables are moved from the `declarations` to the `imports` of an `NgModule`

### Notes

- `AppComponent` is not migrated
- It also imports an internal `ɵInternalFormsSharedModule` module together with the `FormsModule` or `ReactiveFormsModule`

### Migration Examples

Components are migrated to standalone components:

- `standalone` is set to `true`
- dependencies are added to `imports`

```diff:lazy-child.component.ts
import { Component } from '@angular/core';
import { JsonPlaceholderService } from '../services/json-placeholder.service';
+ import { SensitivePipe } from '../../shared-module/pipes/sensitive.pipe';
+ import { AsyncPipe, JsonPipe } from '@angular/common';
+ import { ɵInternalFormsSharedModule, FormsModule } from '@angular/forms';
+ import { MatInputModule } from '@angular/material/input';
+ import { MatFormFieldModule } from '@angular/material/form-field';
+ import { HighlightDirective } from '../../highlight-directive/highlight.directive';

@Component({
    selector: 'app-lazy-child',
    template: `
    <div class="container">
      <p><span appHighlight>lazy-child</span> works!</p>
      <p>{{ 'eager-child works!' | sensitive }}</p>
      <mat-form-field>
        <mat-label>eager-child</mat-label>
        <input matInput type="text" name="name" [(ngModel)]="form.name" />
      </mat-form-field>
      <pre>{{ todos$ | async | json }}</pre>
    </div>
  `,
+  standalone: true,
+  imports: [HighlightDirective, MatFormFieldModule, MatInputModule, ɵInternalFormsSharedModule, FormsModule, AsyncPipe, JsonPipe, SensitivePipe]
})
export class LazyChildComponent {
  form = {
    name: '',
  };

  todos$ = this.placeholderService.getTodos();
  constructor(private placeholderService: JsonPlaceholderService) {}
}
```

`NgModule`s are updated by moving the `declarations` to the `imports`:

```diff:shared.module.ts
import { SensitivePipe } from './pipes/sensitive.pipe';

@NgModule({
-  declarations: [SensitivePipe],
   imports: [
     CommonModule,
     MatInputModule,
     MatFormFieldModule,
   ],
   imports: [
     CommonModule,
     MatInputModule,
     MatFormFieldModule,
+    SensitivePipe,
   ],
   exports: [MatInputModule, MatFormFieldModule, SensitivePipe]
})
export class SharedModule {}
```

## 2. Remove unnecessary NgModule classes

Commit: [c74471ae5b9627ab73ed0e163600834d4d51f85d](https://github.com/timdeschryver/ng-standalone-migration/commit/c74471ae5b9627ab73ed0e163600834d4d51f85d)

### Command

```bash
npx ng generate @angular/core:standalone
Remove unnecessary NgModule classes
```

### Results

- Files only containing an `NgModule` are deleted
- `NgModules`s that reference the removed `NgModule`s are updated

### Manual changes

- Update TestBed: remove deleted `NgModule`s
- Commented a child component in `AppComponent`. This was fixed in the next migration while running all schematics at once.

### Migration Examples

The file `shared.module.ts` is deleted because it only contained an `NgModule`, `SharedModule`:

`NgModules`s that reference the removed `NgModules` are updated.

```diff:lazy.module.ts
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LazyChildComponent } from './lazy-child/lazy-child.component';
- import { SharedModule } from '../shared-module/shared.module';

import { LazyRoutingModule } from './lazy-routing.module';
- import { HighlightModule } from '../highlight-directive/highlight.module';


@NgModule({
    imports: [
        CommonModule,
        LazyRoutingModule,
-       SharedModule,
        FormsModule,
-       HighlightModule,
        LazyChildComponent
    ]
})
export class LazyModule {}
```

## 3. Bootstrap the application using standalone APIs

Commit: [16c649d64130741ea75e4d35517ffd6b5b80cdc8](https://github.com/timdeschryver/ng-standalone-migration/commit/16c649d64130741ea75e4d35517ffd6b5b80cdc8)

### Command

```bash
npx ng generate @angular/core:standalone
Bootstrap the application using standalone APIs
```

### Result

- `main.ts` is updated from `platformBrowserDynamic().bootstrapModule(AppModule)` to `bootstrapApplication(AppComponent)`

### Manual changes

- Readded the child component that was removed in the previous step. This was not needed while running all the schematics at once.

### Notes

- `AppModule` still exists, but the content is commented out
- It seems like files are imported by using the `\\` separator instead of `/`

### Migration Examples

```diff:main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
+ import { importProvidersFrom } from '@angular/core';
+ import { AppComponent } from './app\\app.component';
+ import { provideAnimations } from '@angular/platform-browser/animations';
+ import { AuthConfigModule } from './app\\auth\\auth-config.module';
+ import { AppRoutingModule } from './app\\app-routing.module';
+ import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
+ import { AuthInterceptor } from 'angular-auth-oidc-client';
+ import { HTTP_INTERCEPTORS } from '@angular/common/http';


- platformBrowserDynamic().bootstrapModule(AppModule)
+ bootstrapApplication(AppComponent, {
+     providers: [
+         importProvidersFrom(BrowserModule, AppRoutingModule, AuthConfigModule),
+         { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
+         provideAnimations()
+     ]
+ })
  .catch(err => console.error(err));
```

## 4. Remove unnecessary NgModule classes (for AppModule)

Commit: [c05ca76aad7717e303037e33c269602627ab9720](https://github.com/timdeschryver/ng-standalone-migration/commit/c05ca76aad7717e303037e33c269602627ab9720)

### Command

```bash
npx ng generate @angular/core:standalone
Remove unnecessary NgModule classes
```

### Result

- Now that `AppModule` is not used anymore, it is deleted

## 5. Migrate to provideRouter

Commit: [528661c9cef1e9f3bf5cb83ff6571c96c4ae8164](https://github.com/timdeschryver/ng-standalone-migration/commit/528661c9cef1e9f3bf5cb83ff6571c96c4ae8164)

This is not an automatic migration.

### Result

We can use `provideRouter()` instead of `RouterModule.forRoot()` and `RouterModule.forChild()`.

For more info about `provideRouter` see [Angular Router Standalone APIs](https://angularexperts.ch/blog/angular-router-standalone-apis) by [Kevin Kreuzer](https://twitter.com/kreuzercode).

### Migration Examples

```ts{9-23}:app-routing.module.ts
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app\\app.component';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule),
    provideRouter([
      {
        path: 'child',
        // New: Lazy load a child component
        loadComponent: () =>
          import('./app/child/child.component').then((m) => m.ChildComponent),
        canActivate: [AutoLoginPartialRoutesGuard],
      },
      {
        path: 'lazy',
        canActivate: [AutoLoginPartialRoutesGuard],
        loadChildren: () =>
          import('./app/lazy/lazy.routes').then((m) => m.routes),
      },
    ]),
  ],
}).catch((err) => console.error(err));
```

## 6. Migrate to provideHttpClient

Commit: [655217f3f528fc7db83515cfce59275043dd6183](https://github.com/timdeschryver/ng-standalone-migration/commit/655217f3f528fc7db83515cfce59275043dd6183)

This is not an automatic migration.

### Result

Instead of importing `HttpClientModule` in `AppModule`, and registering interceptors as providers with `HTTP_INTERCEPTORS` we can now use `provideHttpClient()`.

For more info about `provideHttpClient` see [The Refurbished HttpClient in Angular 15 – Standalone APIs and Functional Interceptors](https://www.angulararchitects.io/aktuelles/the-refurbished-httpclient-in-angular-15-standalone-apis-and-functional-interceptors/) by [Manfred Steyer](https://twitter.com/ManfredSteyer).

### Migration Examples

```diff:main.ts
import { bootstrapApplication } from '@angular/platform-browser';
- import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
+ import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  AuthInterceptor,
  authInterceptor,
} from 'angular-auth-oidc-client';
import { AuthConfigModule } from './app\\auth\\auth-config.module';

bootstrapApplication(AppComponent, {
  providers: [
-   importProvidersFrom(AuthConfigModule, HttpClientModule),
-   { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
+   importProvidersFrom(AuthConfigModule),
+   provideHttpClient(withInterceptors([authInterceptor()])),
  ],
}).catch((err) => console.error(err));
```

## 7. Migrate to functional router guards

Commit: [6b1977d24e9770871f432b0eaa0e24efd94d41fe](https://github.com/timdeschryver/ng-standalone-migration/commit/6b1977d24e9770871f432b0eaa0e24efd94d41fe)

This is not an automatic migration.

### Result

A router guard that was implemented as a class can be refactored to a function.

For more info about functional router guards see [How To Use Functional Router Guards in Angular](https://dev.to/this-is-angular/how-to-use-functional-router-guards-in-angular-23kf/) by [Dany Paredes ](https://twitter.com/danywalls).
It's probably best to immediately migrate to the new `canMatch` guard, for more info see [Introducing the CanMatch Router Guard In Angular](https://netbasal.com/introducing-the-canmatch-router-guard-in-angular-84e398046c9a) by [Netanel Basal](https://twitter.com/NetanelBasal).

### Migration Examples

Before:

```ts:authorized.guard.ts
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthorizationGuard implements CanActivate {
  constructor(
    private oidcSecurityService: OidcSecurityService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.oidcSecurityService.isAuthenticated$.pipe(
      map(({ isAuthenticated }) => {
        // allow navigation if authenticated
        if (isAuthenticated) {
          return true;
        }

        // redirect if not authenticated
        return this.router.parseUrl('');
      })
    );
  }
}
```

After:

```ts:authorized.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { map } from 'rxjs';

export const authenticatedGuard = () => {
  const router = inject(Router);
  const securityService = inject(OidcSecurityService);
  return securityService.isAuthenticated$.pipe(
    map(({ isAuthenticated }) => {
      // allow navigation if authenticated
      if (isAuthenticated) {
        return true;
      }

      // redirect if not authenticated
      return router.parseUrl('');
    })
  );
};
```

## 8. Update tests, only import standalone components

Commit: [7e04027511b8ece03522bb3e52e87775e4f7dd8a](https://github.com/timdeschryver/ng-standalone-migration/commit/7e04027511b8ece03522bb3e52e87775e4f7dd8a)

This is not an automatic migration.

### Result

Because a component now contains all its dependencies, we can refactor the test cases.
The test becomes simpler because we are not required to import all the dependencies anymore.
Instead, we can import the component itself.

### Migration Examples

```diff:app.component.spec.ts
await TestBed.configureTestingModule({
    imports: [
-       MatFormFieldModule,
-       MatInputModule,
-       ReactiveFormsModule,
        EagerChildComponent,
-       SensitivePipe,
    ],
}).compileComponents();

const fixture = TestBed.createComponent(LazyChildComponent);
```
