---
title: Angular standalone components and Angular Testing Library make component tests easier
slug: angular-standalone-components-and-angular-testing-library-make-component-tests-easier
description: Standalone components give you a better foundation to build on, as your Angular component becomes less affected by its internals. It doesn't matter if the component has its own template, or if it's using child components. This makes your test cases less brittle than before with Angular Modules. To interact with the component we're still using the Angular Testing Library because it provides useful utilities to interact and query the component.
date: 2023-02-27
tags: Angular Testing Library, Angular, Testing
---

Let's face it, testing an Angular component isn't always fun.
It's exciting to write a test for the original component, but refactoring the component can be time-consuming because it also means that you also need to spend time fixing your tests.
It doesn't exactly mean that you have to rewrite the actual test case, but most of the time you need to update the test setup.

For example, let's say that a component starts out as a single component.
You write one or more test cases for this, and everything is fine until you decide to split the component into multiple components.
You change your application code by adding new components to the Angular module, but then you also need to add the new components to the test setup.
It's the last step that is counter-intuitive, time-consuming, and can lead to frustrations.

In the past, we could use Single-Component Angular Modules (SCAMs) to [make testing components easier](../single-component-angular-modules-and-component-tests-go-hand-in-hand/index.md). But with [standalone components](https://angular.io/guide/standalone-components), we don't have to do this anymore. By directly importing dependencies within a component, the test setup improves exponentially with the number of dependencies, leading to a better developer experience.
Multi-line test setups can become a oneliner.

Standalone components make Angular components less affected by their internals, whether they have their own template or when they're using child components. This makes test cases less brittle than before with Angular modules. But what's even better? You can still use the Angular Testing Library to interact with your component. This library provides useful utilities to interact and query your component, making it even easier to test.

## Example

Let's take a look at an example.
We have a simple counter component `CounterComponent` that renders the current count and has increment and decrement buttons.

```ts:counter.component.ts
import {Component} from "@angular/core";

@Component({
    selector: 'app-counter',
    template: `
    <button (click)="increment()">Increment</button>
    <span>Count: {{count}}</span>
    <button (click)="decrement()">Decrement</button>
    `,
    standalone: true,
})
export class CounterComponent {
    count = 0;

    increment() {
        this.count++;
    }

    decrement() {
        this.count--;
    }
}
```

To verify that the component is behaving as expected we're using the Angular Testing Library to render the `CounterComponent` component, interacts with the two buttons, and check if the count is correct.

```ts:counter.component.spec.ts
import {render,screen} from "@testing-library/angular";
import userEvent from '@testing-library/user-event'
import {CounterComponent} from "./counter.component";

it('renders the current count on clicks', async () => {
    const user = userEvent.setup()
    await render(CounterComponent);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /increment/i}));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /decrement/i}));
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
});
```

So far there's nothing special. The test looks the same with standalone components as with components that use Angular modules.

Next, we divide the counter component into multiple components and see what happens.
In a real-world scenario, this happens when the components do too much, or when you want to reuse a part from it.

We introduce two new components:

- a generic button component `ButtonComponent` that is used for the increment and decrement buttons:

```ts:button.component.ts
import {Component, EventEmitter, Output} from "@angular/core";

@Component({
    selector: 'app-button',
    template: `<button (click)="buttonClick.next()"><ng-content></ng-content></button>`,
    standalone: true,
})
export class ButtonComponent {
    @Output() buttonClick = new EventEmitter<void>();
}
```

- a count component `CountComponent` to render the counter's value:

```ts:count.component.ts
import {Component, Input} from "@angular/core";

@Component({
    selector: 'app-count',
    template: `<span>Count: {{count}}</span>`,
    standalone: true,
})
export class CountComponent {
    @Input() count = 0;
}
```

We import these two new components into the refactored counter component.

```ts{2,3,7-9,11}:counter.component.ts
import {Component} from "@angular/core";
import {ButtonComponent} from "./button.component";
import {CountComponent} from "./count.component";

@Component({
    selector: 'app-counter',
    template: `
    <app-button (buttonClick)="increment()">Increment</app-button>
    <app-count [count]="count" />
    <app-button (buttonClick)="decrement()">Decrement</app-button>
    `,
    standalone: true,
    imports: [ButtonComponent, CountComponent]
})
export class CounterComponent {
    count = 0;

    increment() {
        this.count++;
    }

    decrement() {
        this.count--;
    }
}
```

In a non-standalone word, this would have broken the original test case.
But with standalone components, the test case remains green.

Now, let's add a different dependency, the service `CounterService`.
The service has a `save` method to persist the current count, which is called when the count is changed.

```ts{4,18,22,27}:counter.component.ts
import {Component, inject} from "@angular/core";
import {ButtonComponent} from "./button.component";
import {CountComponent} from "./count.component";
import {CounterService} from "./counter.service";

@Component({
    selector: 'app-counter',
    template: `
    <app-button (buttonClick)="increment()">Increment</app-button>
    <app-count [count]="count" />
    <app-button (buttonClick)="decrement()">Decrement</app-button>
    `,
    standalone: true,
    imports: [ButtonComponent, CountComponent]
})
export class CounterComponent {
    count = 0;
    counterService = inject(CounterService);

    increment() {
        this.count++;
        this.counterService.save(this.count);
    }

    decrement() {
        this.count--;
        this.counterService.save(this.count);
    }
}
```

This still results in a happy test, even though the component has changed and added a new dependency.
But, we don't want to rely on the application's service in the test case because it can have external dependencies e.g. a backend API.
To fix this, we mock the service within the test by using `providers`.
We could use a spy for this, but in the test below we do this manually and keep track of the count values that are passed.
At the end of the test case, we make sure that the save method of the service is invoked with the expected arguments.

```ts{10-17,28}:counter.component.spec.ts
import {render,screen} from "@testing-library/angular";
import userEvent from '@testing-library/user-event'
import {CounterComponent} from "./counter.component";
import {CounterService} from "./counter.service";

it('renders the current count on clicks', async () => {
    const user = userEvent.setup()
    let savedCounts: number[] = [];
    await render(CounterComponent, {
        providers: [
        {
            provide: CounterService,
            useValue: {
                save: (count: number) => savedCounts.push(count)
            }
        }
        ]
    });

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /increment/i}));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /decrement/i}));
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    expect(savedCounts).toEqual([1, 0]);
});
```

## Conclusion

In conclusion, standalone components are an excellent tool to improve testability, and together with the Angular Testing Library, they provide a great developer experience when writing tests for your Angular component.

We've seen that adding dependencies to the component doesn't affect the test case anymore.
This is ideal and goes hand-in-hand with the philosophy of (Angular) Testing Library because we don't care about the internals of a component.
From a user's perspective, we don't care if a component is one big component, or if it's built with child components.

Previously with Angular modules, we had to update the test setup when the internal structure changed of the component, but with standalone components, we don't have to think about this anymore.
This is because the standalone component directly imports its dependencies, whereas previously this came from the Angular module, which was often duplicated within the test setups.

We still use mocks or stubs for external dependencies to keep the tests fast and reliable.
Just as before, we use the `providers` array while arranging the test setup and provide a fake instance of the service that is used within the test.

However, it's important to note that even though standalone components make component testing easier, you still need to write good tests and test the right things.
But standalone components give you a better foundation to build on.
