var nengi = require('../nengi')
var nengiConfig = require('../common/nengiConfig')
var ProtocolMap = require('../nengi/core/protocol/ProtocolMap')
var PlayerInput = require('../client/command/PlayerInput')
var protocolMap = new ProtocolMap(nengiConfig)

var address = 'ws://localhost:8001'
var numberOfBots = 30

var bots = new Map()

function connectNewBot(id) {
    let bot = new nengi.Bot(nengiConfig, protocolMap)
    bot.id = id

    bot.onConnect(response => {
        console.log('Bot attempted connection, response:', response)
        bot.tick = 0  
    })

    bot.onTransfer(clientData => {})

    bot.onClose(() => {
        bots.delete(bot.id)
    })

    bots.set(bot.id, bot)

    bot.connect(address, { text: 'hello i am bot#' + bot.id })
}


for (let i = 0; i < numberOfBots; i++) {
    connectNewBot(i)
}

function randomBool() {
    return Math.random() > 0.5
}

var loop = function() {

    bots.forEach(bot => {
       if (bot.connection) {

            var input = new PlayerInput(
                randomBool(), 
                randomBool(), 
                randomBool(), 
                randomBool(), 
                0, 
                0, 
                false
            )

            bot.addCommand(input)
            bot.update()
            bot.tick++
        }
    })
}

setInterval(loop, 16)
