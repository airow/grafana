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
    editable: false,
    title: 'Scripted dash',
    rows: [{
      //title: 'Chart',
      height: '300px',
      panels: [
        {
          title: '404',
          type: 'text',
          span: 12,
          fill: 1,
          content: '# not found dashboard'
        }
      ]
    }]
  };

  function cb(dashboard) {
    dashboard.editable = false;
    callback(dashboard);
  }

  function setRowPanels(row, panel) {
    if (row) {
      row.height = 1;
      row.showTitle = false;
      row.collapse = false;
      panel.title = "";
      row.panels = [panel];
    }
    return row;
  }

  function inject(panel, rows) {
    //var predicate = { 'title': panel.title };
    function predicate(p) {
      return _.toLower(p.title) === _.toLower(panel.title);
    }

    if (panel) {
      var row = setRowPanels(_.find(rows, predicate), panel);
      if (_.isUndefined(row)) {
        _.each(rows, function (row) {
          if (_.find(row.panels, predicate)) {
            setRowPanels(row, panel);
            return false;
          }
        });
      }
    }
  }


  function cbfail() {
    cb(dynamicDash);
  }

  function gotoDashboard(component) {
    var openDash = component.openDash;
    return $.ajax({
      method: 'GET',
      url: '/api/dashboards/db/' + openDash.dash
    })
      .fail(function (dashRes, getButtonRes) {
        window.localStorage.removeItem(component.localStorageKey);
        cbfail();
      })
      .done(function (result) {

        _.each(component.panels, function (panel) {
          inject(panel, result.dashboard.rows);
        });
        result.dashboard.dashLocalStorage = component.dashboard.dashLocalStorage;
        result.dashboard.slug = result.meta.slug;
        if (_.has(component.panels, 'teld-querybar-panel')) {
          result.dashboard.hasQuerybarPanel = true;
        }
        var watermark = component.dashboard.watermark;
        if (watermark && watermark.show) {
          result.dashboard.watermark = watermark;
        }
        cb(result.dashboard);
      });
  }

  function getComponentDash(componentSlug) {
    return $.ajax({
      method: 'GET',
      url: '/api/dashboards/db/' + componentSlug
    });
  }

  function parseDashtabPanel(component, panel) {
    _.transform(panel.dashboards,
      function (m, item) {
        if (!_.isEmpty(item.permissions)) {
          m[item.permissions] = item.dash;
        }
      }, component.mapping);

    var group = component.dashboard.dashLocalStorage;
    var tab = panel.localStorageKey;
    var localStorageKey = component.localStorageKey = _.remove([group, tab, "dashtab"]).join("_");
    var storage = window.localStorage.getItem(localStorageKey) || "{}";
    component.storage = JSON.parse(storage);
    component.openDash = component.storage.lastDash || { dash: ARGS.db };

    return panel;
  }

  function parseComponent(result) {
    var component = {
      dashboard: result.dashboard,
      panels: {},
      mapping: {}
    };

    var panels = _.flatten(_.map(component.dashboard.rows, 'panels'));
    _.transform(panels, function (componentPanels, panel) {
      switch (panel.type) {
        case "teld-dashtab-panel":
          componentPanels[panel.type] = parseDashtabPanel(component, panel);
          break;
        case "teld-querybar-panel":
          componentPanels[panel.type] = panel;
          break;
      }
    }, component.panels);

    // if (component.panels["teld-dashtab-panel"]) {
    //   component.mapping = _.transform(component.panels["teld-dashtab-panel"].dashboards,
    //     function (m, item) {
    //       if (!_.isEmpty(item.permissions)) {
    //         m[item.permissions] = item.dash;
    //       }
    //     }, {});
    // }

    // var group = component.dashboard.dashLocalStorage;
    // var tab = component.panels["teld-dashtab-panel"].localStorageKey;
    // var localStorageKey = _.remove([group, tab, "dashtab"]).join("_");
    // var storage = window.localStorage.getItem(localStorageKey) || "{}";
    // component.storage = JSON.parse(storage);
    // component.openDash = component.storage.lastDash || { dash: ARGS.db };

    return component;
  }

  function sghost(host, SID) {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    var domain = hostname.split('.');
    if (domain.length >= 2) {
      domain = [domain.pop(), domain.pop()].reverse();
    }
    return protocol + '//' + host + '.' + domain.join(".") + '/api/invoke?SID=' + SID;
  }

  function getButton() {
    var data = {
      "queries": [{
        "refId": "TSG",
        "format": "table",
        "url": sghost('sgi', 'WRPFrame-GetButton'),
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

  function switchDash(component, data) {
    var openDash = component.openDash;
    var result = _.first(data.results);
    if (result) {
      var button = _.find(result.dataset, { Control_ID: openDash.permissions });
      if (_.isUndefined(button)) {

        var permissions = _.keys(component.mapping);

        var firstDash = _.find(component.panels['teld-dashtab-panel'].dashboards, function (eachItem) {
          return _.includes(permissions, eachItem.permissions);
        });

        if (firstDash) {
          openDash = {
            dash: firstDash.dash
          };
        } else {
          var firstButton = _.first(data.results[0].dataset);
          if (firstButton) {
            openDash = {
              dash: component.mapping[firstButton.Control_ID]
            };
          }
        }
      }
    }
    return openDash;
  }


  function processQueryResult(resData) {
    var data = [];
    if (!resData.results) {
      return { data: data };
    }

    for (var key in resData.results) {
      var queryRes = resData.results[key];
      if (_.isUndefined(queryRes.dataset)) {
        continue;
      }
      var series = {
        type: 'table',
        refId: queryRes.refId,
        columns: _.map(_.keys(queryRes.dataset[0]), function (item) { return { "text": item }; }),
        rows: _.map(queryRes.dataset, function (item) { return _.values(item); })
      };
      data.push(series);
    }

    return { data: data };
  }

  function injectDataList(component, getButtonRes) {
    if (component.panels["teld-dashtab-panel"]) {
      var dataList = processQueryResult.apply(this, getButtonRes);
      component.panels["teld-dashtab-panel"].injectDataList = dataList.data;
    }
  }

  if (_.isUndefined(ARGS.component)) {
    dynamicDash.rows[0].panels = [{
      type: 'text',
      span: 12,
      fill: 1,
      content: '# 缺少参数component'
    }];
    return cbfail();
  }

  $.when(getComponentDash(ARGS.component), getButton())
    .fail(function (getComponentRes, getButtonRes) {
      debugger;
      console.log(getComponentRes, getButtonRes);
    })
    .done(function (getComponentRes, getButtonRes) {
      var component = parseComponent.apply(this, getComponentRes);
      if (_.isUndefined(component.openDash.dash) || _.includes(_.values(component.mapping), component.openDash.dash)) {
        if (_.isUndefined(component.openDash.dash) || component.panels["teld-dashtab-panel"].isSaveTabIndex) {
          component.openDash = switchDash.apply(this, _.flatten([component, getButtonRes]));
        }
      }

      /*注入按钮权限*/
      injectDataList(component, getButtonRes);

      gotoDashboard(component);
    });
};
