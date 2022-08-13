---
title: Introducing ngx-testing-library
slug: introducing-ngx-testing-library
description: An adapter around dom-testing-library to provide lightweight utility functions to test Angular components.
author: Tim Deschryver
date: 2018-06-18T14:27:19.273Z
tags: Angular, Testing, Library
---

## A bit of background

A couple of months ago [Kent C. Dodds](https://twitter.com/kentcdodds) created a testing library for react called [react-testing-library](https://github.com/kentcdodds/react-testing-library), which includes simple and complete React DOM testing utilities.

He wanted to provide a solution to writing tests without testing implementation details. With the mindset that you would rather want to test your application in a way how your users are using the application, by encouraging good testing and software practices. With a result of making your tests less prone to break due to implementation changes in order to keep moving forward and not slowing down development, because your tests are “suddenly” failing. You can find more details in hes blog post, [Introducing the react-testing-library 🐐](https://blog.kentcdodds.com/introducing-the-react-testing-library-e3a274307e65).

The library is focused on writing your tests on actual DOM nodes, because of this it makes a real good base to use across different frameworks.

## dom-testing-library

As a nice man as he, [Kent C. Dodds](https://twitter.com/kentcdodds) is, he refactored out the generic, not react specific code, and created [dom-testing-library](https://github.com/kentcdodds/dom-testing-library). This library provides a couple of lightweight but very useful utility functions for testing DOM nodes.

The dom-testing-library mainly consists of query functions to find DOM elements. For this it uses the [`querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) and [`querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) functions from the JavaScript API, remember that this is possible because it uses the actual DOM. The query functions provided by this library are the following:

- [`getByLabelText`](https://github.com/kentcdodds/dom-testing-library#getbylabeltext)
- [`getByPlaceholderText`](https://github.com/kentcdodds/dom-testing-library#getbyplaceholdertext)
- [`getByText`](https://github.com/kentcdodds/dom-testing-library#getbytext)
- [`getByAltText`](https://github.com/kentcdodds/dom-testing-library#getbyalttext)
- [`getByTitle`](https://github.com/kentcdodds/dom-testing-library#getbytitle)
- [`getByValue`](https://github.com/kentcdodds/dom-testing-library#getbyvalue)
- [`getByTestId`](https://github.com/kentcdodds/dom-testing-library#getbytestid)

The library also comes with handy helpers to fire DOM events with [`fireEvent`](https://github.com/kentcdodds/dom-testing-library#fireevent). And if you‘re dealing with asynchronous code, e.g. a http request, it also has you covered with [`wait`](https://github.com/kentcdodds/dom-testing-library#wait) and [`waitForElement`](https://github.com/kentcdodds/dom-testing-library#waitforelement).

Like I said earlier in this post, these lightweight functions provide a good base to use across different framework. That’s why [dom-testing-library](https://github.com/kentcdodds/dom-testing-library) is currently not only used by [react-testing-library](https://github.com/kentcdodds/react-testing-library) but also [vue-testing-library](https://github.com/dfcook/vue-testing-library) and [cypress-testing-library](https://github.com/kentcdodds/cypress-testing-library).

As you may have noticed I’m a bit excited about this approach of testing your UI components, so I I created [ngx-testing-library](https://github.com/timdeschryver/ngx-testing-library), an Angular adapter around dom-testing-library.

## ngx-testing-library

The ngx-testing-library provides one method `createComponent`, to create your component, setting up the Angular `TestBed`, and it applies the dom-testing-library query functions to your component container. It also exposes the `fireEvent` function directly.

Let’s take a look how this looks like if we were testing a simple counter component.

```ts
it('should increment and decrement', async () => {
	// setup the test via the template syntax
	const { getByText, getByTestId, click } = await createComponent(
		'<counter [counter]="10"></counter>',
		{
			declarations: [CounterComponent],
		},
	);

	// or via the component type
	const { getByText, getByTestId, click } = await createComponent(
		{
			component: CounterComponent,
			parameters: {
				counter: 10,
			},
		},
		{
			declarations: [CounterComponent],
		},
	);

	// click the increment button using the fireEvent click function
	// this will also trigger change detection
	click(getByText('+'));
	// find the element based on its text
	expect(getByText('Current Count: 11')).toBeTruthy();
	// find the element via its data-testid attribute
	expect(getByTestId('count').textContent).toBe('Current Count: 11');

	click(getByText('-'));
	expect(getByText('Current Count: 10')).toBeTruthy();
	expect(getByTestId('count').textContent).toBe('Current Count: 10');
});
```

> Note that this library can be used with every test runner, whether it is Jasmine, Jest, or your favorite test runner.

And if we were testing a login form, it would look like as follows:

```ts
test('login form submits', async () => {
	const fakeUser = { username: 'jackiechan', password: 'hiya! 🥋' };
	const handleLogin = {
		emit: jest.fn(),
	};

	const { container, getByLabelText, getByText, input, submit } = await createComponent(
		{
			component: LoginFormComponent,
			parameters: {
				handleLogin: handleLogin as any,
			},
		},
		{
			declarations: [LoginFormComponent],
			imports: [ReactiveFormsModule],
		},
	);

	const usernameNode = getByLabelText(/username/i) as HTMLInputElement;
	const passwordNode = getByLabelText(/password/i) as HTMLInputElement;
	const submitButtonNode = getByText(/submit/i);
	const formNode = container.querySelector('form');

	usernameNode.value = fakeUser.username;
	input(usernameNode);

	passwordNode.value = fakeUser.password;
	input(passwordNode);

	submit(formNode);

	expect(handleLogin.emit).toHaveBeenCalledTimes(1);
	expect(handleLogin.emit).toHaveBeenCalledWith(fakeUser);
	expect(submitButtonNode.type).toBe('submit');
});
```

To get a bit more in depth, I’m referring you to the GitHub repository at [ngx-testing-library](https://github.com/timdeschryver/ngx-testing-library). While it is still a work in progress, I’m confident that it provides the basic utilities to make your tests resilient to change. I would say come take a look and as always, feedback is more than welcome!

## Not to miss

Watch and learn how [Dominic E.](https://twitter.com/elmd_) uses RxJS to cache HTTP requests in the latest Angular Air episode. This video is based from his blog post, [Advanced caching with RxJS](https://blog.thoughtram.io/angular/2018/03/05/advanced-caching-with-rxjs.html).
