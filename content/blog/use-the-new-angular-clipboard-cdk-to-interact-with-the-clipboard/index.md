---
title: Use the new Angular Clipboard CDK to interact with the clipboard
slug: use-the-new-angular-clipboard-cdk-to-interact-with-the-clipboard
description: The new Angular Material release brings us a new CDK clipboard module to interact with the clipboard. In this post, we'll explore how to use the new Clipboard CDK by going over some examples.
author: Tim Deschryver
date: 2019-10-28T06:30:00.000Z
tags: Angular, Material, CDK, clipboard
banner: ./images/banner.jpg
bannerCredit: Photo by [Steve Halama](https://unsplash.com/@steve3p_0) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
---

The [helium-barbell (v9.0.0-next.1)](https://github.com/angular/components/releases/tag/9.0.0-next.1) release brings us a new CDK clipboard module to interact with the clipboard. In this post, we'll explore how to use the new CDK with some examples.

> The Component Dev Kit (CDK) is a set of tools that implement common interaction patterns whilst being unopinionated about their presentation. It represents an abstraction of the core functionalities found in the Angular Material library, without any styling specific to Material Design. Think of the CDK as a blank state of well-tested functionality upon which you can develop your own bespoke components.

## Import the `ClipboardModule`

The first step to use the CDK is to import the `ClipboardModule` from `@angular/cdk/clipboard` and add it to the `imports` declaration.

```ts{3}{10}
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { ClipboardModule } from '@angular/cdk/clipboard'

import { AppComponent } from './app.component'

@NgModule({
  imports: [BrowserModule, ClipboardModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## Using the `cdkCopyToClipboard` attribute

After the `ClipboardModule` is imported, we're good to go.
The only thing needed to copy content is the `cdkCopyToClipboard` attribute.
It's possible to add it to any element, and when the element is clicked it will save the content to your clipboard.

```html
<button cdkCopyToClipboard="👋 You copied me!">Click to copy</button>
```

Copying a static string is boring, but we can also use a property binding to copy the result of an expression.

```ts
export class AppComponent {
  code = 'AAA-BBB-CCC'
}
```

```html
<input disabled [value]="code" />
<button [cdkCopyToClipboard]="code">Copy coupon code</button>
```

Even more fun is to bind it to a function where we can modify the content.

```ts
export class AppComponent {
  value = ''

  copy(value) {
    return `${value}\n\ncopied from timdeschryver.dev`
  }
}
```

```html
<textarea [(ngModel)]="value"></textarea>
<button [cdkCopyToClipboard]="copy(value)">Copy content</button>
```

## Using the `Clipboard` service

Using the `cdkCopyToClipboard` attribute is great to give users the possibility to copy content from a page.
But it doesn't allow us, as developers, to copy content programmatically. This is where the `Clipboard` service comes into play. By using the `copy(content)` method we can copy content to the clipboard.

```html
<button (click)="generateId()">Generate Id</button>
```

```ts{2}{10}
export class AppComponent {
  constructor(private clipboard: Clipboard) {}

  generateId() {
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })

    this.clipboard.copy(id)

    alert(`Id "${id}" is generated and copied to the clipboard`)
  }
}
```

## Playground

<iframe src="https://stackblitz.com/edit/angular-u8dyx6?ctl=1&embed=1&file=src/app/app.component.html&hideExplorer=1&hideExplorer=1" title="clipboard-playground"></iframe>

## Implementation details

Internally, the [`PendingCopy`](https://github.com/angular/components/blob/master/src/cdk/clipboard/pending-copy.ts) is used to copy content to the clipboard. This class creates an invisible textarea in the DOM with the content as its value. When the `copy()` method is used, it will move the focus to the invisible textarea and use the native [`execCommand('copy')`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard) to copy the content to the clipboard. As the last step, it will re-focus the previously selected element.

For the ones interested, the native [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) can also cut content and read the current clipboard value.
