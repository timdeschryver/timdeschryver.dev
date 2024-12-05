---
title: "Creating an Angular application that's used by different user groups"
slug: creating-an-angular-application-thats-used-by-different-user-groups
description: Some guidelines on how to structure and secure your Angular application when it needs to be consumed by different user groups, e.g. by a public and a private portal. You have multiple options to choose from, but my favorite is using an Angular (or NX) workspace, in this blog post I'll explain why.
date: 2024-12-05
tags: Angular, Security
---

How do you structure your Angular project when the application needs to be consumed by different user groups, e.g. a public "area" for normal users and a private "area" for administrators?
Let's refer to these "areas" as portals throughout the rest of this blog post, which I find sounds better and is more descriptive.

Think for example of a shop that has a public website (a public portal) for its customers, and also requires an administrative portal for business owners to maintain the products.

## Start with defining the requirements

Before you start the implementation of a new application it's important to define the requirements of the application.
Think about the different user groups, what they can or cannot do, which elements the user groups share, and how they differ from each other.
All of this impacts the decision on how the application is structured.

Some of the questions you might ask yourself are:

- do you need to hide entire pages and/or components in some portals, (the answer is probably yes), and how would you do this?
  - have you thought about the security implications if an unauthorized user (tries to) see content he/she doesn't have access to?
- do the portals share a common layout or design?
  - how do you reuse blocks, such as components or a common styling?
  - is the main page layout the same for both portals?
- do these portals require a separate release cycle?
- does the admin portal need to be publically available?
- who will work on the different portals, will it be the same team, or will different teams work independently?
- do the portals require a different configuration, e.g. secrets, different API endpoints, or different environment variables?

In this blog post, we'll go through some options and discuss what the implications are.

## One application: with if-else statements and reused models

The simplest solution I can think of is creating one Angular application, which consists of both the public and the admin portal.

There's no or almost no distinction between components, and a lot of services and models are being reused.

Pages and components are shared between portals and rely on `if` statements to show or hide the appropriate content based on the (un)authenticated user.
For example, the home page contains of 2 big `if` blocks, one to show the content of a public user, and one to show the content of an admin user.
Another page might wrap an admin button in an `if` block to hide it from public users.

This approach might seem straightforward initially, but the lack of separation between the portals will lead to challenges as the application grows.
Eventually, the application becomes a tangled mess of `if` statements, which no developer wants to touch because they're afraid of breaking something.

There's also a security risk involved with this approach.
With each addition, there's an increased risk of displaying incorrect elements to the wrong user group, such as an admin button on the public portal.
How would you explain that a public user can access private information, or even worse, can change private information?
Without the proper guard rails in place, a user could try to access "hidden" pages by changing the URL manually.
You also need to pay attention to network requests and make sure that no private data is leaked to the public portal.
This is one of the reasons why I don't like to reuse models between different user groups.
Without proper backend security measures, this could lead to a data breach.

In my opinion, this solution is a big no-no because it's hard to maintain and it's easy to create security vulnerabilities.

## One application: separation through the router

To improve the previous approach, you can create a separation between the different portals through the Angular router.

By splitting your Angular routes into separate "lanes", it becomes easier to differentiate between the portals.
This way you can have a public portal and an admin portal, each with its own routes and route components.

In the example below, there are two portals: a public portal and an admin portal.

```ts:routes.ts
export const routes: Routes = [
	{
		path: 'admin', // only allow (authenticated) admin users to access the admin portal
		canActivate: [isAdminGuard],
		loadChildren: () => import('./admin/admin.routes').then((m) => m.routes),
	},
	{
		path: '',
		loadChildren: () => import('./customers/customers.routes').then((m) => m.routes),
	},
];
```

An important aspect to keep in mind when doing this is to add [route guards](https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access) to the routes.
A guard prevents unauthorized users from accessing routes of the application to which they don't have access.
In the example above, the `adminGuard` makes sure that the admin portal is only accessible to users who are authenticated and have the role of an admin.

I encourage you to rearrange your folder structure to reflect how the user groups consume the application.
For our example, this means that there's a `customers` folder and an `admin` folder, each containing its own components, services, and models.
This practice forces the development team to create separate components and models for each portal, preventing overuse.
If needed there can still be 's still possible to introduce a shared folder, which is used between portals.
This practice helps to remind developers to think in the context of a specific user group.

To prevent the shared components contain `if` statements based on the user, I prefer to create dumb components that make use of content projection to render the user-based content.
This way the shared components don't have to know about the user, and the user-specific content can be passed in from the parent component.
If that isn't possible, it's better to create a separate component for each user group instead of using `if` statements.

The caveat is that while there's some separation between the portals, it isn't enforced.
It's still possible to reuse components (or other code) directly between the portals, which can lead to the same problems as the previous approach.
A thorough code review process is needed to prevent this from happening.

:::tip
Strict boundaries prevent accidental sharing of code.
You can make use of the [`no-restricted-imports` ESLint rule](../../bits/enforce-module-boundaries-with-no-restricted-imports/index.md) or [sherrif](https://softarc-consulting.github.io/sheriff/) to enforce these boundaries.
:::

Another caveat is that the application is still being developed, and deployed, as one big Angular application.
As a result, this leads to a bigger application bundle.
Because it's still one application, there will only be 1 release containing all the changes, there's no possibility to deploy only one public portal.

Security-wise it's a small improvement over the previous approach, but it still isn't the most secure way to build the application.
The same security risks are still present, but it's harder to make a mistake.
There might be a false sense of security because the portals are separated, but the shared codebase still contains sensitive information.
This also applies to configuration files that contain sensitive information, such as an environment file or files that are part of the assets.
There's also the threat that a route guard is not applied to a new route.

I use this approach when there's a small difference between the usergroups within an application, and if I'm sure that there's no high-security risk involved.
For example, a public website consumed by unauthenticated and authenticated users (can be different roles, but no admins), where the authenticated users can have more features than the unauthenticated users.

## Separate applications

Another approach is to create separate Angular applications, one for each portal.
In this setup, each portal is a separate codebase that can be developed, built, and deployed independently.

Compared to [Seperation through the router](#one-application-separation-through-the-router), this approach is more strict and enforces a hard separation between the portals.

This has multiple benefits.

- The responsibilities are clear, each team needs to take ownership of their code.
- The security risk is lower. The attack surface is smaller because the portals are separated from each other. Configuration files, API endpoints, and other sensitive information can be kept separate. Lastly, a portal can be made only accessible through a private network, making it hidden from the public internet.
- The application bundle is smaller because each portal is built separately it will contain only the code that's needed for that portal.
- Each portal has its own release cycle, which means that you can deploy to one portal without impacting the other portal(s).
- Each portal can have its own configuration, such as environment variables, assets, and tooling.

But, it also comes with a cost.
The downside is that you now have to maintain multiple Angular applications, which can lead to duplicated code and increased maintenance costs.
For example, you will have to update all applications when there's a new version or update duplicated code in multiple places for a bug fix.

As a response to this, you can choose to create a shared project that contains shared components, services, and models to be consumed by different portals.
To share this (or multiple) shared project you will have to package it, publish it (publically or internally), and install it in the other applications.
Just be careful to see this as a silver bullet, and create many different shared projects.
In my experience, this can be a hassle to maintain, and if you're not careful it leads to versioning issues, also known as [dependency hell](https://en.wikipedia.org/wiki/Dependency_hell).

Creating separate applications improves the security of the application, but it comes with a cost, namely a decreased development experience (most of the time).
This can be okay when different teams work on the different portals, but when the same team works on both portals, it's something to keep in mind.

You can use seperate applications when the portals are very different from each other, and when the security of the application is a high priority.
I would only use this when there multiple teams responsible for the different portals, otherwise I would opt for an [Angular workspace](#angular-workspace).

## Angular workspace

What if I tell you that you can have the best of both worlds?
That you can have multiple independent applications that can share code between them without the hassle of managing dependencies, and still have strong security measures in place?

To achieve this, you can make use of an [Angular workspace](https://angular.dev/reference/configs/file-structure).

> You develop applications in the context of an Angular workspace. A workspace contains the files for one or more projects. A project is the set of files that comprise an application or a shareable library.

With an Angular workspace, you can create multiple projects, either simple TypeScript libraries or full-blown Angular applications within the same codebase.
Each application can have its own configuration, such as environment variables, assets, and tooling.
All of the applications will have individual `npm` scripts to serve, test, and build the application.
Because of this, each application can be built, tested, and deployed independently.

Besides Angular projects, a workspace can also contain library projects.
This makes it easy to share code between the different applications, without jumping through hoops to manage dependencies.

Using a workspace gives you the same benefits as having [separate applications](#angular-workspace), but without the downsides.

The only gotcha I can think of is that it can become a problem to work on with different teams that don't communicate well.
The workspace codebase is one repository, meaning that some coordination is needed between the teams.
But if this is a problem, then you might have a bigger problem at hand.

I would use an Angular workspace when there are multiple user groups that need to share code between them, and when the security of the application is a high priority.
A single application within the workspace can also make use of the [router](#one-application-separation-through-the-router) to similar user groups that need to share the same application.

### NX

You can also choose for [NX](https://nx.dev/) to create an NX workspace, which is a monorepo using the NX terminology.

> Build system, optimized for monorepos, with plugins for popular frameworks and tools and advanced CI capabilities including caching and distribution.

NX has advantages over the default Angular CLI, especially when you're working with multiple applications and libraries.
One of the key strengths of NX is that can cache several tasks, such as building, testing, and linting, which can speed up the CI build and also the development process.
They also have a dependency graph, which can help you to see which parts of the codebase are affected by a change.

You can also use NX outside of the Angular ecosystem, it also allows you to incorporate other frameworks, backend or frontend, in the same NX monorepo.

## Conclusion

When you're building an Angular application that has multiple user groups, it's important to think about how you structure the application.
Key aspects to keep in mind are the security of the application, the maintainability of the codebase, and the development experience.
These play a crucial role in the decision on how to structure the application.

In this blog post, we've discussed four different approaches to structure an Angular application with multiple user groups.
Each approach has its own benefits and downsides, and it's up to you to decide which approach fits best with your requirements.

That being said, I would advocate using an Angular workspace (or NX workspace if needed) to create multiple applications that can share code between them.
Depending on the requirements, you can also choose to create separate applications or use the Angular router to separate the portals.
But, creating one unstructured application with many `if-else` statements is a big no-no, and I strongly advise against it.

The workspace approach gives you a lot of flexibility, and it's easier to scale when the application grows.
Within one application of the workspace, you can also make use of [the router](#one-application-separation-through-the-router) to separate the usergroups that need to share the same application.
To summarize, the gains of using an Angular workspace are:

- **Strong security measures** are in place.
  Each application has its own configuration, making it harder to accidentally leak sensitive information.
  Because the portals are separated from each other the attack surface is smaller.
- A **better user experience**, because the application is split into multiple applications you only ship the code that's required for that portal, and nothing more.
- A **better development experience**, because you can directly share code without the hassle of managing dependencies.
  Only share code that is identical, do not extend models just to support a feature in one portal. This prevents overfetching or overposting data (another point for security).
- Each portal has its **own release cycle**, which means that you can deploy to one portal without impacting the other portal(s). You can also host portals on different servers, which gives you the possibility to hide the admin portal from the public internet (extra points for security).
