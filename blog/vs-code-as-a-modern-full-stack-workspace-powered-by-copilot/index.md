---
title: VS Code as a modern Full‑Stack workspace, Powered by Copilot
slug: vs-code-as-a-modern-full-stack-workspace-powered-by-copilot
description: Why VS Code transitioned into my primary development environment. The combination of its extensibility, the different integrations, and GitHub Copilot's capabilities makes it an ideal choice for my modern full-stack development needs.
date: 2025-08-15
tags: .NET, Angular, VS Code, GitHub Copilot, Productivity, Developer Experience
---

For the past decade, I've labeled myself as a full-stack developer, sticking with .NET and Angular (first JQuery, then AngularJS). I tried various code editors to increase my productivity because I strongly believe that the right tools can make a significant difference in a developer's workflow, even if it's just to make me happier while working or reduce a little bit of friction in my daily tasks.

For most of the years, this meant using multiple code editors. Ranging from lightweight editors like Sublime Text _- who else remembers those days? -_ to more full-blown and feature-rich environments like Visual Studio and JetBrains IDEs. When writing/debugging SQL, it also meant using specialized tools like SQL Server Management Studio. This worked, and each tool had its strengths TK.

When VS Code was released, the multi-language support and extensibility it offered were appealing. But the C# experience wasn't great, so I only used it for front-end related tasks. The past two years, I ditched VS Code (and other Microsoft products) entirely for the JetBrains suite, which provided a better overall experience for me, mainly because of the refactor features. I lied here a little bit because I still used VS Code to write my blog posts, as this was the most lightweight option available.

Then Copilot came along, and it slowly changed everything. At the beginning, I was skeptical towards AI-related tools and didn't think it was helpful. But over the last year, I noticed the rapid improvements. With the addition of [agents mode](https://docs.github.com/en/copilot/concepts/coding-agent/coding-agent), I found myself using VS Code more frequently, even if it was just to experiment with new Copilot-related features.

After a while of doing this, I quickly realised that the combination of Copilot and VS Code's extensibility with many available plugins allowed me to streamline my workflow significantly. In this post, I want to share how I'm currently building applications with VS Code (and Copilot).

## One workspace, full context

As a full-stack developer, I used to open the front-end project in one IDE and the back-end project in another. Today, I simply open the root folder of the project, containing both the front-end and back-end code, in a single instance of VS Code. This not only simplifies navigation but also allows me to leverage Copilot's capabilities across the entire codebase. Because Copilot has access to the whole codebase, it understands the whole context of the application better, leading to more relevant suggestions and improvements in my coding process.

Having a single workspace also brings several other benefits:

- One search across the whole codebase;
- One set of settings to maintain and to remember;
- Having everything in one repository helps to keep the code (and releases) in sync;

## Recommended extensions

To fully leverage the capabilities of VS Code, we're required to install extensions. Here are some of my recommended extensions.

:::tip
To communicate this list efficiently to your team, add a `extensions.json` file to the `.vscode` folder of your project. This file can be used to recommend extensions to other developers working on the same project. Your team members will be prompted to install the recommended extensions when they open the project.
:::

### .NET development

For .NET, the [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit) extension is a must-have. The extension provides a rich featureset for C# development, including IntelliSense, debugging support, testing shortcuts, and more. If you used this extension in the past, but wasn't impressed, I encourage you to give it another try. The C# Dev Kit has been continuously improved, and you might find it more to your liking now. I don't feel a big difference between using Visual Studio or Visual Studio Code.

:::info

If you're afraid to use your Rider/Resharper functionality, you can try out the new [Resharper (in Preview)](https://marketplace.visualstudio.com/items?itemName=jetbrains.resharper-code) extension by JetBrains.

:::

To enforce coding standards and best practices, I rely on the [Editor Config](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) extension, which offers a collection of analyzers.

### Angular development

For Angular development, the [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) extension is invaluable. The extension uses the Angular Language Service to provide better type knowledge and checking, even in Angular templates.

I also use [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension to configure code standards, ensuring a consistent style across my codebase.

To have a few testing utilities at my disposal, I have the [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) extension installed. There's also a Jest extension if you're using Jest.

### SQL Development

For SQL explorations and development, the team behind (the new) [SQL Server (mssql)](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) has done an excellent job. With the extension, you can connect to a database and write your queries directly in VS Code. It also supports other features that you're used to, such as a table designer, a query plan visualiser, and result exporters. The only feature that I'm missing is inline edits.

If you are used to Azure Data Studio _- which will be deprecated on 28 February 2026 -_ you'll feel right at home with this extension.

### Other extensions

Besides the must-have extensions mentioned above, I also use a variety of other extensions to enhance my development experience. You can find my complete list of recommended extensions in the [extensions.json](https://github.com/timdeschryver/Sandbox/blob/main/.vscode/extensions.json) file within my Sandbox project.

The list includes:

- [Playwright](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) for end-to-end testing.
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) for Git superpowers.
- [Container Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-containers) to manage containers.
- [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-devcontainers) for containerized development (more on this later).

## GitHub Copilot integration

GitHub Copilot has become an integral part of my development workflow. The AI-powered code suggestions help me write code faster. I also experienced that it helps with refactoring tasks in a single file or across different files. Copilot detects refactoring patterns and automatically suggests changes when I'm repeatedly making the same changes in one or multiple files. To start using this feature, you need to enable the [Next Edit Suggestions (NES)](https://code.visualstudio.com/docs/copilot/ai-powered-suggestions#_next-edit-suggestions) setting to take advantage of this feature.

When I'm starting on a new feature or a bug fix, I'm catching myself relying on Copilot more and more. The agent (using the Claude or GPT-5 model) is good at making suggestions. Even if it's not perfect, it often provides a great starting point that I can refine further. When you're working in a new codebase, it gives a good insight into the related files that need to be changed.

To help Copilot give better suggestions, add [instructions](https://github.com/timdeschryver/Sandbox/tree/main/.github/instructions) on how **you expect the code to be structured and any specific patterns you want it to follow**.

## Development Containers

[Development containers](https://containers.dev/) are a great way to ensure a consistent development environment across different machines. By using a containerized approach, you can define your development environment in code and share the same setup with your teammates.

A container also creates an isolated environment for you to try out new tools and technologies without affecting your local setup.
For example, you can work on a major framework upgrade (e.g. a new .NET version) within a specific container without worrying about breaking your main development environment. Only when you're confident about the upgrade you can push the changes.

As an example, take a look at my [Dev Container](https://github.com/timdeschryver/Sandbox/blob/main/.devcontainer/devcontainer.json) configuration. The container configures a machine to run .NET and Node.js applications, and installs essential container tools and VS Code extensions.

## Ending thoughts

To recap this post, I started to get drawn back to VS Code to try out AI-assisted development with GitHub Copilot.

I came to the realization that having a single editor has many benefits, and now I'm using VS Code as my primary editor for .NET and Angular development. The many extensions are instrumental in making this work. With these extensions, I don't feel like I'm missing out on specific features that heavy IDEs have to offer. Even if I would only work on one part of the stack, I still prefer to use VS Code for its versatility, and especially for the integration with Copilot.

I also tried to use Copilot in other editors, but I find that the integration with VS Code is the most seamless. Compared to other editors, VS Code gets frequent updates and improvements. It's usually the first to adopt the new features and enhancements. That being said, I haven't tried out [Cursor](https://cursor.com/).

Kudos to the team behind VS Code, and the many teams behind the integrations are doing a great job at providing a good developer experience to VS Code users. The Azure extensions, the container extensions, are all a testament to this effort. It feels like we're not missing out on new features and that we're always learning and evolving.

All of this makes VS Code a good fit for a modern full-stack development environment, at least in my opinion and for my needs.
