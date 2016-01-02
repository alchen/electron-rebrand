'use strict';

var path = require('path');
var os = require('os');

var download = require('electron-download');
var extract = require('extract-zip');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

module.exports = function packager(opts, cb) {
  var platformPackager;
  var platform = opts.platform;
  var arch = opts.arch;
  var version = opts.version;

  if (!platform || !arch || !version) cb(new Error('Must specify platform, arch and version'));

  switch (arch) {
    case 'ia32': break;
    case 'x64': break;
    default: return cb(new Error('Unsupported arch. Must be either ia32 or x64'));
  }

  switch (platform) {
    case 'darwin': platformPackager = require('./mac.js'); break;
    case 'mas': platformPackager = require('./mac.js'); break;
    case 'win32': platformPackager = require('./win32.js'); break;
    default: return cb(new Error('Unsupported platform. Must be either darwin (mas), or win32'));
  }

  download({
    platform: platform,
    arch: arch,
    version: version
  }, function(err, zipPath) {
    if (err) return cb(err);
    console.log('Packaging app for platform', platform, arch, 'using electron v' + version);
    // extract zip into tmp so that packager can use it as a template
    var tmpDir = path.join(os.tmpdir(), 'electron-packager-' + platform + '-template');
    rimraf(tmpDir, function(err) {
      if (err) {} // ignore err
      mkdirp(tmpDir, function(err) {
        if (err) return cb(err);
        extract(zipPath, {dir: tmpDir}, function(err) {
          if (err) return cb(err);
          platformPackager.createApp(opts, tmpDir, cb);
        });
      });
    });
  });
};
