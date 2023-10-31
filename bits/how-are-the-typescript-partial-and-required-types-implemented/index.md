---
title: 'How are the TypeScript Partial and Required types implemented?'
slug: how-are-the-typescript-partial-and-required-types-implemented
date: 2023-10-31
tags: TypeScript
---

# How are the TypeScript Partial and Required types implemented?

I find it important to know how the most-used TypeScript utility types are implemented.
Here, we see the implementation of the `Partial` (all properties of a type are optional) and `Required` (all properties of a type are required) types.
Knowing this is essential because it allows you to customize or create a new behavior for your use cases.

- `keyof Person` generates a union of the keys of Person, so `keyof Person` results in `"id" | "name"`.
- `[key in keyof Person]` iterates over each key in that union.
- `Person[key]` is the type of the property in Person associated with the key, so "id" is a number, and "name" is a string.
- **The `?` modifier makes the property optional (used for the `Partial` type), while the `-?` modifier removes the optional modifier from the property, making it required (used for the `Required` type).**

:::code-group

```ts:partial.ts [title=Partial]
type Person = { id: number, name: string }

// 🪄 Use the ? modifier to make a property optional
type PersonPartial = { [key in keyof Person]?: Person[key] };
const person: PersonPartial = { name: 'Tim' }
// ^? { id?: number | undefined; name?: string | undefined }

// 🔁 Refactor into a generic type
type GenericPartial<T> = { [key in keyof T]?: T[key] };
const person: GenericPartial<Person> = { name: 'Tim' }
// ^? { id?: number | undefined; name?: string | undefined }

// Use the built-in Partial Type:
// Constructs a type with all properties of Type
// set to optional. This utility will return a type that represents
// all subsets of a given type.
const person: Partial<Person> = { name: 'Tim' }
// ^? { id?: number | undefined, name?: string | undefined }
```

```ts:required.ts [title=Required]
type Person = { id?: number, name?: string }

// 🪄 Use the -? modifuer to make a property required
// (by removing the optional ? modifier)
type PersonRequired = { [key in keyof Person]-?: Person[key] };
const person: PersonRequired = { id: 3, name: 'Tim' }
// ^? { id: number; name: string }

// 🔁 Refactor into a generic type
type GenericRequired<T> = { [key in keyof T]-?: T[key] };
const person: GenericRequired<Person> = { id: 3, name: 'Tim' }
// ^? { id: number; name: string }

// Use the built-in Required Type:
// Constructs a type consisting of
// all properties of Type set to required.
const person: Required<Person> = { id: 3, name: 'Tim' }
// ^? { id: number, name: string }
```

:::
