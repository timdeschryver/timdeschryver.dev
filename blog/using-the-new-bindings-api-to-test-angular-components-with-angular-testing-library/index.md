---
title: Using the new bindings API to test Angular components with Angular Testing Library
slug: using-the-new-bindings-api-to-test-angular-components-with-angular-testing-library
description: Learn how to make use of the new binding methods inputBinding, outputBinding, and twoWayBinding to set component properties in your Angular tests. This native integration provides better signal support and eliminates type assertions for output events.
date: 2025-10-02
tags: Angular Testing Library, Angular, Testing
---

Angular Testing Library v18.1.0 adds support for the new `bindings` functionality in Angular (thank you [Suguru Inatomi (@lacolaco)](https://github.com/lacolaco)!).
Using the methods [`inputBinding`](https://angular.dev/api/core/inputBinding), [`outputBinding`](https://angular.dev/api/core/outputBinding), and [`twoWayBinding`](https://angular.dev/api/core/twoWayBinding) you can now set the component's input and output properties using the official tooling (Angular v20.1).

For those who are currently using Angular Testing Library, you already know that it currently has multiple ways to set the component's properties through `componentProperties`, `componentInputs` (deprecated), `inputs`, `componentOutputs` (deprecated), and `on`. These methods were needed to easily set the input and output properties of a component in tests, and evolved over time to support typesafety and signals.
With the addition of the new built-in methods in Angular, these use cases are now covered by the Angular framework itself.
This will have an impact on the Angular Testing Library API, as the existing methods will be deprecated in future releases in favor of the new `bindings` property.

Let's take a look at the new `bindings` property in combination with Angular Testing Library, we'll also cover some cases with just Angular's functionality without bringing in Angular Testing Library.

## Example component

As an example, we use the following component that has a simple input and output property.
The component shows the input value using a `computed` and emits an event when a button is clicked.

```typescript
@Component({
	template: `
		<div>{{ greeting() }}</div>
		<button (click)="submitClick()">Submit</button>
	`,
})
export class GreetingsComponent {
	name = input.required();
	greet = output<string>();

	protected greeting = computed(() => `Hello ${this.name()}!`);

	protected submitClick() {
		this.greet.emit(this.greeting());
	}
}
```

## Bindings

To set the component's properties, the `render` method options now support a `bindings` property, which is an array of the different binding methods.
This is also the case when using the `TestBed` to create the component, as it also supports a `bindings` property in the `createComponent` method options.

### Input binding

To set the input property, you can use the `inputBinding` method, which can be defined in the `bindings` property of the `render` options.
The example below sets the `name` input property using a signal and asserts that the greeting message is displayed.

```typescript
import { inputBinding, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';

test('displays the greeting message', async () => {
	const nameSignal = signal('Alice');

	await render(GreetingsComponent, {
		bindings: [inputBinding('name', nameSignal)],
	});

	expect(screen.getByText('Hello Alice!')).toBeInTheDocument();
});
```

As you can see, the `inputBinding` method takes two arguments: the name of the input property and a signal that holds the value of the input property.
Instead of using a signal, you can also use an inline method that returns the value.

```typescript
import { inputBinding } from '@angular/core';
import { render, screen } from '@testing-library/angular';

test('displays the greeting message', async () => {
	await render(GreetingsComponent, {
		bindings: [inputBinding('name', () => 'Alice')])],
	});

	expect(screen.getByText('Hello Alice!')).toBeInTheDocument();
});
```

Input properties that are defined using an `alias` can also be set using the `inputBinding` method.
In this case, the alias name needs to be used instead of the property name.

```typescript
// An input with an alias
name = input.required({ alias: 'personName' });

// The input binding uses the alias name to set the value
inputBinding('personName', () => 'Alice');
```

In the past, we used `aliasedInput` in Angular Testing Library to set input properties with an alias, this will also become deprecated in future releases.

### Output binding

To test the output property of a component, you can now use the `outputBinding` method, which can also be defined in the `bindings` property of the `render` options.
Just as with the `inputBinding` method, the `outputBinding` method takes two arguments: the name of the output property and a callback function that will be called when the output event is emitted.

The second argument is great to pass a spy function, which is ideal to assert that the output event was emitted.
This was previously possible, but often required a type assertion to convince TypeScript that the callback function matches the output event type.

```typescript
import { outputBinding } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

test('emits the greeting message', async () => {
	const user = userEvent.setup();
	const greetSpy = vi.fn();

	await render(GreetingsComponent, {
		bindings: [inputBinding('name', () => 'Alice'), outputBinding('greet', greetSpy)],
	});

	await user.click(screen.getByRole('button'));

	expect(greetSpy).toHaveBeenCalledWith('Hello Alice!');
});
```

### Two-way binding

For properties that require two-way binding (e.g. [`model`](https://angular.dev/api/core/model)), you need to use the `twoWayBinding` method to set these properties.
If the greeting component would have a two-way binding for the `name` property, it could be set as follows.

In comparison to the `inputBinding` method, the `twoWayBinding` method only accepts a signal as the second argument, this is because two-way bindings require a writable value.

```typescript
import { twoWayBinding, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';

test('displays the greeting message', async () => {
	const nameSignal = signal('Alice');

	await render(GreetingsComponent, {
		bindings: [twoWayBinding('name', nameSignal)],
	});

	expect(screen.getByText('Hello Alice!')).toBeInTheDocument();
});
```

## Using the standard Angular APIs

As mentioned earlier, the `bindings` property is not specific to Angular Testing Library, but is part of the standard Angular testing APIs.
This means you're not required to use Angular Testing Library to use the new `bindings` functionality.

After configuring the `TestBed` (which is what Angular Testing Library does under the hood), you can create the component using the `createComponent` method and pass the `bindings` property in the options. Just as with the `render` method of Angular Testing Library, the `bindings` property is an array of the different binding methods.

```typescript
import { TestBed } from '@angular/core/testing';
import { inputBinding, outputBinding } from '@angular/core';

TestBed.configureTestingModule({
	declarations: [DemoComponent],
});

const fixture = TestBed.createComponent(DemoComponent, {
	bindings: [inputBinding('name', () => 'Alice'), outputBinding('greet', greetSpy)],
});
```

## Some questions I had, and their answers

### Can I use this API with @Input and @Output decorators?

Yes, you can also make use the `inputBinding` and `outputBinding` methods with components that use the `@Input` and `@Output` decorators.

### What happens if I don't provide a required input?

If you don't provide a required input, Angular throws an error when the component is initialized.

```bash
NG0950: Input is required but no value is available yet. Find more at https://angular.dev/errors/NG0950
```

### What happens if I provide an input that doesn't exist?

One of the advantages of Angular Testing Library's API is that it provides type safety when setting input and output properties.
This is not (yet?) the case when using the `bindings` property, as it accepts strings for the property names.
However, Angular does perform runtime checks and will throw an error if you try to set a property that doesn't exist on the component.

```bash
NG0315: GreetingComponent does not have an input with a public name of "doesNotExist".
```

### Can I update signal values after the component is created?

Yes, you can update the signal values after the component is created.
To assert the template is updated, you need to call `fixture.detectChanges()` to trigger change detection.
Another option, which I prefer, is to use Angular Testing Library's retry utilities, such as `findByQuery`, which automatically retries until the element is found or a timeout occurs.

## Conclusion

The new `bindings` API in Angular Testing Library v18.1.0 and Angular v20.1 provides a standardized way to set input and output properties of components in tests.

The new API's offers a better experience with the Angular framework, making it easier to write and maintain tests for Angular components.
For example, it has a better integration with Angular's signals, and it reduces the need for type assertions when working with output events.
As a result, the existing methods in Angular Testing Library for setting input and output properties will be deprecated in future releases in favor of the new `bindings` property.

If you haven't tried Angular Testing Library yet, now is a great time to start using it in your Angular projects!

Putting it all together, here's a complete example using Angular Testing Library with the new `bindings` API:

```typescript
await render(MyComponent, {
	bindings: [
		inputBinding('value', signal('Angular Testing Library')), // supports signals
		inputBinding('greeting', () => 'hello'), // supports aliases
		outputBinding('clicked', clickHandlerSpy), // easy to set spy functions
		twoWayBinding('name', signal('initial')), // two-way binding with signals
	],
});
```
