## Define a model with zod

```ts:customer.model.ts
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

## Use the zod schema with `createFixture` to generate test fixtures

```ts{11}
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { z } from 'zod';
import { createFixture } from 'zod-fixture';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { CustomerSchema } from './customer.model';

describe(AppComponent.name, () => {
   it('renders a collection of customers', async () => {
     const customers = createFixture(z.array(CustomerSchema));
     await render(AppComponent, {
       providers: [
         {
           provide: AppService,
           useValue: {
             getCustomers: () => of(customers),
           },
         },
       ],
     });

     expect(await screen.findByText(customers[0].name, { exact: false })).toBeTruthy();
     expect(await screen.findByText(customers[1].name, { exact: false })).toBeTruthy();
   });
});
```
