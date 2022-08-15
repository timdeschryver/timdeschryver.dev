Benefits of using parallel states to build progressive views:

- each request has its own distinct state (`idle`, `loading`, `success`, or `error`)
- a single event can be used within multiple nodes (`fetch`), and you can have node-specific events (`receivedTodoOne`)
- easy to build a "view-model" in the component because you have access to all of the states and nodes

```ts
import { createModel } from 'xstate/lib/model';

export const appModel = createModel(
	{
		// comes from an external API
		todoOne: undefined as Todo | undefined,
		todoTwo: undefined as Todo | undefined,
		todoThree: undefined as Todo | undefined,

		// comes from the component
		onlyUncompleted: false,
	},
	{
		events: {
			fetch: () => ({}),
			retry: () => ({}),
			focus: () => ({}),
			toggleCompleted: () => ({}),
			receivedTodoOne: (todo: Todo) => ({ todo }),
			receivedTodoTwo: (todo: Todo) => ({ todo }),
			receivedTodoThree: (todo: Todo) => ({ todo }),
		},
	},
);

export const appMachine = appModel.createMachine({
	id: 'app',
	type: 'parallel',
	context: appModel.initialContext,
	invoke: {
		src: 'checkForDocumentFocus',
	},
	states: {
		todoOne: {
			initial: 'idle',
			states: {
				idle: {
					on: {
						fetch: { target: 'loading' },
						focus: { target: 'loading' },
					},
				},
				loading: {
					tags: ['loading'],
					invoke: {
						src: 'fetchOne',
						onError: {
							target: 'failure',
						},
					},
					on: {
						receivedTodoOne: {
							target: 'success',
							actions: appModel.assign({
								todoOne: (_, event) => event.todo,
							}),
						},
						fetch: {
							target: 'loading',
							actions: appModel.assign({
								todoOne: () => undefined,
							}),
						},
					},
				},
				success: {
					on: {
						fetch: {
							target: 'loading',
							actions: appModel.assign({
								todoOne: () => undefined,
							}),
						},
						focus: { target: 'loading' },
					},
				},
				failure: {
					on: {
						retry: { target: 'loading' },
					},
				},
			},
		},
		todoTwo: {
			initial: 'idle',
			states: {
				idle: {
					on: {
						fetch: { target: 'loading' },
						focus: { target: 'loading' },
					},
				},
				loading: {
					tags: ['loading'],
					invoke: {
						src: 'fetchTwo',
						onError: {
							target: 'failure',
						},
					},
					on: {
						receivedTodoTwo: {
							target: 'success',
							actions: appModel.assign({
								todoTwo: (_, event) => event.todo,
							}),
						},
						fetch: {
							target: 'loading',
							actions: appModel.assign({
								todoTwo: () => undefined,
							}),
						},
					},
				},
				success: {
					on: {
						fetch: {
							target: 'loading',
							actions: appModel.assign({
								todoTwo: () => undefined,
							}),
						},
						focus: { target: 'loading' },
					},
				},
				failure: {
					on: {
						retry: { target: 'loading' },
					},
				},
			},
		},
		todoThree: {
			initial: 'idle',
			states: {
				idle: {
					on: {
						fetch: { target: 'loading' },
						focus: { target: 'loading' },
					},
				},
				loading: {
					tags: ['loading'],
					invoke: {
						src: 'fetchThree',
						onError: {
							target: 'failure',
						},
					},
					on: {
						receivedTodoThree: {
							target: 'success',
							actions: appModel.assign({
								todoThree: (_, event) => event.todo,
							}),
						},
						fetch: {
							target: 'loading',
							actions: appModel.assign({
								todoThree: () => undefined,
							}),
						},
					},
				},
				success: {
					on: {
						fetch: {
							target: 'loading',
							actions: appModel.assign({
								todoThree: () => undefined,
							}),
						},
						focus: { target: 'loading' },
					},
				},
				failure: {
					on: {
						retry: { target: 'loading' },
					},
				},
			},
		},
	},
	on: {
		toggleCompleted: {
			actions: appModel.assign({
				onlyUncompleted: (context) => !context.onlyUncompleted,
			}),
		},
	},
});

export interface Todo {
	userId: number;
	id: number;
	title: string;
	completed: boolean;
}
```
