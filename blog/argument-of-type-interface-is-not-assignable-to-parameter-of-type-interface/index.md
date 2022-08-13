---
title: Argument of type 'interface' is not assignable to parameter of type 'interface'
slug: argument-of-type-interface-is-not-assignable-to-parameter-of-type-interface
description: A peculiar TypeScript error at compile time and how to solve it
author: Tim Deschryver
date: 2021-02-09
tags: typescript
---

While I was [working on a refactor](https://github.com/ngrx/platform/pull/2803), in the [NgRx](https://ngrx.io) project, to allow N number of action handlers `on` within an NgRx reducer `createReducer` - huzzah for [variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types) 🥳, I've encountered a TypeScript issue that I've already bumped against to.

The issue is a compile-time error that gives us the message "Argument of type 'interface' is not assignable to parameter of type 'interface'". When you don't read the full error message (like I did) it can take a while to understand the problem, why it happens, and how to solve this error.

From my understanding, the error pops up when there's a wrapper method that:

- uses a generic
- and has a callback argument that works with the same generic
- the callback argument returns a type that contains the same generic
- and the generic types are not 100% identical

The snippet below illustrates the problem in the most simple way.

```ts{2-4, 6, 10}
// The `Callback<T>` interface is used in the `wrapper` method as well as the `callback` method.
interface Callback<T extends object> {
  (arg: T): any
}

function wrapper<T extends object>(callback: Callback<T>): any {
  return callback({} as T)
}

function callback<T extends object>(cb: () => T): Callback<T> {
  return cb
}
```

These functions give us the following results when we use them:

```ts
// --- INVALID --- //

const givesAnError = wrapper<{ prop?: string }>(callback(() => ({ prop: '' })))
// |> Argument of type 'Callback<{ prop: string; }>' is not assignable to parameter of type 'Callback<{ prop?: string | undefined; }>'.
// |>  Types of property 'prop' are incompatible.
// |>    Type 'string | undefined' is not assignable to type 'string'.

// --- VALID --- //

// Types are 100% identical
const works = wrapper<{ prop: string }>(callback(() => ({ prop: '' })))

// Provide the same generic to the callback method
const worksCallbackGeneric = wrapper<{ prop?: string }>(a
  callback<{ prop?: string }>(() => ({ prop: '' })),
)

// A type assertion on the return value of the callback
const worksTypeAssertion = wrapper<{ prop?: string }>(
  callback(() => ({ prop: '' } as { prop?: string })),
)
```

Now the weird part is that when the `callback` method accepts an input parameter of the same type, it does compile.
But only when the argument is used.

```ts
function callbackWithInput<T extends object>(cb: Callback<T>): Callback<T> {
	return cb;
}

// --- VALID --- //

// Note the argument `_arg` isn't used but helps to make this compile
const works = wrapper<{ prop?: string }>(callbackWithInput((_arg) => ({ prop: '' })));

// --- INVALID --- //

// Same but without an argument gives the same compile error as before
const stillDoesntWork = wrapper<{ prop?: string }>(callbackWithInput(() => ({ prop: '' })));
// |> Argument of type 'Callback<{ prop: string; }>' is not assignable to parameter of type 'Callback<{ prop?: string | undefined; }>'.
// |>  Types of parameters 'input' and 'input' are incompatible.
// |>    Type '{ prop?: string | undefined; }' is not assignable to type '{ prop: string; }'
```

From what I could see, is that somehow TypeScript isn't able to correctly infer the generic's interface anymore.
To be honest with you, I don't know why and I would expect this to compile because the signature has the same types.

As shown in the usage examples above, we can make this work but therefore we must make changes to the signature or the way how the callback method is invoked. From a consumer's perspective, this is bad and this would've been a massive breaking change for the ones using NgRx.

As a fix, I [introduced a new generic](https://github.com/ngrx/platform/blob/1532399c38ba8a095abcbc721915e7b4f8692d76/modules/store/src/reducer_creator.ts#L29) in the NgRx to help TypeScript with the interference. While at first this seemed like a fix, it introduced a hidden breaking change because the signature of the `on` method was changed.

> Noteworthy to mention that if you're adding a generic to only use it once, you're probably doing something wrong. This rule "Type Parameters Should Appear Twice" is explained in [The Golden Rule of Generics](https://effectivetypescript.com/2020/08/12/generics-golden-rule/), written by [Dan Vanderkam](https://twitter.com/danvdk).

Luckily, [Alex Okrushko](https://twitter.com/alexokrushko) provided [a better solution](https://github.com/ngrx/platform/pull/2894) that doesn't impact the consumer.

The solution to resolve this issue correctly is to help TypeScript to infer the type. For this, we can tweak the strictness of the generic. Instead of using the generic directly we can create a mapped type by using `keyof`.

```ts
interface Callback<T extends object> {
	(input: {
		[P in keyof T]?: T[P];
	}): S;
}
```

The other strange part here is that in the NgRx types, Alex didn't need to type the generic's properties as potentially `undefined` (as you can see [here](https://github.com/ngrx/platform/blob/520d0b1b9210bc17e7b5830153c4a9e09092dcca/modules/store/src/reducer_creator.ts#L25)) while I had to when I created this reproduction.

So while this blog post does leave us with some unclarity, it does provide a solution to this problem.
To play around with this reproduction, see the [TypeScript Playground link](https://www.typescriptlang.org/play?ts=4.2.0-dev.20210207#code/JYOwLgpgTgZghgYwgAgMJwDYYEaINYA8AKshAB6QgAmAzsgPbYBWECYAfMgN4BQyyAegHIAqiAT0AtpIjhkYABbA6MelHkKUNehgCuYYPRB9BwgBSgADvoBc3E0P7IA2gAVkoZHggBPejGQAZQBdAH47QLdggG4HYQBfAEoI2KcLEGswOyJk5CJY+J4eGF1xAyNkAHcoOEtLaGJSCllaBmZWDjMETBx8O3QsXARCInZcgd7h4k5efigIMF0oEGQzROQAXk5uwfwzLnjkODocgqKSssMVncmRpspWxhY2di7sOzXNzhz+nqGRmYmeaLZbIBDYM7FUpsK5gv74ADqwEUAEkMvpGuQHnQnh1XuDfrspqNxvDiYC5gsltcITxCjxHABaZnIFEAOQAagBBAAyKIAIshmYzTEUeBIQDQwBooPRKjQuSAAKJQWXqDZVGp1BqzZCWWWWcLIKVQUAAcwKrxMN3+Zk+W1Wuv4+voljsAHJ3QAaExJRI8RKxcVGKVHDDaIgKWXyxUqtWbTW1epQAi6l2Guwm82WszWsl4JGo9FgO3rB37EzOg0e72+xL+wNipks7l8wXC0US0OVNR4Oga6pJnV66vGsCmkBm5DxfH50tfR0j1016f1-1d6U9qB9og+epcmg0aDlFYDrXJ1NLjNjidTme5-g2vb2zj7K8rw7HbhXo1ZyerxIfXXENN17GgJn+ABxWRoGABAE0HbUUy4H9M3Hc1pytR980vdNf3Q-97xfRd0w-esgODSVQO3GhCwURUuSgM1dBkOQzyHZCTDwtDbxzPMiQLZEFDRTI7QAfTgJiy1fJ132QT0fX4P0A2iIA)
