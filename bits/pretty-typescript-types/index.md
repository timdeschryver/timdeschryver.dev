---
title: Pretty TypeScript types
slug: pretty-typescript-types
date: 2023-11-14
tags: typescript
---

# Pretty TypeScript types

I learned this trick from [Matt Pocock](https://twitter.com/mattpocockuk), and I've seen the power by seeing [Marko Stanimirović](https://twitter.com/MarkoStDev) using it in the NgRx codebase.
Because I think that we'll see more usage of this, I wanted to make a bit out of it.

You've probably already encountered TypeScript types where you scratch your head and think "What does this even mean?".
From my own experience, this can happen when you interact with complex types from 3rd party packages.

Using the following `Prettify` utility type, which you need to create yourself, some of the types will become more readable.

```ts
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
```

`Prettify` takes a generic parameter `T` and maps over its keys using a mapped type to essentially create a new type that has the same properties as `T`.

:::ai
Here's a breakdown of what's happening:

- `type Prettify<T>`: This is a declaration of a new type called `Prettify` that takes a generic parameter `T`. `T` is a placeholder for any type that you want to use with `Prettify`.
- `[K in keyof T]`: This is a mapped type. It iterates over all keys of `T` (represented by `K`). `keyof T` is a type that represents all keys of `T`.
- `T[K]`: This is an indexed access type. It represents the type of property `K` in `T`.
- `& {}`: This is an intersection type. It combines multiple types into one. In this case, it's intersecting the mapped type with an empty object type. However, since an intersection with an empty object doesn't change the type, this part doesn't have any effect on the `Prettify` type.

:::

The unwrapping of object properties turns resolved types that were previously difficult to comprehend, into types that become easier to read and understand.

Let's take a look at an example to make this clear:

:::code-group

```ts{4-5,7-8} [title=Combined Types]
type Person = { name: string };
type Address = { street: string };

type PersonWithAddressV1 = Person & Address;
//   ^? PersonWithAddressV1 = Person & Address

type PersonWithAddressPrettified = Prettify<Person & Address>;
//   ^? PersonWithAddressPrettified = { name: string; street: string; }
```

```ts{4-5,7-8} [title=Union Types]
type PrimaryAddress = { type: 'Primary'; street: string };
type SecondaryAddress = { type: 'Secondary'; street: string };

type AddressV1 = PrimaryAddress | SecondaryAddress;
//   ^? AddressV1 = PrimaryAddress | SecondaryAddress

type AddressPrettified = Prettify<PrimaryAddress | SecondaryAddress>;
//   ^? AddressPrettified= { type: 'Primary'; street: string } | { type: 'Secondary'; street: string }
```

:::

With a small modification, it can also unwrap child properties.

```ts
type Prettify<T> = {
	[K in keyof T]: Prettify<T[K]>;
} & {};
```

For more info see Matt's blog [The `Prettify` Helper](https://www.totaltypescript.com/concepts/the-prettify-helper).
