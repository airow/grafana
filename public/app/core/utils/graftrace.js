define([
  // 'jquery',
  'lodash'
],
function(_) {
  'use strict';

  var graftrace = {

    gen: function (panelCtrl) {
      var user = _.get(window, 'grafanaBootData.user');
      var _graftrace_ = {
        // RequestTime: moment().format("YYYYMMDDHHmmssSSSZZ"),
        GrafLogin: user.login,
        GrafOrg: user.orgName,
        DashTitle: panelCtrl.dashboard.title,
        DashId: panelCtrl.dashboard.id,
        // DashTime: this.dashboard.time,
        PanelPluginId: panelCtrl.pluginId,
        PanelId: _.get(panelCtrl, 'panel.id'),
        PanelTitle: _.get(panelCtrl, 'panel.title'),
        VarName: _.get(panelCtrl, 'dsVarable.name'),
        UserAgent: window.navigator.userAgent,
        LocationHref: window.location.href
      };
      if (_.size(_graftrace_.LocationHref) > 10000) {
        _graftrace_.LocationHref = _graftrace_.LocationHref.substring(0, 10000) + "...";
      }
      return _graftrace_;
    },

    setGraftraceHeaders: function (ds, options, context, _graftrace_) {
      if (_graftrace_) {
        // debugger;
        var headers = options.headers || (options.headers = {}, options.headers);
        _graftrace_.DSType = ds.meta.id;
        _graftrace_.DSName = ds.name;
        if (context) {
          _graftrace_.Context = context;
        }
        // debugger;
        if (window && window.location && window.location.hostname === "localhost") {
          console.log(_graftrace_);
          // console.log(headers["_graftrace_"]);
        } else {
          headers["_graftrace_"] = btoa(encodeURIComponent(JSON.stringify(_graftrace_)));
        }
      }
    }
  };

  return graftrace;
});
