//var Grid = require('./Grid')
var EDictionary = require('../../external/EDictionary')
var SpatialStructure = require('./BasicSpace')

function Historian() {
    this.history = {}
    this.tick = -1
}

Historian.prototype.getSnapshot = function(tick) {
    if (this.history[tick]) {
        return this.history[tick]
    } else {
        throw new Error('historian had no snapshot for tick ' + tick)
    }
}

Historian.prototype.record = function(tick, entities, events, boundary) {
    //console.log('recording...', entities)
    var spatialStructure = SpatialStructure.create() 

    for (var i = 0; i < entities.length; i++) {
        var entity = entities[i]
        spatialStructure.insertEntity({
            id: entity.id,
            x: entity.x,
            y: entity.y,
            ref: entity
        })
    }

    for (var i = 0; i < events.length; i++) {
        var event = events[i]
        spatialStructure.insertEvent(event)
    }

    this.history[tick] = spatialStructure

    if (tick > this.tick) {
        this.tick = tick
    }

    if (this.history[tick-20]) {
        this.history[tick-20].release()
        delete this.history[tick-20]
    }
}

Historian.prototype.getCurrentState = function() {
    return this.getSnapshot(this.tick)
}

Historian.prototype.getRecentEvents = function() {
    var spatialStructure = this.getSnapshot(this.tick)
}

Historian.prototype.getRecentSnapshot = function() {
    return this.getSnapshot(this.tick)
}

module.exports = Historian