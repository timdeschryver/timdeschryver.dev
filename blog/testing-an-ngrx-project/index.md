---
title: Testing an NgRx project
slug: testing-an-ngrx-project
description: How write maintainable NgRx tests within an Angular application
author: Tim Deschryver
date: 2021-11-17
tags: Angular, NgRx, Testing
---

No intro needed, let's directly dive into some code snippets for each part of the Angular application!
Each section includes a code snippet of the relevant part of the application, followed by one or more code snippets to see how we can test it efficiently. Some snippets also put a line in a spotlight (🔦) to showcase best practices.

## Actions

Let's start with the easiest one, which are the NgRx actions.
I don't see any value to test these in isolation, instead, they are tested indirectly when we test the reducers and components.

## Reducers

A reducer is a (synchronous) pure function that is invoked with the current state and an action.
Based on the state and the action, the reducer returns a new state.

Because a reducer is pure, and there are no external dependencies, the test specifications are very simple.
There's no need to configure and mock anything, in a test we invoke the reducer with a predefined state and an action.

Given the state and the action, the assertion asserts that the newly returned state is correct.

```ts:reducer.ts
import { createFeature, createReducer } from '@ngrx/store';
import { immerOn } from 'ngrx-immer';

import { customersApiActions, invoicesApiActions, customerPageActions } from './actions';

export const customersInitialState: {
    customers: Record<string, Customer>;
    invoices: Record<string, Invoice[]>;
} = {
    customers: {},
    invoices: {},
};

// the customersFeature reducer manages the customers and invoices state
// when a customer or the invoices are fetched, these are added to the state
// when the invoices are collected, the state is of the invoice is updated to 'collected'
export const customersFeature = createFeature({
    name: 'customers',
    reducer: createReducer(
        customersInitialState,
        immerOn(customersApiActions.success, (state, action) => {
            state.customers[action.customer.id] = action.customer;
        }),
        immerOn(invoicesApiActions.success, (state, action) => {
            state.invoices[action.customerId] = action.invoices;
        }),
        immerOn(customerPageActions.collected, (state, action) => {
            const invoice = state.invoices[action.customerId].find(
                (invoice) => invoice.id === action.invoiceId,
            );
            if (invoice) {
                invoice.state = 'collected';
            }
        }),
    ),
});
```

Some practices I want to put in the spotlight:

🔦 The usage of the factory method to create new state entities. This creates a single point of entry when the structure of an object changes in the future. It also makes it easy to create an object in a good state, while you can still override the object in specific test cases.

🔦 Test data is assigned to variables (arrange). This data is used to invoke the reducer (act) and to verify the result (assert). Assigning test data to a variable prevents magic values, and later, failing tests when the data is changed.

```ts{12-13,31-32,50-58}:reducer.test.ts
import { customersFeature, customersInitialState } from '../reducer';
import { customersApiActions, invoicesApiActions, customerPageActions } from '../actions';

const { reducer } = customersFeature;

it('customersApiActions.success adds the customer', () => {
    const customer = newCustomer();
    const state = reducer(customersInitialState, customersApiActions.success({ customer }));

    expect(state).toEqual({
        customers: {
            // 🔦 Use the customer variable
            [customer.id]: customer,
        },
        invoices: {},
    });
});

it('invoicesApiActions.success adds the invoices', () => {
    const invoices = [newInvoice(), newInvoice(), newInvoice()];
    const customerId = '3';

    const state = reducer(
        customersInitialState,
        invoicesApiActions.success({ customerId, invoices }),
    );

    expect(state).toEqual({
        customers: {},
        invoices: {
            // 🔦 Use the customerId and invoices variable
            [customerId]: invoices,
        },
    });
});

it('customerPageActions.collected updates the status of the invoice to collected', () => {
    const invoice = newInvoice();
    invoice.state = 'open';
    const customerId = '3';

    const state = reducer(
        { ...customersInitialState, invoices: { [customerId]: [invoice] } },
        customerPageActions.collected({ customerId, invoiceId: invoice.id }),
    );

    expect(state.invoices[customerdId][0]).toBe('collected');
});

// 🔦 A factory method to create a new customer entity (in a valid state)
function newCustomer(): Customer {
    return { id: '1', name: 'Jane' };
}

// 🔦 A factory method to create a new invoice entity (in a valid state)
function newInvoice(): Invoice {
    return { id: '1', total: 100.3 };
}
```

## Selectors

NgRx selectors are pure functions to read a slice from the global store.

I categorize selectors into two groups, selectors that access raw data from the state tree, and selectors that merge data from multiple selectors from the first category and transform it into a useable model.

I never write tests for the selectors from the first category, and I rely on TypeScript to catch my silly mistakes.

The second category has logic in the selectors' projector to transform the data.
It's this logic that is crucial to test.

To test these selectors there are two options:

1. provide the full state tree to the selector, this also tests the logic of child selectors
1. invoke the selector's projector method with input parameters, this only tests the project itself

The first option covers more production code, but in my experience, it also has a higher maintenance cost.
That's why I prefer to use the latter.

A selector test isn't complex.
The test invokes the selector's projector method with a given input and verifies its output.

```ts:selectors.ts
import { createSelector } from '@ngrx/store';
import { fromRouter } from '../routing';
import { customersFeature } from './reducer.ts';

// the selector reads the current customer id from the router url
// based on the customer id, the customer and the customer's invoices are retrieved
// the selector returns the current customer with the linked invoices
export const selectCurrentCustomerWithInvoices = createSelector(
    fromRouter.selectCustomerId,
    customersFeature.selectCustomers,
    customersFeature.selectInvoices,
    (customerId, customers, invoices) => {
        if (!customerId) {
            return null;
        }

        const customer = customers[customerId];
        const invoicesForCustomer = invoices[customerId];

        return {
            customer,
            invoices: invoicesForCustomer,
        };
    },
);
```

```ts:selectors.test.ts
import { selectCurrentCustomerWithInvoices } from '../selectors';

it('selects the current customer with linked invoices', () => {
    const customer = newCustomer();
    const invoices = [newInvoice(), newInvoice()];

    const result = selectCurrentCustomerWithInvoices.projector(customer.id, {
        customers: {
            [customer.id]: customer,
        },
        invoices: {
            [customer.id]: invoices,
        },
    });

    expect(result).toEqual({ customer, invoices });
});

function newCustomer(): Customer {
    return { id: '1', name: 'Jane' };
}

function newInvoice(): Invoice {
    return { id: '1', total: 100.3 };
}
```

## Effects

Effects handle all the side-effects of the application.
These are usually asynchronous operations, for example an effect that makes an HTTP request.

Testing NgRx effects is where things are starting to get interesting because this is where, for the first time, (external) dependencies are involved.

To keep effect tests simple and fast, I prefer to not rely on the dependency container of Angular to provide and inject the dependencies with the Angular `TestBed`.
Instead, I like to instantiate the new effect class manually and provide all of the dependencies myself.
That also means that some dependencies are going to be mocked, In the next snippets I'm using jest to create mocks.

Most of the effect tests that I write are not using the marble diagram syntax to verify the output of an effect.
This, not only to keep things as simple as possible but also because it makes sure that we test the right things. **We want to test the effect flow, not the internal details of the effect implementation**.
Frankly said, we shouldn't care about which higher-order mapping operator is used, nor should we care if time-based operators are used to wait on a trigger, for example, the `delay`, `throttle`, and `delay` RxJS operators. We can assume that these behave as expected because these are tested within the RxJS codebase.

Effect tests can become complex, so let's start with a simple example to cover the basics.
Afterward, we are going to explore some more advanced effect scenarios.

### Effects that use Actions and Services

The simple example covers the most common ground and makes an HTTP request when the effect receives an action.
The effect class gets the `Actions` stream and a service (that acts as a wrapper around HTTP requests) injected into the effect class.

```ts:effect.ts
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { customersApiActions, customerPageActions } from '../actions';
import { CustomerService } from './customer.service';

@Injectable()
export class CustomerEffects {
    // the effect initiates a request to the customers service when the page is entered
    // depending on the response, the effect dispatches a success or failure action
    fetch$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(customerPageActions.enter),
            switchMap((action) =>
                this.customerService.getById(action.customerId).pipe(
                    map((customer) => customersApiActions.fetchCustomerSuccess({ customer })),
                    catchError(() => of(customersApiActions.fetchCustomerError({ customerId }))),
                ),
            ),
        );
    });

    constructor(private actions$: Actions, private customerService: CustomerService) {}
}
```

Before the `fetch$` effect can be tested we need to create a new instance of the Effect class, which requires the `Actions` stream and a `CustomerService`.

Since the service is under our ownership, it's easy to create a mocked instance. This is needed to prevent the effect from calling the real service and making HTTP requests.

The `Actions` is a bit more complicated.
Because [it's a typed observable](https://github.com/ngrx/platform/blob/master/modules/effects/src/actions.ts), it doesn't make it easy to be mocked.
Spawning a new observable also doesn't provide a solution because we need to send actions to the effect during the test in order to trigger it.
So what about using a `Subject`? This is a good choice, but it requires that we type the `Subject` to only accept actions, so it becomes `Subject<Action>`. While this works, it is not very convenient. Instead, I like to use the `ActionsSubject` stream (from @ngrx/store), which a [typed Actions subject](https://github.com/ngrx/platform/blob/master/modules/store/src/actions_subject.ts).

Now, we're able to create a new effect instance, and we can send actions to the effect under test.
The only thing left before we can test the effect is to get the output of an effect.
For that, we subscribe to the effect and capture the emitted actions.

```ts{7-9,11-15,59-66}:effect.test.ts
import { ActionsSubject, Action } from '@ngrx/store';
import { CustomersEffects } from '../customers.effects';
import { CustomerService } from '../customer.service';
import { customersApiActions, customerPageActions } from '../actions';

it('fetch$ dispatches a success action', () => {
    // 🔦 The Effect Actions stream is created by instantiating a new `ActionsSubject`
    const actions = new ActionsSubject();
    const effects = new CustomersEffects(actions, newCustomerService());

    // 🔦 Subscribe on the effect to catch emitted actions, which are used to assert the effect output
    const result: Action[] = [];
    effects.fetch$.subscribe((action) => {
        result.push(action);
    });

    const action = customerPageActions.enter({ customerId: '3' });
    actions.next(action);

    expect(result).toEqual([
        customersApiActions.fetchCustomerSuccess(
            newCustomer({
                id: action.customerId,
            }),
        ),
    ]);
});

it('fetch$ dispatches an error action on failure', () => {
    //  🔦 The actions stream is created by instantiating a new `ActionsSubject`
    const actions = new ActionsSubject();
    let customerService = newCustomerService();
    // 🔦 Service method is test specific
    customerService.getById = (customerId: number) => {
        return throwError('Yikes.');
    };

    const effects = new CustomersEffects(actions, customerService());

    const result: Action[] = [];
    effects.fetch$.subscribe((action) => {
        result.push(action);
    });

    const action = customerPageActions.enter({ customerId: '3' });
    actions.next(action);

    expect(result).toEqual([
        customersApiActions.fetchCustomerError({
            customerId: action.customerId,
        }),
    ]);
});

function newCustomer({ id = '1' } = {}): Customer {
    return { id, name: 'Jane' };
}

// 🔦 Service instances are mocked to prevent that HTTP requests are made
function newCustomerService(): CustomerService {
    return {
        getById: (customerId: number) => {
            return of(newCustomer({ id: customerId }));
        },
    };
}
```

### Effect tests rewritten with observer-spy

The above tests have a couple of drawbacks.

A minor drawback is that each test includes boilerplate code to catch the emitted actions. As a countermeasure, we can write a small utility method that catches all emitted actions.

But the major drawback is that the execution time of the test is affected by the time it takes to execute the effect. For effects that rely on time-based operators, this can be a problem. In its best case, this slows down the test. At its worst, it can lead to failing tests because the test exceeds the timeout limit.

Here's where the [observer-spy](https://github.com/hirezio/observer-spy) library \_- thanks to [Shai Reznik](https://twitter.com/shai_reznik) for creating this library -\_ comes into play. With observer-spy, we can subscribe to an observable stream, "flush" all pending tasks, and lastly, read the emitted values.

To use observer-spy in a test, we have to make small modifications to the test:

1. subscribe to the effect with `subscribeSpyTo`
1. if the test is time-sensitive, wrap the test callback with the `fakeTime` function
1. if the test is time-sensitive, invoke the `flush` function to fast-forward the time and handle all pending jobs
1. use the `getValues` function on the subscribed spy to verify the emitted actions

```ts{1,10,14,18,20-26}:effect.test.ts
import { subscribeSpyTo, fakeTime } from '@hirez_io/observer-spy';
import { ActionsSubject, Action } from '@ngrx/store';
import { throwError } from 'rxjs';
import { CustomerService } from '../customer.service';
import { CustomersEffects } from '../effects';
import { customersApiActions, customerPageActions } from '../actions';

it(
    'fetch$ dispatches success action',
    fakeTime((flush) => {
        const actions = new ActionsSubject();
        const effects = new CustomersEffects(actions, newCustomerService());

        const observerSpy = subscribeSpyTo(effects.fetch$);

        const action = customerPageActions.enter({ customerId: '3' });
        actions.next(action);
        flush();

        expect(observerSpy.getValues()).toEqual([
            customersApiActions.fetchCustomerSuccess(
                newCustomer({
                    id: action.customerId,
                }),
            ),
        ]);
    }),
);

function newCustomer({ id = '1' } = {}): Customer {
    return { id, name: 'Jane' };
}

function newCustomerService(): CustomerService {
    return {
        getById: (customerId: number) => {
            return of(newCustomer({ id: customerId }));
        },
    };
}
```

### Effect tests and fake timers

If bringing a library just for making these test easy is not your cup of tea, the other option is to use fake timers. This is a solution that isn't framework/library specific. The examples in this post are using [Jest fake timers](https://jestjs.io/docs/timer-mocks).

It looks similar to your ["default" effect tests](#effects-that-use-actions-and-services), but you get to play a time wizard because you'll have to advance the time by using your magic powers.

In contrast to observer-spy _, where you need to subscribe on an Observable stream to flush all pending tasks,_ fake timers allows you to forward the time for all pending tasks. This is useful when you can't subscribe to a source, for example in a component.

With fake timers there are three possibilities to advance the time:

- `advanceTimersByTime`: to advance time by a certain amount of milliseconds
- `runOnlyPendingTimers`: to advance the time until the current tasks are finished
- `runAllTimers`: to advance time until all tasks are finished

Some practices I want to put in the spotlight:

🔦 to make tests less brittle, wait for the pending task(s) to finish with `runOnlyPendingTimers` or `runAllTimers` instead of advancing the time with `advanceTimersByTime`. This makes sure that the test isn't impacted when the duration is modified.

```ts{3, 7,22-24}:effect.test.ts
afterEach(() => {
    // don't forget to reset the timers
    jest.useRealTimers();
});

it('fetch$ dispatches success action with fake timers', () => {
    jest.useFakeTimers();

    const actions = new ActionsSubject();
    const effects = new WerknemersEffects(actions, getMockStore(), newWerknemerService());

    const result: Action[] = [];
    effects.fetch$.subscribe((action) => {
        result.push(action);
    });

    const action = werknemerActions.missingWerknemerOpened({ werknemerId: 3 });
    actions.next(action);

    jest.advanceTimersByTime(10_000);

    // 🔦 to make tests less brittle, wait for the task to finish with `runOnlyPendingTimers` or `runOnlyPendingTimers` instead of advancing the time with `advanceTimersByTime`.
    // This makes sure that the test isn't impacted when the duration is modified.
    jest.runOnlyPendingTimers();

    expect(result).toEqual([
        werknemerActions.fetchWerknemerSuccess({
            werknemer: newWerknemer({ id: action.werknemerId }),
        }),
    ]);
});
```

### Effects that don't dispatch actions

So far we've seen effects that result in actions being dispatched, but as you probably already know, some effects don't dispatch an action (with the `dispatch: false` option).

To verify that these non-dispatching effects are doing what they're supposed to do, we can reuse 90% of a test, and modify the assertion. Instead of checking the emitted actions, we verify that a side-effect has been executed.

For example, the below test verifies that an action results in a notification.

```ts:effect.test.ts
import { ActionsSubject, Action } from '@ngrx/store';
import { throwError } from 'rxjs';
import { BackgroundEffects } from '../background.effects';
import { NotificationsService } from '../notifications.service';
import { backgroundSocketActions } from '../actions';

it('it shows a notification on done', () => {
    const notifications = newNotificationsService();
    const actions = new ActionsSubject();
    const effects = new BackgroundEffects(actions, notifications);

    effects.done$.subscribe();

    const action = backgroundSocketActions.done({ message: 'I am a message' });
    actions.next(action);

    expect(notifications.info).toHaveBeenCalledWith(action.message);
});

function newNotificationsService(): NotificationsService {
    return {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    };
}
```

To test that the `dispatch` config option is set to `false` we use the `getEffectsMetadata` method, which returns the configuration of all effects in a class. Next, we can access the config options of the effect we want to test, in this case, the `done$` member.

```ts{2,18}:effect.test.ts
import { ActionsSubject, Action } from '@ngrx/store';
import { getEffectsMetadata } from '@ngrx/effects';
import { throwError } from 'rxjs';
import { BackgroundEffects } from '../background.effects';
import { NotificationsService } from '../notifications.service';
import { backgroundSocketActions } from '../actions';

it('it shows a notification on done', () => {
    const notifications = newNotificationsService();
    const actions = new ActionsSubject();
    const effects = new BackgroundEffects(actions, notifications);

    effects.done$.subscribe();

    const action = backgroundSocketActions.done({ message: 'I am a message' });
    actions.next(action);

    expect(getEffectsMetadata(effects).done$.dispatch).toBe(false);
    expect(notifications.info).toHaveBeenCalledWith(action.message);
});

function newNotificationsService(): NotificationsService {
    return {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    };
}
```

### Effects that use the NgRx Global Store

[NgRx v11](https://github.com/ngrx/platform/blob/master/CHANGELOG.md#features-11) included a new method `getMockStore` (imported from `@ngrx/store/testing`) to new up a new mock store instance. This is perfect for our use case, as we can use `getMockStore` to prevent using the Angular TestBed for testing NgRx Effects. Meaning that we can keep the setup to all of our effects the same.

As an example, let's take an effect that only instantiates a new HTTP request for entities that are not in the store. To read from the store, the effect uses a selector to retrieve the entities from the store.
The implementation of such an effect can be found in another blog post, [Start using NgRx Effects for this](/blog/start-using-ngrx-effects-for-this#enhance-your-action-with-global-store-state).

The test below uses `getMockStore` to mock the ngrx store.
`getMockStore` accepts a configuration object to "mock" the selectors.
To do so, define the selectors that are used in the effect and assign them the desired return value.

When a return value is assigned to a selector, the logic of the selector isn't executed, but the given value is simply returned.
The rest of the test remains untouched.

```ts{2,11-13}:effect.test.ts
import { ActionsSubject, Action } from '@ngrx/store';
import { getMockStore } from '@ngrx/store/testing';
import { CustomersEffects } from '../customers.effects';
import { CustomerService } from '../customer.service';
import { customersApiActions, customerPageActions } from '../actions';

it('fetch$ dispatches success action', () => {
    const actions = new ActionsSubject();
    const effects = new CustomersEffects(
        actions,
        getMockStore({
            selectors: [{ selector: selectCustomerIds, value: [1, 3, 4] }],
        }),
        newCustomerService(),
    );

  const result: Action[] = []
  effects.fetch$.subscribe((action) => {
    result.push(action)
  })

    const existingAction = customerPageActions.enter({ customerId: 1 });
    const newAction1 = customerPageActions.enter({ customerId: 2 });
    const newAction2 = customerPageActions.enter({ customerId: 5 });
    actions.next(existingAction);
    actions.next(newAction1);
    actions.next(newAction2);

    expect(result).toEqual([
        customersApiActions.fetchCustomerSuccess(newCustomer({ id: newAction1.customerId })),
        customersApiActions.fetchCustomerSuccess(newCustomer({ id: newAction2.customerId })),
    ]);
});
```

### Effects that use the Angular Router

Manually creating a new instance of the Router is difficult and tedious.
Sadly, it also doesn't have a simple method to create a new instance outside of the Angular TestBed.

So how do we go about this?
We could create a minimal implementation of the Router and just mock the methods that we need, or we could use a library that automatically creates spy implementations for all members and methods of a given type, in our example, the Router.

The test below verifies that the window's title is updated when the user navigates to a different route.

In the example, we use the `createMock` method from the [Angular Testing Library](https://github.com/testing-library/angular-testing-library) (import from `@testing-library/angular/jest-utils`) to create a mock instance of the `Title` service.

The test also uses `createMockWithValues` to set a custom implementation for the router events. This way, we're able to emit new navigation events later to trigger the effect. The implementation of such an effect can be found in another blog post, [Start using NgRx Effects for this](/blog/start-using-ngrx-effects-for-this#change-the-windows-title).

The test below verifies that the window title is updated upon a router navigation.

```ts:effect.test.ts
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { createMock, createMockWithValues } from '@testing-library/angular/jest-utils';
import { Subject } from 'rxjs';
import { RoutingEffects } from '../routing.effects';

it('sets the title to the route data title', () => {
    const routerEvents = new Subject<RouterEvent>();
    const router = createMockWithValues(Router, {
        events: routerEvents,
    });

    const title = createMock(Title);
    const effect = new RoutingEffects(
        router,
        {
            firstChild: {
                snapshot: {
                    data: {
                        title: 'Test Title',
                    },
                },
            },
        } as any,
        title,
    );

    effect.title$.subscribe()

    routerEvents.next(new NavigationEnd(1, '', ''));
    expect(title.setTitle).toHaveBeenCalledWith('Test Title');
});
```

## Components With Global Store

With most of the logic pulled outside of the component, we're left with a small component that doesn't require a lot of dependencies to be tested. There's also a big chance that you're splitting your components into two categories: containers, and presentational components.

In this post, we'll focus on containers because these are the ones that interact with the NgRx global store. If you want to become more familiar with testing presentational components, I got another post for you, [Getting the most value out of your Angular Component Tests](/blog/getting-the-most-value-out-of-your-angular-component-tests).

To test containers components, we again have two options.

One option is to treat a component test as an integration test.
This means that real implementations of selectors, reducers, and effects are used, but that all communications with external services are mocked. Following the "don't test implementation details" best practice, this seems like the best option. But in this case, I would advise not to do it, because the test is going to be brittle and have a complex setup. The setup is hard because you have to configure the store, you need to know the details of all dependencies, and you have to maintain the state tree.

This is the opposite of what we're trying to achieve here.
We want our test to help us develop and maintain an application, not a test that no one understands and wants to touch. Maintaining such a test might take up more time than developing new features.

The second option is to just test the component itself and the interaction with the store, a unit test.
To verify the store interaction we use a mocked store because this prevents that reducers and effects are invoked.

From my experience, writing unit tests for container components is the most productive approach while we can still be confident in the code that we write.
Because there are focussed unit tests on the reducers, selectors, effects, and containers the tests themselves are easier to reason about.

Testing a component requires, for the first time, the usage of the Angular `TestBed`.

Here again, we're using the [Angular Testing Library](https://github.com/testing-library/angular-testing-library). While the Angular Testing Library helps us to make the setup and the component interaction easier, it also guides us to create user-friendly components.
A win-win situation for everyone.

To inject the store into the component, the `provideMockStore` method (imported from `@ngrx/store/testing`) is used and is configured as an Angular provider.

As an example, let's take a look at a component that displays a customer.
The component reads the customer from the store with the `selectCustomerWithOrders` selector and displays the customer and the customer's orders on the page. There's also a refresh button that dispatches a `customersPageActions.refresh` action to the store.

```ts:component.ts
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCustomerWithOrders } from './selectors';
import { customersPageActions } from './actions';

@Component({
    selector: 'app-customer-page',
    template: `
        <ng-container *ngIf="customer$ | async as customer">
            <h2>Customer: {{ customer.name }}</h2>
            <button (click)="refresh(customer.id)">Refresh</button>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let order of customer.orders">
                        <td>{{ order.date }}</td>
                        <td>{{ order.amount }}</td>
                        <td>{{ order.status }}</td>
                    </tr>
                </tbody>
            </table>
        </ng-container>
    `,
})
export class CustomersSearchPageComponent {
    customer$ = this.store.select(selectCustomerWithOrders);

    constructor(private store: Store) {}

    refresh(customerId: string) {
        this.store.dispatch(customersPageActions.refresh({ customerId }));
    }
}
```

The test to check that the customer's name is displayed correctly looks as follows.
The important part here is that a mock store is provided, and while doing so, that the selector is provided a mocked return value. This prevents that we have to configure the whole store, and we can simply provide what is needed. This keeps the test readable and compact.

Some practices I want to put in the spotlight:

🔦 toBeVisible is a custom jest matcher from [jest-dom](https://testing-library.com/docs/ecosystem-jest-dom/)

🔦 [Testing With SIFERS](https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b362) by [Moshe Kolodny](https://twitter.com/mkldny) to promote test setups

```ts{14-15,17-22,38-48}:component.test.ts
import { provideMockStore } from '@ngrx/store/testing';
import { render, screen } from '@testing-library/angular';
import { selectCustomerWithOrders, CustomerWithOrders } from '../selectors';
import type { CustomerWithOrders } from '../selectors';
import { customersPageActions } from '../actions';

it('renders the customer with her orders', async () => {
    const customer = newCustomer();
    customer.orders = [
        { date: '2020-01-01', amount: 100, status: 'canceled' },
        { date: '2020-01-02', amount: 120, status: 'shipped' },
    ];

    // 🔦 Testing With SIFERS by Moshe Kolodny https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b36
    await setup(customer);

    // 🔦 toBeVisible is a custom jest matcher from jest-dom
    expect(
        screen.getByRole('heading', {
            name: new RegExp(customer.name, 'i'),
        }),
    ).toBeVisible();

    // the table header is included
    expect(screen.getAllByRole('row')).toHaveLength(3);

    screen.getByRole('cell', {
        name: customer.orders[0].date,
    });
    screen.getByRole('cell', {
        name: customer.orders[0].amount,
    });
    screen.getByRole('cell', {
        name: customer.orders[0].status,
    });
});

// 🔦 Testing With SIFERS by Moshe Kolodny https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b362
async function setup(customer: CustomerWithOrders) {
    await render('<app-customer-page></app-customer-page>', {
        imports: [CustomerPageModule],
        providers: [
            provideMockStore({
                selectors: [{ selector: selectCustomerWithOrders, value: customer }],
            }),
        ],
    });
}

function newCustomer(): CustomerWithOrders {
    return {
        id: '1',
        name: 'Jane',
        orders: [],
    };
}
```

The above example verifies that the component renders correctly.
Next, we'll see how we can assert that an action is dispatched to the store, in this example when the refresh button is clicked.

To assert that the component sends the refresh action to the store, we're assigning a spy to the `dispatch` method of the store. We use this spy in the assertion to verify that the action is dispatched.

```ts{59-61}:component.test.ts
import { provideMockStore } from '@ngrx/store/testing';
import { render, screen } from '@testing-library/angular';
import { selectCustomerWithOrders, CustomerWithOrders } from '../selectors';
import type { CustomerWithOrders } from '../selectors';
import { customersPageActions } from '../actions';

it('renders the customer name', async () => {
    const customer = newCustomer();
    customer.orders = [
        { date: '2020-01-01', amount: 100, status: 'canceled' },
        { date: '2020-01-02', amount: 120, status: 'shipped' },
    ];

    // 🔦 Testing With SIFERS by Moshe Kolodny https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b362
    const { dispatchSpy } = await setup(customer);

    // 🔦 toBeVisible is a custom jest matcher from jest-dom
    expect(
        screen.getByRole('heading', {
            name: new RegExp(customer.name, 'i'),
        }),
    ).toBeVisible();

    // the table header is included
    expect(screen.getAllByRole('row')).toHaveLength(3);

    screen.getByRole('cell', {
        name: customer.orders[0].date,
    });
    screen.getByRole('cell', {
        name: customer.orders[0].amount,
    });
    screen.getByRole('cell', {
        name: customer.orders[0].status,
    });

    userEvent.click(
        screen.getByRole('button', {
            name: /refresh/i,
        }),
    );

    expect(dispatchSpy).toHaveBeenCalledWith(
        customersPageActions.refresh({ customerId: customer.id }),
    );
});

// 🔦 Testing With SIFERS by Moshe Kolodny https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b362
async function setup(customer: CustomerWithOrders) {
    await render('<app-customer-page></app-customer-page>', {
        imports: [CustomerPageModule],
        providers: [
            provideMockStore({
                selectors: [{ selector: selectCustomerWithOrders, value: customer }],
            }),
        ],
    });

    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    return { dispatchSpy: store.dispatch };
}

function newCustomer(): CustomerWithOrders {
    return {
        id: '1',
        name: 'Jane',
        orders: [],
    };
}
```

## Component Store

In contrast with the global NgRx store, a component store is strongly coupled to the component.
That's the reason why I prefer to see the component store as an implementation detail and thus I almost don't mock the component store during tests. Because the test is using the real implementation of the component store some of the dependencies of the component store must be mocked to prevent communication with the external world.

In the following example, there's a `CustomersSearchStore` that is used in the `CustomersSearchPageComponent` component.
The store holds the customers' state and makes an HTTP request to fetch the customers.
The component uses the store to render the customers in the view.

```ts:store.ts
import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Observable, delay, switchMap } from 'rxjs';
import { CustomersService } from './services';
import { Customer } from './models';

export interface CustomersSearchState {
    customers: Customer[];
}

@Injectable()
export class CustomersSearchStore extends ComponentStore<CustomersSearchState> {
    constructor(private readonly customersService: CustomersService) {
        super({ customers: [] });
    }

    readonly customers$ = this.select((state) => state.customers);

    setCustomers(customers: Customer[]) {
        this.patchState({ customers });
    }

    clearCustomers() {
        this.patchState({ customers: [] });
    }

    readonly search = this.effect((trigger$: Observable<string>) => {
        return trigger$.pipe(
            delay(1000),
            switchMap((query) =>
                this.customersService.search(query).pipe(
                    tapResponse(
                        (customers) => this.setCustomers(customers),
                        () => this.clearCustomers(),
                    ),
                ),
            ),
        );
    });
}
```

```ts:component.ts
import { Component } from '@angular/core';
import { CustomersSearchStore } from './customers-search.store';

@Component({
    template: `
        <input type="search" #query />
        <button (click)="search(query.value)">Search</button>

        <a *ngFor="let customer of customers$ | async" [routerLink]="['customer', customer.id]">
            {{ customer.name }}
        </a>
    `,
    providers: [CustomersSearchStore],
})
export class CustomersSearchPageComponent {
    customers$ = this.customersStore.customers$;

    constructor(private readonly customersStore: CustomersSearchStore) {}

    search(query: string) {
        this.customersStore.search(query);
    }
}
```

To get to know the difference between an integration test and a unit test, we're going to write the same tests for the component.

### Integration tests

The integration test verifies that the component and the component store are integrated correctly.
If you've followed the examples in the previous sections, the next test is going to read easily.

The component test is written with the help of [Angular Testing Library](https://github.com/testing-library/angular-testing-library).
During the setup, we provide a mock for the `CustomersService` service, which is a dependency from the component store.
For the rest of the test, we replicate a user interaction with the store and assert that the right things are rendered.
Because the search query has a delay, the test uses Jest fake timers to forward the elapsed time.

These kinds of tests tend to be longer than you're used to and these are going to verify multiple assertions.
This is totally fine. It's even desired to write tests like this if you're using the (Angular) Testing Library.

```ts:component.test.ts
import { RouterTestingModule } from '@angular/router/testing';
import { render, screen } from '@testing-library/angular';
import { provideMockWithValues } from '@testing-library/angular/jest-utils';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { CustomersSearchPageComponent } from '../customers-search.component';
import { Customer } from '../models';
import { CustomersService } from '../services';

afterEach(() => {
    jest.useRealTimers();
});

it('fires a search and renders the retrieved customers', async () => {
    jest.useFakeTimers();

    await setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    userEvent.type(screen.getByRole('searchbox'), 'query');

    userEvent.click(
        screen.getByRole('button', {
            name: /search/i,
        }),
    );

    jest.runOnlyPendingTimers();

    const link = await screen.findByRole('link', {
        name: /query/i,
    });
    expect(link).toHaveAttribute('href', '/customer/1');
});

async function setup() {
    await render(CustomersSearchPageComponent, {
        imports: [RouterTestingModule.withRoutes([])],
        providers: [
            provideMockWithValues(CustomersService, {
                search: jest.fn((query) => {
                    return of([newCustomer(query)]);
                }),
            }),
        ],
    });
}

function newCustomer(name = 'customer'): Customer {
    return {
        id: '1',
        name,
    };
}
```

### Unit tests

For component stores that are complex and/or require more dependencies, it might be easier and better to unit test the component store and the component separately. Doing this makes it easier to test specific cases. The test suite also going to run faster because the component doesn't need to be rendered to execute component store tests, of which you will write most specifications.

Just like testing the global store, you only write a few component tests that rely on a component store. These make sure that the interaction between the component and the component store is correct.

#### Component store unit tests

You're going to write many (small) tests to make sure that each method of the component store behaves correctly.
Most of them are updating the state of the component store to assert that the state is in the correct shape.

```ts:store.test.ts
import { createMockWithValues } from '@testing-library/angular/jest-utils';
import { of, throwError } from 'rxjs';
import { Customer, CustomersSearchStore } from '../customers-search.store';
import { CustomersService } from '../services';

afterEach(() => {
    jest.useRealTimers();
});

it('initializes with no customers', async () => {
    const { customers } = setup();
    expect(customers).toHaveLength(0);
});

it('search fills the state with customers', () => {
    jest.useFakeTimers();
    const { store, customers, service } = setup();
    const query = 'john';

    store.search(query);
    jest.runOnlyPendingTimers();

    expect(service.search).toHaveBeenCalledWith(query);
    expect(customers).toHaveLength(1);
});

it('search error empties the state', () => {
    jest.useFakeTimers();
    const { store, customers } = setup(() => throwError('Yikes.'));
    store.setState({ customers: [newCustomer()] });

    store.search('john');
    jest.runOnlyPendingTimers();

    expect(customers).toHaveLength(0);
});

it('clearCustomers empties the state', () => {
    const { store, customers } = setup();
    store.setState({ customers: [newCustomer()] });

    store.clearCustomers();

    expect(customers).toHaveLength(0);
});

function setup(customersSearch = (query: string) => of([newCustomer(query)])) {
    const service = createMockWithValues(CustomersService, {
        search: jest.fn(customersSearch),
    });
    const store = new CustomersSearchStore(service);

    let customers: Customer[] = [];
    store.customers$.subscribe((state) => {
        customers.length = 0;
        customers.push(...state);
    });

    return { store, customers, service };
}

function newCustomer(name = 'customer'): Customer {
    return {
        id: '1',
        name,
    };
}
```

#### Component unit tests that use the component store

In comparison to component store tests, we only have a few component tests that rely on the component store.
These tests are also smaller in comparison to the component tests that use the real implementation of the component store.
Instead of using the real implementation of the component store, the component store is mocked during the setup.
Because the component store is provided at the component level, the mocked store instance needs to be provided in the `componentProviders` array.

The component tests can be divided into two groups, one that renders the current state, and the other that invoke component store methods.

For the first group, we assign a predefined result to the select members of the component store.
After the component is rendered, the test takes a look at the component and verifies that the view is correct.

The second group of tests are assigning spies to the component store methods, which are used to check that the component store method is invoked after interacting with the component.

```ts:component.test.ts
import { RouterTestingModule } from '@angular/router/testing';
import { render, screen } from '@testing-library/angular';
import { createMockWithValues } from '@testing-library/angular/jest-utils';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { CustomersSearchPageComponent } from '../customers-search.component';
import { Customer, CustomersSearchStore } from '../customers-search.store';

it('renders the customers', async () => {
    await setup();

    const link = await screen.findByRole('link', {
        name: /customer/i,
    });
    expect(link).toHaveAttribute('href', '/customer/1');
});

it('invokes the search method', async () => {
    const { store } = await setup();
    const query = 'john';

    userEvent.type(screen.getByRole('searchbox'), query);

    userEvent.click(
        screen.getByRole('button', {
            name: /search/i,
        }),
    );

    expect(store.search).toHaveBeenCalledWith(query);
});

async function setup() {
    const store = createMockWithValues(CustomersSearchStore, {
        customers$: of([newCustomer()]),
        search: jest.fn(),
    });

    await render(CustomersSearchPageComponent, {
        imports: [RouterTestingModule.withRoutes([])],
        componentProviders: [
            {
                provide: CustomersSearchStore,
                useValue: store,
            },
        ],
    });

    return { store };
}

function newCustomer(): Customer {
    return {
        id: '1',
        name: 'name',
    };
}
```

## Conclusion

Writing tests for an Angular application doesn't have to be a chore.
When the tests are written correctly, they are used to verify the correctness of the application while they don't hold you back on building new features or changing existing features.

For me, the ideal test is a test that mocks as little as possible and keeps the setup simple.
This makes sure that the test is easier to maintain.

To make the tests in this post as simple as possible, the Angular TestBed is avoided.

Reducers are called with a predefined state and an action in the test. The test then verifies that the returned state is correct.

Selectors that contain logic are tested with the `projector` method. Instead of providing the state tree and invoking child selectors, we invoke the `projector` with the return values of the child selectors. The result is then asserted against the expected value.

Effect tests are written without the Angular TestBed. We create the effect instance manually and mock its dependencies. The effect that is being tested is subscribed to catch all of the emitted actions, which are then checked. To trigger the effect we send a new action to the `ActionsSubject`.

Components that use the global store are tested with the help of the [Angular Testing Library](https://github.com/testing-library/angular-testing-library). In component tests, we don't use the real store instead, but we use a mocked store.

Components with the component store have two kinds of tests, unit tests, and integration tests. I prefer to write integration tests, but when they become too complex, I prefer to write unit tests.
Integration tests use the real store and mock the component store dependencies.
Unit tests are written on the component store, and additionally on the component while providing a mocked component store instance.

Happy testing!
