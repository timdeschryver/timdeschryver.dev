---
title: Using Zod's schema to render a reusable and dynamic Angular table component
slug: using-zods-schema-to-render-a-reusable-and-dynamic-angular-table-component
description: When you think of Zod, you think of parsing and validation. But by leveraging some of Zod's lesser-known functionality we can do more than simply use it to parse objects, for example, to generate a dynamic and reusable table component.
date: 2024-01-25
tags: zod, Angular, Typescript
---

If you're already familiar with [Zod](https://zod.dev), and you hear zod you probably link it with some kind of parsing or validation.

:::note
We also covered these aspects in previous blog posts, such as [Why we should verify HTTP response bodies, and why we should use zod for this](../why-we-should-verify-http-response-bodies-and-why-we-should-use-zod-for-this/index.md) and [Get easy access to Angular route and query parameters with zod](../get-easy-access-to-angular-route-and-query-parameters-with-zod/index.md).
:::

But, zod can bring more to the table than just this.
By leveraging a zod object instance we can get the details about an object structure at run-time, for example, to get a hold of all the properties including their types. _This can be compared to reflection within the C# language._

In this blog post, we'll see how to use zod to dynamically build a (minimal) table as a reusable and typesafe Angular component.
For this, the following `Person` schema will be used within the next snippets.

```ts
const person = z.object({
	id: z.number(),
	name: z.string(),
	dateOfBirth: z.coerce.date(),
});

type Person = z.infer<typeof person>;
```

## Retrieve the property names: using `keyof().options`

The first step is to know all the properties (or keys) of an object schema.
These will later be used as the base to build the columns of the table.

To get the property names we can use the [`keyof()`](https://zod.dev/?id=keyof) method, which creates a `ZodEnum` that contains all the property keys of the schema.
For our convenience, `string`s are a bit easier to work compared to `ZodEnum`s so let's convert the `ZodEnum` tuple to a string collection by using the `.options` property.

```ts
const propertiesAsZodEnums = person.keyof();
//    ^? z.ZodEnum<["id", "name", "dateOfBirth"]>
const propertyNamesAsStrings = person.keyof().options;
//    ^? ["id", "name", "dateOfBirth"]
```

## Modify which columns are (in)visible: using `pick()`/`omit()`

It could be that not all properties need to be visible within the table.
To hide certain columns in a type-safe way the [`pick()` and `omit()`](https://zod.dev/?id=pickomit) methods can be used.

Both methods are used on a zod schema and are identical to the TypeScript's utility types.
These methods will either select the desired property names (`pick()`), or ignore certain property names (`omit()`).

This gives us the following result if we don't want to display the person's id in our example:

```ts
const propertyNamesPick = person
	//  ^? ["name", "dateOfBirth"]
	.pick({ name: true, dateOfBirth: true })
	// ☝️ select properties
	.keyof().options;

const propertyNamesOmit = person
	//  ^? ["name", "dateOfBirth"]
	.omit({ id: true })
	// ☝️ ignore properties
	.keyof().options;
```

## Render the table

Using the property names collection it's now easy to iterate over each name to generate the table header columns.
For each property name, a column is rendered within the table.

```razor {2-8}
<table>
  <thead>
    <tr>
      @for (propertyName of propertyNames; track propertyName) {
        <th>{{ propertyName }}</th>
      }
    </tr>
  </thead>
  <tbody>
    ...
  </tbody>
</table>
```

:::tip
The snippets make use of the [Control Flow](../../bits/angular-control-flow/index.md) syntax instead of structural directives.
The Control Flow was introduced in Angular 17.
:::

With a small change, the same technique can be used to render the body.
Instead of simply iterating over all properties, first iterate over the collection of persons to render a row for each person in the collection.
Using the property name as an index type, we can read the value of a property from an item within the collection.

```razor {9-17}
<table>
  <thead>
    <tr>
      @for (propertyName of propertyNames; track propertyName) {
        <th>{{ propertyName }}</th>
      }
    </tr>
  </thead>
  <tbody>
    @for (person of persons; track person.id) {
      <tr>
        @for (propertyName of propertyNames; track propertyName) {
          <td>{{ person[propertyName] }}</td>
        }
      </tr>
    }
  </tbody>
</table>
```

## Formatting: using `_def.typeName`

Of course not all columns need to be represented as is, some columns will require the need of some formatting.
This could be done before the table gets rendered by mapping/transforming your data to the desired format, or we can build this into the table.

Zod's schema holds a definition that contains the type of the property, which is very helpful.
For example:

```ts
z.string()._def.typeName;
// ^? ZodString

z.number()._def.typeName;
// ^? ZodNumber

z.coerce.coerce.date()._def.typeName;
// ^? ZodDate
```

We can use this information to render certain columns in a specific way, e.g. to use the `date` pipe for date properties.

```razor {9-26}
<table>
  <thead>
    <tr>
      @for (propertyName of propertyNames; track propertyName) {
        <th>{{ propertyName }}</th>
      }
    </tr>
  </thead>
  <tbody>
    @for (person of persons; track person.id) {
      <tr>
        @for (propertyName of propertyNames; track propertyName) {
          <td>
            @switch (typeName(propertyName)) {
              @case ('ZodDate') {
                {{ item[propertyName] | date }}
              }
              @default {
                {{ item[propertyName] }}
              }
            }
          </td>
        }
      </tr>
    }
  </tbody>
</table>
```

The method `typeName(propertyName)` uses the `shape` of the object to have the property information and is implemented as follows:

```ts
typeName(key: keyof Person) {
  // use the object's shape to get the definition (_def) of a specific property
  const def = person.shape[key]._def;
  // get the type name of the definition
  return def.typeName;
}
```

## Reusable component

This is all good, but we want a refactor the above code in a reusable component.
This way, we can use the same table component for all of the zod schemas.
Otherwise, the whole point of doing this will be lost.

For this, we can simply copy-paste the code (or use a refactor command from your favorite IDE) into a new component, and replace the static person types with a generic type. The table requires a schema and a collection as input to be rendered.

:::code-group

```razor table.component.html [title=table.component.html]
<table>
    <thead>
      <tr>
        @for (propertyName of propertyNames; track propertyName) {
          <th>{{ propertyName }}</th>
        }
      </tr>
    </thead>
    <tbody>
      @for (item of data; track $index) {
      <tr>
        @for (propertyName of propertyNames; track propertyName) {
          <td>
            @switch (typeName(propertyName)) {
              @case ('ZodDate') {
                {{ item[propertyName] | date }}
              } @default {
                {{ item[propertyName] }}
              }
            }
          </td>
        }
      </tr>
      }
    </tbody>
</table>
```

```ts table.component.ts [title=table.component.ts]
@Component({
	selector: 'app-table',
	standalone: true,
	imports: [DatePipe],
	templateUrl: './table.component.html',
})
export class TableComponent<Schema extends z.AnyZodObject> {
	@Input({ required: true }) schema!: Schema;
	@Input({ required: true }) data!: z.infer<Schema>[];

	get propertyNames(): (keyof z.infer<Schema>)[] {
		return this.schema.keyof().options;
	}

	protected typeName(key: keyof z.infer<Schema>): string {
		const def = this.schema.shape[key]._def;
		return def.typeName;
	}
}
```

:::

## Bringing it all together

Using the table component created in [Reusable component](#reusable-component), we can now easily render tables based on a zod schema.

```ts
import { Component } from '@angular/core';
import { Persons, person } from './person.model';
import { TableComponent } from './table.component';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TableComponent],
	template: `
    <app-table [schema]="personSchema" [data]="persons" />
    <app-table [schema]="personSchema" [data]="pets" />
                                       ~~~~~~ 
                                       Type '{ name: string; age: number; breed: string; }[]' is not assignable 
                                       to type '{ name: string; dateOfBirth: Date; }[]'
  `,
})
export class AppComponent {
	personSchema = person.pick({ name: true, dateOfBirth: true });
	persons: Persons = [
		{
			id: 1,
			name: 'John Doe',
			dateOfBirth: new Date('1994-01-20'),
		},
		{
			id: 2,
			name: 'Jane Doe',
			dateOfBirth: new Date('1992-10-05'),
		},
	];

	pets = [
		{ name: 'Fluffy', age: 2, breed: 'Poodle' },
		{ name: 'Fido', age: 4, breed: 'Labrador' },
	];
}
```

## Conclusion

As we've seen in this post, zod can be used for more than just parsing and validation.
Using zod's schema we get access to properties within an object's shape, including its type information.
Based on this information it's possible to generate the table and render its data.

While this is just a very simple example, this can further be extended.
There are also a few libraries that extend zod with the intent to generate fields/tables, e.g. [zod-to-fields](https://github.com/wojtekKrol/zod-to-fields).

If you want to play with the example in this blog post see [this TypeScript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgLzgXzgMyhEcDkyEAJvgNwBQVAxhAHYDO8YAplA-XALwoB0EAIwBWLajAAUCCnDjBiALj50AriAFtxASgA00uHQCGIFouS8mUYHQDmW3TOIGYLAPKYAQsFgALU71ps1Cy8js52FGialLSMzGwcjNx8BlBQBgCe4qzs9FFUMOmscAAK8Zw8ZlaYbAA8BawQmHDZCQB8lPUsJWWJFbxVtZ2NzT0M7TT0TM042TDALAxJLfS8ANYs6Y1alAD0OzIyAHoA-BQxU2AzbAUAckYLSz1rG1ua-GBzk7v7BycTsdMILN0ndjAxisBqKtHjk6Ho9kdTjJeGBIatJPp7ooYFBlCxtHBQq4PF4YL44Di8ehNHpnptMFp3p9GNFJswrrAQfcGC4QMB4DxlnCZAi4H9kbh+Ri5NjcV1IrT1vTGUDmQxKBQgA), or use [this StackbBitz](https://stackblitz.com/edit/stackblitz-starters-frz47m?file=src%2Ftable.component.ts).

<iframe src="https://stackblitz.com/edit/stackblitz-starters-frz47m?file=src%2Ftable.component.ts?ctl=1&embed=1" title="angular-table-with-zod" loading="lazy"></iframe>
