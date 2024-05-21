---
title: Simplify Grouping Arrays in JavaScript with Object.groupBy()
slug: simplify-grouping-arrays-in-javascript-with-objectgroupby
date: 2024-02-13
tags: TypeScript
---

# Simplify Grouping Arrays in JavaScript with Object.groupBy()

Grouping an array of objects in JavaScript no longer needs to be complex.
The new [Object.groupBy()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) static method simplifies this task by allowing you to group elements based on string values returned by the callback function.

Previously, achieving this required manual grouping (using methods like `reduce`) or relying on external libraries like Lodash.
However, with Object.groupBy(), you can achieve the same result in a more readable and concise manner.

Here are the key points:

- 💫 Functionality: group elements based on a specified string (object `key` or custom string).
- 💁 Browser Compatibility: [available in modern browsers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy#browser_compatibility).
- 🛠️ TypeScript Support: included in [v5.4-beta](https://devblogs.microsoft.com/typescript/announcing-typescript-5-4-beta/).

<details>
<summary>Input data</summary>

```ts
type Player = { name: string; team: string; yearsActive: number };
const players: Player[] = [
	{
		name: 'Player 1.1',
		team: 'Team One',
		yearsActive: 3,
	},
	{
		name: 'Player 1.2',
		team: 'Team One',
		yearsActive: 5,
	},
	{
		name: 'Player 2.1',
		team: 'Team Two',
		yearsActive: 1,
	},
	{
		name: 'Player 3.1',
		team: 'Team Three',
		yearsActive: 8,
	},
	{
		name: 'Player 3.2',
		team: 'Team Three',
		yearsActive: 2,
	},
];
```

</details>

:::code-group

```ts [title=New (Object.groupBy)]
const playersByTeam = Object.groupBy(players, (player) => {
	return player.team;
});
```

```ts [title=New (Object.groupBy custom)]
const playersByExperience = Object.groupBy(players, (player) => {
	// instead of creating groups based on a property
	// we can also return a generated group key
	return player.yearsActive <= 2 ? 'Rookies' : 'Veterans';
});
```

```ts [title=Old (reduce)]
const playersByTeam = players.reduce(
	(group, player) => {
		if (group.hasOwnProperty(player.team)) {
			group[player.team] = [...group[player.team], player];
			return group;
		}

		group[player.team] = [player];
		return group;
	},
	{} as Record<string, Player[]>,
);
```

:::

To explore and experiment with `Object.groupBy()`, check out the following [TypeScript playground](https://www.typescriptlang.org/play?noUnusedLocals=true&noUnusedParameters=true&target=99&exactOptionalPropertyTypes=true&ts=5.4.0-beta&filetype=ts#code/C4TwDgpgBACgNgQxBATlAvFA3gOwQWwgC4BnYFASxwHMAaKYCA08quqZBFEgQQGNgFAG7EcAV3wAjVAF8AUHwD2OMlDCJk3IrA2oA2gF0MUPXKjYz5qHkLaA5PCSooARgB0Lu7UvnGzKHYAKkz4UADyOBBePhxM3PyCItoAzN7mMmkWVtYExAGOmq5uAEzR2X749sEE4ZFlVpzxAsJ5AKyZGZZYMTZ5DrpoxR71viFVIVCBAO6KI7FcvM1Jrh2Z3dm99gXOycOZo-5BE4EAFigQUfvzTYl5AByrXT25WwNQu6VXFeM1p+eXMUai1u2mKHTkBjkUKUKmAagGJAAQiBqqFMGFJAArCACNzUFCKMRgZEACnUTm49HJhXQAD54RS3BUAJQAbjkAHoOdkAHoAfgUyhIijgEDccEU1BJdgx2Nx+MJxJAXgZmiRKJCbKhgthqtQ6oAogAPSCUCA4PjQdFYnHAPEEomk6n6qlvOkWACQ52AYhQOD1KDcQISLSgAB5MMUoHyAgAlRSKADWFAgJDsUHsADUIIwUAgVHY5DItTDhaLxZLpbLbfbFcioCS+GIyIp8MyVc7uMjjaaUxaIFqoRyAFTDszD8JwAAmUCmSCgzbYUHOU7ElpQ445OtUnfVqNjEFXluMu7cK7XEBJJIQfD4ropzIw9PWUAoADNr7e3CcECQwlMcBgAlTVAMkBiZTVHxfcwbz4PROwgggjEwPQ3DQ2D4PAioDHvTQDHZbJvV9f1YIIqB5HMSwMIQ7DjEwil8MsIi-SgUii3oLAZFYkgoAPJQUCnMMyEoGh6G2FBDFpZloSFEUxQlKU7HPS0iA7BFkX3Q8Ly1IA) to see the code in action.
