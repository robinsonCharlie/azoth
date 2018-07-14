
// pixi syntax for adding a new resource and loading it
// in this demo this is used to load maps after changing instances
function loadAsset(filepath, callback) {
	PIXI.loader.reset()
    PIXI.loader.add(filepath)
    PIXI.loader.load(function(loader, resources) {
    	callback(resources[filepath])
    })
}

module.exports = loadAsset