---
title: I like my components big
slug: i-like-my-components-big
description: Creating sub-components comes with a cost. So what do I think of before creating a new component, because if a component passes the x lines of code isn't a valid reason.
author: Tim Deschryver
date: 2020-04-20
tags: Angular, Architecture
banner: ./images/banner.jpg
bannerCredit: Photo by [Iza Gawrych](https://unsplash.com/@ilmatar) on [Unsplash](https://unsplash.com)
published: true
---

Call me insane, but I like my components big.
I've come across projects with lots of smaller components, for me this can quickly become, or at least feel as, an unmaintainable mess.

For the smallest change, you have opened **multiple files**, sometimes the same one multiple times.
And when you're finished, you have written some lines of actual code and then you have **the code that glues everything together**.
In Angular, this glue are the `@Input` and `@Output` properties to talk between the components.
It's here where we can find some subtle bugs, as we're used to having TypeScript catching typos and wrong types all over the codebase, but sadly not in our templates.

Creating components too early will lead to **wrong abstractions**. If I don't know how a component will be used, then how can I implement it the correct way? If I extract some code into a component too early I start to make assumptions about the "what if" cases. Just like me, you will also know that there's a big chance that these cases won't occur, and new cases that I haven't thought of will. Yet, we still think and dream about all the cases we think we have to cover. This can lead to some frustrations, plus I will try to fit the use case to what I had imagined it to be. This isn't good for all parties involved, and certainly not the best use of time.

But wouldn't this make it harder to test? I would argue that most of the logic that thoroughly has to be tested probably don't have to live in components. Instead, **move it to outside the component**. To be fair, you will write more integration tests and fewer unit tests, but that isn't a bad thing either.

These are the reasons why I like to start with bigger components.
But even I'm not that insane (I like to think so) to create a whole application as just a single component.

If **performance** takes a hit, it's a valid reason to refactor the big component into sub-components.
This will prevent (heavy) re-renders of the component, and [will help Angular to make your application faster](/blog/help-angular-to-make-your-application-faster).

Another reason to create a component is **code reusability**, mot just a component that is used in one other component but in multiple components.
If the same code has been written multiple times, it's a candidate to be moved to its own component.
At this point, the use case of the component is probably well defined, and thus, safe to refactor.
Just guard that component off to new changes that don't fit the current use case.
Having a component with a lot of properties is a component that no one wants to touch because it isn't clear how the component reacts to these properties, or how the properties react between each other. If the component starts to drift off to a different use case, think about creating a separate component, or to move that code back into the bigger component.

## Conclusion

Before creating an extra abstraction in the form of a component, think carefully about the advantages and the disadvantages.

The saying "**write code that is easy to delete**" has been stuck in my head after having watched [Greg Young](https://twitter.com/gregyoung)'s talk [The art of destroying software](https://vimeo.com/108441214). I think that the code that lives inside bigger components is easier to delete in comparison to deleting code in a (wrongfully?) abstracted component. Not only is it easier to delete, but it's also easier to adapt to change.

I'm not against creating smaller components, but they have to **serve their purpose**.
What I don't like is creating components for the reason that it feels like the right thing to do.
Because it comes with a cost.

In my experience, creating bigger components will **increase the productivity** because some overhead has been taken away.
In the form of, writing code, thinking about the code, and reading the code.

Of course, you're free to do whatever you want, this is just my opinion. But I want to emphasize again that I don't think it's a good idea to create multiple smaller components just to lower the lines of code, because in fact, you've just increased it.
