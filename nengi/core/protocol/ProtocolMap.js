var Protocol = require('./Protocol')
var EntityProtocol = require('./EntityProtocol')
var MessageProtocol = require('./MessageProtocol')
var LocalEventProtocol = require('./LocalEventProtocol')
var CommandProtocol = require('./CommandProtocol')

function ProtocolMap(config) {
    this.lookupByIndex = new Map()
    this.lookupByProtocol = new Map()
    this.protocolIndex = 0
    
    this.processProtocols(config, 'basics', Protocol)
    this.processProtocols(config, 'entities', EntityProtocol)
    this.processProtocols(config, 'messages', MessageProtocol)
    this.processProtocols(config, 'localMessages', LocalEventProtocol)
    this.processProtocols(config, 'commands', CommandProtocol)
}

ProtocolMap.prototype.processProtocols = function(config, configSection, protocolConstructor) {
    for (var i = 0; i < config.protocols[configSection].length; i++) {
        var name = config.protocols[configSection][i][0]
        var ctor = config.protocols[configSection][i][1]
        var protocolConfig = ctor.protocol
        var protocol = new protocolConstructor(protocolConfig, config)
        this.lookupByIndex.set(this.protocolIndex, protocol)
        this.lookupByProtocol.set(protocol, this.protocolIndex)

        // mutates prototype
        ctor.prototype.protocol = protocol
        // mutates protocol, adding a name
        protocol.name = name
        this.protocolIndex++

        //console.log(protocol)
    }
}

ProtocolMap.prototype.getProtocol = function(index) {
    return this.lookupByIndex.get(index)
}

ProtocolMap.prototype.getIndex = function(protocol) {
    return this.lookupByProtocol.get(protocol)
}

module.exports = ProtocolMap