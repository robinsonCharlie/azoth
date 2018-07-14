var nengi = require('../nengi')
var nengiConfig = require('../common/nengiConfig')
var ExampleEntity = require('./entity/ExampleEntity')
var Identity = require('./message/Identity')
var MapName = require('./message/MapName')
var Grid = require('../common/Grid')

var CollisionSystem = require('./CollisionSystem')
var convertMap = require('./convertMap')
var mapExits = require('./mapExits')

class GameServer {
    constructor(port, mapName) {
        this.tileMapName = mapName      
        this.tileMap = require('../public/maps/' + mapName)
        this.players = new Map()
        this.collisionSystem = new CollisionSystem(convertMap(this.tileMap), mapExits[mapName], 16, 16)
        this.instance = new nengi.Instance(nengiConfig, 'super secret instance transfer password (change me to any string!)')

        this.instance.onConnect((client, clientData, callback)  => {

            console.log('clientData', clientData)
            // create a character for this person
            this.spawnPlayer(client)

            // send them the name of the map
            this.instance.message(new MapName(mapName), client)

            // define a view for client. Any entities within this movable view will be streamed to the client
            client.view = {
                x: 500,
                y: 500,
                halfWidth: 500,
                halfHeight: 500
            }

            // example of reading transfer data to spawn the player in a specific area
            // in this case the player appears infront of the cave that they just went through
            if (clientData.fromTransfer) {
                // the math here converts world coordinates to tile coordinates and centers the player
                client.entity.x = clientData.fromTransfer.x * 16 + 8
                client.entity.y = clientData.fromTransfer.y * 16 + 8
            }            

            // accept this connection (accept all connections in this demo...)
            callback({ accepted: true, text: 'Welcome!' })
        })

        this.instance.onDisconnect(client => {
            // when someone disconnects, remove their character so it isn't just standing around forever
            this.removePlayer(client)
        })


        console.log('Starting game server on port', port, 'and map', mapName)
        this.instance.listen(process.env.PORT || 5000)
        //this.instance.listen(port)
    }

    spawnPlayer(client) {        
        var entity = new ExampleEntity()
        client.entity = entity
        entity.client = client

        // by default spawn the player at tile 61, 14, which is infront of a cave
        entity.x = 61 * 16
        entity.y = 14 * 16

        this.instance.addEntity(entity)
        this.players.set(entity.id, entity)

        // message that tells the client which entity they control
        this.instance.message(new Identity(entity.id), client)
    }

    removePlayer(client) {
        this.players.delete(client.entity.id)
        this.instance.removeEntity(client.entity)
    }

    update(delta) {
        //console.log(delta)
        // nengi-style reading of commands from clients
        var cmd = null
        while (cmd = this.instance.getNextCommand()) {
            var tick = cmd.tick
            var client = cmd.client

            for (var i = 0; i < cmd.commands.length; i++) {
                var command = cmd.commands[i]
                if (command.protocol.name === 'PlayerInput') {
                    client.entity.move(command)
                }
            }
        }




        // the real core game loop ...
        this.players.forEach(player => {
            // move players
            player.update(delta)

            // collide players with the map and adjust them
            this.collisionSystem.applyMapCollisions(player)

            // check if the player is standing on any of the exits
            var exit = this.collisionSystem.checkExits(player)

            if (exit) {
                // if the player was standing on exit, try to transfer them to the appropriate server
                this.instance.transfer(player.client, exit.address, { x: exit.to.x, y: exit.to.y }, res => {                    
                    // if the target server accepted the tranfer, remove the player from this instance
                    if (res.accepted) {
                        this.removePlayer(player.client)
                    }
                }) 
            }

            // that's all!    
        })


                // nengi-style centering the view on the player's entity
        this.instance.clients.toArray().forEach(client => {
            // center the nengi view on the player's entity
            client.view.x = client.entity.x
            client.view.y = client.entity.y

            //client.entity.x += 2
            //client.entity.y += 2
        })

        // the nengi instance will send out all relevant entity changes and queued messages when update is called
        // call it every frame for a real-time game
        this.instance.update()
    }
}

module.exports = GameServer