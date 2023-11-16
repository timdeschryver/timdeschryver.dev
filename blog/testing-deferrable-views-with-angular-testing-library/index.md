---
title: Testing Deferrable Views with Angular Testing Library
slug: testing-deferrable-views-with-angular-testing-library
description: Let's expore the new API's of Angular Testing Library (v14.5.0) to see how we can easily test deferrable views.
date: 2023-11-16
tags: Angular Testing Library, Angular, Testing
---

The [Angular 17 release](https://blog.angular.io/introducing-angular-v17-4d7033312e4b) is stacked with new features, using Vite and esbuild to build applications, signals, control flow, and deferrable views, just to name a few big ones.
It's the last one, deferrable views, that I want to go over through because it impacts component tests.

:::info
Deferrable views, also known as @defer blocks, are a powerful tool that can be used to reduce the initial bundle size of your application or defer heavy components that may not ever be loaded until a later time. This should result in a faster initial load and an improvement in your Core Web Vitals (CWV) results. Deferring some of your components until later should specifically improve Largest Contentful Paint (LCP) and Time to First Byte (TTFB).
:::

## Testing Deferrable Views

What I like about the (new!) Angular documentation is that it has an [example](https://angular.dev/guide/defer) on how to test deferrable views.
In the example, we see the following component, which makes use of a complete block (`@defer`), and a loading block (`@loading`).

```ts
@Component({
	template: `
		@defer {
		<p>Defer block content</p>
		} @loading {
		<p>Loading...</p>
		}
	`,
})
class FixtureComponent {}
```

To test the deferrable blocks of the component, you'll need to use the new `fixture.getDeferBlocks()` and `deferBlockFixture.render(DeferBlockState)` methods.

```ts
it('should render a defer block in different states', async () => {
	// Create component fixture.
	const componentFixture = TestBed.createComponent(FixtureComponent);

	// Retrieve the list of all defer block fixtures and get the first block.
	const deferBlockFixture = (await componentFixture.getDeferBlocks())[0];

	// Render loading state and verify the rendered output.
	await deferBlockFixture.render(DeferBlockState.Loading);
	expect(componentFixture.nativeElement.innerHTML).toContain('Loading');

	// Render the final state and verify the output.
	await deferBlockFixture.render(DeferBlockState.Complete);
	expect(componentFixture.nativeElement.innerHTML).toContain('Defer block content');
});
```

This is to render the view within its correct state.
In other words, within the test have total control over the current deferrable state of the block(s) in your component.

By just rendering the component, the body is empty.
If the component was using a placeholder view (using `@placeholder`), then this will be rendered in this state.

```html
<body>
	<div id="root0" ng-version="17.0.2" />
</body>
```

As expected, setting the defer block to the loading state renders the loading block.

```html
<body>
	<div id="root0" ng-version="17.0.2">
		<p>Loading...</p>
	</div>
</body>
```

Lastly, updating the defer state to complete, replaces the loading content with the completed content.

```html
<body>
	<div id="root0" ng-version="17.0.2">
		<p>Defer block content</p>
	</div>
</body>
```

## Using Angular Testing Library

The same test can be rewritten using the Angular Testing Library API.
Using the component's fixture, which is returned from the `render` method, the newly provided methods can be invoked to get a deferrable block and to set its state.

```ts
test('renders a defer block in different states using the official API', async () => {
	const { fixture } = await render(FixtureComponent);

	const deferBlockFixture = (await fixture.getDeferBlocks())[0];

	await deferBlockFixture.render(DeferBlockState.Loading);
	expect(screen.getByText(/loading/i)).toBeInTheDocument();
	expect(screen.queryByText(/Defer block content/i)).not.toBeInTheDocument();

	await deferBlockFixture.render(DeferBlockState.Complete);
	expect(screen.getByText(/Defer block content/i)).toBeInTheDocument();
	expect(screen.queryByText(/load/i)).not.toBeInTheDocument();
});
```

What changed in the above example using the Testing Library API and the original "default" test is that we make use of:

- the `render` method to render the component;
- the queries method of `screen` to get specific elements within the DOM;
- and lastly the assertions from `jest-dom` to make the assertions better readable and clear;

Following the Testing Library philosophy, we test a component as a real user.
This results in more robust tests, and usually also has the benefit that tests are easier to write and to read.

But, we can do better.
I don't like that we have to take a few steps in order to put the component in a desired state, which probably will also be repeated in many tests.
The test cases can quickly become bloated.

(Angular) Testing Library aims to make writing tests fun.
We can only achieve this goal with the right abstractions, to keep the test cases as simple as possible.
That's why we added two new APIs to make the interaction with deferrable views less verbose.

### `renderDeferBlock`

The first one is the `renderDeferBlock` method sets a deferrable block in the given state.
This is just a simple wrapper to get and set the state.
Underneath it makes use of the `getDeferBlocks` and `render(DeferBlockState)` methods, so nothing special going on here.

The default behavior sets the state of all deferrable blocks within the component.
To explicitly set the state of a specific block, you can pass the index of the deferrable block you want to update to `renderDeferBlock`.

```ts
test('renders a defer block in different states', async () => {
	const { renderDeferBlock } = await render(FixtureComponent);

	// set the state of all deferrable blocks
	await renderDeferBlock(DeferBlockState.Loading);
	expect(screen.getByText(/loading/i)).toBeInTheDocument();
	expect(screen.queryByText(/Defer block content/i)).not.toBeInTheDocument();

	// explicitly set the state of the first block using the index argument
	await renderDeferBlock(DeferBlockState.Complete, 0);
	expect(screen.getByText(/Defer block content/i)).toBeInTheDocument();
	expect(screen.queryByText(/load/i)).not.toBeInTheDocument();
});
```

### `deferBlockStates`

Besides setting the deferred state within a test, Angular Testing Library provides an option to immediately render the component with its deferrable blocks in the desired state.
Use the `deferBlockStates` configuration option while rendering the component.

```ts
test('renders a defer block initially in the complete state', async () => {
	await render(FixtureComponent, {
		deferBlockStates: DeferBlockState.Complete,
	});

	expect(screen.getByText(/Defer block content/i)).toBeInTheDocument();
	expect(screen.queryByText(/load/i)).not.toBeInTheDocument();
});
```

Just like before, we can also be explicit about it and set the desired state of specific blocks.

```ts
test('renders a defer block initially in the complete state', async () => {
	await render(FixtureComponent, {
		deferBlockStates: [{ deferBlockState: DeferBlockState.Complete, deferBlockIndex: 0 }],
	});

	expect(screen.getByText(/Defer block content/i)).toBeInTheDocument();
	expect(screen.queryByText(/load/i)).not.toBeInTheDocument();
});
```

## Conclusion

Testing deferrable views can be done by setting the state (`Placeholder`, `Loading`, `Complete`, `Error`) of a deferrable block.
While Angular already provides some [utility methods](https://angular.dev/guide/defer#testing), [Angular Testing Library (v14.5.0)](https://www.npmjs.com/package/@testing-library/angular/v/14.5.0) ships two easy-to-use abstractions to make working with defferable views easier within tests.

I see myself using the new `deferBlockStates` more frequently, to set the initial state of a block.
This keeps the tests focused around a particular state, than instead having to update the state of a component (multiple times) within a test.

```ts
test('renders a defer block initially in the complete state', async () => {
	await render(FixtureComponent, {
		deferBlockStates: DeferBlockState.Complete,
	});

	expect(screen.getByText(/Defer block content/i)).toBeInTheDocument();
	expect(screen.queryByText(/load/i)).not.toBeInTheDocument();
});
```
