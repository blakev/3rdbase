var config = {
    viewsDir: 'views',
    staticsDir: 'static'
}

var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn;

var express = require('express');
var app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

var _ = require('underscore'),
    request = require('request'),
    async = require('async');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, config.viewsDir))
app.use('/static', express.static(path.join(__dirname, config.staticsDir)));

config = _.extend(config, require('../config.json'));

_.each(_.keys(config.bin), function(entry) {
    config.bin[entry] = path.join(process.cwd(), 'bin', entry);
})


io.on('connection', function(socket) {
    console.log('connection');

    sendFrames(socket)

    socket.on('disconnect', function() {
        console.log('disconnection');
    })
});


app.get('/', function(req, res) {
    res.render('client.html', {});
})

app.get('/tv', function(req, res) {
    res.writeHead(200,
    {
        "Transfer-Encoding": "binary",
        "Connection": "keep-alive",
        "Content-Type": "video/webm",
        "Accept-Ranges": "bytes"
    });

    var live = spawn(config.bin.ffmpeg,
        [
            '-i', 'http://192.168.200.121:5004/auto/v725',
            '-async', '1',              // syncs audio
            '-c:v', 'libvpx',           // web-m
            '-bufsize', '2000k',        // max bitrate over standard for buffer
            '-threads', '2',
            '-quality', 'realtime',     // best > good > realtime
            '-skip_threshold', '75',    // nn% buffer-full before dropping frames
            '-speed', '0',              // 0-5, quality high-low
            '-qmin', '1',               // 0-4, higher quality lower
            '-qmax', '55',              // 0-63
            '-vf', 'scale=-1:720',      // sample to 720p
            '-force_key_frames', '45',  // force a keyframe every N frames
            '-b:v', '750k',             // average bitrate target
            '-maxrate', '4M',           // max bitrate
            '-c:a', 'libvorbis',        // vorbis MP3
            '-b:a', '160k',             // audio bitrate
            '-f', 'webm',               // output format
            'pipe:1'                    // ...to stdout
        ], {
            detached: false,
            stdio: 'pipe'
        });


    live.stdout.pipe(res);

    live.stdout.on('data', function(data){});

    live.stderr.on('data', function(data) {
        console.log('tv err -> ' + data);
    })

    live.on('error', function(e) {
        console.log('tv.live FFMPEG error: ' + e);
    })

    live.on('exit', function(code) {
        console.log('tv.live FFMPEG terminated with code: ' + code);
    })

    live.on('end', function(e) {
        console.log('tv.live FFMPEG system error: ' + e);
    })

    req.on('close', function() {
        stopStream('closed');
    })

    req.on('end', function() {
        stopStream('ended');
    })

    function stopStream(event) {
        console.log('tv.live streaming has ' + event);
        live.kill();
    }
})

server.listen(8888);

// .pipe(fs.createWriteStream('test.avi'));