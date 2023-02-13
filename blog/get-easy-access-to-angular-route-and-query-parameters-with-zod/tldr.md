Use the [`coerse` method](https://zod.dev/?id=coercion-for-primitives) to quickly transform the value of a primitive.

```ts{}
export class ChildComponent {
	id$ = inject(ActivatedRoute).params.pipe(
        map((params) => route.parse(params).id)
    );
	// ^? Observable<number>
}

const route = z.object({
	id: z.coerce.number(),
});
```

The end result is that we can now easily access route and query parameters from an Angular route.
We can do this in a typesafe way, without having to manually parse the route parameters.
Keep in mind that this throws an error if the route parameters are invalid.
This is a good thing because it means that we can't accidentally use an invalid route parameter.
