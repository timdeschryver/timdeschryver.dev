---
title: Writing resilient Angular Component tests (that use HttpResource) with HttpTestingController
slug: writing-resilient-angular-component-tests-that-use-httpresource-with-httptestingcontroller
description: What if I told you that after all this time, we've been writing Angular Component tests wrong? In this post I will show you the benefit of HttpTestingController to test Angular components that consume a backend API.
date: 2025-03-31
tags: Angular, Angular Testing Library
---

Many (all?) Angular projects make use of services to encapsulate logic to interact with a backend API through HTTP requests.
In this picture setup, the service's sole responsibility is to invoke HTTP requests through the HTTP client (or as we'll later see, something else).
A component can inject the service to interact with the backend API, without knowledge of the underlying implementation.

This practice separates the concerns of the services and the components, which can be seen while writing the test cases.
Having a service as a wrapper around the HTTP traffic also allows us to easily mock the service implementation in our tests in order to prevent actual HTTP requests, enabling us to test the components in isolation.

## The current approach

I believe many projects (myself included) are currently mocking the service, and are returning an `Observable` containing the desired data.
This is done by either mocking the service manually, using Jasmine's or Jest's spy objects, or using a library like `ng-mocks` to automatically mock an Angular service.

For example, let's say we have a component that uses the `CustomersService` to fetch customer details from an API.
The service might look like this, pay attention to the return type of the `getCustomerDetails` method, which is `Observable<CustomerDetails>`.

```ts:customers.service.ts
@Injectable({
	providedIn: 'root',
})
export class CustomersService {
	private http = inject(HttpClient);

	public getCustomerDetails(id: number): Observable<CustomerDetails> {
		return this.http.get<CustomerDetails>(`/api/customers/${id}`);
	}
}
```

In the component test (which is written using [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/)), the `CustomersService` is mocked to return an observable with the predefined data.

```ts{3-4, 7-12}:customer-details.component.spec.ts
it('renders customer details', () => {
	const customer = { id: 1, name: 'John Doe' };
	const customersServiceMock = jasmine.createSpyObj('CustomersService', ['getCustomerDetails']);
	customersServiceMock.getCustomerDetails.and.returnValue(of(customer));

	await render(CustomerComponent, {
		providers: [
			{
				provide: CustomersService,
				useValue: customersServiceMock,
			},
		],
	});

	expect(await screen.findByText('John Doe')).toBeInTheDocument();
});
```

This works, but it might not work as well when using the new Angular [`httpResource` API](https://angular.dev/api/common/http/httpResource).

## Test drawbacks while using `httpResource`

When we swap out the `Observable` return value for an `HttpResourceRef` (which is what `httpResource` returns), we need some more work to mock the retuning value.

If you don't know already, [`HttpResourceRef`](https://angular.dev/api/common/http/HttpResourceRef) is a wrapper designed to provide a more structured way to handle HTTP responses, including loading states and error handling. Because it's a wrapper, it means we cannot simply return the data, but we need to implement the `HttpResourceRef` wrapper around the data.

This change requires us to create a mock object that accurately reflects the structure of the `HttpResourceRef` response, ensuring that all necessary properties are included for our component to function correctly. If you want to, it's possible to make it yourself easy by just mocking the `value()` signal, but this only works if you're not using the other properties of the `HttpResourceRef` object. However, this isn't something I would recommend.

With the current testing approach, the test also need to be revised after introducing the `HttpResource` into the application.
Instead of just returning an Observable with the data, this becomes a more complex task, as we need to mock the `HttpResourceRef` object and its properties.
To fully believe in our test, we need to ensure that the mock is set up correctly, and this might change over time.

The same test using `httpResource` now looks like this:

```ts{2-7, 9-13, 19-24}:customer-details.component.spec.ts
it('renders customer details', async () => {
	const httpResourceRef = {
		hasValue: signal(true),
		value: signal(customerDetails),
		error: signal(undefined),
		loading: signal(false),
	};

	const customerService = {
		getCustomerDetails: () => {
			return httpResourceRef;
		},
	};

	await render(CustomerDetailsComponent, {
		inputs: {
			customerId: 1,
		},
		providers: [
			{
				provide: CustomersService,
				useValue: customerService,
			},
		],
	});

	expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
});
```

If the customer detail component fully leverages the HTTP resource, by also using the `loading` and `error` properties, the test also needs to set them up correctly. This includes ensuring that the `error` signal is set to a valid error state when necessary, and updating the `loading`, `hasValue`, and `value` signals to reflect the current state of the resource.

Resulting in the following test to verify the loading state, and afterwards the success state:

```ts{2-7, 9-13, 20-23, 28-30}:customer-details.component.spec.ts
it('renders customer details', async () => {
	const httpResourceRef = {
		hasValue: signal(false),
		value: signal(undefined as CustomerDetails | undefined),
		error: signal(undefined),
		loading: signal(true),
	};

	const customerService = {
		getCustomerDetails: () => {
			return httpResourceRef;
		},
	};

	await render(CustomerDetailsComponent, {
		inputs: {
			customerId: 1,
		},
		providers: [
			{
				provide: CustomersService,
				useValue: customerService,
			},
		],
	});

	expect(screen.getByText(/Loading customer/i)).toBeInTheDocument();

	httpResourceRef.hasValue.set(true);
	httpResourceRef.value.set(customerDetails);
	httpResourceRef.loading.set(false);

	expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
});
```

This is less than ideal, as it requires us to set up the mock in a way that reflects the actual implementation of the `HttpResourceRef`.
As you can notice in the test, this means that we need to set 3 different signals (`hasValue`, `value`, `loading`) to mirror a successful request.

Maybe that Angular provides a more convenient way to set the `HttpResourceRef` in the future, but for now, we need to set up the mock manually.
Of course, it's possible to implement a utility function to create the `HttpResourceRef` object, but before doing that, let's take a moment to reflect.

## A moment of reflection

What's the definition of a good test?
In my opinion, a good test is one that:

- is **reliable** and produces the same results every time it is run;
- is ideally **fast**;
- is isolated and does **not depend external factors**;
- is **independent of the implementation details** of the code under test;

Let the last point sink in...
If we need to change a test case after a refactor it means that implementation details have leaked into our tests.
This means that we've coupled the test to the implementation details of the component, which is not ideal, worse, it means that it's not a good test.

What if instead, we can just swap out the service's implementation without having an impact on the test?
In other words, it shouldn't matter if the service returns an `Observable`, an `HttpResourceRef`, or any other type of object for that matter.
For our end-user, it doesn't matter what type of object/wrapper is used under the hood, as long as the component behaves correctly and renders the expected data.

We can even argue that the fact that the component uses the service shouldn't dictate how we write our tests (yes, I know unit tests VS integration tests), but let's not go there.
The point is that the test should focus on the component's behavior and expectations, rather than the implementation details of the service.

## HttpTestingController as the solution

It turns out Angular already provides a solution for this.
The [`HttpTestingController`](https://angular.dev/api/common/http/testing/HttpTestingController) is a powerful, but sadly overlooked, utility that allows us to mock HTTP requests and responses. Using the `HttpTestingController`, we can simply set response as a Plain Old JavaScript Object (POJO), as it would be returned from a backend API, and let Angular handle the rest.

Let Angular deal with the implementation details, and let us focus on the user's behavior and expectations in our tests.
With this in mind, we solely want to verify the component renders the correct data when the service returns a response.

The better test using `HttpTestingController` doesn't require us to manually mock dependencies at all.
In fact, it still uses the production service, which is way we need to provide the HTTP client (`provideHttpClient()`) in the test.
To prevent the actual HTTP request from being sent, we also need to provide the `HttpTestingController` (`provideHttpClientTesting()`) in the test.
This will intercept the HTTP request and allow us to mock the response using the `flush()` method.

```ts{6,8,12}:customer-details.component.spec.ts
it('renders customer details', async () => {
	await render(CustomerDetailsComponent, {
		inputs: {
			customerId: 1,
		},
		providers: [provideHttpClient(), provideHttpClientTesting()],
	});
	const httpMock = TestBed.inject(HttpTestingController);

	expect(screen.getByText(/Loading customer/i)).toBeInTheDocument();

	httpMock.expectOne(`/api/customers/1`).flush({ id: 1, name: 'John Doe' });

	expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
});
```

Additionally, the test also verifies that the component renders the loading state while waiting for the response.
This is a nice built-in benefit of using the `HttpResource` API.

In retrospect, this is a much cleaner and a reliable approach compared to mocking the service.
I also find it easier to read and understand.

If you don't like the hardcoded URL in the test, you can also use the function overload to accept each request with `httpMock.expectOne(() => true)`.

We can see that no implementation details are leaked into the test, allowing us to focus on the component's behavior and expectations.
This way, we can easily swap out the service's implementation without impacting the test, and we can be confident that the test will still pass.

## Conclusion

In this article, I've shown how to write better (and more compact) tests by using the `HttpTestingController` for components that interact with a backend API.

While it's a good idea to separate the concerns of the service and the component, it isn't necessary to mock services within a test.
As we've seen, mocking the service is counter-productive as it couples it to the implementation details of the service.
In practice this means that if we change the implementation of the service, e.g. from the `HttpClient` to the `httpResource`, we also have to change all the depending tests.

A more resilient solution is to rely on Angular to mock the HTTP requests and responses.
Luckily, Angular provides the `HttpTestingController` for this purpose.
This way we don't have to worry about changes, because we can simply set a POJO for the data we want to return, and Angular's testing utilities take care of the rest.

As the result we get a more reliable test that is less coupled to the implementation details of the service.
Within the test we notice smaller test setups that contain no more implementation details.

Of course, if you decide to refactor existing components to use the `HttpResourceRef` API, you will need to change implementation within the component to use the new API.
But, the test remains unchanged, ensuring the refactor didn't break the component's behavior.
If during a refactor you need to change the test implementation, it means that you're rewriting the component's behavior or that the test is too tightly coupled to the implementation details of the component.

I have the feeling that this article derailed a bit, because I just wanted to write about how to write tests for components that make use of the new `HttpResource` API.
But I want to encourage you to use the `HttpTestingController` to test your components, and not to mock the service.
If you start doing that now, I'm confident that the migration to the `HttpResource` API will have less impact on your tests.

In summary, here's how the test looks like.
If you'd like to see more test-cases, see [customer-details.component.spec.ts](https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.AngularWorkspace/projects/sandbox-app/src/app/customers/customer-details/customer-details.component.spec.ts) on GitHub.

:::code-group

```ts:customer-details.component.spec.ts [title=customer-details.component.spec.ts]
it('renders customer details', async () => {
	await render(CustomerDetailsComponent, {
		inputs: {
			customerId: 1,
		},
		providers: [provideHttpClient(), provideHttpClientTesting()],
	});
	const httpMock = TestBed.inject(HttpTestingController);

	expect(screen.getByText(/Loading customer/i)).toBeInTheDocument();

	httpMock.expectOne(`/api/customers/1`).flush({ id: 1, name: 'John Doe' });

	expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
});
```

```ts:customer-details.component.ts [title=customer-details.component.ts]
@Component({
	template: `
		@if (customerResource.hasValue() && customerResource.value(); as customer) {
			<div>{{ customer.firstName }} {{ customer.lastName }}</div>
		} @else if (customerResource.loading()) {
			<div>Loading customer...</div>
		}
	`,
})
export default class CustomerDetailsComponent {
	private readonly customersService = inject(CustomersService);

	protected readonly customerId = input.required({ transform: numberAttribute });
	protected readonly customerResource = this.customersService.getCustomerDetails(this.customerId);
}
```

```ts:customers.service.ts [title=customers.service.ts]
@Injectable({
	providedIn: 'root',
})
export class CustomersService {
	public getCustomerDetails(id: Signal<number>): HttpResourceRef<CustomerDetails | undefined> {
		return httpResource(
			() => ({
				url: `/api/customers/${id()}`,
			}),
			{
				parse: parse(CustomerDetails),
			},
		);
	}
}
```

:::
