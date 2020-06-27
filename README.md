# 'nade it, Aaron!

A slack game like Bomberman.

## Development
If you are just developing this game, clone the repository, `npm i` and get going with `npm run build`.  
This will package the app and get you on the right track.

If you are developing the game alongside the engine, you'll need to link the
engine. Clone `webgl-engine` and run `npm run link` in that directory. Then run
`npm run watch` to start the TypeScript watch server. In this project, run `npm link webgl-engine`.
This will let this project update when you update `webgl-engine`.