var nengi = require('../../nengi')

class MapName {
    constructor(name) {
        this.name = name
    }
}

MapName.protocol = {
    name: nengi.UTF8String
}

module.exports = MapName