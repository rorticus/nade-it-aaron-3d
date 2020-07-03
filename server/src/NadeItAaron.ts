import { Room, Client } from "colyseus";
import {GameState} from "./state/GameState";
import {Player} from "./state/Player";

export class NadeItAaron extends Room<GameState> {

    onCreate (options: any) {
        console.log('room created', options);

        this.setState(new GameState());

        this.onMessage("type", (client, message) => {
            // handle "type" message
            console.log('some sort of message', client, message);
        });

    }

    onJoin (client: Client, options: any) {
        console.log('client joined', client.id);
        this.state.players[client.id] = new Player();
    }

    onLeave (client: Client, consented: boolean) {
        console.log('client left', client.id);
        delete this.state.players[client.id];
    }

    onDispose() {
        console.log('onDispose');
    }
}