## Goal

We want to configure our application with environment specific variables.
For example, the endpoint of a backend, or a feature toggle.

## 1. Define config

```ts:app.config.ts
export class AppConfig {
  serviceUrl: string
  someSecret: string
  toggle1: boolean
}

export let APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG')
```

## 2. Load and provide config before bootstrap

```ts:main.ts
import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { environment } from './environments/environment'
import { AppConfig, APP_CONFIG } from './app.config'
import { AppModule } from './app/app.module'

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

## 3. Inject and use the config

```ts:app.component.ts
import { Component, Inject } from '@angular/core';
import { APP_CONFIG } from '../main';

@Component({
  selector: 'app-root',
  template: `
    {{ config | json }}
  `,
})
export class AppComponent {
  constructor(@Inject(APP_CONFIG) public config: AppConfig) {}
}
```
