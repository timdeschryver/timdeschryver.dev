## Installation

Install the required packages.

```bash
npm install @opentelemetry/sdk-trace-web @opentelemetry/instrumentation @opentelemetry/auto-instrumentations-web @opentelemetry/exporter-trace-otlp-http
```

## Setup

Setup and register the instrumentations, processor(s), and exporter(s).

```ts:instrument.ts
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import {
	WebTracerProvider,
	ConsoleSpanExporter,
	SimpleSpanProcessor,
	BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';

const provider = new WebTracerProvider();

// For demo purposes only, immediately log traces to the console
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

// Batch traces before sending them to HoneyComb
provider.addSpanProcessor(
	new BatchSpanProcessor(
		new OTLPTraceExporter({
			url: 'https://api.honeycomb.io/v1/traces',
			headers: {
				'x-honeycomb-team': 'YOUR_KEY_HERE',
			},
		}),
	),
);

provider.register({
  contextManager: new ZoneContextManager(),
});


registerInstrumentations({
	instrumentations: [
		getWebAutoInstrumentations({
			'@opentelemetry/instrumentation-document-load': {},
			'@opentelemetry/instrumentation-user-interaction': {},
			'@opentelemetry/instrumentation-fetch': {},
			'@opentelemetry/instrumentation-xml-http-request': {},
		}),
	],
});
```

## Import

Import the file to load the code.

```ts{6}:main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';

import './instrument';

bootstrapApplication(AppComponent, {
	providers: [provideHttpClient()],
});
```

## Resources

- ["Getting Started" documentation](https://opentelemetry.io/docs/instrumentation/js/getting-started/browser/)
- [`@opentelemetry/auto-instrumentations-web` package](https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-web)
