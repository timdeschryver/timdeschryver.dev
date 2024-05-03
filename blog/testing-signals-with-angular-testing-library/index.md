---
title: Testing Signals with Angular Testing Library
slug: testing-signals-with-angular-testing-library
description: "TLDR: If you're already using Angular Testing Library, you're in luck, because it's already prepared to handle the Signal properties."
date: 2024-04-11
tags: Angular Testing Library, Angular, testing
---

If you're an Angular developer then there's a big chance that the recent new Signal APIs have caught your attention, and you probably want to use them within your project.

If that's the case and if you're wondering how these changes affect your (new and old) tests, then you're in the right place.
The thing is that if you're already using [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/), you're in luck because it's already prepared to handle these new changes.

The philosophy behind Angular Testing Library is to test your components the way your users experience them, and that's the reason why you probably won't need to change anything in your tests to make them work with the new Signal properties. Using Signals is just a technical implementation detail that doesn't affect the way your users use the application and thus they also shouldn't impact how your components are tested.

Let's take a look at some simple examples.

## Table of Contents <!-- omit from toc -->

<!-- TOC -->

- [Testing input properties](#testing-input-properties)
- [Testing output properties](#testing-output-properties)
- [Testing model properties](#testing-model-properties)
- [Access the Signal properties](#access-the-signal-properties)
- [Conclusion](#conclusion)

## Testing input properties

Just as with the "traditional" `@Input()` properties, you can test Signal input properties by setting the input properties in the `componentInputs` object when calling the `render` function. You will have Intellisense to autocomplete the property names, but you will be able to pass invalid property values (this can be improved in the future). While setting the input use the inner value of the Signal, not the Signal itself.

:::code-group

```angular-ts{6, 10}:app.component.ts [title=app.component.ts]
import { Component, input } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div>Hello {{ greetingName() }}!</div>
  `,
})
export class AppComponent {
  greetingName = input.required<string>();
}
```

```angular-ts{6-8, 11}:app.component.spec.ts [title=app.component.spec.ts]
import { render, screen } from '@testing-library/angular';
import { AppComponent } from './app.component';

it('renders the greeting name', async () => {
  await render(AppComponent, {
    componentInputs: {
      greetingName: 'Alice',
    },
  });

  expect(screen.getByText(/Hello Alice!/i)).toBeInTheDocument();
});
```

:::

:::tip
If you're using Jest, you need to upgrade Jest to v29.5 (or higher) and jest-preset-angular v14.0.1 (or higher) to be able to set the Signal properties within the test setups.
:::

For input properties (and output) that have an alias, you can use the alias to set the input property. You won't have IntelliSense for the property name, but you can still set the property using the alias. This is also how inputs are set when using the `@Input()` decorator.

:::code-group

```angular-ts{6, 10-12}:app.component.ts [title=app.component.ts]
import { Component, input } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div>Hello {{ greetingName() }}!</div>
  `,
})
export class AppComponent {
  greetingName = input.required<string>({
    alias: 'name',
  });
}
```

```angular-ts{6-10, 13}:app.component.spec.ts [title=app.component.spec.ts]
import { render, screen } from '@testing-library/angular';
import { AppComponent } from './app.component';

it('renders the greeting name', async () => {
  await render(AppComponent, {
    componentInputs: {
      // Use the alias to set the input property
      // Side note: you won't have IntelliSense for the property name
      name: 'Alice',
    },
  });

  expect(screen.getByText(/Hello Alice!/i)).toBeInTheDocument();
});
```

:::

## Testing output properties

To test the Signal output properties, you can use the `componentOutputs` object when calling the `render` function.
I prefer to use a spy that is assigned to the emit function of the output property.

:::code-group

```angular-ts{7, 12, 14-16}:app.component.ts [title=app.component.ts]
import { Component, input, output } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div>Hello {{ greetingName() }}!</div>
    <button (click)="greetClicked()">Greet</button>
  `,
})
export class AppComponent {
  greetingName = input.required<string>();
  greetPerson = output<string>();

  greetClicked(): void {
    this.greetPerson.emit(`Hello ${this.greetingName()}!`);
  }
}
```

```angular-ts{7, 13-15, 20}:app.component.spec.ts [title=app.component.spec.ts]
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { AppComponent } from './app.component';

it('click sends an output', async () => {
  const user = await userEvent.setup();
  const spy = jasmine.createSpy('greetPerson');

  await render(AppComponent, {
    componentInputs: {
      greetingName: 'Alice',
    },
    componentOutputs: {
      greetPerson: { emit: spy } as any,
    }
  });

  await user.click(screen.getByRole('button', { name: /greet/i }));

  expect(spy).toHaveBeenCalledWith('Hello Alice!');
});
```

:::

## Testing model properties

To test model properties, you can use the `componentInputs` object when calling the `render` function.
You can set the model property to a value, and then test that the component renders the expected output.

:::code-group

```angular-ts{7-8, 13}:app.component.ts [title=app.component.ts]
import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  template: `
    <input type="text" [(ngModel)]="greetingName">
    <div>Hello {{greetingName()}}!</div>
  `,
  imports: [FormsModule],
})
export class AppComponent {
  greetingName = model();
}
```

```angular-ts{8-10, 13-14, 16}:app.component.spec.ts [title=app.component.spec.ts]
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { AppComponent } from './app.component';

it('model properties are updated', async () => {
  const user = await userEvent.setup();
  await render(AppComponent, {
    componentInputs: {
      greetingName: 'Alice',
    },
  });

  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'Bob');

  expect(screen.getByText('Hello Bob!')).toBeInTheDocument();
});

```

:::

## Access the Signal properties

If you need to access the Signal properties directly, you can use the `fixture` object that is returned from the `render` function.
This isn't recommended, but can be useful for some edge cases.

```angular-ts:app.component.spec.ts
test('model update also updates the template', async () => {
  const { fixture } = await render(AppComponent, {
    componentInputs: {
      greetingName: 'Alice',
    },
  });

  expect(screen.getByText(/Hello Alice/i)).toBeInTheDocument();

  await userEvent.clear(screen.getByRole('textbox'));
  await userEvent.type(screen.getByRole('textbox'), 'Bob');

  expect(screen.getByText(/Hello Bob/i)).toBeInTheDocument();
  expect(fixture.componentInstance.greetingName()).toBe('Bob');

  fixture.componentInstance.greetingName.set('Charlie');
  // Set doesn't trigger change detection within the test
  // screen.findBy is needed to update the template
  expect(await screen.findByText(/Hello Charlie/i)).toBeInTheDocument();
  // It's not recommended to access the model directly, but it's possible
  expect(fixture.componentInstance.name()).toBe('Charlie');
});
```

## Conclusion

When you test your components the way your users interact with them, you will make your tests more robust and less brittle.
Angular Testing Library is already prepared to handle the Signal APIs, because they encourage you to test your components the way your users experience them.

Because of this you won't need to change your tests to make them work with the Signal properties.
Using Signals is just a technical implementation detail that doesn't affect the way your users use the application and thus they also shouldn't impact how your components are tested.
