---
title: The new on property improves output testing in Angular Testing Library
slug: the-new-on-property-improves-output-testing-in-angular-testing-library
description: A quick look at the new `on` API to write output tests more intuitively and without workarounds.
date: 2024-07-25
tags: Angular Testing Library, Angular, Testing
---

The latest version of Angular Testing Library ([v17.1.0](https://www.npmjs.com/package/@testing-library/angular/v/17.1.0)) introduces a new API `on` that allows you to test the output of your components more easily. In this article, we'll take a look at how you can use this new method to enhance your output testing in Angular, and why it's a better alternative to the existing `componentOutputs` or `componentProperties` API.

:::note
Thanks to [Suguru Inatomi (lacolaco)](https://x.com/laco2net) who started this by creating an issue, and [S. Mumenthaler](https://github.com/mumenthalers) for the implementation. 🏆
:::

In previous versions of Angular Testing Library, to test output properties of a component you had to use `componentOutputs` to access the output properties of a component.
This was required to assign a spy to the output property and test if it was called correctly.

However, this method had some limitations.
There was no type safety, you had to manually create a "fake" event emitter (or Observable) and use a type assertion to `any` to have code that compiles.
Also, from an implementation perspective, the `componentOutputs` override the component's properties, which isn't ideal as it could lead to unexpected behavior.

For example, to test an output property of a component that emits an event, you would have to do something like this:

```ts{9-13}:example.component.spec.ts
test('it is possible to assign (spy) output properties (deprecated)', async () => {
	const user = userEvent.setup();
	const submit = jest.fn();

	await render(ExampleComponent, {
		componentInputs: {
			value: 47,
		},
		componentOutputs: {
			submitValue: {
				emit: submitSpy,
			} as any,
		},
	});

	const submitButton = screen.getByRole('button', { name: /submit/i });

	await user.click(submitButton);
	expect(submitSpy).toHaveBeenCalledTimes(1);
	expect(submitSpy).toHaveBeenCalledWith(47);
});
```

The new `on` API solves this issue by providing a more intuitive way to listen to the output properties of a component, making it easier to assign a spy.
To use it, set the `on` property in the `render` function with the output property you want to listen to and the spy (or other callback function) you want to assign to it.

Under the hood, `on` also unsubscribes from the output properties when the component is destroyed or rerendered, which is a nice bonus.

Here's how you can use the `on` API to test the output of a component:

```ts{9-11}:example.component.spec.ts
test('it is possible to assign (spy) output properties', async () => {
	const user = userEvent.setup();
	const submitSpy = jest.fn();

	await render(ExampleComponent, {
		componentInputs: {
			value: 47,
		},
		on: {
			submitValue: submitSpy,
		},
	});

	const submitButton = screen.getByRole('button', { name: /submit/i });

	await user.click(submitButton);
	expect(submitSpy).toHaveBeenCalledTimes(1);
	expect(submitSpy).toHaveBeenCalledWith(47);
});
```

As you can notice, this new API is more intuitive and improves the experience of writing and reading tests in Angular Testing Library that involve output properties.

:::warning
Because of this change the current `componentOutputs` and `componentProperties` properties are deprecated and will be removed in the next major version of Angular Testing Library.
:::
