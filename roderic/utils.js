/**
 * @author Szymon Działowski
 * @license MIT License (c) copyright 2017-present original author or authors
 * @homepage https://github.com/stopsopa/roderic
 */

'use strict';

var glob        = require("glob");
var path        = require("path");
require('colors');

const th = msg => new Error(`utils.js error: ${msg}`);

function json(data) {
    return JSON.stringify(data, null, '    ').replace(/\\\\/g, '\\');
}

function findentries(root, mask) {

    if (typeof mask === 'undefined') {

        mask = "/**/*.entry.{js,jsx}";
    }

    const list = glob.sync(root + mask);

    let tmp, entries = {};

    for (let i = 0, l = list.length ; i < l ; i += 1) {

        tmp = path.parse(list[i]);

        tmp = path.basename(tmp.name, path.extname(tmp.name));

        if (entries[tmp]) {

            throw th("There are two entry files with the same name: '" + path.basename(entries[tmp]) + "'");
        }

        entries[tmp] = list[i];
    }

    return entries;
}

var utils = {
    config: false,
    setup: function (config) {

        if ( ! this.config && config ) {

            this.config = config;
        }

        // console && console.log && console.log('env: '.yellow + process.env.NODE_ENV.red + "\n");
        //
        // return process.env.NODE_ENV;
    },
    entries: function (mask, suppressNotFoundError) {

        var t, i, tmp = {}, root = this.config.js.entries;

        if (!root) {

            throw th("First specify root path for entry");
        }

        if (Object.prototype.toString.call( root ) !== '[object Array]') {

            root = [root];
        }

        root.forEach(function (r) {

            t = findentries(r, mask);

            for (i in t) {

                if (tmp[i]) {

                    throw th("There are two entry files with the same name: '" + path.basename(t[i]) + "'");
                }

                tmp[i] = t[i];
            }
        });

        if ( ! suppressNotFoundError && ! Object.keys(tmp).length) {

            throw th("Not found *.entry.js files in directories : \n" + json(root, null, '    '));
        }

        return tmp;
    },
};

module.exports = utils;


