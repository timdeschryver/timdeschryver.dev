---
title: 'ng update: the setup'
slug: ng-update-the-setup
description: Let your library automatically update with ng update
author: Tim Deschryver
date: '2018-05-21T14:00:16.553Z'
tags:
  - Angular
banner: './images/banner.jpg'
bannerCredit: 'Photo by [Victor Lozano](https://unsplash.com/@prozpris) on [Unsplash](https://unsplash.com)'
published: true
---

With the Angular 6 release, already a couple weeks ago, the CLI package `@angular/cli` also received an update (also version 6). You will probably already have heard of it or even used it, but this update of the CLI introduced a new command `ng update`. In short this updates your application and its dependencies by taking a look if any of the dependencies in your `package.json` has a new version available. For more details about Angular 6 release you can take a look at the resources at the bottom of this post.

If you want to automatically let the CLI update your own library when a user runs `ng update` you’ll have to plug into the `ng-update` hook. As an example we’re going to use [frontal](https://github.com/timdeschryver/frontal)_— a selectbox/dropdown component based on_ [_downshift_](https://github.com/paypal/downshift)\_ — _which is currently on version 1.0.0 and after running `ng update` we want to have version 2.0.0 beta installed. There are also some popular packages where you can take a peek: [RxJs](https://github.com/ReactiveX/rxjs), [angular/material2](https://github.com/angular/material2) and recently the [NgRx packages](https://github.com/ngrx/platform).

Enough of the what, let’s take a look at the how!

### Schematics

The first step is to setup the schematics by creating a [`migrations.json`](https://github.com/timdeschryver/frontal/blob/master/migrations/migration.json) file, the name isn’t set in stone so you can name it everything you want (RxJS named theirs [`collection.json`](https://github.com/ReactiveX/rxjs/blob/master/migrations/collection.json)).

```json
{
  "schematics": {
    "frontal-migration-01": {
      "description": "Upgrade to version 2",
      "version": "1.0.0",
      "factory": "./2_0_0/index"
    }
  }
}
```

In the `schematics` value there is a property for each migration, the property name itself isn’t used (I think) but must be unique. The important part here are the `version` and the `factory` values. `version` is used to match the current installed version to run the update against, in the example the update is going to run when version 1.0.0 (or lower) is installed. `factory` is used to point to a factory function where all the magic happens, in the example it will call the default function inside `./2_0_0/index`. It’s also possible to specify a function, with the following syntax `"factory": "./update-6_0_0/index#rxjsV6MigrationSchematic"`.

### Update function

This is the function which is called during `ng update`. In the [implementation](https://github.com/timdeschryver/frontal/blob/master/migrations/2_0_0/index.ts) below, the dependency version will be updated in the `package.json`. Note that it’s also possible to do more than just upgrading the version number, for instance if we take a look at [angular/material2](https://github.com/angular/material2/blob/master/src/lib/schematics/update/update.ts#L36) it also runs some linter rules.

```ts
import {
  Rule,
  SchematicContext,
  Tree,
  SchematicsException,
} from '@angular-devkit/schematics'

export default function(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const pkgPath = '/package.json'
    const buffer = tree.read(pkgPath)
    if (buffer == null) {
      throw new SchematicsException('Could not read package.json')
    }
    const content = buffer.toString()
    const pkg = JSON.parse(content)

    if (pkg === null || typeof pkg !== 'object' || Array.isArray(pkg)) {
      throw new SchematicsException('Error reading package.json')
    }

    if (!pkg.dependencies) {
      pkg.dependencies = {}
    }

    if (pkg.dependencies['frontal']) {
      pkg.dependencies['frontal'] = `2.0.0-beta.1`
      tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2))
    }

    return tree
  }
}
```

> Wouldn’t it be 🍌 🍌 🍌 if all libraries would automatically fix (breaking) changes during this step, or at least let you know which steps you have to make in order to have a successful update?

### Package.json

Last, an `ng-update` entry must be added to the [`package.json`](https://github.com/timdeschryver/frontal/blob/master/src/package.json). This is necessary to let the angular CLI know where to look for the migrations.

```json
"ng-update": {
  "migrations": "./migrations/migration.json"
}
```

### Testing

It is possible to [test](https://github.com/timdeschryver/frontal/blob/master/__tests__/migrations/2_0_0.ts) the factory function by creating a `UnitTestTree`, having a dependency to the library with the old version number. Next the migration is is run with `runSchematic`, expecting that the version number has been changed to the correct version.

```ts
import { Tree } from '@angular-devkit/schematics'
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing'
import * as path from 'path'

const packagePath = '/package.json'
const collectionPath = path.join(__dirname, '../../migrations/migration.json')

function setup() {
  const tree = Tree.empty() as UnitTestTree
  tree.create(
    packagePath,
    `{
        "dependencies": {
          "frontal": "1.0.0"
        }
      }`
  )

  return {
    tree,
    runner: new SchematicTestRunner('schematics', collectionPath),
  }
}

test(`installs version 2.0.0`, () => {
  const { runner, tree } = setup()
  const updatedTree = runner.runSchematic('frontal-migration-01', {}, tree)
  const pkg = JSON.parse(updatedTree.readContent(packagePath))
  expect(pkg.dependencies['frontal']).toBe(`2.0.0-beta.1`)
})
```

To test the `ng update` command locally before publishing to `npm` you can use [`verdaccio`](https://github.com/verdaccio/verdaccio), _a lightweight private npm proxy registry._ There is a resource at the bottom, which addresses this point in detail*.*

### Result

As result we can see that a new version is available after running `ng update`. I’m using the `next` flag to also include `next` tags because version 2 hasn’t been released yet.

![](./images/ng-update.png)

we run ng update frontal — next and see that a new version is available

After running the update command we can see the version number is changed in the `package.json` and we can start using the version in our project 🎉.

![](./images/updated.png)

the version number is updated to the new version after `ng update frontal — next` has ran

### More resources

[Version 6 of Angular Now Available](https://blog.angular.io/version-6-of-angular-now-available-cc56b0efa7a4)

[Seamlessly Updating your Angular Libraries with the CLI, Schematics and ng update](http://www.softwarearchitekt.at/post/2018/04/17/seamlessly-updating-your-angular-libraries-with-ng-update.aspx)

[angular/devkit](https://github.com/angular/devkit/blob/master/docs/specifications/update.md)
