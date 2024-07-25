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
