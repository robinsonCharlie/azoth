var ExampleEntity = require('./entity/ExampleEntity')
var WorldRenderer = require('./WorldRenderer')
var loadAsset = require('./loadAsset')

var depthSort = function(a, b) {
    if (a.y > b.y) {
        return 1
    } else if (a.y < b.y) {
        return -1
    } else {
        return 0
    }
}

// pretty arbitrary dimensions that give the game a zoomed-in pixel art feel
// it is worth noting that the resize logic tries to handle any dimensions, not a square
// and just uses these dimensions as a starting point
var GAME_WIDTH = 533
var GAME_HEIGHT = 533

class PIXIRenderer {
    constructor(thing) {
        var canvas = document.getElementById('mainCanvas')

        this.masterScale = 1 // gets recalculated by resize()
        this.myEntity = null
        this.worldRenderer = null

        this.entities = new Map()

        this.renderer = PIXI.autoDetectRenderer(
            window.innerWidth,
            window.innerHeight,
            { 
                view: canvas,
                antialiasing: false, 
                transparent: false, 
                resolution: 1 
            }
        )

        this.stage = new PIXI.Container()
        this.background = new PIXI.Container()
        this.middleground = new PIXI.Container()
        this.foreground = new PIXI.Container()

        this.stage.addChild(this.background)
        this.stage.addChild(this.middleground)
        this.stage.addChild(this.foreground)

        this.resize()

        window.addEventListener('resize', () => {
            this.resize()
            if (this.worldRenderer) {
                this.worldRenderer.resize(this.masterScale)
            }
        })
    }

    resize() {
        var w = window.innerWidth / GAME_WIDTH
        var h = window.innerHeight / GAME_HEIGHT

        var scale = (w > h) ? w : h

        this.renderer.resize(window.innerWidth, window.innerHeight)

        // round to perfect integers (1..2..3...) for perfect pixel art
        this.masterScale = Math.round(scale)
        if (this.masterScale < 1) {
            this.masterScale = 1
        }
        this.stage.scale.set(this.masterScale)
    }

    reset() {
        this.entities = new Map()
        this.stage = new PIXI.Container()
        this.background = new PIXI.Container()
        this.middleground = new PIXI.Container()
        this.foreground = new PIXI.Container()

        this.stage.addChild(this.background)
        this.stage.addChild(this.middleground)
        this.stage.addChild(this.foreground)

        this.stage.scale.set(this.masterScale)
    }

    loadMap(mapObj) {
        this.worldRenderer = new WorldRenderer(
            this.background,
            this.middleground,
            this.foreground,
            mapObj.tileLayers, 
            mapObj.tileTextures,
            this.masterScale
        )
    }

    createEntity(entity) {
        if (entity.protocol.name === 'ExampleEntity') {
            var clientEntity = new ExampleEntity(entity)            
            this.entities.set(entity.id, clientEntity)
            this.middleground.addChild(clientEntity)
        }
        // etc... for other types of entities
    }

    updateEntity(update) {
        var entity = this.entities.get(update.id)
        entity[update.prop] = update.value
    }

    deleteEntity(id) {
        // remove the graphics
        this.middleground.removeChild(this.entities.get(id))
        // remove our reference
        this.entities.delete(id)
    }

    localMessage(localMessage) { }

    message(message) {
        if (message.protocol.name === 'Identity') {
            // out of all of the entities, this is the one being controlled
            this.myEntity = this.entities.get(message.entityId)
            this.centerCamera(this.myEntity.x, this.myEntity.y)
        }

        if (message.protocol.name === 'MapName') {
            // message.name contains the name of the map file
            loadAsset('/maps/' + message.name, mapData => {
                this.loadMap(mapData)
            })
        }
    }

    json(json) { }

    centerCameraGradually(x, y, delta) {
        var targetX = -x * this.masterScale + (window.innerWidth * 0.5)
        var targetY = -y * this.masterScale + (window.innerHeight * 0.5)

        // move camera gradually, so that lag doesn't jitter the screen
        var dx = targetX - this.stage.x
        var dy = targetY - this.stage.y
        var adjustmentStrength = 6

        this.stage.x = Math.floor(this.stage.x + (dx * adjustmentStrength * delta))
        this.stage.y = Math.floor(this.stage.y + (dy * adjustmentStrength * delta))  
    }

    centerCamera(x, y) {
        this.stage.x = Math.floor(-x * this.masterScale + (window.innerWidth * 0.5))
        this.stage.y = Math.floor(-y * this.masterScale + (window.innerHeight * 0.5))   
    }

    update(delta) {

        if (this.myEntity && this.worldRenderer) {
            //console.log(this.myEntity.x)
            // camera logic accomplished by moving stage and centering it on myEntity

            //this.centerCameraGradually(this.myEntity.x, this.myEntity.y, delta)
            this.centerCamera(this.myEntity.x,  this.myEntity.y)


            this.worldRenderer.cull(this.myEntity.x, this.myEntity.y)
        }

        this.entities.forEach((entity) => {
            // the entities in this demo play their animation via update
            entity.update(delta)
        })

        // depth sort the middleground objects
        this.middleground.children.sort(depthSort)

        this.renderer.render(this.stage)
    }
    
}

module.exports = PIXIRenderer