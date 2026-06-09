---
title: Using Agentic AI to create your own component library
slug: using-agentic-ai-to-create-your-own-component-library
description: 'Agentic AI changes the trade-off between using an existing component library and building your own. This post explores how AI agents can help teams create, maintain, and evolve a custom Angular component library without taking on the full cost.'
date: 2026-06-09
tags: Angular, AI
---

Starting a new frontend project always comes with a set of decisions that shape the project in the long term.
One of those key decisions is whether the team should use an existing component library or build its own.

For a long time, my default recommendation was simple: use an existing component library.

That advice still makes sense in many cases. Existing component libraries give you speed. They provide ready-to-use components with consistent behavior, (hopefully) accessibility considerations, and documentation including examples. For many teams, especially smaller teams, this is the most pragmatic choice.

But that choice also comes with a cost.

When you adopt a component library, you also adopt its assumptions. You get its generic API design, its look and feel, and a predefined behavior. You're also dependent on its release cycle and upgrade path, or lack of upgrade path. That is not necessarily a problem, but it's something to be aware of.

In practice, this friction doesn't always appear immediately.

At the start of a project, a component library usually feels like a productivity boost. You install it, add a few components, and quickly build screens that look consistent. Because most libraries have a lot of extra bells and whistles, you can often get a lot of functionality with minimal effort. You start to use it extensively, but as the product grows, the design requirements become more specific, and more custom to your needs. The product team wants a slightly different interaction than the standard. A flow requires specific behavior that does not fit the component's generic design.

When this happens, teams start to bend the component library to their specific needs, and this is where the cost starts to appear, and if done poorly, it can become a significant maintenance burden. Teams start to customize the library to fit their needs, using various techniques:

- they override CSS
- they create wrapper components to add missing features or to implement their own API on top of the library's API using their own defaults
- they reach into internals to tweak behavior

Teams do this to work around behavior that was not designed for their use case.

While this is not necessarily a problem, sometimes it is fine. But over time, those customizations can become expensive.

The more you deviate from the library's intended usage, the harder it becomes to upgrade. What started as a productivity gain can slowly turn into a dependency that is difficult to change. A major version update can quickly break a project. Every internal CSS class you relied on becomes a risk. Every wrapper component becomes a translation layer between your application and the library. This is when an upgrade path can become a long and expensive process, that requires buy-in from above.

:::info
A component adapter is a good idea if designed intentionally, and if a team takes ownership of it. But it can also become a source of technical debt if it is just a collection of hacks on top of hacks.
:::

This does not mean component libraries are bad. They are not, and they remain a good choice for many projects.
But the decision is not free. You are trading control for convenience, and that trade-off can become more expensive the more your product diverges from the library's assumptions.

In this post I want elaborate that my point is not that every team should build its own component library. My point is that agentic AI lowers the cost of doing so, especially when combined with a source-owned component approach.

## The traditional trade-off

When teams face this decision, the decision is often framed as a trade-off between control and convenience:

- Using an existing component library gives you speed and stability, but less control.
- Building your own component library gives you control and flexibility, but more responsibility, with a higher initial cost.

That responsibility is significant. A component library is not just a collection of buttons, inputs, and other UI elements. It is an internal product. It needs a good and consistent API, accessibility features, test coverage, documentation, and maintenance.

For smaller teams, that cost is often too high.

That is why I would usually advise against building your own component library unless there is a strong reason to do so. Most teams should not spend their time reinventing components when their actual goal is to build business value.

Over the past years, a third option has become more valid with the rise of utility-first CSS frameworks, and more specifically with [Tailwind CSS](https://tailwindcss.com). This recent frontend ecosystem shift has provided a good alternative to the traditional component library model.

A useful middle ground has emerged, and instead of consuming a component library as a black-box dependency, you pull the component source code into your own codebase. Instead of installing a component package within your node modules and treating it as an external runtime dependency, you copy the component code directly into your project as your own components. From that point on, you own the code, and you can modify it as needed.

This way of working, also called a code distribution platform, is successfully implemented and popularized by libraries such as [shadcn/ui](https://ui.shadcn.com/) in the React ecosystem, and [Spartan](https://spartan.ng/) or [Zard](https://zardui.com/) in the Angular ecosystems.

That model is interesting because it changes the ownership boundary.

You still avoid writing everything from scratch, and you get a solid foundation as a starting point. But you are not limited by an external package's public API, styling decisions, or release cycle. You can adapt the component to your application/product because you own the code. This gives you the flexibility to customize and extend behavior without fighting the library.

## Agentic AI to increase the viability of custom component libraries

The biggest reason not to build your own component library has always been the time it requires to create and maintain it. This is time that is not spent building product features, and it is time that is not directly visible to stakeholders. This makes it a cost that can be difficult to justify.

Writing the first version is only part of the work. The real cost comes later: improving APIs, fixing edge cases, keeping components accessible, adapting them to new design requirements, adding tests, keeping it up to date with the latest Angular version and standards, and documenting its usage.

That cost does not disappear with AI, but it changes.

Agentic AI can help you with the repetitive, structural, and incremental work that made custom component libraries expensive in the past. An AI agent can generate a first implementation, refactor an API, add tests, improve accessibility, migrate code to a newer Angular pattern, or create examples based on existing components.

This does not mean that you can blindly outsource your component library to an AI agent. You still need technical ownership. You still need engineers who understand the architecture, review the output, and define the standards.

But the amount of effort required to create and evolve components is lower than it used to be.

That disrupts the traditional trade-off. The convenience of an existing component library is still there, but the cost of ownership for a custom component library is now lower. This makes the option of building your own more viable for more teams.

For some teams, building a custom component library is no longer an unrealistic investment. It can become a practical option, especially when done incrementally.

Instead of deciding upfront that you are going to build a complete component library, you can start with the components you actually need. With this incremental approach, you can let real application needs drive the component library. You can create components as patterns emerge in the application, and you can use AI agents to help with the implementation and maintenance work, one component at a time.

Take the AI-driven approach in combination with code distribution platforms, and it also works well. You can pull in the source code for a component, for the initial implementation, and then use AI agents to help customize it to your needs, and maintain it over time. You get the best of both worlds: a solid starting point and the flexibility to evolve it as needed. When the component doesn't fit your needs, you can also decide to rewrite it from scratch.

## Benefits of owning your components

The main benefit of owning your components is control, and flexibility over styling, behavior, and API design.

### Customization without fighting the library

Custom styling is one of the main sources of friction when using external component libraries.

Most teams eventually need to make components look and behave differently from the default. Some libraries provide strong theming support. Others are harder to customize. Even when customization is possible, you are still working within the constraints of the library's design.

Owning the component source code avoids much of that friction.

You do not need to override internal CSS selectors. You do not need to wrap a component just to change a small part of its template. You do not need to wait for a feature request to be accepted upstream.

You can change the component.

That does not mean every component should become a one-off implementation. The goal is still consistency. The difference is that the consistency is defined by your team instead of by an external package.

This is especially useful when you have a strong design system or a product with specific interaction patterns.

Your component library can reflect your product directly.

### Control over API design

One of the most underestimated benefits of owning your components is control over the API surface.

A good component API should match how your team builds applications.

External component libraries need to support many use cases. That often leads to broad APIs with many inputs, configuration options, slots, templates, and extension points. This flexibility is necessary for a public library, but it can also make components harder to use.

An internal component library has a different goal.

It does not need to support every possible use case. It only needs to support your use cases.

That means your APIs can be smaller, more opinionated, and more aligned with your product. You can encode your design system directly into the components. You can remove options that should not be configurable. You can make the default path the correct path.

For example, instead of exposing every possible option, you can design a component API that matches your product language. Only if it's necessary, you can add a more flexible API for edge cases. But the main API can be simple and focused.

The component becomes part of your application architecture.

With agentic AI, you can also iterate on this API faster. You can ask an agent to inspect existing usage, identify inconsistencies, suggest a simpler API, and update all call sites. That kind of refactoring used to be tedious. It still requires review, but it is no longer as expensive.

## How to make it work

You can build your own component library from scratch, or use a code distribution platform to pull in the source code of existing components. But this doesn't affect the core principles of how to make it work. The most important part is clear ownership over the components.

### Incremental adoption

A common mistake is thinking about a component library as a large upfront investment.

That does not have to be the case.

A more practical approach is to build the library incrementally. Start with the smallest useful set of components and only add more when the application needs them. When creating the component don't try to predict every possible use case. Instead, focus on the most common patterns in your application and build components that support those patterns well.

This keeps the cost low.

You do not need to spend weeks up-front designing a complete library before building product features. You can extract components as more use cases appear. You can let the application needs drive the component creation and evolution over time.

This also prevents overengineering.

Many internal component libraries fail because they try to predict too much too early. They create abstractions for use cases that never appear. They introduce flexibility that nobody needs. This results in the library becoming a project inside the project.

A better approach is to start small.

Create components when duplication appears. Stabilize the API when usage becomes clear. Use AI agents to help with implementation, tests, documentation, and migrations.

This gives you control without turning the component library into a bottleneck.

### Treat it as an external dependency

Even when the component source code lives in your repository, it helps to mentally treat the library as an external dependency to overcome the temptation to reach into internals.

That means application developers should not need to understand every internal detail of every component. The public API should be the main contract.

This can come across as bad advice. After all, you own the code and are responsible for it. If things go wrong, it's on you. But if the public API is designed properly, it gives you a stable surface to build on, while still allowing you to change the internals as needed, for example, when it becomes a problem.

This allows you to move fast, without discussing every internal detail every time you need to use a component.

When a component is well-designed, it should allow the internals to change, without affecting the public API.
If the component behaves correctly, it shouldn't matter if the implementation can be slightly refactored.
At least that's my opinion. I'm confident that when the component is small, that it can be refactored or rewritten without affecting the application code.

AI agents can help here as well. They can generate usage examples, detect breaking API changes, update call sites, and keep documentation aligned with implementation.

### Accessibility still requires ownership

One of the risks of building your own component library is accessibility.

External component libraries often have accessibility built in, or at least they have spent time handling keyboard behavior, ARIA attributes, focus management, and screen reader support. When you build your own components, that responsibility moves to your team.

Again, AI can help here.
An agent can suggest ARIA attributes, implement keyboard interactions, and compare components against accessibility patterns. That is useful. But accessibility is not something to blindly delegate.

You still need to validate behavior.

For Angular projects, a useful building block is the new [`@angular/aria` package](https://angular.dev/guide/aria/overview), which provides accessibility primitives that can be used in your components. These primitives are designed to follow best practices and can help reduce the risk of accessibility issues. The aria package provides directives to handle accessibility patterns, without affecting the visual styling. This allows you to create custom-styled components while still maintaining accessibility.

> Angular Aria works well when you need accessible interactive components that are WCAG compliant with custom styling.

Examples include components such as autocompletes, selects, comboboxes, menus, accordions, and more. These components require more than visual styling. They need correct focus management, keyboard support, roles, labels, right-to-left languages, and interaction semantics.

These are exactly the areas where a custom component library can become risky if the team underestimates the complexity.

A valid approach is to combine AI assistance with established accessibility primitives, automated tests, manual verification, and code review.

## Where AI agents help most

Agentic AI is useful because component libraries contain a lot of work that is structured and well-defined.
It's also something very common across many teams, which means that the agent has enough training data to learn from, and enough context to understand the patterns.

For example, a coding agent can help to:

- generate an initial component implementation;
- create tests with interaction scenarios;
- add and validate accessibility features, such as ARIA attributes and keyboard support;
- write usage examples;
- update documentation;
- refactor APIs;
- migrate components to newer Angular APIs;
- align similar components with the same conventions;
- scan for inconsistent usage across the application.

### How to set up the agent for success

To improve the quality and consistency of the output, it is important to provide the agent with enough context and constraints.
If you want to use AI agents to help build a component library, define the rules first.

Use the [Angular Agent Skills](https://angular.dev/ai/agent-skills) to give the agent a good understanding of Angular concepts and best practices. This will help the agent generate code that is consistent and qualitive. Also create your own design system skill, that explains your design system and conventions. This will help the agent generate components that fit your product's style, design tokens (e.g. colors, typography, spacing), and requirements. If you have team rules, also include these in a SKILL or add it to the instruction file, this can touch on folder structure, naming conventions, testing requirements, documentation format, and more.

These standards do not need to be perfect from day one. But they need to exist.
AI agents are much more useful when they are constrained. A clear set of conventions improves the quality and consistency of the output. The less code, the better.

With this in place, when you ask the agent to create a new component, it has a target to follow, improving the overall quality and consistency of the generated code.

## When not to build your own

Even with AI agents, building your own component library is not always the right choice.

An existing component library is still a better option when your team needs broad component coverage quickly, does not have strong design requirements, or cannot commit to owning UI infrastructure.

Complex components are also worth considering carefully.

For example, data grids, rich text editors, and charts are harder than they look. They contain many edge cases, performance considerations, and interaction details.

In those cases, using a specialized existing library may still be the better decision.
The point is not to reject external dependencies. The point is to be intentional about where you want control.

You can also combine and mix both approaches.
Use custom components for your core design system. Use existing libraries for complex specialized components. Wrap external dependencies only when the wrapper gives you a clear boundary and does not fight the underlying library.

## A practical workflow

If you decide to build your own component library, the next question is how to do it in a way that is sustainable.
A practical workflow for building an AI-assisted Angular component library could look like this.

Start by creating a dedicated library or folder for shared UI components. Define the public API and conventions. Add a few foundational pieces such as buttons, icons, form fields, labels, error messages, and layout primitives. You can also use existing libraries as a starting point, by pulling in the source code for some components, and then customizing them to fit your design system and API conventions.

Then use real product work to drive the next components.

When screens and flows need a repeated pattern, extract it. Ask the agent to generate the component based on existing conventions. Review the API before reviewing the implementation. Make sure the component is easy to consume.

Then ask the agent to add tests, examples, and documentation.

For accessibility-sensitive components, consider using Angular accessibility primitives where possible.

For more complex components, decide to add a dependency on an existing library. While choosing a library, consider that it fits your design system so it doesn't look out of place.

Finally, keep the component library healthy. When one component improves, let the agent inspect similar components and suggest consistent changes. When Angular introduces a new recommended pattern, use the agent to help migrate the library incrementally.

This creates a feedback loop.

The application drives the component library. The component library improves the application. The AI agent reduces the maintenance cost between both.

## Conclusion

Choosing between an existing component library and writing a custom one used to be a fairly predictable decision.

For most teams, the existing library was the safer and faster choice. Building your own meant taking on too much implementation and maintenance work.

Agentic AI changes that. While code distribution platforms already made it more viable to build your own component library, AI agents make it more practical to maintain and evolve it over time.

AI can reduce the cost of creating components, but it does not remove the need for engineering ownership. Without standards, reviews and tests, it only helps you generate technical debt faster.

By taking on the cost of ownership you gain control and flexibility. You can create components that are tailored to your product's design and interaction patterns. An incremental component library becomes a realistic option for more teams.

This isn't a "or-decision" but a "both-and" approach. You can use existing libraries where it makes sense, use code distribution platforms to pull in source code for a solid starting point, use `@angular/aria` for accessibility primitives, use external libraries for complex components, and build your own where you see the most value in owning the code.

For Angular teams, this can be especially useful. You stay within the Angular ecosystem, rely on Angular migrations, own your API surface, and avoid being blocked by external library decisions.

The result is not that every team should build everything themselves.

The better conclusion is this: build where control matters, reuse where complexity is high, and let AI agents reduce the cost of maintaining the pieces you decide to own.
