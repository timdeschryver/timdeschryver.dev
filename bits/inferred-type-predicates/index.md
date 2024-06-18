---
title: Inferred Type Predicates
slug: inferred-type-predicates
date: 2024-06-18
tags: TypeScript
---

# Inferred Type Predicates

It's finally here! While working with TypeScript, I assume we all have been in a situation where we have to write a type predicate to help TypeScript understand the type of a variable. For most cases this is fine, but it can be a pain to write these while using the `filter` method.

Now with the TypeScript 5.5 release, TypeScript introduces a new feature called **Inferred Type Predicates**. This feature allows TypeScript to infer type predicates automatically. This means that TypeScript can now understand the type of a variable or return value based on the conditions that are checked in the code.

Functions that previously required a [Type Predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) can now be simplified. This is a great improvement for developers, as it reduces the amount of boilerplate code needed to write type predicates.

:::code-group

```ts [title=TypeScript >=5.5.0-beta]
type Person = { name: string };
const persons: (Person | null)[] = [];

const personNames = persons.filter((person) => !!person).map((person) => person.name); // ^? Person
```

```ts [title=TypeScript <5.5.0-beta]
type Person = {name:string};
const persons: (Person|null)[] = []

const personNames = persons
  .filter(person => !!person)
  .map(person => person.name)
                 ~~~~~~ 'person' is possibly 'null'.
                 // ^? Person | null
```

:::

Take a look at the following TypeScript playground examples to see the difference between [TypeScript 5.5.0-beta](https://www.typescriptlang.org/play/?ts=5.5.0-beta#code/C4TwDgpgBAChBOBnA9gOygXigb1QQwFsIAuRYeAS1QHMBfAbgCgBjNMqSJN4qACji6oAPqgCuAG3EBKANoBdTFHmMWbYBwQpUAOUIREizlsSMoUAHQAzCuOAJeRtJgB8UAIRvHqKaYsE8YA6aThiuXub4RD5mMbFxMQD0CVAAegD8KoxJUAC0eTkqoJBQAGIUiAAWithQiADuFAQ8vFIuUABuyBQAJrSMRdAAQhTw3dVQluIgza2hHV29KtmAvBuA4jtQACrg0GDwEN0UzHh2UOVQqMjqewCOoiP7UHioIATIe4yWoqjMwBRO5WVKkFgDxAVUhFBhqNWgkAFQ8SDqM5gqCw5LYXx7YCieDoADk9UaeNO6ERTD6jHEEHUiNB5QqQihYyw2FojwMXwA1hc6ug8AYwYyRt0mFBGBRLHwAfTgVJWhizIjzISCC1yVAIOJENAFRpgFYpmrGH0gA) and [TypeScript 5.4.5](https://www.typescriptlang.org/play/?ts=5.4.5#code/C4TwDgpgBAChBOBnA9gOygXigb1QQwFsIAuRYeAS1QHMBfAbgCgBjNMqSJN4qACji6oAPqgCuAG3EBKANoBdTFHmMWbYBwQpUAOUIREizlsSMoUAHQAzCuOAJeRtJgB8UAIRvHqKaYsE8YA6aThiuXub4RD5mMbFxMQD0CVAAegD8Kqyo7F66RIgAYhQAHhAAJobB2b5WNnbwvEGCUjxeUBQGAlou7p5V0X4BTd2hGoIRegPx02ZJqRmMcwC0K0sqoJBQRYgAForYUIgA7hQEPLxSPQBuyBRltIwb0ABCFPAVWAeW4iDnl6M3O4PRbJQC8G4BxHagAFk8ABrfRQUSIaDISxQPBQJ4ceDlCjMPB2EyWUSoZjAChODrbHZBYA8alQIRQV7vFoadQdLYdPbYXw44CieDoADkx1Owva6EgwCYwPEEHU0vp3KELI+OFo6IMJNhqGQR3QeAM1NVbzKTCgjAoaN4VO5tKkl15Zml5jFBAusqgEHEyJwvld3xAnsYDyAA).

## Further reading

- [Announcing TypeScript 5.5 RC](https://devblogs.microsoft.com/typescript/announcing-typescript-5-5-rc/#inferred-type-predicates) by [Daniel Rosenwasser](https://x.com/drosenwasser) - the official announcement of the feature
- [The Making of a TypeScript Feature: Inferring Type Predicates](https://effectivetypescript.com/2024/04/16/inferring-a-type-predicate/) by [Dan Vanderkam](https://x.com/danvdk) - why and how Dan implemented this feature
- [Type Predicate Inference: The TS 5.5 Feature No One Expected](https://www.totaltypescript.com/type-predicate-inference) by [Matt Pocock](https://x.com/mattpocockuk) - a detailed explanation of the feature (with examples)
