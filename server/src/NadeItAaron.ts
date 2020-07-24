import { Room, Client } from "colyseus";
import {GameState} from "./state/GameState";
import {Player} from "./state/Player";
import {generateMap, MAP_HEIGHT, MAP_WIDTH} from "./map/map";
import {Vector3} from "./state/primitives";

export class NadeItAaron extends Room<GameState> {
    onCreate (options: any) {
        this.setState(new GameState());

        this.onMessage('start', (client, message) => {
            const map = generateMap();
            this.broadcast('start', {
                mapWidth: MAP_WIDTH,
                mapHeight: MAP_HEIGHT,
                map
            });
        });

    }

    onJoin (client: Client, options: any) {
        console.log('client joined', client.id);

        const p = new Vector3();
        p.x = 0;
        p.y = 0;
        p.z = 0;

        const player = new Player();
        player.isReady = true;
        player.rotation = 0;
        player.position = p;

        if(Object.keys(this.state.players).length === 0) {
            player.isHost = true;
        } else {
            player.isHost = false;
        }

        const indices = [1, 2, 3, 4];
        for(let key in this.state.players) {
            const index = indices.indexOf(this.state.players[key].index);
            if(index >= 0) {
                indices.splice(index, 1);
            }
        }

        if(indices.length > 0) {
            player.index = indices[0];
        }

        player.id = client.id;
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