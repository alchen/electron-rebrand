# electron-rebrand

This tool is mostly based on [electron-packager](https://github.com/maxogden/electron-packager), but in a more stripped down form that does the [complete rebranding](http://electron.atom.io/docs/latest/tutorial/application-distribution/), including the helper apps, and also removes the default app and icon, to make it easier to incorporate into a customizeable build flow.

At this point, only the OS X and Win32 portions are implementated.

## Usage:

```
var packager = require('electron-rebrand');
var options = {
  name: appName,
  platform: 'darwin',
  arch: 'x64',
  version: '0.27.2',
  'app-bundle-id': 'com.example.' + appName,
  'app-version': appVersion,
  out: './output'
};
packager(options, function (err, appPath) {
  callback(err);
});
```

This will produce a rebreanded base app in `./output` ready for its icon and app to be copied in to the `resource` folder.
