---
title: Flush state with an NgRx meta-reducer
slug: ngrx-flush-state
image: /images/ngrx-flush-state.png
date: 20222-03-29
tags: ngrx, effects, angular
---

## Flush state with an NgRx meta-reducer

### Use case

You want to (partially) flush the state.

### Solution

Use a meta-reducer to listen to an action and flush the state by invoking the reducer with the `undefined` state so the reducers re-use their initial state.

```ts
/**
 * Reset the whole state when the RESET action is dispatched
 */
function flush(reducer) {
	return function (state: AppState | undefined, action: Action) {
		if (action.type === 'RESET') {
			return reducer(undefined, action);
		}

		return reducer(state, action);
	};
}

/**
 * Reset a partial state when the RESET action is dispatched,
 * except for the authentication and design states
 */
function flush(reducer) {
	return function (state: AppState | undefined, action: Action) {
		if (action.type === 'RESET') {
			return reducer(
				{
					authentication: state.authentication,
					design: state.design,
				},
				action,
			);
		}

		return reducer(state, action);
	};
}
```
