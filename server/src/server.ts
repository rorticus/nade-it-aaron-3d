import fetch from "node-fetch";
import * as uuid from "uuid";

const ANON = (process.env.ANON || "true") === "true";

export interface Session {
	id: string;
	createdOn: Date;
	createdBy: string;
	responseUrl: string;
}

export interface JoinToken {
	id: string;
	sessionId: string;
	username: string;
}

const host = process.env.HOST || "https://little-yak-33.loca.lt";

const joinTokens = new Map<string, JoinToken>();
const sessions: Record<string, Session> = {};

export function createSession(createdBy: string, responseUrl: string) {
	const sessionId = uuid.v4();

	sessions[sessionId] = {
		id: sessionId,
		createdOn: new Date(),
		createdBy,
		responseUrl,
	};

	return sessionId;
}

export function createJoinUrl(sessionId: string, username: string) {
	const tokenId = uuid.v4();

	joinTokens.set(tokenId, {
		id: tokenId,
		sessionId,
		username,
	});

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

export async function postBackMessage(sessionId: string, message: string) {
	const session = sessions[sessionId];
	if (session) {
		postToSlack(session.responseUrl, message);
	}
}

export function postToSlack(responseUrl: string, message: string) {
	fetch(responseUrl, {
		method: "post",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({
			response_type: "ephemeral",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: message,
					},
				},
			],
		}),
	});
}
