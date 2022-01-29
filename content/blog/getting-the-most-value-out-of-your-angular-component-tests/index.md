---
title: Getting the most value out of your Angular Component Tests
slug: getting-the-most-value-out-of-your-angular-component-tests
description: How I write my Angular Component Tests with the Angular Testing Library.
author: Tim Deschryver
date: 2021-07-06
tags: angular, testing, testing-library
banner: ./images/banner.jpg
published: true
---

I frequently hear that it's hard to know what to test of an Angular component.
This complaint is often mentioned together by saying that it takes up a lot of time to write and maintain these tests that provide little tp no value. In the end, the team wonders if the tests are worth it.
I've been here before, and there are two outcomes when you reach this point.
You either have almost no tests, or the opposite, the codebase is bloated with a lot of tests that slow you down.
Both options aren't great.

In this blog post, I want to share how I think that we can get the most value out of a test.
But what is a high-value test?
For me, it means that the test can prevent a bug in my code (duh!).
But also that the cost of writing a test doesn't hinder the development process, now or in the future.
In other words, the test doesn't have to feel like a chore to write.
Instead, the test must be easy to read and it must help me to ship new features with confidence.

To accomplish this, I want to closely mimic a user that uses my application.
It also means that as little as possible is mocked, because how else can we assure that the application is performing as expected?

To help me writing these tests, I'm using the [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/). When you're using the Angular Testing Library, you only need the `render` method and the `screen` object to test the basics of your component. For interactions with the component, I'm also using `userEvent` from [@testing-library/user-event](https://testing-library.com/docs/ecosystem-user-event/).

Let's take a look at the first test for a simple component called `EntitiesComponent`.
The component holds a collection of entities and is in charge to display the entities in a table.

```ts
import { render, screen } from '@testing-library/angular';

it('renders the entities', async () => {
	await render(EntitiesComponent);

	expect(screen.getByRole('heading', { name: /Entities Title/i })).toBeDefined();

	// Use the custom Jest matchers from @testing-library/jest-dom
	// to make your tests declarative and readable
	// e.g. replace `toBeDefined` with `toBeInTheDocument`
	expect(screen.getByRole('cell', { name: /Entity 1/i })).toBeInTheDocument();
	expect(screen.getByRole('cell', { name: /Entity 2/i })).toBeInTheDocument();
	expect(screen.getByRole('cell', { name: /Entity 3/i })).toBeInTheDocument();
});
```

Here, you can see the first usage of the `screen` object. You can think of `screen` as the real screen an end-user would see (the DOM tree), containing multiple [queries](https://testing-library.com/docs/queries/about/#types-of-queries) to verify that the component is rendered correctly. **The most important query is the `byRole` variant, it lets you select the element just as how a user (or screen reader) would.** Because of this, it has the added benefit to make your components more accessible.

> 💡 TIP: use `screen.debug()` to log the HTML in the console, or use `screen.logTestingPlaygroundURL()` to create an interactive playground. For example, the example application used in this article is available with [this playground link](https://testing-playground.com/#markup=DwEwlgbgBGILwCIBOB7FAXADAqA7A5gLQQCmSAzmCrogIwBMAdLcwgHzAAWtbAorujCCS5KABUhAGxLAA9Nw4AjAK7p01NgGEkJAIboSUAHIkA7lH6D0ATzkq1G4JN2KSktlADKepAGNOUCQCQmAiUMBguAAOqlA2USSIBgAe6Oxyzq7uwLpRUYToLtJ4RDoAZtK+6IRBVqHkiADaKIoAViRVUADybR3oALrphYrSHOhIYyB8wTZQ9HLoU8CLSqrquHzg6HZrjrIrCxPAAISEhIqR4AQNAN4AUAgEhOWV1U9lKEiEKGUIAFxQBDNXqdHrtKqDO4AXzOHH2RRIcNy+WGozk4AgbCAA). The playground helps to use the correct query.

Pretty simple and readable right? Of course, it's only a simple component so the test should also be simple.

Let's add some extra's to the component and see what impact this has on the test.
Instead of a static entities collection, the component now retrieves the entities with a service and uses a table component (`TableComponent`) to render the entities.

```ts{5-13}
import { render, screen } from '@testing-library/angular';

it('renders the entities', async () => {
    await render(EntitiesComponent, {
        declarations: [TableComponent],
        providers: [
            {
                provide: EntitiesService,
                value: {
                    fetchAll: jest.fn().mockReturnValue([...])
                }
            }
        ]
    });

    expect(
        screen.getByRole('heading', { name: /Entities Title/i })
    ).toBeInTheDocument();

    expect(
        screen.getByRole('cell', { name: /Entity 1/i })
    ).toBeInTheDocument();
    expect(
        screen.getByRole('cell', { name: /Entity 2/i })
    ).toBeInTheDocument();
    expect(
        screen.getByRole('cell', { name: /Entity 3/i })
    ).toBeInTheDocument();
})
```

We see that because of how the component test was previously written, there are no big changes to the modified test. The only part that is affected, is the test setup. **The test doesn't contain the internal details of the component, therefore it's easier to refactor the component without having to worry to go back to the test.**

If you're comfortable with the Angular `TestBed`, the added configuration of `render` (the second argument) must feel familiar. That's because `render` is a simple wrapper around the `TestBed` and the API is kept identical, with some smart defaults.

In the test, the `EntitiesService` service is stubbed to prevent that the test makes an actual network request. While we write component tests, we don't want external dependencies to affect the test. Instead, we want to have control over the data. The stub returns the collection of entities that are provided during the test setup. Another possibility would be to use [Mock Service Worker](https://mswjs.io/) (MSW). MSW intercepts network requests and replaces this with a mock implementation. An additional benefit of MSW is that the created mocks can be re-used while serving the application during the development, or during end-to-end tests.

With the basic functionality written, I think it's time to interact with the component.
Let's add a search textbox to filter the entities in the table and adjust the test to verify the logic.

```ts{4, 6, 35-38, 43-48, 50-52}
import {
    render,
    screen,
    waitForElementToBeRemoved,
} from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

it('renders the entities', async () => {
    await render(EntitiesComponent, {
        declarations: [TableComponent],
        providers: [
            {
                provide: EntitiesService,
                value: {
                    fetchAll: jest.fn().mockReturnValue([...])
                }
            }
        ]
    });

    expect(
        screen.getByRole('heading', { name: /Entities Title/i })
    ).toBeInTheDocument();

    expect(
        screen.getByRole('cell', { name: /Entity 1/i })
    ).toBeInTheDocument();
    expect(
        screen.getByRole('cell', { name: /Entity 2/i })
    ).toBeInTheDocument();
    expect(
        screen.getByRole('cell', { name: /Entity 3/i })
    ).toBeInTheDocument();

    userEvent.type(
        screen.getByRole('textbox', { name: /Search entities/i }),
        'Entity 2'
    );

    // depending on the implementation:
    // use waitForElementToBeRemoved to wait until an element is removed
    // otherwise, use the queryBy query
    await waitForElementToBeRemoved(
        () => screen.queryByRole('cell', { name: /Entity 1/i })
    );
    expect(
        screen.queryByRole('cell', { name: /Entity 1/i })
    ).not.toBeInTheDocument();

    expect(
        await screen.findByRole('cell', { name: /Entity 2/i })
    ).toBeInTheDocument();
})
```

To simulate a user that interacts with the component, use the [methods](https://testing-library.com/docs/ecosystem-user-event/#api) on the `userEvent` object.
These methods replicate the events of a real user. For example, for the `type` method, the following events are fired: `focus`, `keyDown`, `keyPress`, `input`, and `keyUp`.
For the events that aren't available on `userEvent`, you can use `fireEvent` from `@testing-library/angular`.
These events are representations of real JavaScript events that are sent to the control.

The test also includes the usage of a new method, `waitForElementToBeRemoved`.
`waitForElementToBeRemoved` must only be used when an element is asynchronously removed from the document.
When the element is immediately removed, you don't have to wait until it's removed, so you can just use the `queryBy` query and assert that the element does not exist in the document. The difference between the `queryBy` and `getBy` queries is that `getBy` throws an error if the DOM element does not exist, while `queryBy` returns `undefined` if the element does not exist.

The test also demonstrates how the `findBy` queries can be used.
These queries can be compared to the`queryBy` queries, but they're asynchronous.
We can use them to wait until an element is added to the document.

> 💡 TIP: To make test cases resilient to small details, I prefer to use the `findBy` queries over the `getBy` queries.

The test remains easy to read after these changes, so let's continue with the next step.

Let's say that for performance reasons the component internal search behavior had to be tweaked, and a delay has been added to the search. In the worst-case scenario, when the delay is high, the existing test will most likely fail due to a timeout. But even if the delay was low enough to not cause a timeout, the test takes longer to run.

As a remedy, we have to introduce fake timers into the test to make time go by faster.
It's a bit more advanced, but it's certainly a good tool to have in your toolbox.
At first, this was tricky for me, but once I got used to it, I started to appreciate this concept more and more.
You also start to feel like a time wizard, which is a great feeling.

The test below uses the fake timers from Jest, but you can also make use of `fakeAsync` and `tick` utility methods from `@angular/core/testing`.

```ts{2,37}
it('renders the table', async () => {
    jest.useFakeTimers();

    await render(EntitiesComponent, {
        declarations: [TableComponent],
        providers: [
            {
            provide: EntitiesService,
            useValue: {
                fetchAll: jest.fn().mockReturnValue(
                of([...]),
                ),
            },
            },
        ],
    });

    expect(
        await screen.findByRole('heading', { name: /Entities Title/i })
    ).toBeInTheDocument();

    expect(
        await screen.findByRole('cell', { name: /Entity 1/i })
    ).toBeInTheDocument();
    expect(
        await screen.findByRole('cell', { name: /Entity 2/i })
    ).toBeInTheDocument();
    expect(
        await screen.findByRole('cell', { name: /Entity 3/i })
    ).toBeInTheDocument();

    userEvent.type(
        await screen.findByRole('textbox', { name: /Search entities/i }),
        'Entity 2'
    );

    // jest.advanceTimersByTime(DEBOUNCE_TIME);
    // better, this test will succeed if the debounce time is increased
    jest.runOnlyPendingTimers();

    await waitForElementToBeRemoved(
        () => screen.queryByRole('cell', { name: /Entity 1/i })
    );
    expect(
        await screen.findByRole('cell', { name: /Entity 2/i })
    ).toBeInTheDocument();
});
```

In the last addition to the component, we're adding two buttons.
One button to create a new entity, and the second button to edit an existing entity.
Both actions result that a modal is opened.
Because we're testing the entities component we don't care about the modal's implementation, that's why the modal is mocked in the test case.
The modal is tested separately.

The test below asserts that the modal service is invoked when a user clicks on these buttons.

```ts{5,6,8,56-59,61-72}
import {
    render,
    screen,
    waitForElementToBeRemoved,
    within,
    waitFor,
} from '@testing-library/angular';
import { provideMock } from '@testing-library/angular/jest-utils';
import userEvent from '@testing-library/user-event';

it('renders the table', async () => {
    jest.useFakeTimers();

    await render(EntitiesComponent, {
        declarations: [TableComponent],
        providers: [
            {
                provide: EntitiesService,
                useValue: {
                    fetchAll: jest.fn().mockReturnValue(of(entities)),
                },
            },
            provideMock(ModalService),
        ],
    });
    const modalMock = TestBed.inject(ModalService);

    expect(
        await screen.findByRole('heading', { name: /Entities Title/i })
    ).toBeInTheDocument();

    expect(
        await screen.findByRole('cell', { name: /Entity 1/i })
    ).toBeInTheDocument();
    expect(
        await screen.findByRole('cell', { name: /Entity 2/i })
    ).toBeInTheDocument();
    expect(
        await screen.findByRole('cell', { name: /Entity 3/i })
    ).toBeInTheDocument();

    userEvent.type(
        await screen.findByRole('textbox', { name: /Search entities/i }),
        'Entity 2'
    );

    jest.advanceTimersByTime(DEBOUNCE_TIME);

    await waitForElementToBeRemoved(
        () => screen.queryByRole('cell', { name: /Entity 1/i })
    );
    expect(
        await screen.findByRole('cell', { name: /Entity 2/i })
    ).toBeInTheDocument();

    userEvent.click(
        await screen.findByRole('button', { name: /New Entity/i })
    );
    expect(modalMock.open).toHaveBeenCalledWith('new entity');

    const row = await screen.findByRole('row', {
        name: /Entity 2/i,
    });
    userEvent.click(
        await within(row).findByRole('button', {
            name: /edit/i,
        }),
    );
    // to have an example, let's say that there's a delay before the modal is opened
    waitFor(() =>
        expect(modalMock.open).toHaveBeenCalledWith('edit entity', 'Entity 2')
    );
});
```

We see a lot of new things in this test, let's take a closer look.

Clicking the "new entity" button is nothing interesting, and we should've already known how to do this.
We use the `userEvent.click` method to simulate a user click on the button.
Next, we verify that the modal service has been invoked with the right arguments.

If we take a close look at the setup of the test, we notice that `provideMock` is used from `@testing-library/angular/jest-utils` to mock a `ModalService`. `provideMock` wraps every method of the provided service with a jest mock implementation.
This makes it quick and easy to assert if a method has been called.

It's a different story for the "edit entity" button, where we can see two new methods, `within` and `waitFor`.

The `within` method is used because there's an edit button for every row in the table.
With `within` we can specify which edit button we want to click, in the test above it's the edit button that corresponds with "Entity 2".

The second method `waitFor`, is used to wait until the assertion inside its callback is successful.
In this example, the component uses a delay between the edit button click event before opening the modal (just to have an example where `waitFor` can be used).
With `waitFor` we can wait till that happens.

## Bonus examples

### Directives

So far, we've only covered component tests.
Luckily, not a lot is different while testing directives.
The only difference is that we have to provide a template to the `render` method.
If you prefer this syntax, you can also use it to render a component.

The rest of the test remains the same.
The test uses the `screen` object and the utility methods to assert that the directive does what it's supposed to do.

For example, the following test renders the `appSpoiler` directive which hides the text content until the element is being hovered.

```ts{2-4}
test('it is possible to test directives', async () => {
    await render('<div appSpoiler data-testid="sut"></div>', {
        declarations: [SpoilerDirective],
    });

    const directive = screen.getByTestId('sut');

    expect(screen.queryByText('I am visible now...')).not.toBeInTheDocument();
    expect(screen.queryByText('SPOILER')).toBeInTheDocument();

    fireEvent.mouseOver(directive);
    expect(screen.queryByText('SPOILER')).not.toBeInTheDocument();
    expect(screen.queryByText('I am visible now...')).toBeInTheDocument();

    fireEvent.mouseLeave(directive);
    expect(screen.queryByText('SPOILER')).toBeInTheDocument();
    expect(screen.queryByText('I am visible now...')).not.toBeInTheDocument();
});
```

### NgRx Store

It took us a while to get component tests "right" that have an interaction with the NgRx Store.
It finally clicked with the addition of [MockStore](https://ngrx.io/api/store/testing/MockStore).

The first version of our tests didn't mock the NgRx Store, and were using the whole NgRx infrastructure (reducers, selectors, effects).
While this setup was testing the whole flow, it also meant that the Store needed to be initialized for every test.
At the start of the project, this was doable but it quickly grew to become an unmanageable mess.

As a fix, developers were resorting to service wrappers around the Store (a facade).
But rewriting your application logic, just for a test, is not a good practice.

Now, with the `MockStore` we have the best of both worlds.
The test is focused on the component, and the NgRx Store details are eliminated from the test.

In the next test, we'll see how to use the `MockStore` in a component test.
It uses the same example component as the previous tests but replaces the entities service and the modal service with the NgRx Store.

To create the store, the `provideMockStore` method is used, in which we can overwrite the results of the selectors that are used within the component.
We can assign a mock to the dispatch method to verify that actions are dispatched.
When needed you can also refresh the result of the selector.

```ts{2, 8-15, 19-23, 25-27}
import { render, screen } from '@testing-library/angular';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

it('renders the table', async () => {
    await render(EntitiesComponent, {
        declarations: [TableComponent],
        providers: [
            provideMockStore({
                selectors: [
                    {
                        selector: fromEntities.selectEntities,
                        value: [...],
                    },
                ],
            }),
        ],
    });

    // create a mock for `dispatch`
    // this mock is used to verify that actions are dispatched
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    expect(store.dispatch).toHaveBeenCalledWith(fromEntities.newEntityClick());

    // provide new result data for the selector
    fromEntities.selectEntities.setResult([...]);
    store.refreshState();
});
```

## Conclusion

Because the tests are written from the user's perspective, they are much more readable and easier to understand.

From my experience, while following this practice the tests are more robust to future changes.
A test is fragile when you test the internal implementation of the component, e.g. how and when (lifecycle) methods are invoked.

Complete test overhauls happen less frequently because this would mean that the UI of the component would've changed drastically. These changes are also visible for an end-user.
At that point, it's probably better to write a new component and to write a new test, instead of trying to modify the existing component and test cases.

The only reason that you would have to change a test after a refactor, is when the component is broken up into multiple components. In this case, you have to add all the new components/modules/services to the input of the affected tests, but the rest of the test remains the same (if the refactor was successful, otherwise, can it even called a refactor?).

> 💡 TIP: If you're following [Single Component Angular Modules](https://dev.to/this-is-angular/emulating-tree-shakable-components-using-single-component-angular-modules-13do), it easier to see when changes have an impact on your tests.

You might have also noticed that I'm writing multiple arrange/act/assert blocks in a single test.
This is a habit that I've picked up from [Kent C. Dodds](https://twitter.com/kentcdodds), for more details I refer you to his blog post ["Write fewer, longer tests"](https://kentcdodds.com/blog/write-fewer-longer-tests).
Because a test initialization is also costly within Angular, this habit also speeds up the execution time of your test suite.

After our team switched to this approach of writing tests, I noticed that new tests were written faster than before.
Simply, because it just clicked to write our tests this way.
Dare I say, it even brought a bit of joy while writing them.

I want to end this blog post with a quote by Sandi Metz, _"Test the interface, not the implementation"_.

If you can't get enough about testing in Angular, I can recommend the following links:

- Different test cases in the [Angular Testing Library Repository](https://github.com/testing-library/angular-testing-library/tree/main/apps/example-app/src/app/examples)
- [Spectacular](https://github.com/ngworker/ngworker/tree/main/packages/spectacular) to lift Angular integration testing to the next level. There's also a stream that shows how to use Spectacular with the Angular Testing Library by [Lars Gyrup Brink Nielsen](https://twitter.com/LayZeeDK), ["Angular After Dark: Integration testing Angular using Spectacular & Angular Testing Library"](https://www.youtube.com/watch?v=2GYD594kN4s&list=PLyY4r1b00A5DeSkFHJXu5OJc-5rVk7Uvk&index=7)
- [Using MSW (Mock Service Worker) in an Angular project](/blog/using-msw-in-an-angular-project)
- [Spectator](https://github.com/ngneat/spectator) an alternative to Angular Testing Library
