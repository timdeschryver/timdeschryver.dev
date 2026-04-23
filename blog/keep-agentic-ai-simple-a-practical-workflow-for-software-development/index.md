---
title: 'Keep Agentic AI Simple: A Practical Workflow for Software Development'
slug: keep-agentic-ai-simple-a-practical-workflow-for-software-development
description: You don’t need a complex setup or endless prompt tricks to get value from AI in software development. I've experienced that a few practices like an AGENTS.md file, Agent Skills, and specifications can dramatically improve the speed, quality, and consistency of agents.
date: 2026-04-23
tags: AI, .NET, Angular
---

Over the past year, I changed my perspective on AI in software development. I used to be skeptical, but after watching [Burke Holland](https://www.youtube.com/user/burkeholland)'s content on Copilot agents, I realized that I had to give it another try. From using AI as a simple code completion tool, to a tool to generate tests or simple isolated enhancements and smaller tasks, I started to see it as a system that's capable of doing much more. Fast forward to today, I'm using it more and more to create new features from scratch.

Over the last month I used Agentic AI to rewrite a project entirely from scratch, and the results are amazing. The speed boost is incredible, and the quality of the code is good, not perfect, but good enough in my opinion. In this blog post, I want to share my experience and thoughts on AI in software development, and why I think it's a game-changer for software development.

No, I didn't vibe code the project, because while it's probably faster, I think this practice causes issues in the long term. Instead - and because we're currently in the classic cycling season I want to use a cycling metaphor -, I would say that I'm seeing AI as a (super-)domestique, while I was the team leader in the team.

> In road bicycle racing, a [domestique](https://en.wikipedia.org/wiki/Domestique) is a rider who works for the benefit of their team and leader, rather than trying to win the race. In French, domestique translates as "servant". The use of the term dates back to 1911, although such riders had existed before then.

This allowed me to focus on the high-level design and architecture of the project, while I let the AI handle the implementation details and most of the work. In the end, you're still the leader who needs to cross first over the finish line, just as Wout van Aert won Paris Roubaix to raise the cobblestone. Just as pulling in an external dependency, we're still responsible for the overall direction and quality of the project, but we can leverage the power of AI to get there faster and more efficiently.

## Overall architecture and design

The project I worked on, uses an ASP.NET API as the backend and an Angular frontend, orchestrated by Aspire.

Before letting the agents loose, I've set up the project structure the way I wanted.

I used the same design as mentioned in [Treat your .NET Minimal API Endpoint as the application layer](../treat-your-net-minimal-api-endpoint-as-the-application-layer/index.md) using a Vertical Slice architecture. For Angular, I decided to use all the Signal API features, and no external UI library. After the initial setup, I let the AI handle the implementation of the features.

The goal of this project was to act as a sandbox to experiment with different approaches and techniques, to get myself familiar with the capabilities and limitations of AI in software development.
Disclaimer: I'm certainly not an AI-expert, but I wanted to share my successful experience, and I hope it can inspire you to explore AI. I also want to share some of the techniques and approaches I used, and how these helped me to get the most out of AI in software development.

## AGENTS.md

If you're already familiar with AI Agents, then the [AGENTS.md](https://agents.md/) file shouldn't be new to you. This file is always included in the Agent's context, and it contains the instructions that the agent follows while working on the project. Because it's included for every request it's a good practice to add the general guidelines, the structure of the project, and commands the agent can use in this document. Different tools might have their own version of this file, e.g. in GitHub Copilot it's called `instructions.md`, or claude uses `CLAUDE.md`, but the idea remains the same across the tools.

Instead of different versions of this file, using the `AGENTS.md` naming is a standard, and is supported in most (all?) tools.
This makes it easy to switch between tools, without having to change the instructions for the agent.

You don't have to write the `AGENTS.md` file manually, you can also just let the agent generate it for you. In my case this file contains the technology stack, the commands to use (build, test, lint, etc.), the coding style and conventions, and the overall flow of the application. This way, the agent has a clear understanding of the project and its requirements, and uses this to generate code that is aligned with the overall direction of the project.

I also found that adding a database diagram in the mermaid syntax to the `AGENTS.md` file, is a great way to give the agent a better understanding of the data model of the project. In bigger application this big diagram won't be readable for humans, but it does help the agent to understand the application's model to pinpoint where it needs to be.

Because this file is critical to have good results, it's a good idea to review your `AGENTS.MD` file regularly to keep it up to date, to ensure that the instructions and guidelines are still relevant and accurate. This way, you can be confident that the agent is always working with the latest information, and that it can generate code that is aligned with the overall direction of the project.

To keep the file in a good shape, ask the agent to update the `AGENTS.md` after introducing a new concept (within the same session).
I also added recurring mistakes to this file to improve the quality of the agent.

## Skills

I do use [Agent Skills](https://agentskills.io/home) to extend the capabilities of the coding agent. Skills are just markdown files (it can also contain scripts) to teach your agent specific knowledge about tools and technology, or team rules that the agent needs to follow in certain situations. The agent can access these skills, and automatically pulls in the skill(s) when it detects it could be useful for a given task. For example, when I ask the agent to create a new Angular component, it loads the Angular skill, and uses it to generate the component code.

The main differentiation between skills and `AGENTS.md`, is that the agent file is always included in the context, while skills are only included when they are relevent. This is important to keep the context window manageable, in order to get the best results.

Another usage of a skill is that it's possible to invoke the skill on demand using a slash command. In this case the skills feature is the successor of slash commands or file instructions, and provides a standardized way to invoke repetitive tasks.

There are plenty of good skills available. To search for skills, I recommend using [https://skills.sh](https://skills.sh).
To install a skill in your project, you can use the following command. After the installation the skill is added to your project repository (or on your system), so it can be re-used by your team.

```bash
npx skills add dotnet/skills
```

I used skills to teach the agent the latest Angular features, using the official [Angular skill](https://angular.dev/ai/agent-skills), and I also used several official [.NET skills](https://github.com/dotnet/skills) to provide the agent the best practices (e.g. to write good and performant Entity Framework code). Besides the technical skills, I also installed the `pnpm`, `NuGet`, `Aspire`, and several documentation skills (e.g. to create mermaid diagram) to let the agent handle the project management and documentation tasks.

Using the [`skill-creator` skill](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md), it's also possible to generate your own skills, or you can also write them manually if you prefer. However using the creator skill will also include the best practices to write the skill.
I recommend creating custom skill for your team-level rules, or for areas where an agent usually goes off the track.

For my project, a must-have, was creating a design skill containing direction and feeling of the application. This skill documents the overall/brand style (colours, fonts, etc.), and the available components within the project. Without this skill, I experienced that the agent would often deviate from the general design, leading to inconsistent design elements and a bad user experience. By using the design system skill, the agent was able to generate consistent and high-quality UI code, which was aligned with the overall design direction of the project. This was especially required for the codex models, and less for the claude models.

Because most of my endpoints are implemented in the same way, I also used the existing endpoints as examples to let the agent generate an "endpoint template" skill. This made additional generated endpoints consistent with the existing ones.

Agent skills are a great way to improve the overall quality, from anything coding related to general tasks such as writing and updating the documentation.

That's also the reason why I'm not using MCP servers. While these were heavily promoted a couple of months ago, these bloat the context window of the agents, resulting in lower quality output. There are many skills and/or CLI tools (which skills can use) that can replace tasks for an MCP server, for example for [Playwright CLI](https://github.com/microsoft/playwright-cli), [GitHub CLI](https://cli.github.com/), and many more. I've only configured the [Aspire MCP](https://aspire.dev/get-started/aspire-mcp-server/), and for a brief moment a [Figma](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) and [Google Stitch](https://stitch.withgoogle.com/) to try out design integrations but this wasn't a great success.

## Spec-driven development

While the prompt was important (see prompt-engineering), models are becoming better to interpret our requests. This is good news for me, because prompting was never my forte. To write the specifications for new features, I used spec-driven development using [OpenSpec](https://openspec.dev/). I prompted what I wanted to achieve in a few sentences, and OpenSpec generated 3 files for me:

- a `proposal.md` file, where the functional analysis of the feature is described, within a few sections, a summary, a "what", a why, the scope and not in scope, and a list of success criteria.
- a `design.md` file, where the technical design of the feature is described, including the areas, API endpoints, Angular components, and models that need to be created or changed, and the implementation details.
- a `tasks.md` file, where the step-by-step implementation plan is described, with a list of tasks that need to be done to implement the feature, and the order in which they should be done.

When I was unhappy with the generated documents, I could easily change them using a second or third prompt, or make manual changes to the generated files.

I found it to be a great way to communicate the requirements and expectations to the coding agent, and it helped me to get a better understanding of the feature, the implementation, and possible caveats and drawbacks. It also helped me to keep track of the progress, and to steer that the feature is implemented according to the requirements and expectations. If you want, you can change the files OpenSpec generates, but I found that the default templates are good enough for me. An additional benefit of using OpenSpec, is that these (archived) documents are a part of the codebase, and are committed with the rest of the code.

To make smaller changes and bugfixes to existing features, I used a more traditional approach, where I just prompted the agent to make the changes directly, or to create a plan suggestion. This approach worked well without the need for a more formal spec, but I found that for larger features, the spec-driven approach was more effective and efficient. Otherwise, I found that the agent would often miss some subtle details, or that it would implement the feature in a way that was not aligned with my expectations. This meant I had to do multiple iterations to get the feature right, which was time-consuming.

In short, use spec-driven development for bigger features, while it's possible to skip this step for smaller changes or bugfixes.

Instead of OpenSpec, you can also use GitHub's [SpecKit](https://github.com/github/spec-kit).

This way of working also divides the agent's context in multiple steps, again resulting in a better outcome.
Another variation of spec-driven development is Research Plan Implement (RPI), which is almost the same.

:::tip

The talk "[No Vibes Allowed: Solving Hard Problems in Complex Codebases](https://www.youtube.com/watch?v=rmvDxxNubIg)" by Dex Horthy helped me to understand this concept better, and explains why context matters.

:::

## Tools and models

The key to working with agents is to provide just enough context, not too little, but certainly not too much as well.

While there are a few differences in the models that I've used (Claude and Codex), I've found them to be equally useful.
These models evolve at a fast pace, and I think it doesn't matter as much as it used to be. Every few months a new and better model is released, so even if one model is currently better, it can shift in the other direction before you know it.
That being said, the only difference that I've experienced, is that Claude is better in design tasks.

So far, I haven't used custom agents, mostly because I have a feeling that this will pull me into a rabbit hole, while I'm pleased with the default coding agent in combination with skills.

The tools we use to interact with the models are an abstraction layer around the models, which is called the harness.
If I'm well informed, this layer is becoming thinner because the power of AI lies within the models themselves.
Because of this, there isn't much difference between the tools, and they are becoming more and more identical.

This is also something that I've experienced while trying out different tools, from GitHub Copilot, to Codex and Claude, to OpenCode.
The one harness is more independent then another, but this is just a matter of preference (and configuration).
Because the fast pace of AI, I do like and prefer [OpenCode](https://opencode.ai/) because it provides the option to use different models while remaining in the same tool. This is similar to or [GitHub Copilot](https://github.com/copilot/), but additionally it prevents a vendor lock-in as you can connect to different providers.

## Workflow

Using agents has drastically changed my workflow.

Instead of writing code, and writing code, and writing code.
I now delegate this task to the coding agent, while I can give more attention to more critical aspects in the process.

I usually start with using the OpenSpec propose skill to generate a plan to implement.
When the plan is in a good shape, I ask the coding agent to implement the steps within the plan.
After the feature is complete I test the code from a functional standpoint, and I review the critical code paths in depth. To make quick progress I'm not interested in the implementation details. For example, I decided to use custom UI components instead of using a component library. I treated this code as an external dependency, similar to a third-party package, and I only look at the public API, not the internals of the components.
This usually takes a few iterations, and after going back and forth, when I'm happy with the results I'm using the git and GitHub skills to commit the changes and open a pull request.

When the agent is busy with generating a plan or implementing the plan, I usually do one of the following: review (with or without an agent) code, start generating a new plan, updating the documentation (also using an agent), refactor code, or getting a coffee. While it worked on a big task, it can also happen that I'm going for a quick run while the agent is working.

## Team structure and ceremonies

For this project, I was the sole developer, so I didn't have to worry about team structure and ceremonies. However, I'm sure that communication and collaboration is more crucial than ever.

I have the feeling that what I was used to deliver in two-week sprints, is now shipped within a couple of days or even less. Therefore, having frequent check-ins and review moments, are critical to keep everyone aligned. Instead of coding for days/weeks and then having a big review at the end, it's better to have more frequent reviews. This to catch potential issues or misalignments early on, and to ensure that the project is on the right track.

That's why I also believe that the role of a Product Owner and/or Project Manager will become more important. The issue isn't that there isn't enough time and resources anymore, but that there will be an overflow of non-important features. The skill will be to focus on the areas that provide business value, and to not be tricked into all the bells and whistles that provide no-value and are quick to deliver.

I won't be surprised that pair programming could have a new meaning. Instead of having two developers working on a feature, why not having a developer and a stakeholder or key-user working on a feature together. Atleast, this is something that I'm looking forward to try out.

## Conclusion

We can't ignore that our industry is changing. To stay relevant it's important to embrace this change early on.

> As [Dan Clarke](https://uk.linkedin.com/in/danclarkeuk) wrote in [Developers are System Thinkers, not Code Monkeys](https://www.danclarke.com/developers-are-system-thinkers-not-code-monkeys/):
> Don't be the developer who's afraid of AI. Be the developer who treats it as the latest system to learn. Play with it. Experiment. Build things with it. The more you understand how it works, the better you'll be at leveraging it - and that's exactly what we've always done.

Because introducing AI can be overwhelming at first, atleast it was for me, I think it's a good idea to start simple and to not bring in all of features at once. The tools and techniques are also changing in a rapid pace, so it's a challenge to keep up with best practices, especially if it's not your main focus area. Using standardized tools and practices helps to keep everything manageable. While choosing tools, I also think it's important to think about a potential vendor lock-in.

By only using AI agents you will already see some results, but these probably won't impress your, nor be consistent in their output.
I was impressed with the overall quality improvement with introducing the `AGENTS.MD` file and adding Agent Skills to the project. This resulted in major speed improvements by using AI in my development workflow. To prevent countless back-and-forth's between me and the model, a good specification with clear requirements helps to boost the productivity.

While this all sounds good, keep in mind that AI is not the silver bullet.
AI can help you ship faster, but only if you stay in the driver's seat.
Just as within software teams now, there will always be areas that could be (or are required to be) polished up.

I'm seeing our role as software engineer becoming less technical detailed, instead our role is to provide good guardrails to let the agent do its job (and this might also become less important over the next months and years?), while still taking ownership over the product that we're building. That's why it's a good idea to start your AI journey sooner than later.

Instead of focusing on delivering code, I can now give more focus to delivering value, which was - and still is - the most important and brings me the most joy.
