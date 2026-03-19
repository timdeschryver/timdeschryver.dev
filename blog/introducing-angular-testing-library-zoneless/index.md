---
title: Introducing Angular Testing Library Zoneless
slug: introducing-angular-testing-library-zoneless
description: To keep up with modern Angular, there's a new zoneless subpackage that helps you write component tests.
date: 2026-03-19
tags: Angular Testing Library, Angular, Testing
---

[Angular Testing Library](https://testing-library.com/angular) now introduces a new `zoneless` subpackage, a trimmed-down version of the original Angular Testing Library. This is avalable from version 19.2.1 onwards.

## Why

The reason for the new `@testing-library/angular/zoneless` subpackage is that, over time, Angular's testing capabilities have improved, and some of the features provided by the original Angular Testing Library have become less necessary. It focuses on a more streamlined API that leverages Angular's built-in testing features.

## Disabled Automatic Change Detection

The biggest change is that Testing Library's API is no longer monkey patched, such as for user events and the `waitFor` and `findBy` methods, to invoke Angular's change detection using `detectChanges`. This is something you won't notice by looking at the API, but it's a major internal change. This change is necessary to more closely reflect how the component behaves under real circumstances. It shouldn't have a big impact on existing test cases.

## Compact API Surface

This subpackage also includes breaking changes compared with what you're currently used to.
We think these breaking changes have a positive effect during rendering.
For example, the `componentProperties`, `componentInputs`, `componentOutputs`, and `inputs` options have been removed in favor of a single `bindings` option that makes use of [binding syntax](https://angular.dev/guide/testing/components-scenarios#binding-signals-to-inputs) to test `input`, `output`, and `model` bindings. Previously, there were subtle differences, which made it unclear when to use one over the other.

```ts [file=example.spec.ts]
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';

test('renders and interacts with a component', async () => {
	const user = userEvent.setup();
	await render(CustomerDetails, {
		bindings: [inputBinding('customerName', 'Alice')],
		// You can still configure providers
		providers: [],
	});

	const loadButton = screen.getByRole('button', { name: /load customer/i });
	await user.click(loadButton);

	expect(screen.getByText('Hello Alice')).toBeInTheDocument();
});
```

### `configureTestBed` for more control

To make the library less dependent on Angular's APIs, some configuration options that were rarely used have been removed.
Instead, it's now possible to manually configure the testing environment using Angular's `TestBed` API, which provides more flexibility and control over your specific testing setup.

To configure the `TestBed`, use the `configureTestBed` method. For example, you can configure the router or defer behavior.

```ts [file=example.spec.ts] [highlight=7-11]
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';

test('renders and interacts with a component', async () => {
	const user = userEvent.setup();
	await render(CustomerDetails, {
		configureTestBed: (testBed) => {
			testBed.configureTestingModule({
				deferBlockBehavior: DeferBlockBehavior.Manual,
			});
		},
	});
});
```

### Vitest Compatibility

A nice side effect of the `zoneless` subpackage is that it's better compatible with [Vitest](https://vitest.dev/) (browser mode).

### Future Improvements

Of course, we will re-evaluate the API in the future and add more features if needed. For now, the `zoneless` package provides the bare minimum needed to test components, while offering a more focused and efficient testing experience for Angular developers.

## Call to Action

The `zoneless` subpackage is available as a separate package, so you can choose to use it without affecting your existing tests. We encourage you to try it out and share your feedback. Feel free to [open issues](https://github.com/testing-library/angular-testing-library/issues/new) or contribute to the project if you have suggestions for improvements or new features. Your feedback helps shape the future of Angular Testing Library.
