---
title: 'The Methods to Update an Array: Cheat Sheet'
slug: the-methods-to-update-an-array-cheat-sheet
date: 2024-03-05
tags: typescript
---

# The Methods to Update an Array: Cheat Sheet

[ECMAScript 2023](https://tc39.es/ecma262/2023) (ES2023 or ES14) introduces a fresh set of array instance methods to enhance the way arrays can be modified.

In total four new methods are added, `toSorted()` (vs `sort()`), `toReversed()` (vs `reverse()`), `toSpliced()` (vs `splice()`), and `with` (vs bracket notation).
These methods use immutable operations on arrays, making it easier and more predictable to work with data without directly modifying the original array.

If you're use TypeScript, these methods are available in version 5.2.

Let's dive into these new methods, and at the same time refresh our knowledge for the existing methods.

| Description                                                             | Mutable Version                                                                                                                        | Immutable Version                                                                                                                                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sorts the array                                                         | [`sort(compareFn)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)                       | [`toSorted(compareFn)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted) - NEW                    |
| Reverses the array                                                      | [`reverse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse)                          | [`toReversed()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed) - NEW                         |
| Change an element in the array                                          | bracket notation (`.[index] = e1`)                                                                                                     | [`with(index, value)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/with) - NEW                         |
| Changes the contents of the array                                       | [`splice(start, deleteCount, items?)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)  | [`toSpliced(start, deleteCount, items?)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSpliced) - NEW |
| Removes the last element                                                | [`pop()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop)                                  | [`slice(0, -1)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)                                    |
| Removes the first element                                               | [`shift()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift)                              | [`slice(1)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)                                        |
| Adds element(s) to the end of the array                                 | [`push(e1, e2)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push)                          | [`concat([e1, e2])`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat)                               |
| Adds element(s) to the start of the array                               | [`unshift(e1, e2)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift)                    | [`toSpliced(0, 0, e1, e2)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSpliced)                     |
| Changes all elements within a range to a static value                   | [`fill(value, start, end?)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill)              | ❌ Not available                                                                                                                                  |
| Shallow copies part of this array to another location in the same array | [`copyWithin(target, start, end?)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin) | ❌ Not available                                                                                                                                  |

```ts
/**
 * Sorts the array - by id
 * sort: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 * toSorted: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted
 */
update('sort', (persons) => persons.sort((a, b) => a.id - b.id));
update('sort immutable', (persons) => persons.toSorted((a, b) => a.id - b.id));

/**
 * Reverses the array
 * reverse: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
 * toReversed: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed
 */
update('reverse', (persons) => persons.reverse());
update('reverse immutable', (persons) => persons.toReversed());

/**
 * Changes an element in the array
 * bracket notation
 * toSpliced: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/with
 */
update('change (bracket notation)', (persons) => {
	persons[1] = { id: 9, name: 'Updated Person' };
	return persons;
});
update('with immutable', (persons) => persons.with(1, { id: 9, name: 'Updated Person' })); // 🎉 New in ES2023 (and TS 5.2)

/**
 * Changes the contents of the array - remove person at index 2 and 3, add new person at index 0
 * splice: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 * toSpliced: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed
 */
update('splice', (persons) => {
	console.log(persons.splice(2, 2)); // returns the deleted item
	console.log(persons.splice(0, 0, { id: 9, name: 'New Person' })); // returns the deleted item (empty in this case)
	return persons;
});
update('toSpliced immutable', (persons) =>
	persons.toSpliced(2, 2).toSpliced(0, 0, { id: 9, name: 'New Person' }),
); // 🎉 New in ES2023 (and TS 5.2)

/**
 * Removes the last element
 * pop: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
 * slice: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
 */
update('pop', (persons) => {
	console.log(persons.pop()); // returns the deleted item
	return persons;
});
update('slice (remove last) immutable', (persons) => persons.slice(0, -1));

/**
 * Removes the first element
 * shift: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
 * slice: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
 */
update('shift', (persons) => {
	console.log(persons.shift()); // returns the deleted item
	return persons;
});
update('slice (remove first) immutable', (persons) => persons.slice(1));

/**
 * Adds element(s) to the end of the array
 * push: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
 * concat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
 */
update('push', (persons) => {
	console.log(persons.push({ id: 9, name: 'New Person' })); // returns the new length
	return persons;
});
update('concat immutable', (persons) => persons.concat({ id: 9, name: 'New Person' }));

/**
 * Adds element(s) to the start of the array
 * unshift: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
 * toSpliced: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSpliced
 */
update('unshift', (persons) => {
	console.log(persons.unshift({ id: 9, name: 'New Person' }, { id: 10, name: 'Other New Person' })); // returns the new length
	return persons;
});
update('toSpliced immutable', (persons) =>
	persons.toSpliced(0, 0, { id: 9, name: 'New Person' }, { id: 10, name: 'Other Person' }),
);

/**
 * Changes all elements within a range to a static value
 * fill: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
 * ❌: has no immutable version
 */
update('fill', (persons) => persons.fill({ id: 9, name: 'New Person' }, 2, 4));

/**
 * Shallow copies part of this array to another location in the same array
 * copyWithin: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
 * ❌: has no immutable version
 */
update('copyWithin', (persons) => persons.copyWithin(1, 2, 3));

// Helpers
function update(description: string, updater: (original: Person[]) => Person[]) {
	const original: Person[] = initPersons();
	const updated = updater(original);
	console.log(`[${description}]`, {
		updated,
		original,
	});
}

function initPersons(): Person[] {
	return [
		{ id: 2, name: 'Mike Johnson' },
		{ id: 1, name: 'Sarah Williams' },
		{ id: 5, name: 'David Wilson' },
		{ id: 4, name: 'Emily Davis' },
		{ id: 3, name: 'Michael Johnson' },
	];
}
type Person = { id: number; name: string };
```

For additional details, check out the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#copying_methods_and_mutating_methods).
Besides the new mutable methods, the ES2023 also added the [findLast](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast), and [findLastIndex](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLastIndex) methods for an easy lookup of the last element in an array.

A runnable example can be found in the following the [TypeScript Playground](https://www.typescriptlang.org/play?noUnusedLocals=true&noUnusedParameters=true&target=99&exactOptionalPropertyTypes=true&ts=5.2.2&filetype=ts#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-ZXy3VRKNf8uJ5y8Mca40B4in7nDfvjr+rG-7hCAeA1QKTnGgbYpxtVFtzKtMyaHkhqSgyCIIQABKBCFPgRoyqxgMZrb4CA9jANOGPlUSiPBg6oCcOgFQtAyD0FYE4LF1A2AKhxOFyLWTQ3ojlVUYLJ1oBhdxhF-OfBGBYogFgPA8XICCWDm6DE3BfMBaSyF6AEMYULThRQAABtQAAJLVFzbnwB3TYA1keDVIbFc4H15ilWUuDchg9SldmHPG3NFlnLWA0uvgy9Cyt1AhuQ1qrwUcJN00XQALK0D1twIoIBNBEGxdwRD63dpbYHUOi6ig0DIE0NwTjMQWChAgJQS7Y3IZ-c24Xb093KAABFSi0je+zH712AejmQ8Di0oRohGDB34YG32rt-f+7dqSwODth2QIEY7p3zsY9+2wSbjADDBFHfxUro8wBQlCGYIQQ7PP0DIHdIAA).
