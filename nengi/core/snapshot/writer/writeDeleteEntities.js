var Chunk = require('../Chunk').Chunk
var BinaryType = require('../../binary/BinaryType')
var Binary = require('../../binary/Binary')
var writeDeleteId = require('../../protocol/write/writeDeleteId')
//var config = require('../../../config')

function writeDeleteEntities(bitStream, ids, config) {
    if (ids.length > 0) {
        bitStream[Binary[BinaryType.UInt8].write](Chunk.DeleteEntities)  
        bitStream[Binary[BinaryType.UInt16].write](ids.length)        
        ids.forEach(id => {
            writeDeleteId(bitStream, config.ID_BINARY_TYPE, id)
        })
    }
}

module.exports = writeDeleteEntities