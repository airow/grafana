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

  var dashboard;

  // Intialize a skeleton with nothing but a rows array and service object
  dashboard = {
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

  // Set a title
  dashboard.title = 'Scripted dash';

  var tabSwitch = ARGS.tabswitch || 'tabswitch';
  var slug = window.localStorage.getItem(tabSwitch) || ARGS.db;

  if (_.isUndefined(slug)) {
    callback(dashboard);
    return;
  }

  $.ajax({
    method: 'GET',
    url: '/api/dashboards/db/' + slug
  })
  // .fail(function(jqXHR, textStatus, errorThrown) {
  //   debugger;
  // })
  .done(function(result) {
    debugger;
    //dashboard = result.dashboard;
  })
  .always(function(result) {
    debugger;
    // when dashboard is composed call the callback
    // function and pass the dashboard
    callback(dashboard);
  });
}
