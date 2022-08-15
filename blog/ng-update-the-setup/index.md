---
title: 'ng update: the setup'
slug: ng-update-the-setup
description: Within 5 minutes you can automagically have your library upgraded when a user runs the ng update command.
author: Tim Deschryver
date: 2018-05-21T14:00:16.553Z
tags: Angular, Angular CLI
---

In this post, we take a look at how you can configure your library to automatically be upgraded when a user runs the `ng update` command.

The basic setup requires you to make two small changes:

1. add 3 lines to the `package.json` file
1. create an empty JSON file

By taking 5 minutes to do this, you hook into the `ng-update` command and your library can be discovered and upgraded when a user runs `ng update`. This makes sure that your users are using the latest version of your library, keeping everybody happy.

This setup can then further be extended to also include automatic code migrations, for example, to modify code to fix breaking changes.

To see a configured version, take a look at the [Angular Testing Library](https://github.com/testing-library/angular-testing-library/tree/main/projects/testing-library), or to [NgRx](https://github.com/ngrx/platform/tree/master/modules/store), which also includes code migrations.

Enough of the what, let’s take a look at the how!

## Create the migrations.json file

The first step is to create a new JSON file.
Its name doesn't really matter, but an unwritten convention is to use `migrations.json`.
As a best practice, you should also isolate the migrations from the source code, that's why I prefer to create the file in the `schematics/migrations` directory.
Inside of the file, simply add an empty `schematics` entry.

```json{3}:schematics/migrations/migration.json
{
  "$schema": "../../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {}
}
```

## Update your package.json

In the `package.json` file you're going to create a new `ng-update` entry that includes a `migrations` property. The Angular CLI looks for this property during the update process, and by pointing to the `migrations.json` file, the CLI knows how to run your migration(s).

```json{3-5}:package.json
{
  "name": "your-awesome-library-here",
  "ng-update": {
    "migrations": "./schematics/migrations/migration.json"
  },
  "dependencies": {}
}
```

This is sufficient to plug your library into the `ng-update` command.

## Add the migration schematic to the output (dist) folder

By default, these migrations aren't included in your output (dist) folder.
For it to be included, you need to add a post-build script to copy the migration file to the output folder.
Make sure that the path inside of the `package.json` file matches the migration file that is added to the output folder.

## Add automatic code migrations (optional)

So far, only the version of your library is upgraded when the `ng update` command is run.
The new version of the library is installed, and the version is updated in the `package.json` file.

To also run some code during this upgrade path, you can add code migrations to the `migrations.json` file.

A code migration section consists of a `version`, a `factory`, and a `description`.

```json{4-8}:schematics/migrations/migration.json
{
  "$schema": "../../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "migration-v2": {
      "description": "Update to version 2",
      "version": "2.0.0",
      "factory": "./2_0_0/index"
    }
  }
}
```

The `version` decides the migration that has to be run.
In the example above, the migration is run when the user is on a lower version than v2, and wants to upgrade to v2 or higher.

When the Angular CLI detects that a migration needs to be run, it will run the factory, which is a function that returns a schematic, a [Rule](https://github.com/angular/angular-cli/blob/fb3b1fe32b6ccb67e99b496a9cedeec5d5a27ce3/packages/angular_devkit/schematics/src/engine/interface.ts#L234-L237).
In the example above, the schematic function is the default export in the `./2_0_0/index.ts` file.

Besides this syntax, you can also see a variant of the factory function that exports a named function.
The migration file then looks like the following snippet, notice the name of the function `runV2Migration` after file name.

```json{4-8}:schematics/migrations/migration.json
{
  "$schema": "../../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "migration-v2": {
      "description": "Update to version 2",
      "version": "2.0.0",
      "factory": "./index#runV2Migration"
    }
  }
}
```

## Define the migration rule (optional)

This is the function that is called while the `ng update` command is executing.
Within this function, you have access to the users' projects files.

The implementation of this function usually involves using the Abstract Syntax Tree (AST) to crawl for the nodes (code blocks) that need to be updated.

> I like to use [https://astexplorer.net/](https://astexplorer.net/) to visualize and interact with the AST.

Because this is can become long and complex, the example below uses a simpler example and migrates the `package.json` file of the user to clean up a deprecated dependency to `ngrx-store-freeze`.

The code below reads and parses the `package.json` file, removes the dependency, and overwrites the current file with the updated version.

```ts:schematics/migrations/2_0_0/index.ts
import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';

export default function (): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const pkgPath = '/package.json';
    const buffer = tree.read(pkgPath);
    if (buffer === null) {
      throw new SchematicsException('Could not read package.json');
    }
    const content = buffer.toString();
    const pkg = JSON.parse(content);

    if (pkg === null || typeof pkg !== 'object' || Array.isArray(pkg)) {
      throw new SchematicsException('Error reading package.json');
    }

    const dependencyCategories = ['dependencies', 'devDependencies'];

    dependencyCategories.forEach((category) => {
      if (pkg[category] && pkg[category]['ngrx-store-freeze']) {
        delete pkg[category]['ngrx-store-freeze'];
      }
    });

    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
    return tree;
  };
}
```

## How to test the migration

Testing an application is important, and testing a migration is not an exception.
To test the migration, there are some useful functions available that can be imported from the `angular-devkit/schematics/testing` module.

The test, you prepare the workspace, then you run the migration, and lastly, you can verify that the result of the migration is correct.

In the example below, a `package.json` file is created with a dependency to `ngrx-store-freeze`.
After running the migration, the `package.json` file is read to check if the `ngrx-store-freeze` dependency is removed.

```ts
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const packagePath = '/package.json';
const collectionPath = 'migrations/migration.json';

test(`removes the ngrx-store-freeze package`, () => {
	const tree = new UnitTestTree(new EmptyTree());
	tree.create(packagePath, JSON.stringify({ dependencies: { 'ngrx-store-freeze': '1.0.0' } }));

	const schematicRunner = new SchematicTestRunner('migrations', collectionPath);
	// migration-v2 is the name of the migration, which is defined in the migration.json file
	await schematicRunner.runSchematicAsync('migration-v2', {}, tree).toPromise();

	const actual = tree.readContent(packagePath);
	expect(JSON.parse(actual)).toEqual({ dependencies: {} });
});
```

## Conclusion

With just a few lines of configuration, you can add your project to the `ng-update` command.
This has the advantage that your users stay up-to-date with the latest version of your library.

If you want, you can optionally include migrations that modify the users' code.
This is useful because you can fix breaking changes.
A win-win for the maintainers and the users.

For me, this is one of the main reasons why I like the Angular ecosystem.
