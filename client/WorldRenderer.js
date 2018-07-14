// creates a unique key for combinations of x and y, used by the cache
function createkey(x, y) {
    return x + y * 10000000
}

class WorldRenderer {
	constructor(background, middleground, foreground, tileLayers, tileTextures, initialScale) {
		this.cache = new Map()

		this.background = background
		this.middleground = middleground
		this.foreground = foreground
		this.tileLayers = tileLayers
		this.tileTextures = tileTextures

		this.maxWidth = this.tileLayers['Background0'].width
		this.maxHeight = this.tileLayers['Background0'].height

		this.tileWidth = 16
		this.tileHeight = 16

		this.viewWidth = 12
		this.viewHeight = 8

		this.prev = {
			x: 0,
			y: 0
		}
		
		this.resize(initialScale)
	}

	resize(scale) {
		// show enough tiles to slightly overfill the screen
        this.viewWidth = Math.ceil((window.innerWidth / this.tileWidth * (1/scale))) + 1
        this.viewHeight = Math.ceil((window.innerHeight / this.tileHeight * (1/scale))) + 1
        //console.log('view', this.viewWidth, this.viewHeight)
        // do a "force" cull
        this.cull(this.prev.x * this.tileWidth, this.prev.y * this.tileHeight, true)
	}

	addTile(x, y) {
		var tilekey = createkey(x, y)

		if (this.cache.get(tilekey)) {
			// this tile already endXists in the renderer
			return
		}

		var bg0 = this.tileLayers['Background0'].get(x, y)
		var bg1 = this.tileLayers['Background1'].get(x, y)
		var bg2 = this.tileLayers['Background2'].get(x, y)
		var mg = this.tileLayers['Middleground'].get(x, y)		
		var fg = this.tileLayers['Foreground'].get(x, y)

		var cache = {
			key: tilekey,
			x: x,
			y: y,
			bg0: null,
			bg1: null,
			bg2: null,
			mg: null,
			fg: null
		}

		// background layers
		if (bg0 !== 0) {
			var tile = new PIXI.Sprite(this.tileTextures[bg0])
			tile.x = x * this.tileWidth
			tile.y = y * this.tileHeight
			this.background.addChild(tile)
			cache.bg0 = tile
		}

		if (bg1 !== 0) {
			var tile = new PIXI.Sprite(this.tileTextures[bg1])
			tile.x = x * this.tileWidth
			tile.y = y * this.tileHeight
			this.background.addChild(tile)
			cache.bg1 = tile
		}

		if (bg2 !== 0) {
			var tile = new PIXI.Sprite(this.tileTextures[bg2])
			tile.x = x * this.tileWidth
			tile.y = y * this.tileHeight
			this.background.addChild(tile)
			cache.bg2 = tile
		}

		if (mg !== 0) {
			var tile = new PIXI.Sprite(this.tileTextures[mg])
			tile.x = x * this.tileWidth
			tile.y = y * this.tileHeight
			this.middleground.addChild(tile)
			cache.mg = tile
		}

		if (fg !== 0) {
			var tile = new PIXI.Sprite(this.tileTextures[fg])
			tile.x = x * this.tileWidth
			tile.y = y * this.tileHeight
			this.foreground.addChild(tile)
			cache.fg = tile
		}

		//this.tileCache[tilekey] = cache
		this.cache.set(tilekey, cache)
	}

	removeTile(x, y) {
		var tilekey = createkey(x, y)
		var cache = this.cache.get(tilekey)
		if (cache) {
			if (cache.bg0) {
				this.background.removeChild(cache.bg0)
			}
			if (cache.bg1) {
				this.background.removeChild(cache.bg1)
			}
			if (cache.bg2) {
				this.background.removeChild(cache.bg2)
			}
			if (cache.mg) {
				this.middleground.removeChild(cache.mg)
			}
			if (cache.fg) {
				this.foreground.removeChild(cache.fg)
			}
		}
		this.cache.delete(tilekey)
	}


	// only shows tiles near the player, this is what allows for giant maps to be used
	cull(x, y, force) {
		// convert game coordinates to tile coordinates
		var tx = Math.floor(x / this.tileWidth)
		var ty = Math.floor(y / this.tileHeight)

		// check if we've moved at least one tile
		if (tx === this.prev.x && ty === this.prev.y && !force) {			
			return
		}

		// calculate start and end coordinates of the visible area
		var startX = tx - this.viewWidth
		var startY = ty - this.viewHeight
		var endX = tx + this.viewWidth
		var endY = ty + this.viewHeight

		// limit bounds to within the map
        if (startX < 0) {
            startX = 0
        }
        
        if (ty < 0) {
            ty = 0
        }
        
        if (endX > this.maxWidth) {
            endX = this.maxWidth
        }
        
        if (endY > this.maxHeight) {
            endY = this.maxHeight
        }

        // add tiles within the visible area
        for (var y = startY; y < endY; y++) {
            for (var x = startX; x < endX; x++) {    
				this.addTile(x, y)
            }
        }

        // remove tiles that are now outside of the visible area
        this.cache.forEach(tileCacheRecord => {
        	if (tileCacheRecord.x > endX || tileCacheRecord.x < startX 
        		|| tileCacheRecord.y > endY || tileCacheRecord.y < startY) {
        		this.removeTile(tileCacheRecord.x, tileCacheRecord.y)
        	}
        })

        // record position (for performance reasons)
        this.prev.x = tx
        this.prev.y = ty
	}
}

module.exports = WorldRenderer