import {Engine, GameObject} from "webgl-engine";
import {createTexture, loadTextureFromSource} from "webgl-engine/lib/webgl/utils";

const playerSkins = [
    require('./resources/images/player1-skin.png').default,
    require('./resources/images/player2-skin.png').default,
    require('./resources/images/player3-skin.png').default,
    require('./resources/images/player4-skin.png').default,
];

export function getPlayerSkin(index: number) {
    return playerSkins[index - 1];
}

export function updatePlayerSkin(engine: Engine, player: GameObject, skinUrl: string) {
    const skinTexture = createTexture(engine.gl);

    const model = player.getObjectById('characterMedium', true);

    model.renderable.renderables[0].uniforms['u_texture0'] = skinTexture;

    loadTextureFromSource(engine.gl, skinTexture, engine.gl.TEXTURE_2D, engine.gl.TEXTURE_2D, skinUrl);
    model.renderable.renderables[0].uniforms['u_hasTexture'] = true;
}

export function removePlayerSkin(engine: Engine, player: GameObject) {
    const model = player.getObjectById('characterMedium', true);

    model.renderable.renderables[0].uniforms['u_hasTexture'] = false;
}
