import { markdownPage, markdownResponse } from '#lib/markdown-pages.js';
import { publicUrl } from '#lib/variables.js';

export const prerender = true;

// The Markdown version of the home page (src/routes/+page.svelte), keep both in sync
export function GET() {
	const page = {
		title: 'Tim Deschryver - .NET and Angular Software Engineer',
		description:
			'Practical insights on .NET, Angular, testing, and developer tooling from Tim Deschryver, a Belgium-based software engineer and Microsoft MVP.',
		canonical: publicUrl(),
	};

	return markdownResponse(
		markdownPage(
			page,
			`
# Hi, I'm Tim 👋

Software engineer · Belgium

Helping teams **deliver value** with .NET, Angular, and agentic AI.

## Work & writing

I’m a software engineer who [writes](${publicUrl('/blog')}) about lessons learned while working with **.NET** and **Angular**, both to help others and my future self.

## Open source

I’m an [open-source enthusiast](https://github.com/timdeschryver) and core team member of [NgRx](https://ngrx.io/) and [Angular Testing Library](https://testing-library.com/angular), contributing to their ongoing development and maintenance.

## Recognition

Recognized by Microsoft as a [Most Valuable Professional (MVP)](https://mvp.microsoft.com/en-us/PublicProfile/5004452?fullName=Tim%20Deschryver).

## Beyond code

Also a hobby **runner**.

## Currently exploring

### Agentic AI

Applying coding agents to real software-development workflows and integrating agentic AI into applications in a thoughtful, practical way.

### Sociocracy 3.0

Exploring better ways for teams to collaborate and make decisions.

## Elsewhere

- [LinkedIn](https://www.linkedin.com/in/tim-deschryver)
- [Bluesky](https://bsky.app/profile/timdeschryver.dev)
- [Twitter](https://twitter.com/tim_deschryver)
- [GitHub](https://github.com/timdeschryver)

## Main sections

- [Blog](${publicUrl('/blog')}): Long-form technical articles
- [Developer Bits](${publicUrl('/bits')}): Concise technical notes and examples
- [llms.txt](${publicUrl('/llms.txt')}): Index of all articles, with links to their Markdown versions

---

**Kaizen 改善** (kai.zen): Kaizen is an approach to creating continuous improvement based on the idea that small, ongoing positive changes can reap significant improvements.
`,
		),
	);
}
