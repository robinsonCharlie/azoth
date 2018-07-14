var Grid = require('../common/Grid')
var SAT = require('sat')

class CollisionSystem {
	constructor(collisionGrid, exits, tileWidth, tileHeight) {
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight

		// collision grid
		this.grid = null
		this.initializeCollisionGrid(collisionGrid)

		// map exits
		this.exits = exits
	}

	initializeCollisionGrid(collisionGrid) {
		this.grid = new Grid(collisionGrid.width, collisionGrid.height)
		this.grid.fill(null)

		var blockedTileCount = 0
		for (var x = 0; x < collisionGrid.width; x++) {
			for (var y = 0; y < collisionGrid.height; y++) {
				if (collisionGrid.get(x, y)) {
					var collisionPolygon = new SAT.Box(
						new SAT.Vector(x * this.tileWidth, y * this.tileHeight), 
						this.tileWidth, this.tileHeight).toPolygon()

					this.grid.set(x, y,	collisionPolygon)
					blockedTileCount++
				}
			}
		}
		//console.log('CollisionSystem loaded with', blockedTileCount, 'tile colliders')
	}

	applyMapCollisions(entity) {
		var circle = entity.collider	

		// position of the circle in grid coordinates
		var tx = Math.floor(circle.pos.x / this.tileWidth)
		var ty = Math.floor(circle.pos.y / this.tileHeight)

		// how far to look around the circle
		var padding = 1

		/* Note: the tricky part about checking for collisions in an area of tiles is that
		* it is possible to collide with multiple objects at once, such as at a corner or junction.
		* SAT reports back the depth of the collision (see: https://github.com/jriecken/sat-js).
		* Normally just subtracting these numbers is enough to uncollide the object, however if there
		* are multiple collisions, then we will uncollide the object by too much. The solution is to move
		* the collider on each step so that we don't accrue collisions that are already uncollided by
		* the prior step. All of this is done just to have a nice, firm (no rubberband) collision
		* that also allows players to slide along walls. */

		var collidedEver = false
		for (var x = -padding; x <= padding; x++) {
			for (var y = -padding; y <= padding; y++) {
				var gx = tx + x
				var gy = ty + y

				var tileCollider = this.grid.get(gx, gy)

				if (tileCollider) {
					var response = new SAT.Response()
					var collided = SAT.testCirclePolygon(circle, tileCollider, response)
					if (collided) {						
						collidedEver = true
						circle.pos.x -= response.overlapV.x
						circle.pos.y -= response.overlapV.y
						entity.x = circle.pos.x
						entity.y = circle.pos.y				
					}
				}
			}
		}
	}

	checkExits(entity) {
		var playerGridX = Math.floor(entity.x / this.tileWidth)
        var playerGridY = Math.floor(entity.y / this.tileHeight)

        for (var i = 0; i < this.exits.length; i++) {
        	var exit = this.exits[i]
        	if (playerGridX === exit.x && playerGridY === exit.y) {
        		return exit
        	}
        }

        return false
	}
}

module.exports = CollisionSystem