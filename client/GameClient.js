var nengi = require('../nengi')
var nengiConfig = require('../common/nengiConfig')
var InputSystem = require('./InputSystem')
var PIXIRenderer = require('./PIXIRenderer')
var PlayerInput = require('./command/PlayerInput')

class GameClient {
    constructor() {
        this.renderer = new PIXIRenderer()
        this.client = new nengi.Client(nengiConfig)
        this.input = new InputSystem()

        this.client.onConnect(connectionResponse => {
            console.log('Connection response', connectionResponse)
        })

        this.client.onTransfer(clientData => {            
            this.renderer.reset()
            // optional: can add properties to clientData and they will be submitted to server
            //clientData.sessionKey = 'example987654321'
        })

        this.client.onClose(() => {
            console.log('Connection closed.')
        })

        this.connect('ws://localhost:8001')
        // optional: send an object to the server with data from client
        //this.connect('ws://localhost:8001', { sessionKey: 'example123456789' })
    }

    connect(serverAddress, config) {
        this.client.connect(serverAddress, config)
    }

    // all of the things that nengi can send...
    processSnapshot(snapshot) {
        snapshot.createEntities.forEach(entity => {
            this.renderer.createEntity(entity)
        })

        snapshot.updateEntities.forEach(update => {
            this.renderer.updateEntity(update)
        })

        snapshot.deleteEntities.forEach(id => {
            this.renderer.deleteEntity(id)
        })

        snapshot.messages.forEach(message => {
            this.renderer.message(message)
        })

        snapshot.localMessages.forEach(localMessage => {
            this.renderer.localMessage(localMessage)
        })
        
        snapshot.jsons.forEach(json => {
            this.renderer.json(json)
        })
    }


    // note: update is called by requestAnimationFrame. This will be 60 fps on most computers, but 144 fps+ on fancy
    // monitors. Both work fine for this demo. For some games it may be desirable to enforce a specific tick rate.
    update(delta) {
        // relative mouse coordinates to the center of the screen -- not used in this demo but
        // left here as an example. Can use this to fire a projectile or cast an ability in a direction.
        // Divide by the screen scale and add the camera's position to obtain world coordinates.
        var relativeMouseX = this.input.currentState.mx - window.innerWidth * 0.5
        var relativeMouseY = this.input.currentState.my - window.innerHeight * 0.5
      
        var controls = new PlayerInput(
            this.input.frameState.w,
            this.input.frameState.a,
            this.input.frameState.s,
            this.input.frameState.d,
            relativeMouseX, //this.input.currentState.mx,
            relativeMouseY, //this.input.currentState.my,
            this.input.frameState.mouseDown
        )

        this.client.addCommand(controls)

        // client.update() flushes all commands, sending them to the server
        // in this demo all we ever send is a 'PlayerInput' object
        this.client.update()
        this.input.releaseKeys()

        // nengi, interpolate positions for data received from the server
        var serverState = this.client.interpolate(100)

        // why do we have to worry about late snapshots? b/c nengi doesn't send the full
        // state of the game each frame, it sends small deltas. If the game client lags (or 
        // switches tabs), we miss a few snapshots and we must catch up.
        serverState.late.forEach(late => {
            this.processSnapshot(late)
        })
        
        if (serverState.interpolated) {
            this.processSnapshot(serverState.interpolated)
        }

        this.renderer.update(delta)
    }    
}

module.exports = GameClient