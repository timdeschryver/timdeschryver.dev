import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCodes, handleA2ARequest, keywords } from './a2a';

const siteUrl = 'https://timdeschryver.dev';

const llmsTxt = `# Tim Deschryver

## Blog posts

- [Testing Signals with Angular Testing Library](https://timdeschryver.dev/blog/testing-signals-with-angular-testing-library.md) (2024-04-11; topics: Angular Testing Library, Angular, Testing): TLDR: Angular Testing Library handles Signal properties.
- [Your first MCP server with ASP.NET](https://timdeschryver.dev/blog/your-first-mcp-server-with-aspnet.md) (2026-06-25; topics: .NET, AI, MCP): Query your application's data using natural language.

## Developer bits

- [Inferred Type Predicates](https://timdeschryver.dev/bits/inferred-type-predicates.md) (2024-06-18; topics: typescript): Type predicates are inferred.
`;

const blogPost = `---
title: Your first MCP server with ASP.NET
---

The content of the blog post.
`;

const pages: Record<string, string> = {
	'https://timdeschryver.dev/llms.txt': llmsTxt,
	'https://timdeschryver.dev/blog/your-first-mcp-server-with-aspnet.md': blogPost,
};

beforeEach(() => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) =>
			url in pages ? new Response(pages[url]) : new Response('Not Found', { status: 404 }),
		),
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function send(body: unknown, headers: Record<string, string> = { 'A2A-Version': '1.0' }) {
	const response = await handleA2ARequest(
		new Request(`${siteUrl}/a2a`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...headers },
			body: typeof body === 'string' ? body : JSON.stringify(body),
		}),
		siteUrl,
	);
	expect(response.status).toBe(200);
	expect(response.headers.get('Content-Type')).toBe('application/json');
	return response.json<any>();
}

function sendMessage(message: Record<string, unknown>, configuration?: Record<string, unknown>) {
	return send({
		jsonrpc: '2.0',
		id: 1,
		method: 'SendMessage',
		params: { message: { messageId: 'msg-1', role: 'ROLE_USER', ...message }, configuration },
	});
}

describe('SendMessage', () => {
	it('searches the content with the keywords of the message', async () => {
		const response = await sendMessage({
			parts: [{ text: 'Which articles explain how to test Angular components?' }],
		});

		expect(response).toEqual({
			jsonrpc: '2.0',
			id: 1,
			result: {
				message: {
					messageId: expect.any(String),
					contextId: expect.any(String),
					role: 'ROLE_AGENT',
					parts: [{ text: expect.any(String), mediaType: 'text/markdown' }],
				},
			},
		});
		expect(response.result.message.parts[0].text).toBe(
			'- [Testing Signals with Angular Testing Library](https://timdeschryver.dev/blog/testing-signals-with-angular-testing-library) (blog, 2024-04-11; topics: Angular Testing Library, Angular, Testing): TLDR: Angular Testing Library handles Signal properties.',
		);
	});

	it('keeps the context of the conversation', async () => {
		const response = await sendMessage({ contextId: 'context-1', parts: [{ text: 'typescript' }] });

		expect(response.result.message.contextId).toBe('context-1');
		expect(response.result.message.parts[0].text).toContain('Inferred Type Predicates');
	});

	it('reads a blog post by its URL', async () => {
		const response = await sendMessage({
			parts: [{ text: 'Read https://timdeschryver.dev/blog/your-first-mcp-server-with-aspnet.' }],
		});

		expect(response.result.message.parts).toEqual([{ text: blogPost, mediaType: 'text/markdown' }]);
	});

	it('answers when the blog post does not exist', async () => {
		const response = await sendMessage({
			parts: [{ text: 'Read https://timdeschryver.dev/blog/does-not-exist' }],
		});

		expect(response.result.message.parts[0].text).toBe(
			'No blog post or bit found at https://timdeschryver.dev/blog/does-not-exist. Ask for articles about a topic to find its URL.',
		);
	});

	it('answers with plain text when the client does not accept Markdown', async () => {
		const response = await sendMessage(
			{ parts: [{ text: 'typescript' }] },
			{ acceptedOutputModes: ['text/plain'] },
		);

		expect(response.result.message.parts[0].mediaType).toBe('text/plain');
	});

	it('rejects output modes other than text', async () => {
		const response = await sendMessage(
			{ parts: [{ text: 'typescript' }] },
			{ acceptedOutputModes: ['application/json'] },
		);

		expect(response.error.code).toBe(errorCodes.contentTypeNotSupported);
	});

	it('rejects messages without text', async () => {
		const response = await sendMessage({ parts: [{ url: 'https://example.com/image.png' }] });

		expect(response.error.code).toBe(errorCodes.contentTypeNotSupported);
	});

	it('rejects messages for a task', async () => {
		const response = await sendMessage({ taskId: 'task-1', parts: [{ text: 'typescript' }] });

		expect(response.error.code).toBe(errorCodes.taskNotFound);
	});

	it('rejects invalid messages', async () => {
		const response = await sendMessage({ role: 'user', parts: [{ text: 'typescript' }] });

		expect(response).toEqual({
			jsonrpc: '2.0',
			id: 1,
			error: { code: errorCodes.invalidParams, message: expect.any(String) },
		});
	});

	it('returns an internal error when the content cannot be read', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('Bad Gateway', { status: 502 })),
		);
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const response = await sendMessage({ parts: [{ text: 'typescript' }] });

		expect(response.error.code).toBe(errorCodes.internalError);
	});
});

describe('JSON-RPC', () => {
	it('requires version 1.0 of the protocol', async () => {
		const response = await send({ jsonrpc: '2.0', id: 1, method: 'SendMessage', params: {} }, {});

		expect(response.error.code).toBe(errorCodes.versionNotSupported);
	});

	it.each([
		['GetTask', errorCodes.taskNotFound],
		['CancelTask', errorCodes.taskNotFound],
		['ListTasks', errorCodes.unsupportedOperation],
		['SendStreamingMessage', errorCodes.unsupportedOperation],
		['SubscribeToTask', errorCodes.unsupportedOperation],
		['CreateTaskPushNotificationConfig', errorCodes.pushNotificationNotSupported],
		['GetExtendedAgentCard', errorCodes.extendedAgentCardNotConfigured],
		['toString', errorCodes.methodNotFound],
		['message/send', errorCodes.methodNotFound],
	])('answers %s with error %d', async (method, code) => {
		const response = await send({ jsonrpc: '2.0', id: 'request-1', method, params: {} });

		expect(response).toEqual({
			jsonrpc: '2.0',
			id: 'request-1',
			error: { code, message: expect.any(String) },
		});
	});

	it('rejects invalid JSON', async () => {
		const response = await send('{');

		expect(response).toEqual({
			jsonrpc: '2.0',
			id: null,
			error: { code: errorCodes.parseError, message: expect.any(String) },
		});
	});

	it('rejects requests without an id', async () => {
		const response = await send({ jsonrpc: '2.0', method: 'SendMessage', params: {} });

		expect(response.error.code).toBe(errorCodes.invalidRequest);
	});

	it('only accepts POST requests', async () => {
		const response = await handleA2ARequest(new Request(`${siteUrl}/a2a`), siteUrl);

		expect(response.status).toBe(405);
		expect(response.headers.get('Allow')).toBe('POST');
	});

	it('allows cross-origin requests', async () => {
		const response = await handleA2ARequest(
			new Request(`${siteUrl}/a2a`, { method: 'OPTIONS' }),
			siteUrl,
		);

		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(response.headers.get('Access-Control-Allow-Headers')).toContain('A2A-Version');
	});
});

describe('keywords', () => {
	it('removes the words of the question and the plural form', () => {
		expect(keywords('Which articles explain how to test Angular components?')).toEqual([
			'test',
			'angular',
			'component',
		]);
	});

	it('keeps the punctuation that is part of a term', () => {
		expect(keywords('Posts about .NET, C#, and Node.js.')).toEqual(['.net', 'c#', 'node.js']);
	});
});
