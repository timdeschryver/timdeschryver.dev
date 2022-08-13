```ts
inferface Customer {
	customerId: string;
	name: string;
}

// no compile errors
const customerBad = { customerId: newid() } as Customer;

// with compile errors
const customerGood: Customer = { customerId: newid() };
      ~~~~~~~~~~~~ Property 'name' is missing in type '{ customerId: string; }' but required in type 'Customer'
```
