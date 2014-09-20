var url = require('url');

var u = require('./utils.js');

var request = require('request'),
    async = require('async'),
    cheerio = require('cheerio'),
    _ = require('underscore');


function get(root, page, callback) {
    request.get(url.resolve(root, page), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            callback(error, null);
        }
    });
}

var api = function(config) {
    this.config = config;

    this.get = _.partial(get, this.config.protocol + '://' + this.config.ip);

    this.system = apiSystem(this);
    this.tuners = apiTuners(this);
};

api.prototype.info = function() {
    return this.config;
};

function apiTuners(self) {
    var pages = self.config.pages.tuners;

    return {
        count: pages.count,
        
        onChannel: function(callback) {
            async.map(_.range(this.count), this.status, function(err, results) {
                var properties = {};
                
                _.each(results, function(t) {
                    if (!_.isNull(t.virtualChannel)) {
                        var v = t.virtualChannel.split(' ');

                        properties[t.tunerId] = {
                            channel: _.first(v),
                            name: _.rest(v).join(' ')
                        }
                    } else {
                        properties[t.tunerId] = null;
                    }
                })

                callback(err, properties);
            })
        },

        status: function(tunerId, callback) {
            tunerId = parseInt(tunerId);

            if (_.isNaN(tunerId) || tunerId < 0 || tunerId > pages.count) {
                callback('invalid tuner id "' + tunerId + '"', null);
            }

            self.get(pages.status + tunerId.toString(), function(err, body) {
                var $ = cheerio.load(body),
                    properties = {tunerId: tunerId};

                $('table').children().filter(function(index, el) {
                    return $(this).attr('class') !== 'undefined'
                })
                .each(function(index, el) {
                    var prop = u.toCamelCase($(el).children(0).text()),
                        val = $(el).children(1).text();

                    if (val.toLowerCase() === 'none') {
                        val = null;
                    }

                    if (prop.length > 0) {
                        properties[prop] = val;
                    }
                })

                callback(null, properties);
            })
        }
    }
}

function apiSystem(self) {
    var pages = self.config.pages.system;

    return {
        status: function(callback) {
            self.get(pages.status, function(err, body) {
                var $ = cheerio.load(body),
                    properties = {};

                $('table').children().each(function(index, el) {
                    var prop = u.toCamelCase($(el).children(0).text()),
                        val = $(el).children(1).text();

                    if (prop.length > 0) {
                        properties[prop] = u.commaList(val);
                    }
                });

                callback(null, properties);
            })
        },

        log: function(callback) {
            self.get(pages.log, function(err, body) {
                var $ = cheerio.load(body),
                    logLines = $('pre').text().split('\n');

                var ret = [];

                _.each(logLines, function(line) {
                    var line = line.split(': '),
                        first = line[0].split(' '),
                        date = first[0],
                        subSys = first[1];

                    if (first.length === 0
                        || date.length === 0
                        || subSys === 'undefined') {

                        return ;
                    }

                    var time = date.split('-')[1].split(':');
                        date = new Date(date.slice(0,4), date.slice(4,6), date.slice(6,8), 
                                        time[0], time[1], time[2], 0);

                    ret.push(
                        {
                            date: date,
                            where: subSys,
                            message: _.rest(line).join(' ')
                        }
                    );
                })

                callback(null, ret);
            })
        }
    }    
};

exports.api = api;