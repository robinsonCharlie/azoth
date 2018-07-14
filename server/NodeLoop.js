
/**
* Runs a specified main function @ specified fps
*/
var NodeLoop = {}


/*
* Provides a high resolution time (nanonseconds) converted to milliseconds.
* Unlike Date.now(), NodeLoop.time is not relative to any real point in time.
*/
var hrtimeMs = function() {
    var time = process.hrtime()
    return time[0] * 1000 + time[1] / 1000000
}

NodeLoop.previousTick = hrtimeMs()
NodeLoop.tickLengthMs = null
NodeLoop.tick = 0
NodeLoop.main = null

NodeLoop.setFPS = function(fps) {
    NodeLoop.tickLengthMs = 1000 / fps
}

NodeLoop.setMain = function(main) {
    NodeLoop.main = main
}

NodeLoop.begin = function() {
    if (!NodeLoop.main)
        throw new Error('ERROR: NodeLoop requires a main() function, use NodeLoop.setMain(fn)')
    if (!NodeLoop.tickLengthMs)
        throw new Error('ERROR: NodeLoop requires an fps, use NodeLoop.setFPS(num)')

    NodeLoop.loop()
}

NodeLoop.loop = function() {
    var now = hrtimeMs()
    if (NodeLoop.previousTick + NodeLoop.tickLengthMs <= now) {
        var delta = (now - NodeLoop.previousTick) / 1000
        NodeLoop.previousTick = now
        NodeLoop.tick++

        //var start = hrtimeMs() // uncomment to benchmark main
        NodeLoop.main(delta, NodeLoop.tick, Date.now())
        //var stop = hrtimeMs()
        //console.log('update took', stop-start, 'ms')
    }

    if (delta * 1000 > NodeLoop.tickLengthMs + 1) {
        // technically, we're always lagging by a few nanoseconds only report 
        // lag of 1 ms or more
        // disable this in production unless you want a log full of entries like
        // "lagged by 1.8291680216789246 ms"
        
        //console.log('lagged by', (delta * 1000) - (NodeLoop.tickLengthMs), 'ms')
    }

    // schedules the next iteration of the loop on the node.js event loop using
    // a hyrbid of setTimeout & setImmediate calls. Low CPU use while idle.
    if (hrtimeMs() - NodeLoop.previousTick < NodeLoop.tickLengthMs - 16) {
        // schedule 16+ milliseconds in the future
        // NOTE: we cannot just set a timeout for the perfect amount of time
        // because setTimeout is innacurate by up to 16 ms, so instead we use
        // setTimeout when we have more than 16 ms remaining until the next loop
        // The resolution of node timer is subject to changes per version and 
        // per operating system. Node v0.12.0+ may be able to get away with 1 ms
        setTimeout(NodeLoop.loop)
        // P.S. using setTimeout only will make iterations up to 16 ms late
    } else {
        // schedule for next node cycle (nanoseconds from now, pending cpu use)
        // NOTE: unless we're already late, NodeLoop.loop will likely cycle many 
        // times for ~16 milliseconds until it is time to run main() again
        setImmediate(NodeLoop.loop)
        //setImmediate(NodeLoop.loop)
        // P.S. using setImmediate only will keep CPU @ 100% regardless of
        // whether node had much to do
    }
}

module.exports = NodeLoop