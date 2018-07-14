var Grid = require('../common/Grid')

// hardcoded to read the 'Collisions' layer out of a map and produce a grid of true/false
// where true means there is a wall and false means there is empty space
function convertMap(tiledMap) {
	var collisionLayer = tiledMap.layers.find(layer => { 
		return layer.name === 'Collisions'
	})
	
	var collisionGrid = new Grid(collisionLayer.width, collisionLayer.height)

	for (var i = 0; i < collisionLayer.data.length; i++) {
		// presuming that any tile value other than 0 means blocked
		collisionGrid.cells[i] = (collisionLayer.data[i]) ? true : false
	}

	return collisionGrid
}

module.exports = convertMap