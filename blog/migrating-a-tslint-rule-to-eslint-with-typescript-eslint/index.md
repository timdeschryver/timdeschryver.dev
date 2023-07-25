---
title: Migrating a TSLint Rule to ESLint with @typescript-eslint
slug: migrating-a-tslint-rule-to-eslint-with-typescript-eslint
description: The most important pointers you need to know before migrating your TSLint rules to ESLint rules.
author: Tim Deschryver
date: 2020-04-06
tags: Linters, Developer Experience, Tooling, Typescript
---

Because [TSLint is getting deprecated](https://medium.com/palantir/tslint-in-2019-1a144c2317a9), we have to find a new way to write our TSLint rules.
Luckily for us, there a lot of contributors working on an alternative, [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint). As the name implies, it's using ESLint to lint your TypeScript code. Internally, it uses a custom parser to turn the code into an Abstract Syntax Tree, allowing us to write our beloved rules.

## Dependencies

As most of the development, it all starts by installing dependencies.

```bash
$ npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Project setup

The folder structure stays the same, we still have a folder called `rules`.
But there is a small difference with the file names. Instead of using lowerPascalCase `ngrxActionHygieneRule`, we're now using the kebab style `action-hygiene` to create the rule files. You can also notice that the rules aren't prefixed anymore, nor are they using the `Rule` suffix.

## Creating a rule

Instead of creating a class and extending it from the `TypeRule` class to create a rule, we use the `RuleCreator` method.
This method can be imported from `@typescript-eslint/experimental-utils`.

```diff
- export class Rule extends Lint.Rules.TypedRule {}
+
+ import { ESLintUtils } from '@typescript-eslint/experimental-utils'
+ export default ESLintUtils.RuleCreator(ruleName => generateDocsUrl(ruleName)){})
```

This utility method expects that you pass the rule name, some metadata, the default options, and lastly a `create` method.
These options to configure your rules can be compared with the static `metadata` property of a TSLint rule and its `apply` methods.

```diff
-  public static metadata: Lint.IRuleMetadata = {
-    ruleName: 'ngrx-action-hygiene',
-    description: 'Enforces the use of good action hygiene',
-    descriptionDetails:
-      'See more at https://www.youtube.com/watch?v=JmnsEvoy-gY',
-    options: null,
-    optionsDescription: 'Not configurable',
-    requiresTypeInfo: false,
-    type: 'maintainability',
-    typescriptOnly: true,
-  }

+  name: 'action-hygiene',
+  meta: {
+    type: 'suggestion',
+    docs: {
+      category: 'Best Practices',
+      description:
+        'Enforces the use of good action hygiene. See more at https://www.youtube.com/watch?v=JmnsEvoy-gY.',
+      recommended: 'warn',
+    },
+    schema: [],
+    messages: {
+      actionHygiene: `Action type '{{ actionType }}' does not follow the good action hygiene practice, use "[Source] Event" to define action types`,
+    },
+  },
+  defaultOptions: [],

- public applyWithProgram(
-    sourceFile: ts.SourceFile,
-    program: ts.Program,
-  ): Lint.RuleFailure[] {
-   // rule implementation
-  }

+  create: context => {
+    return {
+      // rule implementation
+    }
+  }
```

## Rewriting a rule implementation

I've found that writing rules in ESLint is a more pleasant experience, and most of them are also easier to write in my opinion.
Previously with TSLint, we had to traverse the AST ourselves, which was hard sometimes and it usually was tedious work to do.

For easier access to the AST nodes ESLint provides [esquery](https://github.com/estools/esquery), to query nodes via [selectors](https://eslint.org/docs/developer-guide/selectors) which can be compared to CSS selectors.
By using selectors, we can for example select siblings and use attribute conditions to query the nodes we're looking for.
Because of this a multiline rule could be rewritten and reduced to a single line.

> As a side note, there is a TSLint equivalent, [tsquery](https://github.com/phenomnomnominal/tsquery) from [Craig Spence](https://twitter.com/phenomnominal) which has a similar API

Don't worry if you're not into using selectors - although they're really cool! - you can fallback to the visit methods, with the benefit that the nodes are already having the correct type. Just be aware that some node types have a slightly different name, compared to their TSLint equivalent.

```diff
- protected visitCallExpression(node: ts.CallExpression) {
-   // rule implementation
- }

+ create: context => {
+   return {
+    CallExpression(node) {
+      // rule implementation
+    },
+   // an example of a esquery, to find console.log statements
+   // with exactly one argument
+   `CallExpression[callee.object.name="console"][callee.property.name="log"][arguments.length=1]`(node) {
+      // rule implementation
+    }
+   }
+ }
```

## Adding a failure

To add a failure we can simply execute the `context.report` method, pass it a node, a message id and, optional data.
The message id must be configured in the meta data of the rule. The data is used to replace the placeholders, between double curly braces `{{ propertyName }}`, in the message.

```diff
- const failures = hits.map(
-     (node): Lint.RuleFailure =>
-       new Lint.RuleFailure(
-         sourceFile,
-         node.getStart(),
-         node.getStart() + node.getWidth(),
-         generateFailureString(),
-         this.ruleName,
-       ),
- )
- return failures

+ context.report({
+   node,
+   messageId: 'actionHygiene',
+   data: {
+     actionType: value,
+   },
+ })
```

For example, the following config and report will translate to "Action type 'LOAD_CUSTOMERS' does not follow the good action hygiene practice, use "[Source] Event" to define action types".

```ts
{
  messages: {
    actionHygiene: `Action type '{{ actionType }}' does not follow the good action hygiene practice, use "[Source] Event" to define action types`,
  },

  context.report({
     node,
     messageId: 'actionHygiene'
     data: {
        actionType: node.value
     }
  })
}
```

Because the typescript-eslint project is written in TypeScript, your rule and its configuration are completely typesafe.
If you make a typo while writing the message id, the compiler will not compile and throw an error at you. This is also the case if the rule can be configured, which comes in handy while writing tests for configurable rules.

## Failures with fixers

To include a fix for a rule violation, you can provide a fixer to the report method:

```ts
context.report({
	node,
	messageId: 'actionHygiene',
	data: {
		actionType: value,
	},
	fix: (fixer) => fixer.replaceTextRange(node.range, '[Source] Event'),
});
```

All of the fixer methods are documented, see the [docs](https://eslint.org/docs/developer-guide/working-with-rules#applying-fixes) for more info.

## Writing Tests

At first, I was a little bit disappointed because I liked the approach TSLint took with this, but the ESLint approach start to grow on me after a while.
With TSLint, a test looked like this, where you could just write your code in a `*.ts.lint` file, and underline the failures.

```ts
const action = createAction('customers load')
                            ~~~~~~~~~~~~~~~~                          [action-hygiene]

[action-hygiene]: Action type does not follow the good action hygiene practice, use "[Source] Event" to define action types
```

With ESLint, the tests feel more comfortable with other tests that you've written.
You will have to create a test runner, configure it, and then you will be able to run the rule with valid and invalid cases.

```ts
import { resolve } from 'path';
import { TSESLint } from '@typescript-eslint/experimental-utils';

const ruleTester = new TSESLint.RuleTester({
	parser: resolve('./node_modules/@typescript-eslint/parser'),
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
});

ruleTester.run(ruleName, rule, {
	valid: [`export const loadCustomer = createAction('[Customer Page] Load Customer')`],
	invalid: [
		{
			code: `export const loadCustomer = createAction('LOAD_CUSTOMER')`,
			errors: [
				// each property here is optional
				// you can decide the level of your test
				{
					messageId,
					line: 1,
					column: 42,
					endLine: 1,
					endColumn: 57,
					data: {
						actionType: 'LOAD_CUSTOMER',
					},
				},
			],
		},
	],
});
```

> You can also create your own test runner, like angular-eslint did in [test-helper.ts](https://github.com/angular-eslint/angular-eslint/blob/master/packages/eslint-plugin/tests/test-helper.ts) to be able to use squigglies in [test cases](https://github.com/angular-eslint/angular-eslint/blob/master/packages/eslint-plugin/tests/rules/no-input-rename.test.ts)

## Utility methods

There are (currently) no guard utility methods available, and this is what I miss the most.
For now, it's easy to write them ourselves, but it would be great to have them packaged in the library as these will frequently be used in most projects.

```diff
- ts.isCallExpression(node)

+ import { TSESTree } from '@typescript-eslint/experimental-utils'
+
+ export function isCallExpression(
+  node: TSESTree.Node,
+ ): node is TSESTree.CallExpression {
+  return node.type === 'CallExpression'
+ }
+
+ isCallExpression(node)
```

## Adding documentation to a rule

Having the opportunity to point to the docs was something I didn't know that I missed with TSLint.
The `RuleCreator` has a built-in way to point to the documentation of a rule. In fact, the callback to the docs while creating the rule is required. This goes without a saying, but this is a great developer experience and is helpful to your users.

```ts
export default ESLintUtils.RuleCreator(ruleName => `https://someurl/docs/${ruleName}.md`){
   ...
})
```

Most of the docs I've seen have more information about the violation, explain why it's a violation, and have invalid and valid code snippets. See the [docs of Testing Library](https://github.com/testing-library/eslint-plugin-testing-library/tree/master/docs/rules) for an example.

## Tools

The tools I use to write rules remain the same.
I usually start out in [AST Explorer](https://astexplorer.net/), just like before, or as a replacement to [TSQuery Playground](https://tsquery-playground.firebaseapp.com/).
Make sure to have the `@typescript-eslint/parser` chosen in the settings.

## Resources

- The [typescript-eslint monorepo](https://github.com/typescript-eslint/typescript-eslint)
- The [angular-eslint project](https://github.com/angular-eslint/angular-eslint/tree/master/packages/eslint-plugin); a port from [codelyzer](https://github.com/mgechev/codelyzer)
- The [eslint-plugin-rxjs](https://github.com/cartant/eslint-plugin-rxjs); a port from [rxjs-tslint-rules](https://github.com/cartant/rxjs-tslint-rules)
- The [ESLint docs](https://eslint.org/docs/developer-guide/working-with-rules/)
- Convert your TSLint config to ESLint with [https://github.com/typescript-eslint/tslint-to-eslint-config](https://github.com/typescript-eslint/tslint-to-eslint-config)
