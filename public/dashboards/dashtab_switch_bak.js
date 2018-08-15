/* global _ */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (in the ARGS variable)
 *
 * Global accessable variables
 * window, document, $, jQuery, ARGS, moment
 *
 * Return a dashboard object, or a function
 *
 * For async scripts, return a function, this function must take a single callback function,
 * call this function with the dashboard object
 */

'use strict';

// accessible variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;

return function (callback) {
  debugger;
  // Intialize a skeleton with nothing but a rows array and service object
  var dynamicDash = {
    title: 'Scripted dash',
    rows: [{
      title: 'Chart',
      height: '300px',
      panels: [
        {
          title: 'Async dashboard test',
          type: 'text',
          span: 12,
          fill: 1,
          content: '# Async test'
        }
      ]
    }]
  };

  var mapping = {
    manage_YYSJ: 'dashtab_yingxiao',
    manage_YunYing: 'dashtab_yunying',
    manage_Finance: 'dashtab_Finance',
    manage_YWSJ: 'dashtab_yunwei',
    manage_MapShow: 'dashtab_fugailv',
    manage_KHTC: 'dashtab_kehutucao',
    manage_CPML: 'dashtab_chanpinmulu',
    manage_HYFX: 'dashtab_HYSJFXMB'
  };

  function gotoDashboard(dashboard) {
    if (openDash.dash === dashboard.title) {
      callback(dashboard);
    } else {
      return $.ajax({
        method: 'GET',
        url: '/api/dashboards/db/' + openDash.dash
      })
        .fail(function (dashRes, getButtonRes) {
          debugger;
          callback(dynamicDash);
        })
        .done(function (result) {
          debugger;
          callback(result.dashboard);
        });
    }
  }


  function dashMapping(result) {
    var dash = result.dashboard;

    var panels = _.flatten(_.map(dash.rows, 'panels'));

    var tabdash = _.find(panels, 'butPermiFiled');

    if (tabdash) {
      _.transform(tabdash.dashboards,
        function (m, item) {
          if (!_.isEmpty(item.permissions)) {
            m[item.permissions] = item.dash;
          }
        },
        mapping);
    }
    return result;
  }

  function getButton() {
    var data = {
      "queries": [{
        "refId": "TSG",
        "format": "table",
        "url": "https://sgi.teld.cn/api/invoke?SID=WRPFrame-GetButton",
        "parameters": [{
          "key": "MenuId",
          "type": "value",
          "value": "10aab4c9-6164-4da7-b8b0-80df1111a06b"
        }]
      }]
    };

    return $.ajax({
      method: 'POST', url: 'callteldsg/_sg',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(data)
    });
  }

  function switchDash(data) {
    debugger;
    var result = _.first(data.results);
    if (result) {
      var button = _.find(result.dataset, { Control_ID: openDash.permissions });
      if (_.isUndefined(button)) {
        var firstButton = _.first(data.results[0].dataset);
        if (firstButton) {
          openDash = {
            dash: mapping[firstButton.Control_ID]
          };
        }
      }
      //slug = openDash.dash;
    }
    return openDash;
  }

  var group = ARGS.group;
  var tab = ARGS.tab;
  var localStorageKey = ARGS.lskey || _.remove([group, tab, "dashtab"]).join("_");

  var storage = window.localStorage.getItem(localStorageKey) || "{}";
  storage = JSON.parse(storage);

  var openDash = storage.lastDash || { dash: ARGS.db };

  $.when(
    $.ajax({
      method: 'GET',
      url: '/api/dashboards/db/' + ARGS.db
    }), getButton()
  )
    .fail(function (dashRes, getButtonRes) {
      debugger;
    })
    .done(function (dashRes, getButtonRes) {
      debugger;
      var result = dashMapping.apply(this, dashRes);

      if (!_.includes(_.values(mapping), openDash.dash)) {
        return gotoDashboard(result.dashboard);
      }

      openDash = switchDash.apply(this, getButtonRes);
      gotoDashboard(result.dashboard);
    });
}
