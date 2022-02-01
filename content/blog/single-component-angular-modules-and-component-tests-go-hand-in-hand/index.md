---
title: Single Component Angular Modules and Component Tests go hand in hand
slug: single-component-angular-modules-and-component-tests-go-hand-in-hand
description: Say no to brittle tests with SCAMs
author: Tim Deschryver
date: 2022-01-31
tags: Angular, Testing, Angular Testing Library
banner: ./images/banner.jpg
published: true
---

Writing a good test is not as simple as it sounds, it takes some guidance and practice to get it right.
One of the key factors that make a good test stand out is the arrange (or setup) part.
For Angular component tests, Single Component Angular Modules (SCAMs) help to make the difference between an OK test and a good test.
With SCAMs, you end up with no fragile test setups with half of the code, which results in a happy and productive, team that isn't afraid to move things around.

I'm certain that a previous team that I was a part of could have benefitted from SCAMs to be less frustrated on our component tests.
Most changes to a component required some minutes for an experienced developer to make sure that the existing tests were passing again.
While a new developer often was staring at the failing tests not knowing what to do next.
For most cases, this doesn't make sense because the served component was working.
After a few times, the process of fixing the failing test became clearer but it wasn't ideal and it was costly.

SCAMs provide an answer to this problem, in combination with the [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/) it might even become fun to have tests for your components.

Let's take a look at an example.
Can you think of changes to the `MyAwesomeComponent` component that breaks the render process, thus causing the test to fail?

```ts
it('renders the MyAwesomeComponent component', async () => {
	await render(MyAwesomeComponent, {
		imports: [
			MatButtonModule,
			MatDialogModule,
			MatInputModule,
			MatTableModule,
			MyAwesomeSharedModule,
		],
		declarations: [MyAwesomeChildComponent, MyAwesomeGrandChildComponent],
		providers: [
			{
				provide: EntityService,
				useValue: mock(EntityService),
			},
		],
	});

	// ... the rest of the test here ...
});
```

A couple of reasons that I can think of to break the test are:

- a new module is used in the `MyAwesomeComponent` component
- the `MyAwesomeComponent` component uses a new component
- one of the (grand)children of `MyAwesomeComponent` is using a new component
- a used component is removed
- the `MyAwesomeComponent` component is added to `MyAwesomeSharedModule`

## Single Component Angular Modules offer a solution

To make the tests less brittle to internal changes, we can make use of SCAMs.
With a SCAM the changes to the component (or directive) are encapsulated within its module.
Because this module is directly imported into the test, the setup of the test is automatically updated.

Without going into too many details of a SCAM, the module of the component under test looks as follows.

> For more info see [Single Component Angular Modules](https://dev.to/this-is-angular/emulating-tree-shakable-components-using-single-component-angular-modules-13do), by [Lars Gyrup Brink Nielsen](https://twitter.com/LayZeeDK).

```ts
@NgModule({
	declarations: [MyAwesomeComponent],
	exports: [MyAwesomeComponent],
	imports: [
		MatButtonModule,
		MatDialogModule,
		MatInputModule,
		MatTableModule,
		MyAwesomeSharedModule,
		MyAwesomeChildComponentModule,
		MyAwesomeGrandChildComponentModule,
	],
})
export class MyAwesomeComponentModule {}
```

### Default implementation with `excludeComponentDeclaration`

Render the component and import its module in which it's declared in.
To prevent the rendered component to be automatically added to the TestBed's declarations, use the `excludeComponentDeclaration` property.

```ts{3}:my-awesome-component.spec.ts
it('renders the MyAwesomeComponent component', async () => {
    await render(MyAwesomeComponent, {
        excludeComponentDeclaration: true,
        imports: [MyAwesomeComponentModule],
        providers: [
            {
                provide: EntityService,
                useValue: mock(EntityService),
            },
        ],
    });

    // ... the rest of the test here ...
});
```

### Global `excludeComponentDeclaration`

When SCAMs become the de-facto implementation, the `excludeComponentDeclaration` property can globally be configured by using the `configure` method in the global test setup file.
Now, you can omit the `excludeComponentDeclaration` option in each `render` method.

```ts{3-5}:test.ts
import { configure } from '@testing-library/angular';

configure({
    excludeComponentDeclaration: true,
});
```

```ts:my-awesome-component.spec.ts
it('renders the MyAwesomeComponent component', async () => {
    await render(MyAwesomeComponent, {
        imports: [MyAwesomeComponentModule],
        providers: [
            {
                provide: EntityService,
                useValue: mock(EntityService),
            },
        ],
    });

    // ... the rest of the test here ...
});
```

### Using the component's template

You can also use the component's template instead of its `Type` to render the component.
This doesn't require the `excludeComponentDeclaration` property to be set.

```ts{2}:test.ts
it('renders the MyAwesomeComponent component', async () => {
    await render(`<my-awesome-component></my-awesome-component>`, {
        imports: [MyAwesomeComponentModule],
        providers: [
            {
                provide: EntityService,
                useValue: mock(EntityService),
            },
        ],
    });

    // ... the rest of the test here ...
});
```

## Conclusion

While SCAMs have multiple positive features, the benefits that they give to Angular component tests is my favorite characteristic of a SCAM.  
From my experience, it's been an absolute joy to work with and I'm feeling more productive than before.

By organizing your Angular building blocks into SCAMs you don't need to figure out which dependencies are required to keep the test setup up-to-date. With SCAMs each change to the component's production code is directly reflected in the test.

If you follow this practice, your tests become resilient to internal changes and you can give your full focus to the new features.

Happy testing!
