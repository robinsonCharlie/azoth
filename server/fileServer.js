var http = require('http')
var static = require('node-static')
var fileServer = new static.Server('./public')

console.log('Starting fileServer...')
var http = require('http').createServer(function(request, response) {
    request.addListener('end', function() {
        fileServer.serve(request, response, function(err, result) {
            if (err) { 
                console.error("Error serving " + request.url + " - " + err.message)
                response.writeHead(err.status, err.headers)
                response.end()
            }
        })
    }).resume()
}).listen(process.env.PORT, process.env.IP)
//}).listen(7999)