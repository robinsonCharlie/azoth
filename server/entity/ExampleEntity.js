var nengi = require('../../nengi')
var Direction = require('../../common/Direction')
var SAT = require('sat')

class ExampleEntity {
    constructor() {
        this.x = 0
        this.y = 0
        this.isMoving = false
        this.facing = Direction.DOWN

        // collider, a circle shape slightly smaller than a grid tile
        this.collider = new SAT.Circle(new SAT.Vector(this.x, this.y), 7)

        this.velX = 0
        this.velY = 0
    }

    update(delta) {
        // move the character
        this.x += this.velX * 75 * delta
        this.y += this.velY * 75 * delta
        this.velX = 0
        this.velY = 0

        // this game uses very zoomed in pixel art, having sub-pixel coordinates creates artifacts and jitter
        this.x = Math.floor(this.x)
        this.y = Math.floor(this.y)

        // move its collider (used for collisions against the map geometry)
        this.collider.pos.x = this.x
        this.collider.pos.y = this.y
    }

    // note: move does not actually move the character, it merely aims the character in a direction
    // the character moves when update() is called.
    move(command) {
        var x = 0
        var y = 0

        if (command.a) { 
            x -= 1
            this.facing = Direction.LEFT
        }
        if (command.d) { 
            x += 1 
            this.facing = Direction.RIGHT
        }
        if (command.s) { 
            y += 1
            this.facing = Direction.DOWN
        }
        if (command.w) { 
            y -= 1
            this.facing = Direction.UP
        }

        if (command.w || command.a || command.s || command.d) {
            this.isMoving = true
        } else {
            this.isMoving = false
        }

        // vectorish math to make sure that diagonal movement isn't faster
        var len = Math.sqrt((x * x) + (y * y))
        if (len > 0) {
            this.velX = x/len
            this.velY = y/len 
        }
    }   
}

ExampleEntity.protocol = {
    x: { type: nengi.UInt16, interp: true },
    y: { type: nengi.UInt16, interp: true },
    facing: nengi.UInt2,
    isMoving: nengi.Boolean
}

module.exports = ExampleEntity