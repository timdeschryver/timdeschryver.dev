---
title: Angular Control Flow
slug: angular-control-flow
date: 2023-09-26
tags: Angular
---

# Angular Control Flow

The past week I cursed Angular a little bit because I just wanted to have a simple `if-else` condition within my HTML template.
But, as you probably already know, we have to jump through a couple of hoops to get this working.
The result is a not-so-easy-to-read template that's prone to errors.

Angular 17 changes that by providing a new (opt-in) way on how we write our templates.
Instead of using the structural directives `NgIf`, `NgFor`, and `NgSwitch`, you'll be able to use the new `@` syntax.

This change drastically improves the Developer's Experience;

- it's easier to read
- you don't have to import the directives
- it's less verbose since you don't have to create wrapper components e.g. `ng-container`.

As an example, let's take a look at my `if-else` condition and compare both solutions.

:::code-group

```razor [title=If Control Flow]
@if (ifCondition) {
    <div>If template</div>
} @else if (elseIfCondition) {
    <div>Else-if Template</div>
} @else {
    <div>Else Template</div>
}
```

```razor [title=NgIf Directive]
<ng-container *ngIf="ifCondition; else elseIfTemplate">
	<div>If template</div>
</ng-container>

<ng-template #elseIfTemplate>
	<ng-container *ngIf="elseIfCondition; else elseTemplate">
		<div>Else-if Template</div>
	</ng-container>
</ng-template>

<ng-template #elseTemplate>
	<div>Else Template</div>
</ng-template>
```

:::

For completeness let's also take a look at the new syntaxes to iterate over a collection (`*ngFor`) and how to create a switch expression (`*ngSwitch`).

:::code-group

```razor [title=For Control Flow]
@for (todo of todos; track todo.id) {
    <li>{{ todo.description }}</li>
} @empty {
    <li>Congratulations! You've conquered your to-do list.</li>
}
```

```razor [title=Switch Control Flow]
@switch (card.kind) {
    @case ('summary') {
        <app-summary-card [card]="card" />
    } @case ('image') {
        <app-image-card [card]="card" />
    } @default {
        <app-simple-card [card]="card" />
    }
}
```

:::

To already try out the new Control Flow feature before it's officialy released, update the angular compiler options within the TypeScript configuration file.
Add the `_enabledBlockTypes` property, and add the blocks you want to use within your application.

```json:tsconfig.json
{
  "angularCompilerOptions": {
    "_enabledBlockTypes": ["if", "switch", "for", "defer"]
  }
}
```

For more information see the Angular blog post [Meet Angular’s New Control Flow](https://blog.angular.io/meet-angulars-new-control-flow-a02c6eee7843).
