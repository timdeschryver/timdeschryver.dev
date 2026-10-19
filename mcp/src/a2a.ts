import { markdownPath, parseContentIndex, searchContent } from './content';
import { fetchText, formatItem } from './site';

// A stateless, read-only A2A agent (https://a2a-protocol.org/latest/specification/) over the JSON-RPC binding, routed at /a2a
// The site publishes its Agent Card at /.well-known/agent-card.json (src/routes/.well-known/agent-card.json/+server.ts)
// The agent doesn't use a model: a message with the URL of a blog post or bit returns it as Markdown (read-article),
// other messages search the content with the keywords of the message (find-articles)
// It answers with a Message, it never creates tasks

export const protocolVersion = '1.0';

// JSON-RPC error codes, the A2A-specific codes are listed in section 9.5 of the specification
export const errorCodes = {
	parseError: -32700,
	invalidRequest: -32600,
	methodNotFound: -32601,
	invalidParams: -32602,
	internalError: -32603,
	taskNotFound: -32001,
	pushNotificationNotSupported: -32003,
	unsupportedOperation: -32004,
	contentTypeNotSupported: -32005,
	extendedAgentCardNotConfigured: -32007,
	versionNotSupported: -32009,
};

// The answers are Markdown, which also reads as plain text
const outputModes = ['text/markdown', 'text/plain'];

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST',
	'Access-Control-Allow-Headers': 'Content-Type, A2A-Version, A2A-Extensions',
};

type JsonRpcId = string | number | null;

type Part = { text?: unknown };

type Message = {
	messageId: string;
	contextId?: string;
	taskId?: string;
	role: 'ROLE_USER';
	parts: Part[];
};

class A2AError extends Error {
	constructor(
		readonly code: number,
		message: string,
	) {
		super(message);
	}
}

const noTasks = () => {
	throw new A2AError(errorCodes.taskNotFound, "Task not found, this agent doesn't create tasks");
};
const noStreaming = () => {
	throw new A2AError(errorCodes.unsupportedOperation, 'Streaming is not supported');
};
const noPushNotifications = () => {
	throw new A2AError(
		errorCodes.pushNotificationNotSupported,
		'Push notifications are not supported',
	);
};

const methods: Record<string, (params: unknown, siteUrl: string) => Promise<unknown>> = {
	SendMessage: sendMessage,
	SendStreamingMessage: noStreaming,
	SubscribeToTask: noStreaming,
	GetTask: noTasks,
	CancelTask: noTasks,
	ListTasks: () => {
		throw new A2AError(
			errorCodes.unsupportedOperation,
			"Listing tasks is not supported, this agent doesn't create tasks",
		);
	},
	CreateTaskPushNotificationConfig: noPushNotifications,
	GetTaskPushNotificationConfig: noPushNotifications,
	ListTaskPushNotificationConfigs: noPushNotifications,
	DeleteTaskPushNotificationConfig: noPushNotifications,
	GetExtendedAgentCard: () => {
		throw new A2AError(
			errorCodes.extendedAgentCardNotConfigured,
			'There is no extended Agent Card',
		);
	},
};

export async function handleA2ARequest(request: Request, siteUrl: string): Promise<Response> {
	if (request.method === 'OPTIONS')
		return new Response(null, { status: 204, headers: corsHeaders });
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', {
			status: 405,
			headers: { ...corsHeaders, Allow: 'POST' },
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return errorResponse(
			null,
			new A2AError(errorCodes.parseError, 'The request is not valid JSON'),
		);
	}

	const id =
		isRecord(body) && (typeof body.id === 'string' || typeof body.id === 'number') ? body.id : null;
	if (!isRecord(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string' || id === null) {
		return errorResponse(
			id,
			new A2AError(
				errorCodes.invalidRequest,
				'Send a JSON-RPC 2.0 request with an id and a method',
			),
		);
	}

	// Without the header, the client uses version 0.3 of the protocol
	const version = request.headers.get('A2A-Version')?.trim() || '0.3';
	if (!/^1\.0(\.\d+)?$/.test(version)) {
		return errorResponse(
			id,
			new A2AError(
				errorCodes.versionNotSupported,
				`A2A version ${version} is not supported, send the A2A-Version: ${protocolVersion} header`,
			),
		);
	}

	const method = Object.hasOwn(methods, body.method) ? methods[body.method] : undefined;
	if (!method) {
		return errorResponse(
			id,
			new A2AError(errorCodes.methodNotFound, `Method ${body.method} not found`),
		);
	}

	try {
		return jsonResponse({ jsonrpc: '2.0', id, result: await method(body.params, siteUrl) });
	} catch (error) {
		if (error instanceof A2AError) return errorResponse(id, error);
		console.error(error);
		return errorResponse(id, new A2AError(errorCodes.internalError, 'Reading the content failed'));
	}
}

async function sendMessage(params: unknown, siteUrl: string) {
	const message = isRecord(params) ? params.message : undefined;
	if (!isMessage(message)) {
		throw new A2AError(
			errorCodes.invalidParams,
			'Send a message with a messageId, the ROLE_USER role, and its parts',
		);
	}
	if (message.taskId) {
		throw new A2AError(
			errorCodes.taskNotFound,
			`Task ${message.taskId} not found, this agent doesn't create tasks`,
		);
	}

	const mediaType = outputMode(
		isRecord(params) && isRecord(params.configuration)
			? params.configuration.acceptedOutputModes
			: undefined,
	);
	const text = message.parts
		.map((part) => part.text)
		.filter((text) => typeof text === 'string')
		.join('\n')
		.trim();
	if (!text) {
		throw new A2AError(
			errorCodes.contentTypeNotSupported,
			'Send a question or the URL of a blog post or bit as a text part',
		);
	}

	return {
		message: {
			messageId: crypto.randomUUID(),
			contextId: message.contextId ?? crypto.randomUUID(),
			role: 'ROLE_AGENT',
			parts: [{ text: await answer(text, siteUrl), mediaType }],
		},
	};
}

async function answer(text: string, siteUrl: string) {
	const urls = (text.match(/https?:\/\/\S+/g) ?? []).map((url) =>
		url.replace(/[.,;:!?)\]'"]+$/, ''),
	);
	const read = urls
		.map((url) => ({ url, path: markdownPath(url, siteUrl) }))
		.find(({ path }) => path);
	if (read?.path) {
		const markdown = await fetchText(new URL(read.path, siteUrl).href, false);
		return (
			markdown ??
			`No blog post or bit found at ${read.url}. Ask for articles about a topic to find its URL.`
		);
	}

	const items = parseContentIndex(await fetchText(new URL('/llms.txt', siteUrl).href));
	const results = searchContent(items, {
		query: keywords(text.replace(/https?:\/\/\S+/g, ' ')).join(' '),
	});
	return results.length ? results.map(formatItem).join('\n') : 'No content found.';
}

// Common words of a question that don't help to find content, e.g. "Which articles explain how to test Angular components?"
const stopWords = new Set(
	`a about all an and any are article articles be bit bits blog by can could do does explain explains find for from get give have how i in is it me my of on or post posts read search show some tell that the there this to using what when where which who why with write written you your`.split(
		' ',
	),
);

export function keywords(text: string) {
	return (
		text
			.toLowerCase()
			.split(/\s+/)
			// Keeps the punctuation of terms like ".NET", "C#", and "Node.js"
			.map((word) => word.replace(/^[^\p{L}\p{N}.#+]+|[^\p{L}\p{N}#+]+$/gu, ''))
			.filter((word) => word && !stopWords.has(word))
			// The terms are matched as substrings, without the plural "s" they match both forms (e.g. "components")
			.map((word) => (/^\p{L}{3,}s$/u.test(word) ? word.slice(0, -1) : word))
	);
}

function outputMode(acceptedOutputModes: unknown) {
	if (!Array.isArray(acceptedOutputModes) || acceptedOutputModes.length === 0)
		return outputModes[0];

	const mode =
		outputModes.find((mode) => acceptedOutputModes.includes(mode)) ??
		(acceptedOutputModes.some((mode) => mode === '*/*' || mode === 'text/*')
			? outputModes[0]
			: undefined);
	if (!mode) {
		throw new A2AError(
			errorCodes.contentTypeNotSupported,
			`The agent answers with ${outputModes.join(' or ')}`,
		);
	}
	return mode;
}

function isMessage(value: unknown): value is Message {
	return (
		isRecord(value) &&
		typeof value.messageId === 'string' &&
		value.messageId.length > 0 &&
		value.role === 'ROLE_USER' &&
		Array.isArray(value.parts) &&
		value.parts.every(isRecord) &&
		(value.contextId === undefined || typeof value.contextId === 'string') &&
		(value.taskId === undefined || typeof value.taskId === 'string')
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorResponse(id: JsonRpcId, error: A2AError) {
	return jsonResponse({ jsonrpc: '2.0', id, error: { code: error.code, message: error.message } });
}

// JSON-RPC errors are returned with a 200 status, the error is in the body
function jsonResponse(body: object) {
	return new Response(JSON.stringify(body), {
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}
