---
title: How I stay in control while building and delivering software with AI
slug: how-i-stay-in-control-while-building-and-delivering-software-with-ai
description: As AI rapidly changes how we build software, it's important to stay in control and take ownership. The same standards should apply whether a human or a machine builds the software. For me, meeting those standards starts with data quality and integrity. In this post, I share what else I focus on to stay in control.
date: 2026-11-10
tags: AI, Architecture
---

Everyone can vibe code a project, and getting the first version working is exciting and fun. But not everyone wants to own the result, and owning it starts with understanding what we're building.

In [Keep Agentic AI Simple](../keep-agentic-ai-simple-a-practical-workflow-for-software-development/index.md), I wrote about letting the agent handle implementation details. That doesn't mean we should blindly trust everything it produces or lose oversight of the project. I review the work differently than I used to: at a higher level, rather than going through every implementation detail. I focus on the reasoning behind the changes and check that the result conforms to the requirements and fits the overall design.

I still need to understand how the parts fit together and how a change affects the rest of the application. That helps me judge the agent's suggestions and know when to step in. In this post, I share the practices and key areas I focus on when working with AI agents, from the initial design to the data we store. These choices help me stay in control and protect the application's quality and reliability.

## Before building

The process starts with **why we're building software**. I discuss the problem with stakeholders and what they want to achieve. Sometimes this also covers the how, e.g. when stakeholders already have a clear idea and plan. The features and technical choices should follow from that discussion.

This stage happens in person whenever possible and helps everyone stay aligned. It also means everyone involved shares responsibility for the outcome.

### Clarify requirements with the agent

I think working with agents changes the role of a developer, from implementing the work to guiding and reviewing what the agent builds. That starts with an analysis.

This step might take longer than before because I go back and forth with the agent to get the requirements clear. I ask it to suggest different approaches and explain the pros and cons of each. We compare them against the requirements and the architecture we already have. Think of it as a brainstorming session.

By discussing the alternatives, I get a better understanding of the trade-offs. This is particularly useful in domains I'm less familiar with, where I need to understand the reasoning well enough to explain our decisions to stakeholders and team members.

The outcome isn't a full product requirements document (PRD), and I don't work out every implementation detail up front. The analysis gives us a direction and leaves room for the agent to fill in the details.

### Try quick prototypes with stakeholders

Before the actual implementation, I make sure **everyone understands what we're building**. I ask the agent to build quick prototypes for stakeholders to see and ideally try out. In my experience, it's easier to discuss something we can visualize and interact with. The shorter feedback loop saves time and reduces misunderstandings before we invest in the full implementation.

With the speed at which agents can change and iterate on prototypes, we can even apply feedback during these sessions and show the result in real time.

## During implementation

### Design and implement the data model

I was taught that the data model is the cornerstone of an application, so I may be biased here. The stored **data is one, if not the most important, valuable asset of an application**. The model defines the business concepts we work with and the information we keep. A good data model ensures consistency, integrity, and clarity in how we handle that data. Not only for today but also for the long-term maintainability and evolution of the application.

It's easy to change and iterate over the code and design, but changing the data model has far-reaching consequences. Mistakes in the model can lead to inconsistent data, loss of information, and increased complexity in the application logic. This is why I treat the design and implementation of the data model with extra care.

Given its importance, I design and implement the core and critical parts of the data model myself, especially at the start of a project. For the rest, the agent can propose changes, but they need my explicit approval.

Changing the code won't automatically repair incorrect records or recover information we never stored. I carefully review the meaning of the model and the quality of the stored data as part of the work.

An industry model can give us a starting point. For example, the Banking Industry Architecture Network (BIAN) provides shared definitions through its [Business Object Model](https://bian.org/servicelandscape-14-0-0/views/view_54016.html). Although BIAN is a banking standard, I see its modeling techniques as a useful base for other domains too, especially its Core Object Classifications.

### Write down architecture choices

I use [Architecture Decision Records (ADRs)](https://adr.github.io/) to **keep the project decisions traceable**. They record our architecture choices, why we made them, and the trade-offs. I keep them with the code alongside a short overview of how the parts fit together. They also include failed experiments and decisions that were considered but not adopted.

People and agents can read that reasoning before planning a change. We can spot proposals that conflict with earlier choices without having to repeat the whole design discussion. I link to the documents from `AGENTS.md` so the agent can find them.

After a design discussion, the agent can draft the ADR. I check that it matches what we agreed. When a decision changes, we record why and which earlier decision it replaces. While reviewing changes, I make sure to read these files to get a better understanding of the context and reasoning behind the change.

The instructions for writing ADRs should keep the agent focused on the key choices, trade-offs, and reasoning that help a future reader understand the context, not on every detail. Otherwise, the decision records grow into hundreds of lines that nobody reads.

### Agree on the model and its language

We need to agree on what the concepts in the model mean. Whether I design the model or the agent proposes a change, I discuss its terms and relationships with stakeholders before building on it.

I feel that [ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html) from Domain-Driven Design (DDD) matters even more with agents. Stakeholders, developers, and agents should use the same terms for the same concepts in discussions, specifications, and code. This makes it easier to check the implementation against the requirements. If needed, a short glossary linked from [`AGENTS.md`](https://agents.md/) keeps the definitions available to the agent.

### Validate the work in steps

Once the why is clear, I ask the agent to tackle the work in steps. This makes it more manageable and allows me to steer the agent in the right direction when needed. It also prevents the agent from building on top of a mistake from an earlier step or, in the worst case, on a wrong assumption from the start.

In practice, the agent often does better than I initially expected. By now, that no longer surprises me. With recent model improvements, it gets a lot right without extensive guidance and can handle more complex tasks on its own.

The agent can suggest the steps. I decide where I need to stay closely involved, based on the risk and how well I understand the work. Well-understood work can go in larger steps. Small changes with a clear scope and low risk, for example from stakeholder feedback, can be handled by the agent on its own. I review the result instead of each step. Critical paths, changes to the data model, and work in a domain I'm still learning get smaller steps and a closer review.

The agent can also ask for guidance when it runs into uncertainty or a high-risk situation, ideally with a few options to choose from.

During the review, I focus on the application flow and whether the implementation fits the intended design. I pay extra attention to authorization rules and new dependencies. I also put more focus on the overall user experience and consistency, simply because I now have more time for it.

### Value the knowledge behind open source

For me, much of an open-source project's value comes from the **knowledge of its maintainers and contributors**. They understand the design choices and the problems the project has had to solve. That experience matters when we need help or want to make a change.

An agent can help us build an alternative, but we then take on its maintenance effort. I consider the knowledge and help available around an existing project when deciding what to build myself and what to reuse.

In [Using Agentic AI to create your own component library](../using-agentic-ai-to-create-your-own-component-library/index.md), I chose to own the code because we needed control over the components' styling, behavior, and API. That's a trade-off I make on purpose, not by default.

### Watch out for extra features

An agent can be very eager to do more than we asked for. It can decide to build additional functionality on its own, or add complexity that wasn't part of the original scope, e.g. support for scenarios nobody asked for. It's important to recognize these additions and evaluate whether they add value before accepting them. **It's easier to add a feature later when it's needed than to remove one.**

Even if the agent builds them quickly, we still have to test and maintain them. I strongly believe that less is more, and that applies to the agent's additions too.

## Conclusion

The agent and I work as a team, so I can spend more time where I add the most value. **I still need to be in charge of the direction, and that requires understanding how the system works.** Without that understanding, I wouldn't be able to make informed decisions and communicate them effectively to the team and stakeholders. Our understanding of the problem changes as we learn more. Revisiting decisions along the way gives us the opportunity to change direction before building further on assumptions that no longer hold.

In the end, it shouldn't matter whether a human or a machine built the software. The result needs to meet the same standards, and we remain responsible for it.

We use this process and these techniques to build software with AI at dotNET lab. They help us work faster while our team stays responsible for the whole flow, including after launch. You can read more about it at [custom software](https://dotnetlab.eu/en/custom-software).
