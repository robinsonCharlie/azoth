var nengi = require('../../nengi')

class Identity {
    constructor(entityId) {
        this.entityId = entityId
    }
}

Identity.protocol = {
    entityId: nengi.UInt16
}

module.exports = Identity