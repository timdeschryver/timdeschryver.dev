---
title: Using Angular Testing Library with Test Harnesses
slug: using-angular-testing-library-with-test-harnesses
description: In most cases, I write tests for Angular components without using Test Harnesses, but finding the correct element(s) is not always straightforward. Here, Test Harnesses play a part in easily finding and interacting with those components that can't be queried. Using Test Harnesses is also a good practice into keeping your tests readable and resilient to changes.
date: 2022-12-19
tags: Angular, Testing
---

The test cases you write for your own components are mostly the simple ones to write because you know the code base and you're in control of the component's HTML structure.
If it's needed you can always change the HTML structure in your template to make it easier to query the element that is needed in a test.

But, what if you want to write tests for a third-party component? Or, for a component that another team wrote?
In these cases, you don't have control over the HTML structure and you can't make changes to it.
This can make it harder to write tests, and it definitely makes it harder to write maintainable tests.

Even for the components that live in your code base, it can be tricky to query the correct element while keeping your test readable and resilient to changes.

In this post, we go over the combination of [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/) and [Test Harnesses](https://material.angular.io/cdk/test-harnesses/overview) to make writing tests easier and enjoyable.

## Angular Testing Library `*ByRole` queries

In comparison to CSS selectors to find HTML elements, using queries provided by Angular Testing Library makes it easier to find elements.
Specifically, I want to highlight the `screen.*ByRole` queries because these provide the most value, and are also the most versatile to use.

Using them within a test case automatically improves the readability of the test, and your test won't break that often compared to the other selectors.
It's also a good way to ensure that the appropriate [sementic HTML element](https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantics_in_html) is used (another plus is that it acts as a solid foundation of accessibility practices).

For example, let's compare the following two test cases:

```ts:button-with-css-query.spec.ts
import { render, screen } from '@testing-library/angular';

it('renders a button', async () => {
    await render(`<div class="click-me">Click me</div>`);
    const button = document.querySelector('div.click-me');
});
```

```ts:button-with-role-query.spec.ts
import { render, screen } from '@testing-library/angular';

it('renders a button', async () => {
    await render(`<button>Click me</button>`);
    const button = screen.getByRole('button');
    // or when you need to be more specific
    const button = screen.getByRole('button', { name: /click me/i });
});
```

Both test cases verify that a button is rendered, but the second test is more robust and its intention is also clear.
The second test uses the `*ByRole` query to find the button. If the button should be changed in the future, the query continues to find it.
This is because a button is a button and remains a button.

On the other hand, the first test case is brittle. It fails when the template of the component changes, for example, when the class name changes or when the `div` is replaced with another element.

But... there are times when there's no semantic HTML element that fits your needs.
Although it's better then nothing, the queries that come with Testing Library to query these elements might still be brittle.
As a workaround, I used to add a `data-testid` attribute to be able to query the elements by id.
This is fine for your own components, but you can't do this for components that you don't own.

For these cases, a Test Harness is the perfect solution.

## Test Harnesses

Test Harnesses let you query and interact with the components without having to worry about the DOM structure.
This is perfect for testing 3rd party components, and for the base components that are shared in your code base.

The advantage of using a harness is that you can change the DOM structure without breaking the tests, you just have to update the test harness to be "compatible" with the changes made to the template. Instead of going through all the test cases and updating the query, you only need to make one change.
With this minimal effort you make sure that your tests are resilient to future changes.

Luckily, we don't need to invent this concept from scratch.
The [Angular Material CDK](https://material.angular.io/cdk/test-harnesses/overview) provides the infrastructure to write test harnesses for Angular components. Angular Material also has a set of test harnesses for their components. Sadly, not all 3rd party components have test harnesses but if needed you can write your own.

Without going into much detail about test harnesses (you can find an elaborate explanation in the [Angular Material CDK documentation](https://material.angular.io/cdk/test-harnesses/overview) with lots of examples), let's look at how to integrate a test harness with the Angular Testing Library.

First, let's create a component that has a button that opens a snack bar when it's clicked.

```ts:snack-bar.component.ts
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-harness',
    standalone: true,
    imports: [MatButtonModule, MatSnackBarModule],
    template: `
        <button mat-stroked-button (click)="openSnackBar()" aria-label="Show an example snack-bar">
            Pizza party
        </button>
    `,
})
export class SnackBarComponent {
    constructor(private snack bar: MatSnackBar) {}

    openSnackBar() {
        return this.snackBar.open('Pizza Party!!!');
    }
}
```

Before using a test harness, let's take a look at the test for this component without using a test harness.
It looks similar to the test at the beginning of this post, but it uses a `screen.*ByText` query to verify that the snack bar is opened.
While this works, the `*ByText` query is not very specific, and this could also conflict with other elements on the page when the same text is displayed multiple times.

The below test uses `*ByText` because the snack bar isn't wrapped in a semantic HTML element.
We just test that the message is displayed.

```ts:snack-bar.component.spec.ts
import { render, screen } from '@testing-library/angular';
import user from '@testing-library/user-event';

import { SnackBarComponent } from './snack-bar.component.ts';

test('shows a message on click', async () => {
    await render(`<app-harness></app-harness>`, {
        imports: [SnackBarComponent],
    });

    user.click(screen.getByRole('button'));
    expect(await screen.getByText(/Pizza Party!!!/i)).toBeInTheDocument();
});
```

Now, let's take a look at the same test, but now with the addition of a test harness.
The component is rendered in the same way, but as an additional step, we load the test harnesses environment.
To load the harness, pass the component's fixture that's returned from the `render` method.

Once the test harness environment is loaded, we can use the `getHarness` method to query specific elements/components on the page.
In this example, the `MatButtonHarness` and `MatSnackBarHarness` components.

When we get access to the harness instances, the test uses the methods provided by the harness to interact with the button and to verify that the harness shows the expected message.

```ts{13-15, 17-19, 21-22}:snack-bar.component.spec.ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { render } from '@testing-library/angular';

import { SnackBarComponent } from './snack-bar.component.ts';

test('shows a message on click (Test Harness)', async () => {
    const view = await render(`<app-harness></app-harness>`, {
        imports: [SnackBarComponent],
    });

    // use the root loader to get the harnesses for the entire document
    // because the snack bar is rendered outside of the component
    const loader = TestbedHarnessEnvironment.documentRootLoader(view.fixture);

    const buttonHarness = await loader.getHarness(MatButtonHarness);
    const button = await buttonHarness.host();
    button.click();

    const snackbarHarness = await loader.getHarness(MatSnackBarHarness);
    expect(await snackbarHarness.getMessage()).toMatch(/Pizza Party!!!/i);
});
```

While this test uses the test harnesses, I do find it a bit verbose.
Because it uses the Child Components within the test it also leaks the implementation details of the component(s).

I could also be opinionated, but I prefer to use the queries provided by Angular Testing Library where it's applicable.

For this case I would replace the button harness with the `screen.*ByRole('button')` query, and use `user-event` to interact with the button.
For the snack bar, the test harness is a perfect fit because it can't easily be queried with a query from Angular Testing Library.

```ts{15, 17-18}:snack-bar.component.spec.ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { render, screen } from '@testing-library/angular';
import user from '@testing-library/user-event';

import { SnackBarComponent } from './snack-bar.component.ts';

test('shows a message on click (Test Harness with Queries)', async () => {
	const view = await render(SnackBarComponent);

	// use the root loader to get the harnesses for the entire document
	// because the snack bar is rendered outside of the component
	const loader = TestbedHarnessEnvironment.documentRootLoader(view.fixture);

	user.click(screen.getByRole('button'));

	const snackbarHarness = await loader.getHarness(MatSnackBarHarness);
	expect(await snackbarHarness.getMessage()).toMatch(/Pizza Party!!!/i);
});
```

https://twitter.com/tim_deschryver/status/1603008583645515777

## Conclusion

Ideally, an element should be queryable with Testing Library. When that's not possible, I like to use a Test Harness.
Doing this results in a more robust test that is less likely to break when the implementation changes.

But, don't just fall back to a test harness without giving it some thought.
Instead, think about how you can make the element queryable.
Most of the time this means using semantic HTML.

If it isn't your codebase, you can open an issue on the component's repository.
This is a win-win situation because you get a more robust test, and the component gets better, and will likely be better accessible.

In short, using a Test Harness is a good fit to Angular Testing Library when it's not possible to query an element with Testing Library.
