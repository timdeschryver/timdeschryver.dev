---
title: Flagged enum, why and how
slug: flagged-enum-what-why-and-how
description: Let's take a look at what a flagged enum is and when these can be handy
author: Tim Deschryver
date: 2020-02-24T07:23:12.657Z
tags: Angular, TypeScript
---

## Why

The [TypeScript docs](https://www.typescriptlang.org/docs/handbook/enums.html) define enums as follows:

> Enums allow us to define a set of named constants. Using enums can make it easier to document intent, or create a set of distinct cases. TypeScript provides both numeric and string-based enums.

An enum can be stored as a single value, but storing a collection of enum values is verbose.
Especially if you're using a relational database, for example SQL Server, where you need to create a different table to store these values.

Let's use a selection of weekdays as an example, where a user can select one or more days.
In code, we have different structures to store a user's selection:

```ts
// as enums

enum Days {
	Monday = 1,
	Tuesday = 2,
	Wednesday = 3,
	Thursday = 4,
	Friday = 5,
	Saturday = 6,
	Sunday = 7,
}

const selectedDays = [Days.Monday, Days.Wednesday]; // [1, 3]

// as union types

type Days = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

const selectedDays = ['Monday', 'Wednesday'];

// as an array of booleans

const selectedDays = [true, false, true, false, false, false, false];

// as an object

const selectedDays = {
	monday: true,
	tuesday: false,
	wednesday: true,
	thursday: false,
	friday: false,
	saturday: false,
	sunday: false,
};
```

While these structures work, they aren't optimal when you need to send them to a backend service.
To make it easier for us, we can use flagged enums.
A flagged enum can be used to efficiently send and store a collection of boolean values.

In a flagged enum, each value of the enum is assigned to a bit value.
These must be bit values because each combination possible will be unique.
That's why flagged enums are useful, they provide a way to efficiently work with a collection of values.

```ts
enum Days {
	Monday = 1 << 0, // 1
	Tuesday = 1 << 1, // 2
	Wednesday = 1 << 2, // 4
	Thursday = 1 << 3, // 8
	Friday = 1 << 4, // 16
	Saturday = 1 << 5, // 32
	Sunday = 1 << 6, // 64
}

const selectedDays = Days.Monday | Days.Wednesday; // 5
```

## How

To work with these values, we make use of [bitwise operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators).

The first step is to convert the `Days` enum to an array of bit numbers.

```ts
function enumToBitValues(enumValue: object) {
	return Object.keys(enumValue).map(Number).filter(Boolean);
}
```

This gives us the following array we can work with:

```json
[1, 2, 4, 8, 16, 32, 64]
```

It's important to filter out non-numbers values, otherwise the output will look as follows:

```json
["1", "2", "4", "8", "16", "32", "64", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// this is because the enum has as value
{
  "1": "Monday",
  "2": "Tuesday",
  "4": "Wednesday",
  "8": "Thursday",
  "16": "Friday",
  "32": "Saturday",
  "64": "Sunday",
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 4,
  "Thursday": 8,
  "Friday": 16,
  "Saturday": 32,
  "Sunday": 64
}
```

A flagged enum is stored as a single value, but our front-end is represented as a checkbox list.
To map the user's selection to a single value, we create a sum of the selected values:

```ts
function formValueToBit(enumeration: object, selection: boolean[]) {
	const bits = enumToBitValues(enumeration);
	return selection.reduce((total, selected, i) => total + (selected ? bits[i] : 0), 0);
}
```

If we select monday and wednesday this `formValueToBit` function will have 5 as output:

```ts
const selectedDay = formValueToBit(Days, [true, false, true, false, false, false, false]);

// output: 5
```

To do the inverse and map the value back to an array of booleans, to determine if a checkbox must be checked or not, we use the bitwise AND operator.

```ts
function bitToFormValue(enumeration: object, bit: number) {
	const bits = enumToBitValues(enumeration);
	return bits.map((b) => (bit & b) === b);
}
```

This gives the following result:

```ts
const selectedDay = bitToFormValue(Days, 5);

/*
output: [
  true,   //  1 & 5
  false,  //  2 & 5
  true,   //  4 & 5
  false,  //  8 & 5
  false,  // 16 & 5
  false,  // 32 & 5
  false,  // 64 & 5
]
*/
```

## Angular form example

You can play around with an Angular reactive forms implementation:

<iframe src="https://stackblitz.com/edit/angular-enum-bits?ctl=1&embed=1&file=src/app/app.component.ts" title="enum-bits" loading="lazy"></iframe>
