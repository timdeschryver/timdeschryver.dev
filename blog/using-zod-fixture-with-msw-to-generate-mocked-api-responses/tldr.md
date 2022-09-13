## Define a model with zod

```ts:models/customer.ts
import { z } from 'zod';

export const CustomerSchema = z.object({
    id: z.number(),
    name: z.string(),
    birthday: z.date(),
    address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
    }),
    pets: z.array(z.object({ name: z.string(), breed: z.string() })),
    totalVisits: z.number(),
});

export type Customer = z.infer<typeof CustomerSchema>;
```

## Use the zod schema with `createFixture` to generate test fixtures within an MSW handler

```ts{7-10}:mocks/customer.handler.ts
import { setupWorker, rest } from 'msw';
import { z } from 'zod';
import { createFixture } from 'zod-fixture';
import { CustomerSchema } from '../models/customer';

export const handlers = [
    rest.get('/api/customers', (req, res, ctx) => {
        const customers = createFixture(z.array(CustomerSchema));
        return res(ctx.json(customers));
    }),
];

export const worker = setupWorker(...handlers);
```

## Result when the API endpoint is hit

```json
[
	{
		"id": 106,
		"name": "name-b7fb9fce-7f8d-454a-8a11-a19fed45205e",
		"birthday": "2022-10-02T00:08:39.500Z",
		"address": {
			"street": "street-6f0e0a92-bb4e-40e3-b0ab-4aaabfeb7064",
			"city": "city-ee8048f8-1710-4fce-ad59-1bfb6944c5fd",
			"state": "state-e5a67dc8-fc30-4514-bbf3-41ba33f43b7f"
		},
		"pets": [
			{
				"name": "name-f7bb7cb0-8253-4f50-9b60-547bdee952d0",
				"breed": "breed-f40e7bbb-f2d5-433e-8439-4048a51f55df"
			},
			{
				"name": "name-27f93c74-a942-4f43-837e-7bea9507a359",
				"breed": "breed-aff7f6ab-a270-4d94-9241-e9c7931843ec"
			},
			{
				"name": "name-87452301-7eb0-4db3-84de-71da51ae41fd",
				"breed": "breed-abd0c7b5-08c9-4504-acf4-fa63629619b7"
			}
		],
		"totalVisits": 290
	},
	{
		"id": 375,
		"name": "name-456f982b-cb1e-4e19-8f8a-28e14ec5dbbd",
		"birthday": "2022-09-14T11:52:39.869Z",
		"address": {
			"street": "street-ac2b41a7-5dd7-459e-8838-34cf1b65b070",
			"city": "city-1ddd9395-885f-47c3-8559-d4acb8069d58",
			"state": "state-ebc14ff3-2c44-4f31-8df6-d2af984eabec"
		},
		"pets": [
			{
				"name": "name-69e6c95f-5696-4402-bc97-37809861826c",
				"breed": "breed-7ec1d225-f790-4134-aba5-9afcea6b0da1"
			},
			{
				"name": "name-3622ca6c-4e08-432d-ae62-a21dc77725c6",
				"breed": "breed-ff23b885-dc7b-49dc-aede-f64be2d24b6c"
			},
			{
				"name": "name-5de7015d-6922-42df-b733-d6c6bafe2e54",
				"breed": "breed-9446ed34-01f7-4768-a4f5-b9df6328ade6"
			}
		],
		"totalVisits": 263
	},
	{
		"id": 6,
		"name": "name-10a3bfb3-dfa8-42e2-bcd7-b26c8be15d7b",
		"birthday": "2022-08-26T15:01:59.194Z",
		"address": {
			"street": "street-d9c0b615-49b6-4289-a74a-d82a5a460df5",
			"city": "city-17bcb8d8-a56e-408e-ac8e-0e720e2fae76",
			"state": "state-d86ced3d-83de-427c-938a-24fbf884a9b1"
		},
		"pets": [
			{
				"name": "name-740e81e6-41fb-4461-abcc-6072eff3bee1",
				"breed": "breed-0ddae151-26bc-4d73-b295-8781ec62cc11"
			},
			{
				"name": "name-78e11711-e67c-4ef2-bfb5-c55f47bb8195",
				"breed": "breed-20480c54-1b8c-400b-ab7e-c4693d8b0241"
			},
			{
				"name": "name-b71807a7-24c2-43c5-9925-d486c3872d2a",
				"breed": "breed-b77ffa84-0639-49c1-89ec-36420b151807"
			}
		],
		"totalVisits": 326
	}
]
```
