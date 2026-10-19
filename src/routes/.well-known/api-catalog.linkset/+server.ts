import { publicUrl } from '#lib/variables.js';

export const prerender = true;

// The RFC 9727 API catalog, served at /.well-known/api-catalog
// Azure Static Web Apps derives the content type from the file extension,
// so the catalog is prerendered as a .linkset file and rewritten (see staticwebapp.config.json and hooks.ts)
export function GET() {
	const catalog = {
		linkset: [
			{
				anchor: publicUrl(),
				'service-desc': [
					{
						href: publicUrl('/openapi.json'),
						type: 'application/vnd.oai.openapi+json;version=3.1',
					},
				],
				'service-doc': [
					{
						href: publicUrl('/llms.txt'),
						type: 'text/plain',
					},
				],
			},
		],
	};

	return new Response(JSON.stringify(catalog, null, '\t'), {
		headers: {
			'Content-Type': 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
			Link: '</.well-known/api-catalog>; rel="api-catalog"',
		},
	});
}
