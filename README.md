# 'nade it, Aaron!

The game is split into two parts, the server and the client. The server handles all game logic and does all the  "hard" stuff while the client is really just a UI over the server events coming back.

### Requirements

nade it, Aaron! uses the following programs:

- `node` - required to run the server and generate the client.
- [Blender](https://www.blender.org) (optional) - Used to make the GLTF files used for 3d models.
- [Asset Forge](https://assetforge.io) (optional) - Used to get the terrain assets.
- [Docker](https://www.docker.com) (optional) - to build the the final release version.

### Installation

1. Clone this repository

2. Install dependencies

   ```shell
   npm i
   cd server && npm i && cd ..
   cd client && npm i && cd ..
   ```

3. At this point, you should be done!

### Building

The server will automatically serve the client build directory as it's web server.  It's easiest to just run both the client and server build commands in watch mode, rebuilding whenever you make a change.

> server/

```shell
npm run watch
```

> client/

```shell
npm run watch
```

After a few seconds, the server should print out a URL to let you know its ready. You'll probably want to also wait for your client build to finish. After both builds have settled down, you should be able to hit http://localhost:2567 and see the menu screen.

## Map Assets

Map assets are generated using Asset Forge.

1. Assemble single tile using Asset Forge using the default grid. A single tile should span one grid cell.
2. Export as GLB file
3. Export as a sprite using the following export settings,
    ![Asset Forge Export Settings](./docs/assetForgeExportSettings.png)
4. Paste exported sprite in final map grid (pixelmator file)
5. Update `tileReference.png` by exporting pixelmator file as PNG

## Tiles

Tile information is stored in `shared/mapdef.json`. The indices of the tiles directly correlate
the indices defined in the Tile Reference.

![Tile Reference](./docs/tileReference.png)
