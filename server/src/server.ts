import * as uuid from "uuid";

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

const host = process.env.HOST || "https://shy-robin-81.loca.lt";

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
	return sessionId in sessions;
}

export function validateToken(tokenId: string) {
	return joinTokens.has(tokenId);
}

export function consumeToken(tokenId: string) {
	const t = joinTokens.get(tokenId);

	joinTokens.delete(tokenId);

	return t.username;
}
