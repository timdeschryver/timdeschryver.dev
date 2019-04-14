---
title: Required @Input() properties
slug: required-input-parameters
description: How to create required input parameters
author: Tim Deschryver
date: '2018-05-14T14:00:12.814Z'
tags:
  - Angular
banner: './images/banner.jpg'
bannerCredit: 'Photo by [Jametlene Reskp](https://unsplash.com/@reskp) on [Unsplash](https://unsplash.com)'
published: true
---

This week I got asked how to make a component’s input property required. Without giving it much thought I started my answer ‘well, you can just …’, then I stopped asking myself the same question. So I opened a new [StackBlitz](https://stackblitz.com/) project and started exploring the options before giving an answer.

Before we start let’s imagine we’re creating a component `HelloComponent` to greet a person. In order to greet the person properly, the `person` property is required.

### Adding a null check

The first thing that came to my mind was to throw an error when the `person` property would be `null` or `undefined`.

```ts
ngOnInit() {
  if (this.person === null || this.person === undefined) {
    throw new TypeError("The input ‘Person’ is required");
  }
}
```

This doesn’t change much except that it would throw a useful error message.  
Before: `ERROR TypeError: Cannot read property ‘name’ of null`  
After: `ERROR TypeError: The input ‘Person’ is required`

### Using the selector

To make the requirement explicit we can use the `selector` in the `@Component` decorator to require that the attribute on our component has to exist.

```ts
@Component({
    selector: 'hello[person]'
})
```

Resulting in the following error when we start the application or at compile time when the application is build Ahead of Time (AoT), if the `HelloComponent` doesn’t have a `person` attribute.

```bash
Error: Template parse errors:
'hello' is not a known element:
1. If 'hello' is an Angular component, then verify that it is part of this module.
2. To allow any element add 'NO_ERRORS_SCHEMA' to the '@NgModule.schemas' of this component. ("[ERROR ->]<hello></hello>"): ng:///AppModule/AppComponent.html@0:0
Evaluating src/main.ts
Booting application
```

### Outcome

By putting the two together, I can say that I’m happy with the result.  
If you got a better way or see a problem with this approach please feel free to let me know, feedback is as always welcome.  
The question I’m asking myself right now, is if this is something that should be done in the first place… again let us know your opinion on this 😃.

Below you can find the two put together as well as the StackBlitz project ready for you to play with.

_NOTE: I’m using_ `_ngOnInit_` _but like_ [Isaac Mann](https://twitter.com/MannIsaac) _mentioned you could also use_ `_ngOnChanges_`_._

```ts
import { Component, Input, OnInit } from '@angular/core'
import { Person } from './person'

@Component({
  selector: 'hello[person]',
  template: `
    <h1>Hello {{ person.name }}!</h1>
  `,
})
export class HelloComponent implements OnInit {
  @Input() person: Person

  ngOnInit() {
    if (!this.person) {
      throw new TypeError("'Person' is required")
    }
  }
}
```
