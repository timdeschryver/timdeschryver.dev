:::code-group

```ts:customer-details.component.spec.ts [title=customer-details.component.spec.ts]
it('renders customer details', async () => {
	await render(CustomerDetailsComponent, {
		componentInputs: {
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
