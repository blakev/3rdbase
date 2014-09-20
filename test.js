var config = require('./config.json');

var homerun = require('./src/homerun.js'),
    api = new homerun.api(config.hdHomeRun);

// api.system.status(console.log)

api.tuners.onChannel(console.log);
api.tuners.status(0, console.log);