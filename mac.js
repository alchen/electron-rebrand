'use strict';

var os = require('os');
var path = require('path');
var fs = require('fs');

var plist = require('plist');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var ncp = require('ncp').ncp;

var async = require('async');

function buildMacApp(opts, cb, newApp) {
  var base = {
    output: opts.out || process.cwd(),
    appContents: path.join(newApp, 'Contents'),
    helperContents: path.join(newApp, 'Contents', 'Frameworks', 'Electron Helper.app', 'Contents'),
    NPContents: path.join(newApp, 'Contents', 'Frameworks', 'Electron Helper NP.app', 'Contents'),
    EHContents: path.join(newApp, 'Contents', 'Frameworks', 'Electron Helper EH.app', 'Contents')
  };

  var paths = {
    appPList: path.join(base.appContents, 'Info.plist'),
    helperPList: path.join(base.helperContents, 'Info.plist'),
    NPPList: path.join(base.NPContents, 'Info.plist'),
    EHPList: path.join(base.EHContents, 'Info.plist'),

    newExecutable: path.join(base.appContents, 'MacOS', opts.name),
    newNPExecutable: path.join(base.NPContents, 'MacOS', opts.name + ' Helper NP'),
    newEHExecutable: path.join(base.EHContents, 'MacOS', opts.name + ' Helper EH'),
    newHelperExecutable: path.join(base.helperContents, 'MacOS', opts.name + ' Helper'),

    defaultExecutable: path.join(base.appContents, 'MacOS', 'Electron'),
    defaultNPExecutable: path.join(base.NPContents, 'MacOS', 'Electron Helper NP'),
    defaultEHExecutable: path.join(base.EHContents, 'MacOS', 'Electron Helper EH'),
    defaultHelperExecutable: path.join(base.helperContents, 'MacOS', 'Electron Helper'),

    defaultIcon: path.join(base.appContents, 'Resources', 'atom.icns'),
    defaultApp: path.join(base.appContents, 'Resources', 'default_app'),

    helperPath: path.join(base.appContents, 'Frameworks', 'Electron Helper.app'),
    NPPath: path.join(base.appContents, 'Frameworks', 'Electron Helper NP.app'),
    EHPath: path.join(base.appContents, 'Frameworks', 'Electron Helper EH.app'),

    finalHelperPath: path.join(base.appContents, 'Frameworks', opts.name + ' Helper.app'),
    finalNPPath: path.join(base.appContents, 'Frameworks', opts.name + ' Helper NP.app'),
    finalEHPath: path.join(base.appContents, 'Frameworks', opts.name + ' Helper EH.app'),

    finalPath: path.join(base.output, opts.name + '.app')
  };

  var bundleId = opts['app-bundle-id'] || 'com.electron.' + opts.name.toLowerCase();
  var appVersion = opts['app-version'];

  // update plist files
  var appPList = plist.parse(fs.readFileSync(paths.appPList).toString());
  var helperPList = plist.parse(fs.readFileSync(paths.helperPList).toString());
  var EHPList = plist.parse(fs.readFileSync(paths.EHPList).toString());
  var NPPList = plist.parse(fs.readFileSync(paths.NPPList).toString());

  appPList.CFBundleExecutable = opts.name;
  appPList.CFBundleDisplayName = opts.name;
  appPList.CFBundleIdentifier = bundleId;
  appPList.CFBundleName = opts.name;
  appPList.CFBundleIconFile = opts.name + '.icns';
  appPList.ElectronTeamID = opts.teamID;

  helperPList.CFBundleIdentifier = bundleId + '.helper';
  helperPList.CFBundleName = opts.name + ' Helper';

  EHPList.CFBundleIdentifier = bundleId + '.helper.EH';
  EHPList.CFBundleDisplayName = opts.name + ' Helper EH';
  EHPList.CFBundleExecutable = opts.name + ' Helper EH';
  EHPList.CFBundleName = opts.name + ' Helper EH';

  NPPList.CFBundleIdentifier = bundleId + '.helper.NP';
  NPPList.CFBundleDisplayName = opts.name + ' Helper NP';
  NPPList.CFBundleExecutable = opts.name + ' Helper NP';
  NPPList.CFBundleName = opts.name + ' Helper NP';

  if (appVersion) {
    appPList.CFBundleVersion = appVersion;
  }

  if (opts.protocols) {
    var protocols = opts.protocols.map(function (protocol) {
      return {
        CFBundleURLName: protocol.name,
        CFBundleURLSchemes: [].concat(protocol.schemes)
      };
    });

    appPList.CFBundleURLTypes = protocols;
    helperPList.CFBundleURLTypes = protocols;
  }

  fs.writeFileSync(paths.appPList, plist.build(appPList));
  fs.writeFileSync(paths.helperPList, plist.build(helperPList));
  fs.writeFileSync(paths.EHPList, plist.build(EHPList));
  fs.writeFileSync(paths.NPPList, plist.build(NPPList));

  function moveApp() {
    async.series([
      function (callback) {
        mkdirp(base.output, function (err) {
          callback(err);
        });
      },
      function (callback) {
        rimraf(paths.defaultApp, function (err) {
          callback(err);
        });
      },
      function (callback) {
        rimraf(paths.defaultIcon, function (err) {
          callback(err);
        });
      },
      function (callback) {
        fs.renameSync(paths.defaultExecutable, paths.newExecutable);
        fs.renameSync(paths.defaultNPExecutable, paths.newNPExecutable);
        fs.renameSync(paths.defaultEHExecutable, paths.newEHExecutable);
        fs.renameSync(paths.defaultHelperExecutable, paths.newHelperExecutable);
        fs.renameSync(paths.helperPath, paths.finalHelperPath);
        fs.renameSync(paths.NPPath, paths.finalNPPath);
        fs.renameSync(paths.EHPath, paths.finalEHPath);
        callback();
      },
      function (callback) {
        fs.rename(newApp, paths.finalPath, function (err) {
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
  createApp: function createApp (opts, electronPath, cb) {
    var electronApp = path.join(electronPath, 'Electron.app');
    var tmpDir = path.join(os.tmpdir(), 'electron-packager-mac');

    var newApp = path.join(tmpDir, opts.name + '.app');

    // reset build folders + copy template app
    rimraf(tmpDir, function rmrfd () {
      // ignore errors
      mkdirp(newApp, function mkdirpd () {
        // ignore errors
        // copy .app folder and use as template (this is exactly what Atom editor does)
        ncp(electronApp, newApp, function copied (err) {
          if (err) return cb(err);
          buildMacApp(opts, cb, newApp);
        });
      });
    });
  }
};
