---
title: Fixing Angular Standalone Components that have a circular dependency
slug: fixing-angular-standalone-components-that-have-a-circular-dependency
description: Luckily there's a function called `forwardRef` to solve a circular dependency between two Angular Standalone Components. A use case for this is a recursive component that renders its parent component.
date: 2023-05-15
tags: Angular, Standalone Components
---

While I was in the process of migrating our Angular project to use Angular Standalone Components I bumped against an issue that I wasn't expecting. The problem was a circular dependency between two components that recursively rendered each other.

In our case, this is a list component that renders a list item component, and the list item component renders the same list component again. For each component to render the other component it needs to include the other component within its `imports` array. This creates a circular dependency, which results in the following error:

```bash
ReferenceError: Cannot access 'ListItemComponent' before initialization.
```

With the previous version that used Angular modules, this did not cause any issues because both components were imported within the same module.

The workaround I came up with is to dynamically render the component, while this works it isn't very clean and requires some extra code changes.

So I went on Twitter, and again, the helpful Angular community came to the rescue.

https://twitter.com/tim_deschryver/status/1656353733356273665

Thanks to [Enea Jahollari](https://twitter.com/Enea_Jahollari), [Tomas Trajan](https://twitter.com/tomastrajan), and most importantly [El Greco](https://twitter.com/elgreco247) for the help in coming up with a fix that doesn't require a refactor!

It also seems that I'm not the only one that ran into this issue...
A day later when I encountered the issue, another developer also ran into the same issue and posted a [question on StackOverflow](https://stackoverflow.com/questions/76233330/angular-15-ref-error-cannot-access-component-a-before-initialization).

The solution to this problem is to utilize the [`forwardRef` function](https://angular.io/api/core/forwardRef) from `@angular/core`.

> Allows to refer to references which are not yet defined.

I was already familiar with the `forwardRef` function, but I did not know that it can be used to import standalone components.

Let's take a look at what this looks like.

The parent component (`ListComponent`), is just a normal component that imports the child component (`ListItemComponent`).
There's nothing special to see here.

```ts{14}:list.component.ts
import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ListItemComponent } from '../list-item/list-item.component';

@Component({
  selector: 'app-list',
  template: `
    <p>list works!</p>
    <app-list-item *ngIf="!fromListItem"></app-list-item>
  `,
  standalone: true,
  imports: [
    NgIf,
    ListItemComponent,
],
})
export class ListComponent {
  @Input() fromListItem: boolean = false;
}
```

The magic happens in the child component (`ListItemComponent`).
Rather than directly importing the parent component (`ListComponent`) from the child component, the child component uses `forwardRef` to import the parent component.

```ts{10}:list-item.component.ts
import { Component, forwardRef } from '@angular/core';
import { ListComponent } from '../list/list.component';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.css'],
  standalone: true,
  imports: [
    forwardRef(() => ListComponent)
  ],
  // 👇 not using `forwardRef` throws a reference error
  // imports: [ComponentAComponent],
})
export class ListItemComponent {
}
```

## Playground

<iframe src="https://stackblitz.com/edit/angular-hqgbou?file=src/list-item/list-item.component.ts" title="circular-standalone-components" loading="lazy"></iframe>
