## Registering Application Insights

Create a wrapper around the Application Insights SDK.
Configure the service with your instrumentation key, and bind the Angular router to the `ApplicationInsights`.

```ts:insights.service.ts
import { Injectable, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';
import { AngularPlugin } from '@microsoft/applicationinsights-angularplugin-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

@Injectable({ providedIn: 'root' })
export class Insights {
    private angularPlugin = new AngularPlugin();
    private appInsights = new ApplicationInsights({
        config: {
            instrumentationKey: this.appConfig.insights.instrumentationKey,
            extensions: [this.angularPlugin],
            extensionConfig: {
                [this.angularPlugin.identifier]: {
                    router: this.router,
                    errorServices: [new ErrorHandler()],
                },
            },
        },
    });

    // expose methods that can be used in components and services
    trackEvent = this.appInsights.trackEvent;
    trackTrace = this.appInsights.trackTrace;

    constructor(private router: Router, private appConfig: AppConfig) {
        this.appInsights.loadAppInsights();
    }
}
```

## Logging exceptions

Import the service into your module, and while doing so, set the `ApplicationinsightsAngularpluginErrorService` as the default Angular error handler.

```ts{6-12}:insights.module.ts
import { ErrorHandler, NgModule } from '@angular/core';
import { ApplicationinsightsAngularpluginErrorService } from '@microsoft/applicationinsights-angularplugin-js';
import { Insights } from './insights.service';

@NgModule({
  providers: [
    Insights,
    {
      provide: ErrorHandler,
      useClass: ApplicationinsightsAngularpluginErrorService,
    },
  ],
})
export class InsightsModule {}
```

## Import the Insights Module

Import the insights module into your `AppModule`.

```ts{15}:app.module.ts
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { InsightsModule } from './insights';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        InsightsModule
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
```

## Upload source maps to Azure

To view useful source maps in Application Insights, upload the source maps of the application to Azure.
