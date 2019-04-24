---
title: 'Angular: Build once deploy to multiple environments 🚀'
slug: angular-build-once-deploy-to-multiple-environments
description: In our quest to build a twelve-factor app where we build once and deploy to multiple environment we encountered some problems, but we managed to solve them. Read here how we did it.
author: Tim Deschryver
date: '2019-04-24T08:00:00.000Z'
tags:
  - Angular
  - DevOps
  - CI/CD
banner: './images/banner.jpg'
bannerCredit: 'Photo by [Chau Cédric](https://unsplash.com/@an_ku_sh) on [Unsplash](https://unsplash.com)'
published: false
publisher: Angular In Depth
publish_url: ''
---

### [The twelve-factor app](https://12factor.net/)

If we take a look at the description of such an app, it says:

In the modern era, software is commonly delivered as a service: called web apps, or software-as-a-service. The twelve-factor app is a methodology for building software-as-a-service apps that:

- Use declarative formats for setup automation, to minimize time and cost for new developers joining the project;
- Have a clean contract with the underlying operating system, offering maximum portability between execution environments;
- Are suitable for deployment on modern cloud platforms, obviating the need for servers and systems administration;
- Minimize divergence between development and production, enabling continuous deployment for maximum agility;
- And can scale up without significant changes to tooling, architecture, or development practices. The twelve-factor methodology can be applied to apps written in any programming language, and which use any combination of backing services (database, queue, memory cache, etc).

A twelve-factor app has 12 factors as the name implies, for this post we're scoping into the fifth topic [Build, release, run](https://12factor.net/build-release-run). If we take a look at the description of this stage, it says:

A codebase is transformed into a (non-development) deploy through three stages:

- The _build stage_ is a transform which converts a code repo into an executable bundle known as a build. Using a version of the code at a commit specified by the deployment process, the build stage fetches vendors dependencies and compiles binaries and assets.
- The _release stage_ takes the build produced by the build stage and combines it with the deploy’s current config. The resulting release contains both the build and the config and is ready for immediate execution in the execution environment.
- The _run stage_ (also known as “runtime”) runs the app in the execution environment, by launching some set of the app’s processes against a selected release. Code becomes a build, which is combined with config to create a release.

The twelve-factor app uses strict separation between the build, release, and run stages. For example, it is impossible to make changes to the code at runtime, since there is no way to propagate those changes back to the build stage.

### environment.ts

I believe this file is miss-used in most of the cases, maybe even the most miss-used file in an Angular application. In my opinion, Angular should be more explicit about the use of this file. Sadly, we weren't an exception and we didn't know it until some time ago. Our environment files had some config variables inside of them that varied between environments, e.g. the API endpoint or a token to use a 3rd party service. This caused us to create a separate `environment` file for each environment dev, test, staging, production1, and production2. By storing our config variables in the `environment` files it forced us to build the application for each environment when we needed to deploy a new version of our application. This was time-consuming and it was also error-prone. Short said, it is considered a bad practice.

As the start of our quest we extracted all of the environment specific variables into a config file, which is just a simple JSON file. This left us with 2 `environment` files to define if it's a production build or not. These will be familiar as these are also the default files provided by Angular.

```ts
// environment.ts
export const environment = {
  production: false,
}
```

```ts
// environment.prod.ts
export const environment = {
  production: true,
}
```

While we develop the application we're using the `environment.ts` file, when we create a build on our CI server we use the `environment.prod.ts` file. The Angular CLI picks up the correct file via the `angular.json` file.

### Deploying the application

Now how should we deploy to an environment with the correct config variables? To do this, we will have to override the config file during the deployment. Depending on the infrastructure and tools that you're using, you could either replace the config file with the correct one, or you could define the config variables during your deploy step and override each config variable with the set variable.

We now have one build and multiple deploys, but we still have to load in the config file in our application. This is the part where we struggled for a bit.

### Using the config file

We thought we weren't the first ones on this quest so we went online in order to solve our problem. All of the solutions we encountered were using the `APP_INITIALIZER` provider to postpone the bootstrap process of the Angular components until the config file was loaded.

```ts
export function initConfig(configService: AppConfigService) {
  return () => configService.init() // in this function the config file is being loaded
}

@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [AppConfigService],
      multi: true,
    },
  ],
})
export class AppModule {}
```

At first this seemed like a good solution and after implementing it, it did what it supposed to do and it worked. We were happy.

Until at a specific moment where we needed to have access to our config from outside components and services, we had other configuration objects depending on the config file at the start up. We needed to create a configuration object to load a module, an example is that we needed to load `ApplicationInsightsModule` at startup. We tried to chain multiple `APP_INITIALIZER` providers in the hope we didn't have to start over. Unfortunately, we discovered that the config wasn't loaded at the time when we needed it. We tried multiple ways to get around it without changing our solution with the `APP_INITIALIZER` provider, but without any success.

So we went back to the drawing board and asked for some help in the [AngularInDepth](https://twitter.com/AngularInDepth) group where [Joost Koehoorn](https://twitter.com/JoostK) and [Lars Gyrup Brink Nielsen](https://twitter.com/LayZeeDK) offered some great guidance. With some help we discovered that `platformBrowserDynamic` also accepts providers.

### platformBrowserDynamic

We needed to have the config variables loaded in before the application booted up, in order to do this we took the bootstrapping process a step further. We had to load the config file first, before everything else, before the application was loaded in. Angular boots up the application module inside the `main.ts` file. In order to solve our problem we had to postpone this process until we loaded our config variables. Because [`platformBrowserDynamic`](https://angular.io/api/platform-browser-dynamic) accepts providers, we saw an opportunity to define the config here.

The code below loads the config file via the [`fetch API`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). This is a Promise, so we can know for sure that the config file will be loaded before we bootstrap the application module. The self-declared `APP_CONFIG` token is used here to store the configuration variables.

```ts
fetch('/assets/config.json')
  .then((response) => response.json())
  .then((config) => {
    if (environment.production) {
      enableProdMode()
    }

    platformBrowserDynamic([{ provide: APP_CONFIG, useValue: config }])
      .bootstrapModule(AppModule)
      .catch((err) => console.error(err))
  })
```

### Using APP_CONFIG

Now we're a step further, we have loaded the config before we bootstrapped the application but we still have to make use of it. As the last hurdle in our quest, we had to create the `ApplicationInsightsModule`'s config. Because we know the config file is loaded when the `AppModule` gets loaded, we can now access the config file and provide the Application Insights config. It's also fine to re-use the `APP_CONFIG` config, but to make the config more scoped and maintainable for the modules, we're chopping up the large config into smaller chunks.

```ts
@NgModule({
  providers: [
    {
      provide: APP_INSIGHTS_CONFIG,
      useFactory: (config: AppConfig) => config.applicationInsights,
      deps: [APP_CONFIG],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Wrapping up

We now are fully compliant to the fifth factor of a twelve-factor app, being Build, release, run. This means we can now build our application one time and deploy it to every environment we have. During the deployment to an environment we have to deploy the correct version of the configuration file.

As bonus on having this kind of setup makes it very easy to create and use feature toggles.

TLDR:

- don't use the `environment.ts` file for environment specific config variables, create a custom configuration file (as JSON)
- most of the time using the `APP_INITIALIZER` approach will be a solution to this problem
- using the `platformBrowserDynamic` approach solves this problem in a different way (and is also easier to comprehend when you're not familiar with the bootstrap process?)
