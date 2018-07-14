var ProtocolMap = require('../protocol/ProtocolMap')
var readSnapshotBuffer = require('../snapshot/reader/readSnapshotBuffer')
var createCommandBuffer = require('../snapshot/writer/createCommandBuffer')
var createPongBuffer = require('../snapshot/writer/createPongBuffer')
var createHandshakeBuffer = require('../snapshot/writer/createHandshakeBuffer')
var EntityCache = require('../instance/EntityCache')
var Binary = require('../binary/Binary')
var getValue = require('../protocol/getValue')

var WorldState = require('./WorldState')

function Client(config) {
    this.config = config
    this.protocols = new ProtocolMap(config)

    this.tickLength = 1000/config.UPDATE_RATE

    this.entityCache = new EntityCache()

    this.websocket = null

    this.snapshots = []
    this.latest = null

    this.clientTick = 0

    this.updateTick = 0

    this.lastProcessedTick = -1
    //this.interpCache = {
        //
    //}

    this.onStringData = null

    this.sendQueue = {}
    this.lastSentTick = -1

    this.averagePing = 100
    this.pings = []

    this.serverTime = -1

    this.timeDifference = -1
    this.timeDifferences = []


    this.avgDiff = 0

    this.avgDiffs = []
    this.connectionCallback = null
    this.closeCallback = null
    this.transferCallback = null
}

Client.prototype.reset = function() {
    this.websocket.close()
    this.entityCache = new EntityCache()

    
    this.snapshots = []
    
    //this.latest = null
    this.clientTick = 0
    this.updateTick = 0
    this.lastProcessedTick = -1
    this.sendQueue = {}
    this.lastSentTick = -1
    this.averagePing = 100
    this.pings = []
    this.serverTime = -1
    this.timeDifference = -1
    this.timeDifferences = []
    this.avgDiff = 0
    this.avgDiffs = []
    
}

Client.prototype.onClose = function(cb) {
    this.closeCallback = cb
}

Client.prototype.onTransfer = function(cb) {

    this.transferCallback = (transferKey, address) => {
        var clientData = { transferKey: transferKey }
        cb(clientData)
        this.reset()
        this.connect(address, clientData)
    }
}

Client.prototype.onConnect = function(cb) {
    this.connectionCallback = cb
}


Client.prototype.update = function() {
    for (var i = this.lastSentTick; i < this.updateTick; i++) {
        this.sendCommands(i)
        //console.log('sending', i)
        this.lastSentTick = i
    }
    this.updateTick++
}



Client.prototype.addCommand = function(command) {
    var tick = this.updateTick
    if (typeof this.sendQueue[tick] === 'undefined') {
        this.sendQueue[tick] = []
    }
    command.type = this.protocols.getIndex(command.protocol)
    this.sendQueue[tick].push(command)
}


Client.prototype.sendCommands = function(tick) {
    if (this.websocket && this.websocket.readyState === 1) {
        var commands = this.sendQueue[tick]
        if (!commands) {
            commands = []
        }
        this.websocket.send(createCommandBuffer(tick, commands).byteArray)
        delete this.sendQueue[tick]
    }
}

Client.prototype.findInitialSnapshot = function(renderTime) {
    for (var i = this.snapshots.length-1; i >= 0; i--) {
        var snapshot = this.snapshots[i]
        if (snapshot.timestamp < renderTime) {
            //snapshotNewer = snapshot
            //snapshotNewerIndex = i
            return { snapshot: snapshot, index: i }
        }
    }
}



var lerp = function(a, b, portion) {
  return a + ((b - a) * portion)
}

//ar prev = Date.now()
var prev = 0
Client.prototype.interpolate = function(interpDelay) {

    //var now = Date.now()
    //var delta = now - prev
   // prev = now

    //this.serverTime += delta
    //console.log('snapshots.length', this.snapshots.length)

   var renderTime = Date.now() - interpDelay - this.avgDiff //this.averagePing + this.timeDifference
   //console.log('rt', renderTime)
   // console.log(renderTime- prev)
   //console.log('delta', renderTime - prev)
    prev = renderTime
    

    //renderTime = this.serverTime - 200
    //console.log(renderTime)


    if (this.snapshots.length > 0) {
        //console.log(this.snapshots[this.snapshots.length-1].tick)
    }
    
    var late = []
    var lateDebug = []

    var snapshotOlderIndex = null
    var snapshotNewer = null
    var snapshotOlder = null

     var initialSnapshotData = this.findInitialSnapshot(renderTime)

     if (initialSnapshotData) {
        snapshotOlder = initialSnapshotData.snapshot
        snapshotOlderIndex = initialSnapshotData.index
     }


    if (snapshotOlder) {


        var olderTick = snapshotOlder.tick
        for (var i = 0; i < this.snapshots.length; i++) {
            var tempSnapshot = this.snapshots[i]
            if (tempSnapshot.tick === olderTick + 1) {
                snapshotNewer = tempSnapshot
            }
        }
        //if (this.snapshots[snapshotOlderIndex+1]) {
        //    snapshotNewer = this.snapshots[snapshotOlderIndex+1]
        //}

        var iSnapshot = {
            createEntities: [],
            deleteEntities: [],
            updateEntities: [],
            localMessages: [],
            messages: [],
            jsons: [],
            tick: null
        }
        //console.log('old', snapshotOlder.tick, 'last', this.lastProcessedTick)
        if (snapshotOlder.tick - 1> this.lastProcessedTick) {
            //console.log(snapshotOlder.tick - this.lastProcessedTick, 'behind')
            for (var i = this.snapshots.length - 1; i > -1; i--) {
                var ss = this.snapshots[i]

                if (ss.tick < snapshotOlder.tick && !ss.processed) {
                    late.push(ss)
                    lateDebug.push(ss.tick)
                    ss.processed = true
                    this.snapshots.splice(i, 1)
                }
            }
        }
        late.reverse()

        if (!snapshotOlder.processed) {
            iSnapshot.timestamp = snapshotOlder.timestamp
            iSnapshot.createEntities = iSnapshot.createEntities.concat(snapshotOlder.createEntities)
            iSnapshot.deleteEntities = iSnapshot.deleteEntities.concat(snapshotOlder.deleteEntities)
            iSnapshot.localMessages = iSnapshot.localMessages.concat(snapshotOlder.localMessages)
            iSnapshot.messages = iSnapshot.messages.concat(snapshotOlder.messages)
            iSnapshot.jsons = iSnapshot.jsons.concat(snapshotOlder.jsons)
            snapshotOlder.processed = true
            iSnapshot.tick = snapshotOlder.tick
            this.lastProcessedTick = snapshotOlder.tick
        }

    }


    if (snapshotNewer && snapshotOlder) {

        //console.log('ss', snapshotNewer.tick, snapshotOlder.tick)    
        //console.log('late', late.length)
        if (snapshotOlder.tick >= this.lastProcessedTick) {

           // var total = snapshotNewer.timestamp - snapshotOlder.timestamp
            var total = snapshotOlder.timestamp + this.tickLength - snapshotOlder.timestamp
            var portion = renderTime - snapshotOlder.timestamp        
            var ratio = portion / total

            var _d = snapshotNewer.timestamp - snapshotOlder.timestamp
            if (_d >= 110) {
                //console.log('STUTTER?', _d)
            }
            //console.log(snapshotNewer.timestamp - snapshotOlder.timestamp)
            iSnapshot.timestamp = lerp(snapshotOlder.timestamp, snapshotNewer.timestamp, ratio)

            //console.log('snapshots', snapshotNewer.tick, snapshotOlder.tick)
            for (var i = 0; i < snapshotNewer.updateEntities.length; i++) {
                var update = snapshotNewer.updateEntities[i]
                var entityOlder = snapshotOlder.entities.get(update.id)
                var prop = update.prop
                try {
                    var propData = entityOlder.protocol.properties[prop]
                } catch (e) {
                    console.log(snapshotNewer, snapshotOlder, entityOlder)
                    throw new Error('stop')
                }
                var binaryType = Binary[propData.type]
                //console.log(prop, '::', entityOlder.protocol.properties[prop])

                if (propData.interp) {
                    var entityNewer = snapshotNewer.entities.get(update.id)
                    var valueOlder = getValue(entityOlder, propData.path) //entityOlder[prop]
                    var valueNewer = getValue(entityNewer, propData.path) //entityNewer[prop]

                    var valueInterp = valueOlder

                    if (typeof binaryType.interp === 'function') {
                        valueInterp = binaryType.interp(valueOlder, valueNewer, ratio)
                    } else {
                        valueInterp = lerp(valueOlder, valueNewer, ratio)
                    }            

                    //temp
                    //valueInterp = valueNewer


                    iSnapshot.updateEntities.push({
                        id: entityOlder.id,
                        prop: prop,
                        path: propData.path,
                        value: valueInterp
                    })

                } else {
                    iSnapshot.updateEntities.push(update)
                }
            }
        } else {
            //console.log('FUTURE MAGICKS OH NO, AVOIDED THO YEAAA')
        }
    } else {
        // extrapolate?
        //console.log('extrap')
        //console.log('extrapolate', snapshotOlder != null, snapshotNewer != null)

        var snapshotOlderOlder = null
        if (snapshotOlder && true) {

            var olderTick = snapshotOlder.tick
            for (var i = 0; i < this.snapshots.length; i++) {
                var tempSnapshot = this.snapshots[i]
                if (tempSnapshot.tick === olderTick - 1) {
                    snapshotOlderOlder = tempSnapshot
                }
            }
            //if (this.snapshots[snapshotOlderIndex+1]) {
            //    snapshotNewer = this.snapshots[snapshotOlderIndex+1]
            //}

            //var temptemp = snapshotOlder

            //snapshotOlder = snapshotOlderOlder
            //snapshotNewer = snapshotOlder

            if (snapshotOlder && snapshotOlderOlder) {

                var diff = renderTime - snapshotOlder.timestamp
                if (diff > 200) {
                   diff = 200
                    //console.log('over 200')
                }
                //console.log('extrapolate', diff)

                var entities = snapshotOlderOlder.entities.toArray()

                for (var i = 0; i < entities.length; i++) {
                    var entityA = entities[i]
                    var entityB = snapshotOlder.entities.get(entityA.id)

                    if (entityA && entityB) {
                        //console.log('ya')
                        var xDiff = entityB.x - entityA.x
                        var yDiff = entityB.y - entityA.y

                        var xPropData = entityA.protocol.properties['x']
                        var yPropData = entityA.protocol.properties['y']

                        //console.log(xDiff, yDiff)

                        var xExtrapolated = entityB.x + (xDiff * (diff/this.tickLength))
                        var yExtrapolated = entityB.y + (yDiff * (diff/this.tickLength))

                        iSnapshot.updateEntities.push({
                            id: entityB.id,
                            prop: 'x',
                            path: xPropData.path,
                            value: xExtrapolated
                        })

                        iSnapshot.updateEntities.push({
                            id: entityB.id,
                            prop: 'y',
                            path: yPropData.path,
                            value: yExtrapolated
                        })
                    }
                }

                /*
               // var total = snapshotNewer.timestamp - snapshotOlder.timestamp
                var total = snapshotOlder.timestamp + this.tickLength - snapshotOlder.timestamp
                var portion = renderTime - snapshotOlder.timestamp        
                var ratio = portion / total

                iSnapshot.timestamp = lerp(snapshotOlder.timestamp, snapshotNewer.timestamp, ratio)

                //console.log('snapshots', snapshotNewer.tick, snapshotOlder.tick)
                for (var i = 0; i < snapshotNewer.updateEntities.length; i++) {
                    var update = snapshotNewer.updateEntities[i]
                    var entityOlder = snapshotOlder.entities.get(update.id)
                    var prop = update.prop
                    try {
                        var propData = entityOlder.protocol.properties[prop]
                    } catch (e) {
                        console.log(snapshotNewer, snapshotOlder, entityOlder)
                        throw new Error('stop')
                    }
                    var binaryType = Binary[propData.type]
                    //console.log(prop, '::', entityOlder.protocol.properties[prop])

                    if (propData.interp) {
                        var entityNewer = snapshotNewer.entities.get(update.id)
                        var valueOlder = getValue(entityOlder, propData.path) //entityOlder[prop]
                        var valueNewer = getValue(entityNewer, propData.path) //entityNewer[prop]

                        var valueInterp = valueOlder

                        if (typeof binaryType.interp === 'function') {
                            valueInterp = binaryType.interp(valueOlder, valueNewer, ratio)
                        } else {
                            valueInterp = lerp(valueOlder, valueNewer, ratio)
                        }            

                        iSnapshot.updateEntities.push({
                            id: entityOlder.id,
                            prop: prop,
                            path: propData.path,
                            value: valueInterp
                        })

                    } else {
                        iSnapshot.updateEntities.push(update)
                    }
                }
                */
            }
        }
    }

    if (lateDebug.length > 0) {
        //console.log('late', late.length, lateDebug)
    }
   
    //this.interpCache.saveSnapshot(iSnapshot)
    
    return {
        late: late,
        interpolated: iSnapshot,
        older: snapshotOlder,
        newer: snapshotNewer,
        latest: this.latest
    }

    //console.log('AAA', snapshotNewer, 'BBB', snapshotOlder)
}

Client.prototype.readNetwork = function() {
    return {
        latest: this.latest
    }
}

Client.prototype.getSnapshots = function() {
    return this.snapshots
}

var foob = true

Client.prototype.connect = function(address, handshake) {
    this.websocket = new WebSocket(address, 'nengi-protocol')
    this.websocket.binaryType = 'arraybuffer'

    if (typeof handshake === 'undefined' || !handshake) {
        handshake = {}
    }

    this.websocket.onopen = event => {
        this.websocket.send(createHandshakeBuffer(handshake).byteArray)
        //this.connectCallback = connectCallback
        //if (this.connectCallback) {
        //    this.connectCallback()
        //}
    }

    this.websocket.onerror = err => {
        //if (this.on)
        console.log('WebSocket error', err)
    }

    this.websocket.onclose = () => {
        if (this.closeCallback) {
            this.closeCallback()
        }
        //throw new Error('stopping game loop, connection to server closed')
    }

    this.websocket.onmessage = message => {
        if (message.data instanceof ArrayBuffer) {
            
            var snapshot = readSnapshotBuffer(
                message.data,
                this.protocols, 
                this.entityCache,
                this.config,
                this.connectionCallback,
                this.transferCallback
            )
            // some messages aren't snapshots (connection & transfer)
            if (!snapshot) {
                return
            }

            if (snapshot.pingKey !== -1) {
                //console.log('pingKEY')
                var pongBuffer = createPongBuffer(snapshot.pingKey)
                //console.log(pongBuffer.byteArray)
                this.websocket.send(pongBuffer.byteArray)
            }
            if (snapshot.avgLatency !== -1) {
                //console.log('avg latency', snapshot.avgLatency)
                this.averagePing = snapshot.avgLatency
            }
            

            var worldState = new WorldState(this.clientTick, this.tickLength, snapshot, this.latest)

            this.avgDiffs.push(Date.now() - worldState.timestamp)

            var total = 0
            for (var i = 0; i < this.avgDiffs.length; i++) {
                total += this.avgDiffs[i]
            }
            this.avgDiff = total / this.avgDiffs.length

            //var p = this.serverTime
            this.serverTime = worldState.timestamp + this.averagePing

            if (foob && this.timeDifferences.length < 200) {
                //console.log('ping', this.averagePing, Date.now() - worldState.timestamp, Date.now() - worldState.timestamp - 
                //(0.5 * this.averagePing))

                this.timeDifferences.push(Date.now() - worldState.timestamp - (0.5 * this.averagePing))

                var total = 0
                for (var i = 0; i < this.timeDifferences.length; i++) {
                    total += this.timeDifferences[i]
                }
                this.timeDifference = total / this.timeDifferences.length
                
            } else {
                foob = false
                while (this.timeDifferences.length > 150) {
                    this.timeDifferences.shift()
                }

                var total = 0
                for (var i = 0; i < this.timeDifferences.length; i++) {
                    total += this.timeDifferences[i]
                }
                this.timeDifference = total / this.timeDifferences.length

            }

            
            //console.log('diff', this.timeDifference)

            //console.log(this.serverTime - p)
            //console.log('estimated serverTime', this.serverTime)
            //console.log('ws', worldState)
            //console.log(worldState.ping)
            /*
            if (worldState.ping > -1) {
                this.pings.push(worldState.ping)
                var totalPing = 0
                for (var i = 0; i < this.pings.length; i++) {
                    totalPing += this.pings[i]
                }
                this.averagePing = totalPing / this.pings.length

                if (this.pings.length > 5) {
                    this.pings.shift()
                }
                //console.log(worldState.ping, 'avg', this.averagePing)
            }
            */
            this.latest = worldState
            this.snapshots.push(worldState)
            this.clientTick++

            if (this.snapshots[this.snapshots.length-20]) {
                if (this.snapshots[this.snapshots.length-20].processed) {
                    this.snapshots.splice(this.snapshots.length-20, 1)
                }
            }

        } else if (typeof message.data === 'string') {
            //console.log('received string from server, ignoring', message.data)
            if (typeof this.onStringData === 'function') {
                this.onStringData(message.data)
            }
        } else {
            console.log('unknown websocket data type')
        }
    }
}

module.exports = Client