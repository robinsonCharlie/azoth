var tiledLoaderMiddleware = require('./tiledLoaderMiddleware')
var GameClient = require('./GameClient')

window.onload = function() {
    console.log('window loaded')

    // pixel art modde
    PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST
    // load spritesheet
    PIXI.loader.add('/images/spritesheet.png', '/images/spritesheet.json')
    // activate tiled map loader
    PIXI.loader.use(tiledLoaderMiddleware)

    PIXI.loader.load(function(loader, resources) {

        var game = new GameClient()

        var prev = Date.now()
        var loop = function() {
            var now = Date.now()
            var delta = (now - prev)/1000
            prev = now
            game.update(delta)
            window.requestAnimationFrame(loop)
        }

        // expose game to window for debugging in console
        window.game = game

        loop()
    })
}
