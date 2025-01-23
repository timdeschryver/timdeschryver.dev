---
title: Be proactive when you join an Angular project
slug: be-proactive-when-you-join-an-angular-project
description: Tips to help improve the shape of an older Angular codebase.
author: Tim Deschryver
date: 2022-02-15
tags: Angular
---

As developers, we're always using analogies to explain our work to non-developers.
We do this to give an idea of what it's like without using too much of our technical jargon.
In this intro, I'm doing the same.

Working on a project is a lot like gardening.
You start to plant seeds and watch them slowly grow into a beautiful, colorful, garden, and a home to some animals.
When you start out and everything is new, you give your new garden a lot of attention, but then you realize that it requires a consistent commitment to properly maintain the garden. If you want to do it right, you have to give it the required time, otherwise it transforms into a wilderness with dead flowers.
Because the garden keeps on growing it becomes harder and harder to give each area the desired time. Sadly, you also need to attain other chores that you don't like as much as maintaining your garden. This is all taking away valuable time the garden needs.
Eventually, the garden slowly loses its beauty and so does your motivation.

Starting a new project is a lot like the above-described garden.
The project starts off with good intentions, but eventually some trade-offs need to be made along the way due to several factors. Doing your best with the current information, deadlines that had to be reached, members that leave the team, evolving technology, and the lack of experience are all reasons that decide the quality of the codebase. When it becomes worse it also has an impact on the future development, at its worst-case, it also lowers the team mood and team morale. Making a new change requires more energy than it used to.

When you join a team it usually takes a while to be brought up-to-speed and to start being or feeling productive.
When you hear your team members complain about the current state of the codebase, that it got out of control, that it could need a polishment, or when you notice it yourself, there's a chance for you to make a positive impact by being proactive.

Giving a codebase the required, but long over-due focus is a win-win situation for you and the team.
You get an introduction to the codebase, and the whole team wins because you improve the state of the application.
Because, let's be honest, no one else wants to do it at this point in time.
It's also a perfect opportunity to get to know your team members because what you're about to do is going to result in questions on both sides.

Let's take a look at what you can do now to clean up the codebase by bringing it up to date.
Let's start gardening!

## Tune up the strictness

### TypeScript

This is probably the most impactful item on your to-do list, but also the most time-consuming.
With strictness enabled it results in silly mistakes being caught at compile time, and thus you create a safer environment.
For example, it can detect an unsafe operation on an object that could possibly be `null`.

To enable "strict mode" in your application, open the `tsconfig.json` file and set the `compilerOptions.strict` property to `true`.
`strict` is a superset containing multiple strict options. Besides the `strict` flag, you can also enable more properties that result in a safer environment, for example, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`, which are enabled by default in a new Angular 13 project.

### Angular templates

Besides the TypeScript strict mode, Angular also provides a `strictTemplates` option.
The option can be compared to the `strict` option, but for the HTML templates.
For example, it warns you when you pass a method the wrong type, e.g. a string instead of a number.

The `strictTemplates` option can be enabled by setting the `angularCompilerOptions.strictTemplates` to `true` in the `tsconfig.json` file.

### Enable strict mode

The first time when you enable one or both strict options you are probably going to see some errors when you try to run )and build) the application.
These need to be addressed first, before the application can run again.

```json{7,26}:tsconfig.json
/* To learn more about this file see: https://angular.io/config/tsconfig. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "es2017",
    "module": "es2020",
    "lib": [
      "es2020",
      "dom"
    ]
  },
  "angularCompilerOptions": {
    "strictTemplates": true
  }
}
```

See the [TypeScript docs](https://www.typescriptlang.org/tsconfig#strict) and the [Angular docs](https://angular.io/guide/template-typecheck#strict-mode) for more info.

## Betterer

Refactoring all the errors at once is the best scenario, but don't worry when there are too many of them.
Luckily, [Betterer](https://phenomnomnominal.github.io/betterer/) provides a solution to incrementally improve the state of the codebase.

By using Betterer, you're not forced to fix all the errors in one go, but the development process can continue.
This means that you don't have to "waste" time before you can run the application.
With Betterer you can take your time to take care of the errors one by one, without the addition of new errors, and this can be a team effort.

To add Betterer run the init command:

```bash
# Install Betterer and create a blank test
npx @betterer/cli init
# Install the plugins we need
npm i --save-dev @betterer/typescript @betterer/angular
```

Then, you can remove the `strict` option from the `tsconfig.json` file (the one we added before) and move them to a Betterer test inside the `.betterer.ts` file.

```ts{1,4-7}:.better.ts
import { typescript } from '@betterer/typescript';

export default {
  'stricter compilation': () =>
    typescript('./tsconfig.json', {
      strict: true,
    }).include('./src/**/*.ts'),
};
```

Before you run the Betterer command, also add the `--strict` flag to the added betterer script in the `package.json` file, making it harder to cheat with the test results.

```json{8}:package.json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint",
    "betterer": "betterer --strict"
  },
  "dependencies": {},
  "devDependencies": {
    "@betterer/cli": "^5.1.6",
    "@betterer/typescript": "^5.1.6",
    "@betterer/angukar": "^5.1.6"
  }
}
```

Now, you're ready to run Betterer for the first time, which gives you the following result.

```bash
npm run betterer

   \ | /     _         _   _
 '-.ooo.-'  | |__  ___| |_| |_ ___ _ __ ___ _ __
---ooooo--- | '_ \/ _ \ __| __/ _ \ '__/ _ \ '__|
 .-'ooo'-.  | |_)|  __/ |_| ||  __/ | |  __/ |
   / | \    |_.__/\___|\__|\__\___|_|  \___|_|

🎉 Betterer (4.743ms): 1 test done!
✅ stricter compilation: "stricter compilation" got checked for the first time! (291 issues) 🎉

1 test got checked. 🤔
1 test got checked for the first time! 🎉
```

As you can see, the Betterer command checks for violations that are configured in the test file.
In this case, with the TypeScript strictness enabled.
What you can't see, is that it stores the results in a separate `.betterer.results` file.

The next time that the command is run, Betterer compares the two results and throws an error when the result has gotten worse.

```bash
🎉 Betterer (3.809ms): 1 test done!
✅ stricter compilation: "stricter compilation" got better! (0 fixed issues, 291 remaining) 😍

・ New issue in "/work/project/src/state.ts"
・ > 2 | import {  BehaviorSubject, throwError } from 'rxjs';
・     |                            ^^^^^^^^^^ 'throwError' is declared but its value is never read.

1 test got checked. 🤔
1 test got worse. 😔
```

Great! You can now detect new violations and prevent them from being committed (more on this later).

When you've positively made improvements, Betterer lets you commit the changes, and it updates its results file.

```bash
🎉 Betterer (6.809ms): 2 tests done!
✅ stricter compilation: "stricter compilation" got better! (49 fixed issues, 242 remaining) 😍

1 test got checked. 🤔
1 test got better! 😍
```

Multiple tests can be added to the `.betterer.ts` file, for example, we can also include a test for the Angular strict templates option.

```ts{2,10-13}:.betterer.ts
import { typescript } from '@betterer/typescript';
import { angular } from '@betterer/angular';

export default {
    'stricter compilation': () =>
        typescript('./tsconfig.json', {
          strict: true,
        }).include('./src/**/*.ts'),

    'stricter template compilation': () =>
        angular('./tsconfig.json', {
            strictTemplates: true
        }).include('./src/*.ts', './src/*.html'
};
```

## Update Angular

Another item on your to-do list is to verify that the project is running on the latest version of Angular.
If you notice that this isn't the case you can try to update Angular.
Most of the time, it only takes a few minutes, up to an hour, for it to complete.
When you notice that this isn't the case, you can abort the upgrade progress and document what went well and what didn't, this is valuable information to schedule the upgrade. Also, if you notice that the latest version of Angular is just released a few weeks before, ask your colleagues if it's OK to upgrade Angular because there might be a policy that restricts this.

Updating Angular's dependencies isn't difficult, and there's an official [Angular Update Guide](https://update.angular.io/) that lays down the details and gives a step-by-step update path.

To check if a dependency can be updated, run the `ng update` command.
If the project isn't using the latest version, you'll see an output like the one below.

```bash
npx ng update

The installed local Angular CLI version is older than the latest stable version.
Installing a temporary version to perform the update.
Installing packages for tooling via npm.
Installed packages for tooling via npm.
Using package manager: 'npm'
      @angular/cdk                            11.2.13 -> 12.2.9        ng update @angular/cdk@12
      @angular/cli                            11.2.11 -> 12.2.9        ng update @angular/cli@12
      @angular/core                           11.2.12 -> 12.2.9        ng update @angular/core@12
      @ngrx/store                             11.1.1 -> 13.0.2         ng update @ngrx/store

    There might be additional packages that don't provide 'ng update' capabilities that are outdated.
    You can update the additional packages by running the update command of your package manager.
```

Next, pass the desired libraries as an input argument to the `ng update` command and let the Angular CLI do its magic.

```bash
npx ng update @angular/cli@12 @angular/cdk@12 @ngrx/store
```

> Read about how you can include your own libraries to the update command in [ng update: the setup](../ng-update-the-setup/index.md)

## ESLint

In the early years Angular relied on TSLint to statically analyze your code to quickly find problems (also known as a linter) in an Angular project.
In 2019-2020, TSLint became deprecated and was ported over to ESLint as [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint).

Because TSLint was included with the creation of a new Angular project, a lot of older Angular projects still depend on TSLint.
This gives us another item on our to-do list, the migration from TSLint to ESLint.

For Angular projects, there's the [angular-eslint](https://github.com/angular-eslint/angular-eslint) ESLint plugin, which is the ESLint equivalent of `codelyzer`.

Luckily, the `angular-eslint` team has put a lot of effort into an automatic migration to offer us a smooth transition going from TSLint to ESLint. To upgrade your project to ESLint run the following commands.

```bash
npx ng add @angular-eslint/schematics
npx ng generate @angular-eslint/schematics:convert-tslint-to-eslint
```

The script ports over the TSLint rules to ESLint rules and tries to find the ESLint equivalents to your installed TSLint plugins.
While you're installing and configuring ESLint, I recommend you to also add the [RxJS ESLint plugin](https://github.com/cartant/eslint-plugin-rxjs) and if your project is using NgRx, there's also the [NgRx ESLint Plugin](https://ngrx.io/guide/eslint-plugin).

Besides being useful (it can detect common mistakes), linters also includes fixers for some deprecations and best practices.

For a simple project, this results in the following ESLint config.

```json:.eslintrc.json
{
  "root": true,
  "ignorePatterns": [
    "projects/**/*"
  ],
  "overrides": [
    {
      "files": [
        "*.ts"
      ],
      "parserOptions": {
        "project": [
          "tsconfig.json"
        ],
        "createDefaultProgram": true
      },
      "extends": [
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates"
      ],
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "app",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "app",
            "style": "kebab-case"
          }
        ]
      }
    },
    {
      "files": ["*.ts"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "ecmaVersion": 2019,
        "project": "./tsconfig.json",
        "sourceType": "module"
      },
      "extends": ["plugin:rxjs/recommended"]
    },
    {
      "files": ["*.ts"],
      "extends": ["plugin:ngrx/recommended"]
    },
    {
      "files": [
        "*.html"
      ],
      "extends": [
        "plugin:@angular-eslint/template/recommended"
      ],
      "rules": {}
    }
  ]
}
```

Before pushing these changes, let's also run ESLint against your whole codebase and let it fix violations automatically by using the `--fix` flag.

```bash
npx eslint . --fix
```

This already solves a lot of issues, but for other issues you need to manually rewrite the code that causes the violation.
To see all the ESLint errors and warnings, run the following command.

```bash
npx eslint .
```

Here again, you can resort to [Betterer](#betterer) if there are too many errors to fix at once by using the built-in [Betterer ESLint Test](https://phenomnomnominal.github.io/betterer/docs/eslint-test).

## Prettier

Because everyone has a unique writing (and format) style, it sometimes makes it harder to review a change.
By enforcing a team style you make sure that a change is isolated to just the task and nothing more.
This practice makes it easier to review changes.

To enforce the writing style you can use [Prettier](https://prettier.io/), an opinionated code formatter.

To add prettier to your project, run the next command.

```bash
npm i --save-dev prettier
```

Then, create a `prettier.config.js` config file and configure the options to your desires, for example:

```js:prettier.config.js
module.exports = {
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
};
```

I also encourage you to immediately run prettier on the whole project.
Otherwise, a small change to a file may result in a lot of formatting changes in that same file, making it harder to review the isolated change.

To format your whole codebase at once, run the following command.

```bash
npx prettier . --write
```

### Prettier with ESLint

You can end up with conflicts because both ESLint and Prettier can change your code.
One can override the other, resulting in a different output.
In the worst case, one rule might conflict and report warning(s) while the code looks good for the other.

To solve this, install the Prettier ESLint Plugin [`eslint-plugin-prettier`](https://github.com/prettier/eslint-plugin-prettier). Next, add the prettier plugin to the ESLint settings.

```json:.eslintrc.json
{
  "extends": ["plugin:prettier/recommended"]
}
```

For using the plugin correctly with the Angular ESLint Plugin, you can take a look at the [documentation](https://github.com/angular-eslint/angular-eslint#notes-for-eslint-plugin-prettier-users).

## Unifying libraries

There might be some inconsistencies on a project where different developers have been working on.
For example, different libraries that are used to do the same thing, e.g. icon libraries, utility libraries,...

For new developers that join the team, this makes it harder to follow the best practices and to keep the design consistent.
It's up to you to detect these libraries and unify them into one library.
Better, you can also document how something is best done in your project.

An additional benefit is that the bundle size shrinks.

## Writing Tests

On a project that doesn't have tests, there might be a fear of regression to touch existing parts of the application.
To give you a layer of security, I find that end-to-end tests offer a lot of value.
It also gives you a chance to go through the application and get acquainted with the domain.

A simple happy-path test to a critical part of the application is good enough to start with.
While this provides direct value, it also acts as a good foundation that can be built upon.

To write the end-to-end test, I'm currently using [Playwright](https://playwright.dev/).
One of the key essentials is that it has a [test generator command](https://playwright.dev/docs/codegen) where you can just click through your application, and the generator writes the test case for you. It can just be that simple.

In [future blog posts](https://timdeschryver.dev/blog?q=playwright), I probably go into more details about why I like and use Playwright and how to set it up in an Angular project.

## Git hooks

The above-mentioned tools and rules are a great way to improve and maintain the state of the project, but it isn't a one-time thing, and we're also lacking a way to enforce them to the whole team and future developers.

Simply mentioning and documenting what you've done, and asking the team to pay attention to keep the application in a better shape isn't good enough. While the thought of it makes the team happy, in practice, these good intentions tend to evaporate quickly.

To force the team to follow these rules, you need to introduce [git hooks](https://git-scm.com/docs/githooks).
A hook is executed before (pre) or after (post) running a git command.

Usually you write a hook that runs before the git command is executed.
Two popular hooks are the `pre-commit` and `pre-push` hook to prevent "falsy" code is committed or pushed to a branch.

In the example below a `pre-commit` file is created in the `.githooks` folder, in which you implement the `pre-commit` hook.
The implementation of the hook can run your npm scripts, in this case we want to run Betterer with the `precommit` option, and we want to run lint-staged.

```bash:.githooks/pre-commit
#!/bin/sh

npx betterer precommit
npx lint-staged

# instead of adding the commands in this file,
# you can also add a script to the package.json scripts to run the desired checks
# npm run pre-commit
```

To register the git hook, add the [`prepare` lifecycle hook](https://docs.npmjs.com/cli/v8/using-npm/scripts#prepare-and-prepublish) to the scripts of the `package.json` file. When a team member runs the `npm install` command, the `prepare` hook is executed and the git hook is registered.

```json{8}:package.json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint",
    "prepare": "git config core.hookspath .githooks"
  },
  "dependencies": {},
  "devDependencies": {
    "lint-staged": "^12.3.3",
  }
}
```

The [lint-staged](https://github.com/okonet/lint-staged) is a library (yes, another one) that helps us to keep the application in better shape.
It makes it easy to run commands to staged git files before these are committed.
In other words, a touched filed is automatically formatted (important if someone's IDE doesn't run prettier) and is checked against ESLint and strictness violations. This makes sure that code is always formatted and ensures that there are no violations against strict compilers and ESLint rules.
You could also always run the commands to the whole project, but this could take up some time, using lint-staged makes sure that almost no time is lost.

To install lint-staged, run the following command.

```bash
npm install --save-dev lint-staged
```

To configure lint-staged, create a `lint-staged.config.js` file and add the `prettier` and `eslint` commands.

```js:lint-staged.config.js
module.exports = {
  '*.{ts,js}': ['prettier --write', 'eslint --fix'],
  '*.html': ['prettier --write', 'eslint'],
  '*.{json,md,css}': ['prettier --write'],
};
```

## Detect and remove unused objects

A project that's been under development has probably a few objects (interfaces, methods, ...) that aren't used anymore.
This is poluting the codebase and causes confusion.

You can detect these object with [ts-prune](https://github.com/nadeesha/ts-prune).
When you run the command below, you get a list unused objects.

```ts
npx ts-prune
```

Take a look at the output and act accordingly by removing unused objects, resulting in a clean code base.

## NX

Instead of manually upgrading the project to use the latest versions of the above mentioned tools and libraries, take a look at [NX](https://nx.dev/).

NX offers a rich eco-system and provides automatic upgrade paths.

## Conclusion

Joining a new team is always exciting and you never know in which shape you'll encounter the application.
To start things off on a positive note there are probably some chores that you can pick up that no one else feels like doing.

By listening to the complaints and by taking a closer look at the codebase, I'm sure that you can find things that need to be improved. Sadly, no codebase is perfect.
In these cases, I say "be proactive" and get to work.

This benefits you because you can get to know the application and your team members better while immediately making a good impact.
It also benefits the whole team because a codebase that is well maintained leads to a better mood and motivates the team to continually improve. Because the morale is better, productivity also increases, making the managers happy.

Enjoy and take care of your clean workspace!
