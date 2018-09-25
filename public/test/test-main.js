(function() {
  "use strict";

  // Tun on full stack traces in errors to help debugging
  Error.stackTraceLimit=Infinity;

  window.__karma__.loaded = function() {};

  System.config({
    baseURL: '/base/',
    defaultJSExtensions: true,
    paths: {
      'mousetrap': 'vendor/npm/mousetrap/mousetrap.js',
      'eventemitter3': 'vendor/npm/eventemitter3/index.js',
      'remarkable': 'vendor/npm/remarkable/dist/remarkable.js',
      'tether': 'vendor/npm/tether/dist/js/tether.js',
      'tether-drop': 'vendor/npm/tether-drop/dist/js/drop.js',
      'moment': 'vendor/moment.js',
      "jquery": "vendor/jquery/dist/jquery.js",
      'lodash-src': 'vendor/lodash/dist/lodash.js',
      "lodash": 'app/core/lodash_extended.js',
      "angular": 'vendor/angular/angular.js',
      'angular-mocks': 'vendor/angular-mocks/angular-mocks.js',
      "bootstrap":  "vendor/bootstrap/bootstrap.js",
      'angular-route':          'vendor/angular-route/angular-route.js',
      'angular-sanitize':       'vendor/angular-sanitize/angular-sanitize.js',
      "angular-ui":             "vendor/angular-ui/ui-bootstrap-tpls.js",
      "angular-strap":          "vendor/angular-other/angular-strap.js",
      "angular-dragdrop":       "vendor/angular-native-dragdrop/draganddrop.js",
      "angular-bindonce":       "vendor/angular-bindonce/bindonce.js",
      "angular-post-message":   "vendor/angular-post-message/src/angular-post-message.js",
      "angular-signalr-hub":   "vendor/angular-signalr-hub/signalr-hub.js",
      "ws":                     "vendor/require-undefined.js", /*mock angular-websocket require('ws') */
      "angular-websocket":      "vendor/angular-websocket-2.0.0/dist/angular-websocket.js",
      // "ace":             "vendor/ace-builds-1.2.8/src-min-noconflict/ace.js",
      // "ui-ace":          "vendor/ui-ace-0.2.3/ui-ace.js",
      "Snap.svg":        "vendor/Snap.svg-0.5.1/dist/snap.svg.js",
      "me-pageloading":  "vendor/me-pageloading-0.4.1/me-pageloading.js",
      "flipcountdown":  "vendor/flipcountdown-3.0.5/jquery.flipcountdown.js",
      "jquery.signalR":   "vendor/jquery.signalR/jquery.signalR-2.2.2.js",
      "spectrum": "vendor/spectrum.js",
      "bootstrap-tagsinput": "vendor/tagsinput/bootstrap-tagsinput.js",
      "jquery.flot": "vendor/flot/jquery.flot",
      "jquery.flot.pie": "vendor/flot/jquery.flot.pie",
      "jquery.flot.selection": "vendor/flot/jquery.flot.selection",
      "jquery.flot.stack": "vendor/flot/jquery.flot.stack",
      "jquery.flot.stackpercent": "vendor/flot/jquery.flot.stackpercent",
      "jquery.flot.time": "vendor/flot/jquery.flot.time",
      "jquery.flot.crosshair": "vendor/flot/jquery.flot.crosshair",
      "jquery.flot.fillbelow": "vendor/flot/jquery.flot.fillbelow",
      "jquery.flot.gauge": "vendor/flot/jquery.flot.gauge",
      "jquery.flot.categories": "vendor/flot/jquery.flot.categories",
      "numeral": "vendor/numeral/numeral.js",
      'echarts': 'vendor/npm/echarts/dist/echarts.min.js',
      'echarts.china': 'vendor/npm/echarts/map/js/china.js',
      'echarts.bmap': 'vendor/npm/echarts/dist/extension/bmap.min.js',
      'swiper': 'vendor/angular-swiper-0.4.0/swiper/js/swiper.js',
      'angular-swiper': 'vendor/angular-swiper-0.4.0/angular-swiper.js',
      'async': 'vendor/async-2.6.1/async.js',
      'watermark': 'vendor/watermark.js',
      //'brace': 'vendor/npm/brace/index.js',
      'vendor/npm/brace/index': 'vendor/npm/brace/index.js',
      'brace/ext/language_tools': 'vendor/npm/brace/ext/language_tools.js',
      'brace/theme/textmate': 'vendor/npm/brace/theme/textmate.js',
      'brace/mode/text': 'vendor/npm/brace/mode/text.js',
      'brace/snippets/text': 'vendor/npm/brace/snippets/text.js',
      'brace/mode/sql': 'vendor/npm/brace/mode/sql.js',
      'brace/snippets/sql': 'vendor/npm/brace/snippets/sql.js',
      'w3c-blob': 'vendor/npm/w3c-blob/index.js',
      'buffer': 'vendor/npm/buffer/index.js',
      'base64-js': 'vendor/npm/base64-js/index.js',
      'ieee754': 'vendor/npm/ieee754/index.js',
      'isarray': 'vendor/npm/isarray/index.js',
    },

    packages: {
      app: {
        defaultExtension: 'js',
      },
      vendor: {
        defaultExtension: 'js',
      },
    },

    map: {
    },

    meta: {
      'vendor/angular/angular.js': {
        format: 'global',
        deps: ['jquery'],
        exports: 'angular',
      },
      'vendor/angular-mocks/angular-mocks.js': {
        format: 'global',
        deps: ['angular'],
      },
      'vendor/npm/eventemitter3/index.js': {
        format: 'cjs',
        exports: 'EventEmitter'
      },
      'vendor/npm/mousetrap/mousetrap.js': {
        format: 'global',
        exports: 'Mousetrap'
      },
      'vendor/angular-swiper-0.4.0/swiper/js/swiper.js': {
        format: 'cjs',
        exports: 'Swiper'
      },
    }
  });

  function file2moduleName(filePath) {
    return filePath.replace(/\\/g, '/')
    .replace(/^\/base\//, '')
      .replace(/\.\w*$/, '');
  }

  function onlySpecFiles(path) {
    return /specs.*/.test(path);
  }

  window.grafanaBootData = {settings: {}};

  var modules = ['angular', 'angular-mocks', 'app/app'];
  var promises = modules.map(function(name) {
    return System.import(name);
  });

  Promise.all(promises).then(function(deps) {
    var angular = deps[0];

    angular.module('grafana', ['ngRoute']);
    angular.module('grafana.services', ['ngRoute', '$strap.directives']);
    angular.module('grafana.panels', []);
    angular.module('grafana.controllers', []);
    angular.module('grafana.directives', []);
    angular.module('grafana.filters', []);
    angular.module('grafana.routes', ['ngRoute']);

    // load specs
    return Promise.all(
      Object.keys(window.__karma__.files) // All files served by Karma.
      .filter(onlySpecFiles)
      .map(file2moduleName)
      .map(function(path) {
        // console.log(path);
        return System.import(path);
      }));
  }).then(function()  {
    window.__karma__.start();
  }, function(error) {
    window.__karma__.error(error.stack || error);
  }).catch(function(error) {
    window.__karma__.error(error.stack || error);
  });

})();
