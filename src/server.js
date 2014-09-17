var config = {
    viewsDir: 'views',
    staticsDir: 'static'
}

var fs = require('fs'),
    path = require('path');

var express = require('express');
var app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

var request = require('request'),
    async = require('async');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, config.viewsDir))
app.use('/static', express.static(path.join(__dirname, config.staticsDir)));


io.on('connection', function(socket) {
    console.log('connection');

    sendFrames(socket)

    socket.on('disconnect', function() {
        console.log('disconnection');
    })
});


// function sendFrames(socket) {
//     var reader = request.get('http://192.168.200.121:5004/auto/v725');

//     var bufferList = [],
//         totalBufferSize = 0;

//     reader.on('data', function(chunk) {
//         var chunk = chunk.toString();

//         var tBuffer = new Buffer(chunk, 'utf-8');

//         totalBufferSize = totalBufferSize + tBuffer.length;
//         bufferList.push(tBuffer);

//         if (totalBufferSize >= 128 * 1024) {
//             var frameBuffer = Buffer.concat(bufferList, totalBufferSize);

//             socket.emit('video frames', frameBuffer.toString());

//             totalBufferSize = 0;
//             bufferList = [];

//             reader.pause();

//             setTimeout(function() {
//                 reader.resume()
//             }, 1 * 1000);
//         }
//     })
// }

app.get('/', function(req, res) {
    res.render('client.html', {});
})

app.get('/tv', function(req, res) {
    req.pipe(request.get('http://192.168.200.121:5004/auto/v725')).pipe(res);
})

server.listen(8888);

// .pipe(fs.createWriteStream('test.avi'));