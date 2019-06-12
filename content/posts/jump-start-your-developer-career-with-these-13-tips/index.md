---
title: Jump start your developer career with these 13 tips
slug: jump-start-your-developer-career-with-these-13-tips
description: I believe that to become a better engineer it all comes down to practice, practice and more practice. Especially when you just started your career. The problem is that when you're just getting started, there is much more to it than just writing lines of code.
author: Tim Deschryver
date: 2019-05-14T20:30:00.000Z
tags: career, level-up, development, productivity
banner: ./images/banner.jpg
published: true
publisher: Angular In Depth
canonical_url: https://blog.angularindepth.com/jump-start-your-developer-career-with-these-13-tips-8003091eb30d
---

I believe that to become a better engineer it all comes down to practice, practice and more practice. Especially when you just started your career. The problem is that when you're just getting started, there is much more to it than just writing lines of code.

At the beginning you'll struggle to get everything right, doing this while trying to focus on writing code can be too much at the same time. That's why I encourage to take the time and put in some effort into getting used to everything that comes with writing code. After this, when you will write code, you will notice that it will become a smoother experience and you won't get pulled out of the flow while performing other tasks, for example, navigating through files and searching for an answer on the internet.

You will get more time to write code, and you'll also be more focused on the writing code part as the other tasks will be performed more automatically without thinking about it.

The following tips aren't in a particular order and I would suggest to only pick one or two up at a time, focus is the key here.

### Learn your IDE

To get more productive quickly, learn how your IDE works. Take the time to learn the shortcuts for tasks you frequently do or take some time to perform. One task that immediately comes to mind is to find a file in the file explorer, this task often takes some seconds but even more important, it **takes you out of the flow**. By learning the shortcut to navigate to the file, you won't be required to think.

Another useful tip in working with your IDE is to take a look at the extensions (or plugins) it provides. Even the smallest extensions, for example, a theme, can often lead to a happier development environment and experience. It's these little things that can help when you're working in your IDE for several hours a day.

Most of IDE's have a "tip of the day", do not turn this off. You can learn about useful tips you otherwise won't encounter.

To get you started, here are the links to the cheat sheets with a list of shortcuts:

- [VSCode shortcuts for Windows](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf) | [VSCode shortcuts for MacOS](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf)
- [Atom shortcuts](https://github.com/zyzo/atom-cheatsheet)
- [WebStorm shortcuts](https://resources.jetbrains.com/storage/products/webstorm/docs/WebStorm_ReferenceCard.pdf)

### Level up your Google-fu

**As developers, we can't know (and remember) everything.** The good thing is that an answer is only some keystrokes away. Know how to use a search engine and you'll get to the correct answer faster. For example, when Angular came out chances were high that you would come across an AngularJS answer, but if you know how to use Google properly you could have filtered these out by using the minus sign to eliminate articles containing the word AngularJS, e.g. _angular change detection -angularjs_. This again requires your brain to think less, your brain doesn't need to think of the older articles that won't help you further.

To get you started, here's a link with some useful tips:

- [20 Google Search Tips to Use Google More Efficiently](https://www.lifehack.org/articles/technology/20-tips-use-google-search-efficiently.html)

### Reading documentation

A tip continuing the above tip would be on how to read documentation files. You don't need to read the whole documentation to solve your problem. Quickly scan the document and know which part you have to read to solve your problem. By practicing this early on you will also take notice of the multiple ways on how to solve a problem, each with their benefits and drawbacks. It will also give you an idea on how good documentation looks like and **the importance of good documentation**.

### Asking questions

When you're stuck with a problem and you are not able to find an answer within a time span of 10 minutes, do not hesitate to ask for help. When you're asking for help don't just ask the question. **Show and describe the problem that you're encountering, explain why you think this problem occurs, show what you have tried already in order to solve the problem, and what you have found on the internet.** This gives a good basis and some thinking time to the one that's trying to help.

A good question is phrased correctly and boils down to the actual problem, not the code and other random factors around it. To pinpoint the root cause, **create a new minimal application and try to reproduce the issue**. Most of the time, you will notice that this step usually solves the problem. If it doesn't, it will help you to have a better understanding of its behavior. This minimal application offers a playground to you and the other developer trying to answer. It helps her by filtering out all the other buzz, plus this playground can be tested faster than the actual application.

Even if you have the problem solved but are unsure about the implementation, **take a break** or ask for a second pair of eyes. There are always multiple ways to solve a problem. Often the implementation depends on how you look at it, it depends on how you start at solving the problem in front of you. You will notice that when you take a break and come back, you will take a look at the problem from another angle and this will lead to another implementation. The same counts for a second pair of eyes, with a fresh mind the real problem usually surfaces and the solution will become clear.

Extra tips:

- [Writing the perfect question](https://codeblog.jonskeet.uk/2010/08/29/writing-the-perfect-question/) by [Jon Skeet](https://twitter.com/jonskeet)
- If you're stuck with a generic question, ask your question on StackOverflow. It will help you to think about the problem and to phrase is correctly. As an extra benefit, you can also help other developers with the same problem.
- Buy a [rubber duck](https://en.wikipedia.org/wiki/Rubber_duck_debugging) to you offer help at any time.

### Committing frequently and writing good commit messages

This tip is often times overlooked. By writing good commit messages, you will **leave a trail of thoughts behind**. When you or a reviewer takes a look at the commit history, the line of thoughts will be immediately clear. This makes it easier to review code. Ask for the commit rules in your company to show that you care, if there are no rules, a good start would be to follow the practice of conventional commit messages. A commit message describes what you did in a glance, for example `update check out` does not show what you did in comparison to `fix(check out): resolve delivery address to a foreign country`. The latter shows that the commit is a bug fix during the checkout process, and what it solved, adding a foreign country as a delivery address.

Comparable to this tip, is to commit small changes frequently. This makes it **easier to revert changes** if you went down the wrong rabbit hole. A popular practice is to write (failing) tests first, commit the tests, solve the problem and make sure the tests pass, and as last step to refactor the code. This is known as [Test Driven Development (TDD)](https://medium.com/javascript-scene/tdd-changed-my-life-5af0ce099f80) and is also referred to as the _Red Green Refactor_ cycle. To take it a step further, you could even try the [test && commit || revert](https://medium.com/@kentbeck_7670/test-commit-revert-870bbd756864) cycle, where changes would be reverted if the test cases would fail.

Having a good understanding of `git` and knowing what you can do with it is definitely helpful for this tip, and in general.

Resources:

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/)
- [Become a GIT pro by learning GIT architecture in 15 minutes](https://blog.angularindepth.com/become-a-git-pro-by-learning-git-architecture-in-15-minutes-9c995db6faeb) by [Max Koretskyi](https://twitter.com/maxkoretskyi)

### Knowing to debug is important

You will often need to debug code. If you master your debug skills, you will find the cause of the problem faster. Here again, learn the environment you're working in, for example the chrome devtools or inside your IDE, and the shortcuts to jump through the code more quickly. Reading, really reading (and understanding) an error message is also a step in the right direction. From my experience error messages are frequently ignored. More often than not, **reading the error message carefully will result in a quicker fix**, you will know what went wrong and where the error occurred. This is useful information to start the debug process.

If it seems unsolvable, think like a scientist and keep the scientific method in mind. To follow the scientific method, make an observation and form a hypothesis, make a prediction based on the hypothesis, test the prediction, repeat until you got the hypothesis right. For more info see [Level Up Your Reverse Engineering Skills](https://blog.angularindepth.com/level-up-your-reverse-engineering-skills-8f910ae10630) by [Max Koretskyi](https://twitter.com/maxkoretskyi).

### Reading code

You will read more code than you would write, reading and understanding code is an important part of your career. By reading other peoples code, I learned a lot. Reading work-related code is a great start, but don't stop there. Try reading code of a popular library or from a library you're using daily. At first, this will be hard but don't give up after one try. **When you read code on a regular basis, you will notice familiar parts and all the pieces will come together nicely**.

If you want to take it a step further, you can even contribute to these libraries. As a start you can start by offering help to triage issues and to write documentation, everyone loves good up-to-date documentation. When you'll become familiar with the code base you could pick up small changes and bug fixes, later on you can write bigger and bigger features.

Related to this tip, is the opposite. Let your code be reviewed and stay open for feedback.

To get started in open source look for entry-level issues to get a hang of it, look for issues labeled as "Good First Issue", "Up For Grabs", or "Help Wanted".

You can find tips on how to read code efficiently at [One secret to becoming a great software engineer: read code](https://hackernoon.com/one-secret-to-becoming-a-great-software-engineer-read-code-467e31f243b0) by [Nemil Dalal](https://twitter.com/nemild).

### Split up big tasks into multiple smaller tasks

If a task is too big and you don't know where to start, split it up into smaller chunks. This will make it **easier to wrap your head around**. An extra benefit of doing this is that you'll feel more productive. Every task you can check off is a win. This will lead to a positive state of mind and the drive to continue your winning streak.

### Get involved

A great way to become better is to surround you with motivated people, these people will pull you up to a higher level. Find a mentor, start contributing to open source, write and read articles, follow people, or join a local group. It **works contagiously to see the effort motivated people put into their work**, seeing how passionate they are about their work and seeing them reap the deserved results.

### Put in the extra time

If you want to get better at a faster pace then other developers, put in the extra time. It only has to take an extra 30 minutes a day. That's 2 to 3 hours extra per week, this accumulates to 156 hours extra over the time span of a year. The average workweek in Belgium is around 37.5 hours, putting in the extra time a day means you have worked **a whole extra month** more. During the first years of your career this is a lot, and believe me this will be visible.

If you need some motivation to put in the extra time, I suggest you to read [Connecting the dots: where hard work and dreams can lead you](https://blog.angularindepth.com/connecting-the-dots-where-hard-work-and-dreams-can-lead-you-2e8ef44096b), again by [Max Koretskyi](https://twitter.com/maxkoretskyi).

### Gain domain knowledge

> This tip is from [Michael Karén](https://twitter.com/melcor76)

Knowing the domain you work in helps. **You're not just writing some code, you're writing code for a specific domain and for experienced peoples working in this domain, to create business value.** Great developers can communicate about domain topics and can translate the business language into lines of code. From my experience, it really helps to talk through a problem with your users. Not everything is important, they will help you to distinguish important parts from less important parts, to nice-to-haves. This is important because we as developers can't know the essentials of an application, without talking to our users we will put in time to a wrong part of the application. Knowing the domain you work in will also often lead to cleaner, more readable code. This is where it helps if you are interested in the business side of your chosen company.

To go more in-depth for this tip, read [Learn Business and Become a Better Software Developer](https://hackernoon.com/learn-business-and-become-a-better-software-developer-6db96ef852b1).

### Pair program

> This tip is from [Oleksandr Poshtaruk](https://twitter.com/El_Extremal)

One of the pillars of [extreme programming](https://en.wikipedia.org/wiki/Extreme_programming), program with in pairs. A starting developer can **learn from working alone, but can learn the tricks of the trade from a more experienced developer**. They key here is to find what works for you, to find a balanced timetable to work. Pairing can be intense, agree on a schedule with the needed breaks.

A nice-to-know to this tip is that not every level of developer can pair program with junior developers efficiently, the [Dreyfus model](https://en.wikipedia.org/wiki/Dreyfus_model_of_skill_acquisition) is a good resource to find a matching pair.

### Focused debugging sessions

> This tip is from [Max Koretskyi](https://twitter.com/maxkoretskyi)

To understand and remember something in-depth, have a scenario and the flow you want to understand in mind. Go through this flow with a debugger and read the implementation in an IDE. While doing this process allow you yourself to think and process the code you just read. Create an hypothesis (think like a scientist) and find out if your hypothesis stands or falls, if it falls (as in most of the time) don't get discouraged. To help you understanding the flow you can take a look at the callstack to know where you are.

### Conclusion

The above tips won't make you a better engineer overnight. What they do, is allowing you to focus on the coding part while you're writing code. The best way to learn something is to focus on one task at a time. If you take the time to practice and master the above tips, you will execute all of the tasks around coding without thinking about it. This will lead to small wins and more coding time. I believe the best way to become better at writing code is to practice, practice and practice, the writing code skills will come automatically over time, we just want to become better at a shorter time. Knowing your way around and not waste time makes it also more fun and practical to pair program with other engineers, plus you'll look more skilled.

Recently I learned the Japanese word **kaizen**, which I find is a suitable ending to this post. The word **kaizen** translates to improvement. It's the philosophy of **continuous improvement of working practices, personal efficiency by small incremental improvements**.

![Image of kaizen](./images/banner.jpg)
