var nengi = require('../nengi')

var config = {
    UPDATE_RATE: 20, // UPDATE_RATE of server logic, used by interp calculations
    DRAW_RATE: 60, // DRAW_RATE is not currently used
    ID_BINARY_TYPE: nengi.UInt16,
    TYPE_BINARY_TYPE: nengi.UInt8,
    ID_PROPERTY_NAME: 'id',
    TYPE_PROPERTY_NAME: 'type',

    protocols: {   
        entities: [
            ['ExampleEntity', require('../server/entity/ExampleEntity')]
        ],

        localMessages: [],

        messages: [
            ['Identity', require('../server/message/Identity')],
            ['MapName', require('../server/message/MapName')]
        ],

        commands: [
            ['PlayerInput', require('../client/command/PlayerInput')]
        ],

        basics: []
    }
}

module.exports = config