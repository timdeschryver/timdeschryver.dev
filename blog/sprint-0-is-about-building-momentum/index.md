---
title: Sprint Zero is about building momentum
slug: sprint-0-is-about-building-momentum
description: Deliver value early and build stakeholder trust from Sprint Zero. Agentic AI and practical tooling help teams ship working features and act on feedback.
date: 2026-10-06
tags: AI, Team, Agile
---

Most of the projects I've worked on started with a Sprint Zero, a sprint to prepare everything before the "real" work begins. Looking back, much of that time went into searching for the perfect architecture that's flexible enough to handle everything thrown at it. With the combination of modern tools and Agentic AI, I believe there's a better use of that time: building momentum by delivering a working feature from the start.

## What is Sprint Zero?

Some teams use the term Sprint Zero for a preparation phase before they start delivering product features. As Luis Branco describes in [Sprint Zero: The Solid Foundation for Successful Agile Projects](https://www.projectmanagement.com/blog-post/77846/sprint-zero-the-solid-foundation-for-successful-agile-projects), this can include agreeing on initial requirements, preparing the development environment, and creating a backlog.

So how does this fit into agile frameworks such as Scrum? A sprint Zero can be seen as a part of Scrum, but you might be surprised that Sprint Zero isn't part of the framework. The [Scrum Guide](https://scrumguides.org/scrum-guide.html#scrum-team) expects every sprint to deliver a valuable, useful increment, which a preparation sprint doesn't. Yet, many teams still start their projects with a Sprint zero that could be shifted into more sprints.

## My experience with Sprint Zero

In my experience, and because of my role, Sprint Zero is primarily a very technical sprint. It involves setting up the development environment, configuring necessary tools, and ensuring that the team has a clear understanding of the project's initial requirements. In theory, this phase allows us to hit the ground running once the actual development sprints begin.

In practice, this was mostly the case, but it came with a cost. The time and effort we spent didn't directly contribute to delivering business value. It was a time to discuss the architecture, establish coding standards, evaluate library trade-offs, and align on development practices. Because this is a very technical phase, it was also a time to look into new libraries and architectures and discuss them in depth, which often meant that Sprint Zero took more time than planned.

While it took some time, it gave the team space for valuable discussions and helped build a shared understanding. For the technical people in the team, myself included, it was also a happy time: a chance to explore new technologies and to show off our knowledge and skills.

The downside was that we were looking for the perfect architecture, the architecture that would handle all use cases, including the complex ones and the edge cases.
Sadly, there is no "perfect". Over time, the project evolves, requirements change, team members leave and join, and what seemed like the perfect architecture initially may need adjustments.

In practice, we made assumptions and decisions during Sprint Zero that we later had to revisit as the project progressed.
In the most drastic cases, projects stuck to the initial architecture and decisions, even when they no longer fit, and the team had to work around them. Others adapted to evolving requirements and lessons learned during the ongoing development.

## A new way to approach Sprint Zero

Instead of aiming for a perfect architecture from the get-go, a more effective approach to Sprint Zero is to focus on building momentum.

Over the past decade, new tools and frameworks have reduced the upfront effort required to set up a project. Agentic AI takes this a step further by helping throughout the development process, from clarifying requirements and exploring designs to scaffolding, implementation, verification, and ongoing improvements. Together, these tools help teams establish a working foundation and start delivering value almost immediately.

That gives us an opportunity to build a feature, learn from how it's used, and adjust our decisions as we go.

## Why momentum matters

A project starts with the most uncertainty. We don't fully know the domain yet, and as mentioned earlier, the requirements are based on assumptions. Decisions made upfront are made with the least amount of knowledge. While this might not seem like much, it can all add up to a higher cost later on.

I like to build the features in front of, or even better, together with, stakeholders. A working product helps us see which assumptions were right, and which ones need to change. In my experience, this also helps the stakeholders themselves. We've all heard something along the lines of "I can only really think about it once I can try it". A working feature gives them something concrete to react to.

Momentum also builds trust. When stakeholders see progress early, the conversation shifts away from instructions and technical details, toward the why: why we're building the software, who we're building it for, and how it delivers value. These are more interesting and valuable discussions to have. Instead of "us versus them", we're figuring it out together.

## How we can build momentum in Sprint Zero

AI helps us deliver value from the very first sprint. The team sets the direction: understanding the problem, deciding on the overall shape of the system, and keeping the code easy to change. With that guidance in place, the team hands off the implementation details to the agent. The team then verifies that the result aligns with its technical and functional vision: how the system is designed, what it should do, and the value it should deliver.

:::info
John Ousterhout's ["A Philosophy of Software Design"](https://web.stanford.edu/~ouster/cgi-bin/book.php) distinguishes between tactical and strategic programming. Tactical programming prioritizes getting the next feature working, accepting shortcuts to get there. Strategic programming continually invests in a design that keeps the system easy to change, including the implementation details. The team needs to manage this trade-off throughout development. I first heard this framing applied to AI in Matt Pocock's talk [Software Fundamentals Matter More Than Ever](https://www.youtube.com/watch?v=v4F1gFy-hqg). My takeaway is to use the agent's speed while continuing to invest in the design of the code it produces.
:::

Concretely, we build the first feature from multiple **vertical slices**. Each slice covers a specific action through the relevant layers of the application, from the interface to the API and the database. The team decides how these slices fit together and into the architecture, while the agent implements the details. Organizing code around features helps keep changes local: the code for each feature stays together, making it easier to understand and change. When features share data or logic, we still need to check how a change affects the rest of the application.

Stakeholders try the first working feature, which brings multiple slices together. Their feedback helps us refine it and decide what to build next, before we build a larger workflow around the wrong assumptions.

I take a pragmatic approach to the setup: start from a reusable foundation that helps us build, verify, and deliver the first feature, then adapt it as the project grows.

## Tools I use

Across recent projects, I've noticed that I use almost the same starting point for a new project. Having the tools and practices below already in place lets the team start from a working system and spend its time on the first feature. Every project is different, so I see it as a starting point, not as a set of rules.

**[Aspire](https://aspire.dev/)** orchestrates the application: the frontend, the backend, the database, and other dependencies. Once configured, it runs all services together, so no one has to start services or connect dependencies by hand. Aspire can also deploy the application, as I've written about in [Containerize an ASP.NET Core BFF and Angular frontend using Aspire](../containerize-an-aspnet-core-bff-and-angular-frontend-using-aspire/index.md). I keep all projects (e.g. frontend and backend) together in a **monorepo**, so the agent sees the whole system and can implement a feature across the stack in a single change.

Stakeholders need a working version they can try. A **CI/CD** pipeline deploys the first feature to a shared environment. This can be a managed platform such as **[Render](https://render.com/)** or **[Railway](https://railway.com/)**, a VPS with **[Dokploy](https://dokploy.com/)**, or **Azure**. Each deployment gives stakeholders an updated version to try, and their feedback guides what comes next.

Building **authentication and authorization** into the first feature lets stakeholders try the application with realistic user permissions. Adding these checks upfront also reduces the work of retrofitting them later, when endpoints, pages, and tests need to be revisited. For an example, see [Secure your Yarp BFF with cookie-based authentication](../secure-your-yarp-bff-with-cookie-based-authentication/index.md).

Feedback only helps if we can act on it. Integration tests with **[TUnit](https://tunit.dev/)** give us more confidence to change the implementation as our understanding improves. Its [benchmarks](https://tunit.dev/docs/benchmarks/) show faster execution than xUnit, NUnit, and MSTest in scenarios such as async tests, helping keep the agent's feedback loop short. The tests help catch regressions in the behavior we've specified, see [Why writing integration tests on a C# API is a productivity booster](../why-writing-integration-tests-on-a-csharp-api-is-a-productivity-booster/index.md).

**Automating repetitive tasks** reduces manual work and gives the AI agent guardrails. **[EditorConfig](https://editorconfig.org/)** defines shared formatting settings, while **[Oxlint](https://oxc.rs/docs/guide/usage/linter.html)**, **[Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)**, and strict compiler checks provide fast feedback on errors and deviations from our conventions. ESLint covers the remaining Angular-specific rules. These checks help the agent correct mistakes before review, leaving the team more time to focus on behavior and design.

With [**OpenTelemetry**](https://opentelemetry.io/), I collect logs, traces, and metrics from every service and send them to the Aspire dashboard locally and a custom telemetry stack, such as Grafana, in production. Running it with Aspire allows the Aspire MCP server to give the agent runtime context to investigate failures and verify its work, as described in [Improve your AI coding agent with runtime context from Aspire MCP](../improve-your-ai-coding-agent-with-runtime-context-from-aspire-mcp/index.md).

Small, focused changes are easier to understand, review, and adjust. For the backend, I like to use **ASP.NET Minimal APIs** with the **REPR pattern** (Request-Endpoint-Response) to keep the code for a use case together. Each endpoint is a vertical slice with its own request, handler, and response, see [Treat your .NET Minimal API Endpoint as the application layer](../treat-your-net-minimal-api-endpoint-as-the-application-layer/index.md).

Making knowledge reusable helps us spend less time repeating guidance and correcting the same patterns. The official **[Angular skills](https://angular.dev/ai/agent-skills)** and **[.NET skills](https://github.com/dotnet/skills)** give the agent current framework guidance, helping it avoid outdated patterns from its training data. For more about skills, see [Keep Agentic AI Simple: A Practical Workflow for Software Development](../keep-agentic-ai-simple-a-practical-workflow-for-software-development/index.md).

Alongside the official skills, it's possible to create my own with **[book-to-skill](https://github.com/virgiliojr94/book-to-skill)**, which turns a book into an **Agent Skill**. Instead of loading an entire book into the context window, it extracts the frameworks, decision rules, and anti-patterns into a compact skill, and only loads a chapter when it's relevant to the task. I used it to turn John Ousterhout's ["A Philosophy of Software Design"](https://web.stanford.edu/~ouster/cgi-bin/book.php) and David C. Hay's ["Data Model Patterns"](https://books.google.com/books/about/Data_Model_Patterns.html?id=a7VQAAAAYAAJ) into skills. When the agent designs a module or a data model, these skills give it design guidance, which we also use to review its output.

Taking **more ownership** of our code gives us room to respond to feedback as the product takes shape. Writing code ourselves used to be expensive, which often made adding a dependency the cheaper option. With agents, building what we need becomes more practical, for example a **custom component library**, as I describe in [Using Agentic AI to create your own component library](../using-agentic-ai-to-create-your-own-component-library/index.md).

Maintenance tasks can interrupt the team's focus. Agents can pick up small, well-defined items from the backlog automatically, such as minor bug fixes or small improvements. The agent runs on a trigger, a schedule or in a loop, similar to what I describe in [Scheduled AI in practice: turning telemetry into a daily health report](../scheduled-ai-in-practice-turning-telemetry-into-a-daily-health-report/index.md), and opens a pull request for the team to review. Having these changes prepared for review can help the team keep its attention on the next milestone.

I also use **AI to refactor**. As we learn more about the domain, the code and the architecture need to follow. Refactoring used to be a big investment that was easily postponed, which is why the decisions made in Sprint Zero tended to stick. With an agent, a refactoring that touches many files can become cheaper. Strict compilers and linters catch structural mistakes, while integration tests help detect regressions in the behavior we've covered. Combining these checks with focused vertical slices and review gives us more confidence to act on what we've learned and evolve the architecture. In a follow-up article, I'll share where AI fits into my development workflow and how I use it in practice.

The choice of package manager might seem like a small detail, but I've found that install times add up quickly when running agents in parallel or starting fresh CI jobs. That's why I use **[pnpm](https://pnpm.io/)** for its fast installs.

## Conclusion

Sprint Zero doesn't have to be a sprint without value. Instead of searching for the perfect architecture, use the available time to align the team on the why. The how still matters, but it shouldn't be the priority, or the only thing we discuss. Delivering a working feature early also builds trust with the stakeholders, because they can see the progress instead of hearing about it. That trust makes it easier for stakeholders to share concerns, give honest feedback, and make decisions with us, knowing that we listen and follow through.

Once there's momentum, keep it going. Use AI and familiar tools to keep delivering software at a steady cadence. Keep the team involved in design and review, put the result in front of stakeholders, and let what you learn guide the next milestone. With AI, we can build more than ever, but more isn't the goal. The key is to focus on the right thing, and to not let the speed of AI distract the team and the stakeholders from it.

The architecture will change as the project evolves, and that's fine. That's why my goal isn't to get the code right from the first time, but to make it easy to change or delete. What matters is that we learn quickly and deliver value from the start, and keep building on top of that good start.
