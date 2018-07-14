var GameServer = require('./GameServer')
var NodeLoop = require('./NodeLoop')
var nengiConfig = require('../common/nengiConfig')

var argv = require('yargs-parser')(process.argv.slice(2))

var gameServer = new GameServer(argv.port, argv.map)

NodeLoop.setFPS(nengiConfig.UPDATE_RATE)
NodeLoop.setMain((delta, tick, now) => {
    gameServer.update(delta, tick, now)
})
NodeLoop.begin()
