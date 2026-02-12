---
title: Improve the quality of your Angular component snapshots with Vitest
slug: improve-the-quality-of-your-angular-component-snapshots-with-vitest
description: Snapshot testing Angular components in Vitest can be noisy. Learn how to clean up your snapshots with Angular-aware serializers to get reviewable DOM snapshots. This practice can also be applied to projects migrating from Jest to Vitest, ensuring consistent snapshots across test runners.
date: 2026-02-12
tags: Angular, Testing, Vitest
---

To test an Angular component, I sometimes use a snapshot test to validate the DOM. This can be a quick way to verify a component with few interactions renders correctly. Snapshot testing was already possible with Jest, but if you are migrating your test suite to Vitest, you will notice a couple of differences.

In this post I want to point out a small change you can make to improve your snapshots.
If you were using Jest, this improvement is also helpful because you do not have to change your existing tests.

## Your first snapshot test

:::info
Snapshot testing is a testing technique where you take a snapshot of the output of a component or function and compare it to a previously stored snapshot. Running the test will generate a snapshot if it doesn't exist, or compare the output to the existing snapshot if it does exist. If the output has changed, the test will fail, indicating that there has been a change in the component's output. This can be useful for catching unintended changes in the component's behavior or appearance.
:::

For a small demonstration, let's take a look at the following snapshot test, which renders the `App` component and verifies the fixture matches the snapshot.

```ts [file=app.spec.ts]
import { render } from '@testing-library/angular/zoneless';
import { App } from './app';

it('creates the app', async () => {
	const { fixture } = await render(App);
	expect(fixture).toMatchSnapshot();
});
```

Running the above test for the first time can take a long time, and may even time out.
At the end, the test should generate a snapshot, and when you look at the output, it explains why it was so slow.
In this example, the snapshot contains about 803,000 lines of output, because it includes the entire component fixture.
Here's a small snippet of the generated snapshot:

```txt [file=__snapshots__/app.spec.ts.snap]
// Vitest Snapshot v1, https://vitest.dev/guide/snapshot.html

exports[`App > should create the app 1`] = `
ComponentFixture {
  "_appRef": ApplicationRef {
    "_destroyListeners": [],
    "_destroyed": false,
    "_injector": R3Injector {
      "_destroyed": false,
      "_ngOnDestroyHooks": Set {
...
```

As you can see, this is not very useful.
To make the test valuable, we can pass the HTML element to the snapshot instead of the component fixture.

```ts [file=app.spec.ts]
import { render } from '@testing-library/angular/zoneless';
import { App } from './app';

it('creates the app', async () => {
	const { fixture, container } = await render(App);

	expect(fixture.nativeElement).toMatchSnapshot();
	// or
	expect(container).toMatchSnapshot();
});
```

Running the tests again now results in a better snapshot.
In the new snapshot you can see the DOM content of the `App` component.
For example, we can now clearly see that the component renders 3 card components.

```html [file=__snapshots__/app.spec.ts.snap]
// Vitest Snapshot v1, https://vitest.dev/guide/snapshot.html exports[`creates the app 1`] = `
<div _nghost-a-c4254472376="" id="root0" ng-version="21.1.3">
	<app-card _ngcontent-a-c4254472376="" _nghost-a-c2695974021="">
		<div _ngcontent-a-c2695974021="" class="card-shadow">
			<div _ngcontent-a-c2695974021="" class="card-divider" />
			<app-card-title _ngcontent-a-c4254472376="">
				<!--container-->
				Card Title 1
			</app-card-title>
			<div _ngcontent-a-c4254472376="">Card details</div>
		</div>
	</app-card>
	<app-card _ngcontent-a-c4254472376="" _nghost-a-c2695974021="">
		<div _ngcontent-a-c2695974021="" class="card-shadow">
			<div _ngcontent-a-c2695974021="" class="card-divider" />
			<app-card-title _ngcontent-a-c4254472376="">
				<!--container-->
				Card Title 2
			</app-card-title>
			<div _ngcontent-a-c4254472376="">Card details</div>
		</div>
	</app-card>
	<app-card _ngcontent-a-c4254472376="" _nghost-a-c2695974021="">
		<div _ngcontent-a-c2695974021="" class="card-shadow">
			<div _ngcontent-a-c2695974021="" class="card-divider" />
			<app-card-title _ngcontent-a-c4254472376="">
				<!--container-->
				Card Title 3
			</app-card-title>
			<div _ngcontent-a-c4254472376="">Card details</div>
		</div>
	</app-card>
	<!--container-->
</div>
`;
```

## Improve the snapshot quality using snapshot serializers

While this is an improvement, and you might find this is already good enough, I think the snapshot contains too much noise.
When you pay close attention (to be honest, you cannot miss it), you notice additions injected by Angular, such as `_ng` attributes and `<!--container-->` comments. These make the snapshot harder to review and the snapshot is more likely to change, for example after an Angular upgrade.

If you are already familiar with Jest snapshot testing, this extra noise should be something you do not see in Jest snapshots.
This is not because of the Jest test runner, but because the [`jest-preset-angular` library](https://thymikee.github.io/jest-preset-angular/) makes use of custom snapshot serializers to prettify the output. To resolve the Vitest snapshot pollution, we're also required to use custom serializers in Vitest.

To configure Vitest, first create a `vitest.config.ts` file in the `src` folder of your Angular project.
Next, reference this file in `angular.json` as the `runnerConfig` option to extend (or modify) the default Angular testing behavior.
With this change, the Angular test runner picks up the custom configuration to configure the Vitest test runner.

```json [file=angular.json] [highlight=7-12]
{
	"$schema": "./node_modules/@angular/cli/lib/config/schema.json",
	"version": 1,
	"newProjectRoot": "projects",
	"projects": {
		"sandbox": {
			"test": {
				"builder": "@angular/build:unit-test",
				"options": {
					"runnerConfig": "src/vitest.config.ts"
				}
			}
		}
	}
}
```

Now, back to the `vitest.config.ts` file, where we need to set the snapshot serializer(s) used by Vitest.
Luckily, it's possible to reuse the already existing serializers of `jest-preset-angular`.

`jest-preset-angular` provides 3 different serializers, each focusing on one aspect of the snapshot:

- `html-comment`: removes the `<!--container-->` comments from the snapshot
- `ng-snapshot`: allows you to snapshot test a component fixture instead of a DOM element (just as the very first snapshot example at the top of the page)
- `no-ng-attributes`: removes the `_ng` attributes from the snapshot

```ts [file=vitest.config.ts] [highlight=6-10]
import { defineConfig } from 'vitest/config';

// More info at https://angular.dev/guide/testing#advanced-vitest-configuration
export default defineConfig({
	test: {
		snapshotSerializers: [
			'jest-preset-angular/build/serializers/html-comment',
			'jest-preset-angular/build/serializers/ng-snapshot',
			'jest-preset-angular/build/serializers/no-ng-attributes',
		],
	},
});
```

If you do not have `jest-preset-angular` installed, first add it using the following command:

```bash
npm install jest-preset-angular --save-dev
```

After this change, you can revert the earlier test change and simplify the test by passing the component instance to the snapshot.
Behind the scenes, the `ng-snapshot` serializer converts the instance to the HTML structure.

```diff [file=app.spec.ts]
import { render } from '@testing-library/angular/zoneless';
import { App } from './app';

it('creates the app', async () => {
  const {fixture} = await render(App);
-  expect(fixture.nativeElement).toMatchSnapshot();
+  expect(fixture).toMatchSnapshot();
});
```

:::tip
While you're in the process of migrating your Jest test suite to use Vitest, this also means that your snapshots will almost be identical between Jest and Vitest.
One of the differences you'll still notice is how the snapshots are named, which is slightly different.
But, the snapshot content should be the same.
:::

After running the test again and approving the new snapshot, this version becomes much more compact,
allowing you and your team to focus on the important output.
This effect can clearly be seen in the new version of the snapshot:

```html [file=__snapshots__/app.spec.ts.snap]
// Vitest Snapshot v1, https://vitest.dev/guide/snapshot.html exports[`creates the app 1`] = `
<div>
	<app-card>
		<div class="card-shadow">
			<div class="card-divider" />
			<app-card-title> Card Title 1 </app-card-title>
			<div>Card details</div>
		</div>
	</app-card>
	<app-card>
		<div class="card-shadow">
			<div class="card-divider" />
			<app-card-title> Card Title 2 </app-card-title>
			<div>Card details</div>
		</div>
	</app-card>
	<app-card>
		<div class="card-shadow">
			<div class="card-divider" />
			<app-card-title> Card Title 3 </app-card-title>
			<div>Card details</div>
		</div>
	</app-card>
</div>
`;
```

## Analog.js

There is also a Vitest serializer in the `@analogjs/vitest` library, but it does not have as rich a feature set as the serializers from `jest-preset-angular`. The serializer provided by `@analogjs` is similar to `ng-snapshot`, which is the least interesting one in my opinion. This [could change in the future (feel free to help with this GitHub issue)](https://github.com/analogjs/analog/issues/2065), because for now it can feel strange to still import `jest-preset-angular` and this leads to conflicting peer dependencies.
To start using the `@analogjs` serializer, take a look at the [documentation](https://analogjs.org/docs/features/testing/vitest).

## Conclusion

Snapshot tests can be a simple way to validate component output, but the default snapshot format is noisy. By adding Angular-aware serializers, you get snapshots that are stable and easier to review. This is useful for new projects, but also especially for projects that are migrating from Jest to Vitest because the snapshot versions remain consistent.
