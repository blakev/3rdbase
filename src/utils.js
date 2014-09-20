var _ = require('underscore');

function upperFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerFirst(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function toCamelCase(attrib) {
    var parts = attrib.split(/[_\- ,\.]+/);
    return _.first(parts).toLowerCase() + _.map(_.rest(parts), upperFirst).join('');
}

function commaList(attrib) {
    if (attrib.indexOf(',') !== -1) {
        var ret = [];
        var parts = attrib.split(',');

        _.each(parts, function(e) {
            ret.push(e.trim());
        })

        if (ret.length == 1) {
            return ret[0];
        } else {
            return ret;
        }
    } 

    return attrib;
}

module.exports = {
    upperFirst: upperFirst,
    lowerFirst: lowerFirst,
    toCamelCase: toCamelCase,
    commaList: commaList
}