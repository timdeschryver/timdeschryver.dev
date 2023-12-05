---
title: 👋 Hello @ngrx/signals
slug: hello-ngrx-signals
date: 2023-12-05
tags: Angular, NgRx
---

# 👋 Hello @ngrx/signals

Exciting news for Angular developers!

With the release of [Angular Signals](https://angular.io/guide/signals), the NgRx team - especially [Marko Stanimirović](https://twitter.com/MarkoStDev) who came up with the idea and did the heavy lifting - built a new state management solution that provides a reactive state management solution and a set of utilities for Angular Signals.

[@ngrx/signals](https://ngrx.io/guide/signals) consists of two big blocks and includes multiple smaller convenient Lego blocks to make working with state simple and intuitive.

- The `signalState` utility method provides a lightweight solution that manages state in a concise and minimalistic manner;
- While `signalStore`provides a full-blown state management solution (with optional plugins, e.g. Entity Management);

These tools provide an opinionated, but flexible, development experience to build your application.

Check out the [v17 blog post](https://dev.to/ngrx/announcing-ngrx-v17-introducing-ngrx-signals-operators-performance-improvements-workshops-and-more-55e4) for more info, or the in-depth blog posts from the [Angular Architects](https://www.angulararchitects.io/en/blog/?search=signal+store) team!

:::code-group

```ts counter.component.ts {4-28} [title=Signal State Example]
import { Component } from '@angular/core';
import { signalState, patchState } from '@ngrx/signals';

@Component({
	selector: 'app-counter',
	standalone: true,
	template: `
		Count: {{ state.count() }}

		<button (click)="increment()">Increment</button>
		<button (click)="decrement()">Decrement</button>
		<button (click)="reset()">Reset</button>
	`,
})
export class CounterComponent {
	state = signalState({ count: 0 });

	increment() {
		patchState(this.state, (state) => ({ count: state.count + 1 }));
	}

	decrement() {
		patchState(this.state, (state) => ({ count: state.count - 1 }));
	}

	reset() {
		patchState(this.state, { count: 0 });
	}
}
```

```ts counter.store.ts {13-36} [title=Component Store: Define Store]
import { computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import {
	signalStore,
	withState,
	patchState,
	withComputed,
	withHooks,
	withMethods,
} from '@ngrx/signals';

export const CounterStore = signalStore(
	withState({ count: 0 }),
	withComputed(({ count }) => ({
		doubleCount: computed(() => count() * 2),
	})),
	withMethods(({ count, ...store }) => ({
		increment() {
			patchState(store, { count: count() + 1 });
		},
		decrement() {
			patchState(store, { count: count() - 1 });
		},
	})),
	withHooks({
		onInit({ increment }) {
			interval(2_000)
				.pipe(takeUntilDestroyed())
				.subscribe(() => increment());
		},
		onDestroy({ count }) {
			console.log('count on destroy', count());
		},
	}),
);
```

```ts counter.component.ts {4-19} [title=Component Store: Usage]
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CounterStore } from './counter.store';

@Component({
	selector: 'app-counter',
	standalone: true,
	template: `
		<p>Count: {{ store.count() }}</p>
		<p>Double Count: {{ store.doubleCount() }}</p>

		<button (click)="store.increment()">Increment</button>
		<button (click)="store.decrement()">Decrement</button>
	`,
	providers: [CounterStore],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CounterComponent {
	readonly store = inject(CounterStore);
}
```

:::
