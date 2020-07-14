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
        const player = new Player();

        let indices = [1, 2, 3, 4];
        for(let key in this.state.players) {
            const index = indices.indexOf(this.state.players[key].index);
            if(index >= 0) {
                indices = indices.splice(index, 1);
            }
        }

        if(indices.length > 0) {
            player.index = indices[0];
        }

        this.state.players[client.id] = player;
    }

    onLeave (client: Client, consented: boolean) {
        console.log('client left', client.id);
        delete this.state.players[client.id];
    }

    onDispose() {
        console.log('onDispose');
    }
}