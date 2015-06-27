'use strict';

var os = require('os');
var path = require('path');

var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var ncp = require('ncp').ncp;
var mv = require('mv');

var async = require('async');

function buildWinApp (opts, cb, newApp) {
  var paths = {
    app: path.join(newApp, 'resources', 'app'),
    defaultApp: path.join(newApp, 'resources', 'default_app'),
    finalPath: path.join(opts.out || process.cwd(), opts.name + '-win32')
  };

  function moveApp() {
    async.series([
      function (callback) {
        rimraf(paths.defaultApp, function (err) {
          callback(err);
        });
      },
      function (callback) {
        mkdirp(paths.finalPath, function (err) {
          callback(err);
        });
      },
      function (callback) {
        ncp(newApp, paths.finalPath, function (err) {
          callback(err);
        });
      }
    ], function (err) {
      cb(err);
    });
  }

  moveApp();
}

module.exports = {
  createApp: function createApp (opts, electronApp, cb) {
    var tmpDir = path.join(os.tmpdir(), 'electron-packager-windows');

    var newApp = path.join(tmpDir, opts.name + '-win32');

    // reset build folders + copy template app
    rimraf(tmpDir, function rmrfd () {
      // ignore errors
      mkdirp(newApp, function mkdirpd () {
        // ignore errors
        // copy app folder and use as template (this is exactly what Atom editor does)
        ncp(electronApp, newApp, function copied (err) {
          if (err) return cb(err);
          // rename electron.exe
          mv(path.join(newApp, 'electron.exe'), path.join(newApp, opts.name + '.exe'), function (err) {
            if (err) return cb(err);
            buildWinApp(opts, cb, newApp);
          });
        });
      });
    });
  }
};
