```typescript
await render(MyComponent, {
	bindings: [
		inputBinding('value', signal('Angular Testing Library')), // supports signals
		inputBinding('greeting', () => 'hello'), // supports aliases
		outputBinding('clicked', clickHandlerSpy), // easy to set spy functions
		twoWayBinding('name', signal('initial')), // two-way binding with signals
	],
});
```
