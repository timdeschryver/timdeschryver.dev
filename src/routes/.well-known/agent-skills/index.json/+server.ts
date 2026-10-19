import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import frontmatter from 'front-matter';

export const prerender = true;

const skillsPath = 'static/.well-known/agent-skills';

// The Agent Skills Discovery index (https://github.com/cloudflare/agent-skills-discovery-rfc), served at /.well-known/agent-skills/index.json
// The skills are static files in static/.well-known/agent-skills/{name}/SKILL.md,
// the digest is created from the same bytes that are served, so it stays in sync when a skill changes
export function GET() {
	const skills = fs
		.readdirSync(skillsPath, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort()
		.map((name) => {
			const skill = fs.readFileSync(path.join(skillsPath, name, 'SKILL.md'));
			const { attributes } = frontmatter<{ name: string; description: string }>(
				skill.toString('utf-8'),
			);

			if (attributes.name !== name || !/^(?!.*--)[a-z0-9][a-z0-9-]{0,63}(?<!-)$/.test(name)) {
				throw new Error(`Skill ${name} needs a valid name that matches its directory`);
			}
			if (!attributes.description || attributes.description.length > 1024) {
				throw new Error(`Skill ${name} needs a description of at most 1024 characters`);
			}

			return {
				name,
				type: 'skill-md',
				description: attributes.description,
				url: `/.well-known/agent-skills/${name}/SKILL.md`,
				digest: `sha256:${createHash('sha256').update(skill).digest('hex')}`,
			};
		});

	const index = {
		$schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
		skills,
	};

	return new Response(JSON.stringify(index, null, '\t'), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
