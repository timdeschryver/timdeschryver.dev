For one-off tests that require a larger setup, it's sometimes easier and faster to reuse a mock and overwrite some propeorties of the response to test a business requirement.

```ts{2-11}
it('should warn when the customer has an overdue payment and makes a new order', () => {
	cy.intercept('GET', `/api/customers/*`, (request) => {
		request.reply((response) => {
			// reuse the first payment and convert it to an overdue payment
			const [payment] = response.body['payments'];
			payment.paymentDate = null;

			response.body['payments'] = [payment];
			return response;
		});
	});

	cy.findByRole('alert', { name: /account has an overdue payment/i });
});
```
