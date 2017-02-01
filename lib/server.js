var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');

module.exports = function (port) {

    // Serve up public/ftp folder
    var serve = serveStatic(process.cwd(), { 'index': ['index.html', 'index.htm'] })

    // Create server
    var server = http.createServer(function onRequest(req, res) {
        serve(req, res, finalhandler(req, res))
    })

    // Listen
    port = port || 3000
    server.listen(port);
    console.log(`Server listening on port: ${port}`);
}