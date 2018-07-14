var Grid = require('../common/Grid')

var middleware = function(resource, next) {
    if (!resource || !resource.data || !resource.data.tilesets || !resource.data.layers) {
        // this resource is not a tiled map json, skip it
        return next()
    }

    var loadOptions = {
        crossOrigin: resource.crossOrigin,
        loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
        parentResource: resource
    }

    // copy tile layers from Tiled json to Grid objects
    resource.tileLayers = {}
    resource.data.layers.forEach(layer => {
        var grid = new Grid(layer.width, layer.height)
        for (var i = 0; i < layer.data.length; i++) {
            grid.cells.push(layer.data[i])
        }
        resource.tileLayers[layer.name] = grid
    })

    // load tilesheet textures from Tiled
    resource.tileTextures = {}
    resource.data.tilesets.forEach(tileset => {
        this.add(tileset.image, loadOptions, function(subResource) {
            var baseTexture = PIXI.Texture.fromImage(subResource.name)
            var i = tileset.firstgid
            for (var y = tileset.margin; y < tileset.imageheight; y += tileset.tileheight + tileset.spacing) {
                for (var x = tileset.margin; x < tileset.imagewidth; x += tileset.tilewidth + tileset.spacing) {
                    var rect = new PIXI.Rectangle(x, y, tileset.tilewidth, tileset.tileheight)
                    resource.tileTextures[i] = new PIXI.Texture(baseTexture, rect)
                    i++
                }
            }
        })
    })

    next()
}

module.exports = middleware