import { monitor } from "@colyseus/monitor";
import bodyParser from "body-parser";
import { Server } from "colyseus";
import cors from "cors";
import express from "express";
import http from "http";
import { NadeItAaron } from "./NadeItAaron";
import { createJoinUrl, createSession, postToSlack } from "./server";

const staticPath = process.env.STATIC_PATH || "../client/build";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);
app.use(express.json());
app.use(express.static(staticPath));
app.post("/slack/join", (req, res) => {
	const { payload: payloadJSON } = req.body;

	const {
		actions,
		user: { username },
		response_url: slackResponseUrl,
	} = JSON.parse(payloadJSON);
	const action = actions[0];

	if (action && action.action_id === "play") {
		const sessionId = action.value;

		const responseUrl = createJoinUrl(sessionId, username);

		postToSlack(
			slackResponseUrl,
			`Great! click <${responseUrl}|this link> to join.`,
			{
				ephemeral: true,
				markdown: true
			}
		);
	}

	res.send();
});

app.post("/slack", (req, res) => {
	const { user_name: userName, response_url: responseUrl, token } = req.body;

	const sessionId = createSession(userName, responseUrl, token);

	res.header("content-type", "application/json");
	res.send(
		JSON.stringify({
			response_type: 'in_channel',
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `${userName} is looking to nade someone. You in?`,
					},
				},
				{
					type: "actions",
					elements: [
						{
							type: "button",
							text: {
								type: "plain_text",
								text: "Play Now! :grenade:",
								emoji: true,
							},
							value: sessionId,
							action_id: "play",
						},
					],
				},
			],
		})
	);
});

const server = http.createServer(app);
const gameServer = new Server({
	server,
});

// register your room handlers
gameServer.define("nadeit", NadeItAaron).filterBy(["sessionId"]);

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
