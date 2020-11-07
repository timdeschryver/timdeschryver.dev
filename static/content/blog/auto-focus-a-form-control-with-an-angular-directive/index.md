---
title: Auto-focus a form control with an Angular directive
slug: auto-focus-a-form-control-with-an-angular-directive
description: Give auto-focus to form controls with just a few lines of code
author: Tim Deschryver
date: 2020-10-19
tags: Angular
banner: ./images/banner.jpg
bannerCredit: Tim Deschryver
published: true
---

In an application that has a lot of CRUD forms, it can be useful for users to give focus to a form control.
It's a small thing that can improve the user experience by a lot.
For example, when a modal opens and the user has to move the mouse towards the form control and click it, instead, the user can just start to type when the model is opened.

While it's possible to focus an element with the [autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) attribute, I found that creating an [Angular Directive](https://angular.io/guide/attribute-directives) is more convenient.

When the directive's `selector` is set to `form`, every form in the application will automatically focus the first form control.
The directive below also gives focus to the form control that's invalid when the form is submitted.

**Keep in mind, that giving a control auto-focus isn't always good for your users as it [reduces usability and accessibility](https://dequeuniversity.com/rules/axe-linter/1.0/no-autofocus).**

```ts:form-focus.directive.ts
import {
  Directive,
  ElementRef,
  HostListener,
  AfterViewInit,
} from '@angular/core'

@Directive({
  selector: 'form',
})
export class FormFocusDirective implements AfterViewInit {
  focusables = ['input', 'select', 'textarea']

  constructor(private element: ElementRef) {}

  ngAfterViewInit() {
    const input = this.element.nativeElement.querySelector(
      this.focusables.join(','),
    )
    if (input) {
      input.focus()
    }
  }

  @HostListener('submit')
  submit() {
    const input = this.element.nativeElement.querySelector(
      this.focusables.map((x) => `${x}.ng-invalid`).join(','),
    )
    if (input) {
      input.focus()
    }
  }
}
```

<iframe src="https://stackblitz.com/edit/angular-j9pkwh?ctl=1&embed=1&file=src/app/form-focus.directive.ts" title="auto-focus" loading="lazy"></iframe>
