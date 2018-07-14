var EDictionary = require('../../external/EDictionary')
var copyProxy = require('../protocol/copyProxy')
var getValue = require('../protocol/getValue')
var setValue = require('../protocol/setValue')

function WorldState(tick, timeBetweenSnapshots, snapshot, previousWorldState) {
    this.timeBetweenSnapshots = timeBetweenSnapshots
    this.tick = tick
    this.raw = snapshot
    this.processed = false
   
    this.timestamp = snapshot.timestamp
    // entity state
    this.entities = new EDictionary()

    this.createEntities = []
    this.updateEntities = []
    this.deleteEntities = []

    // (ids) created this snapshot
    this.createdEntityIds = []
    // (ids) deleted this snapshot
    this.deletedEntityIds = []
    // (ids) updates this snapshot
    this.updatedEntityIds = []

    // localMessage state
    this.localMessages = []
    // message state
    this.messages = []
    // jsons
    this.jsons = []

    this.ping = -1
    //this.temporalOffset = -1

    this.init(snapshot, previousWorldState)
}

WorldState.prototype.init = function(snapshot, previousWorldState) {

    if (previousWorldState) {
        // this.timestamp = previousWorldState.timestamp + 100
        if (this.timestamp === -1) {
            //console.log('missing timestamp')
            this.timestamp = previousWorldState.timestamp + this.timeBetweenSnapshots
        } else {
            //console.log('TIMESYNC!')
            //console.log('ping', Date.now() - this.timestamp)
            //var ping = Date.now() - this.timestamp
            //if (ping > -1) {
             //   this.ping = ping
            //}
        }
        //this.temporalOffset = Date.now() - this.timestamp
        //console.log('this.temporalOffset', this.temporalOffset)

        previousWorldState.entities.forEach(entity => {
            var clone = copyProxy(entity, entity.protocol)
            clone.protocol = entity.protocol
            this.entities.add(clone)
        })
    }

    snapshot.createEntities.forEach(entity => {
        this.createdEntityIds.push(entity.id)
        var clone = copyProxy(entity, entity.protocol)
        clone.protocol = entity.protocol
        this.entities.add(clone)
        this.createEntities.push(clone)
    })

    snapshot.localMessages.forEach(localMessage => {
        var clone = copyProxy(localMessage, localMessage.protocol)
        clone.protocol = localMessage.protocol
        this.localMessages.push(clone)
    })

    snapshot.messages.forEach(message => {
        var clone = copyProxy(message, message.protocol)
        clone.protocol = message.protocol
        this.messages.push(clone)
    })

    snapshot.jsons.forEach(json => {
        this.jsons.push(JSON.parse(json))
    })

    snapshot.updateEntities.partial.forEach(singleProp => {
        this.updatedEntityIds.push(singleProp.id)

        var entity = this.entities.get(singleProp.id)
        //entity[singleProp.prop] = singleProp.value
        setValue(entity, singleProp.path, singleProp.value)

        this.updateEntities.push({ 
            id: singleProp.id, 
            prop: singleProp.prop,
            path: singleProp.path,
            value: singleProp.value
        })
    })

    snapshot.updateEntities.optimized.forEach(batch => {
        this.updatedEntityIds.push(batch.id)

        var entity = this.entities.get(batch.id)
        batch.updates.forEach(update => {
            if (update.isDelta) {
                var value = getValue(entity, update.path)
                setValue(entity, update.path, value + update.value)
                //entity[update.prop] += update.value
            } else {
                setValue(entity, update.path, update.value)
                //entity[update.prop] = update.value
            }

            this.updateEntities.push({ 
                id: batch.id, 
                prop: update.prop,
                path: update.path,
                value: entity[update.prop]
            })           
        })
    })

    snapshot.deleteEntities.forEach(id => {
        this.deletedEntityIds.push(id)
        this.deleteEntities.push(id)
        this.entities.removeById(id)
    })
}

module.exports = WorldState