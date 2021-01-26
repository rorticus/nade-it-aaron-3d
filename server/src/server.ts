import fetch from "node-fetch";
import * as uuid from "uuid";

const ANON = (process.env.ANON || "false") === "true";

export interface Session {
	id: string;
	createdOn: Date;
	createdBy: string;
	responseUrl: string;
	slackToken: string;
	slackChannelId: string;
	slackMessageId: string;
}

export interface JoinToken {
	id: string;
	sessionId: string;
	username: string;
}

export interface SlackMessageOptions {
	ephemeral?: boolean;
	markdown?: boolean;
	replaceOriginal?: boolean;
}

const host = process.env.HOST || "https://tricky-frog-68.loca.lt";

const joinTokens = new Map<string, JoinToken>();
const sessions: Record<string, Session> = {};

export function createSession(
	createdBy: string,
	responseUrl: string,
	token: string,
	channelId: string
) {
	const sessionId = uuid.v4();

	sessions[sessionId] = {
		id: sessionId,
		createdOn: new Date(),
		createdBy,
		responseUrl,
		slackToken: token,
		slackChannelId: channelId,
		slackMessageId: "",
	};

	return sessionId;
}

export function createJoinUrl(
	sessionId: string,
	username: string,
	sourceMessageId: string
) {
	const tokenId = uuid.v4();

	joinTokens.set(tokenId, {
		id: tokenId,
		sessionId,
		username,
	});

	sessions[sessionId].slackChannelId = sourceMessageId;

	return `${host}?t=${sessionId}:${tokenId}`;
}

export function validateSession(sessionId: string) {
	if (ANON) {
		return true;
	}

	return sessionId in sessions;
}

export function validateToken(tokenId: string) {
	if (ANON) {
		return true;
	}
	return joinTokens.has(tokenId);
}

export function consumeToken(tokenId: string) {
	if (ANON) {
		return "ANON";
	}

	const t = joinTokens.get(tokenId);

	joinTokens.delete(tokenId);

	return t.username;
}

export function endSession(sessionId: string) {
	delete sessions[sessionId];
}

export async function replaceOriginalMessage(
	sessionId: string,
	message: string
) {
	const session = sessions[sessionId];
	if (session) {
		fetch("https://slack.com/api/chat.update", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				token: session.slackToken,
				channel: session.slackChannelId,
				ts: session.slackMessageId,
				as_user: true,
				texdt: message,
			}),
		});
	}
}

export async function postBackMessage(
	sessionId: string,
	message: string,
	options?: SlackMessageOptions
) {
	const session = sessions[sessionId];
	if (session) {
		postToSlack(session.responseUrl, message, options);
	}
}

export function postToSlack(
	responseUrl: string,
	message: string,
	options: SlackMessageOptions = {}
) {
	const {
		ephemeral = false,
		markdown = false,
		replaceOriginal = false,
	} = options;

	fetch(responseUrl, {
		method: "post",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({
			response_type: ephemeral ? "ephemeral" : "in_channel",
			replace_original: replaceOriginal,
			blocks: [
				{
					type: "section",
					text: {
						type: markdown ? "mrkdwn" : "plain_text",
						text: message,
					},
				},
			],
		}),
	});
}
