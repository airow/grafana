define([
  'angular',
  //'lodash',
  //'jquery'
],
function (angular) {
  'use strict';

  var module = angular.module('grafana.services');

  module.factory('dashboardViewStateSrv1', function(Hub) {

    var hub = new Hub('employee');
    console.log(hub);

    console.log('dashboardSignalrHubSvr');

    // represents the transient view state
    // like fullscreen panel & edit
    function DashboardViewState($scope) {
      var self = this;
      self.state = {};
      self.panelScopes = [];
      self.$scope = $scope;
      self.dashboard = $scope.dashboard;

      $scope.exitFullscreen = function() {
        if (self.state.fullscreen) {
          self.update({ fullscreen: false });
        }
      };

      $scope.onAppEvent('$routeUpdate', function() {
        var urlState = self.getQueryStringState();
        if (self.needsSync(urlState)) {
          self.update(urlState, true);
        }
      });

      $scope.onAppEvent('panel-change-view', function(evt, payload) {
        self.update(payload);
      });

      $scope.onAppEvent('panel-initialized', function(evt, payload) {
        self.registerPanel(payload.scope);
      });

      this.update(this.getQueryStringState());
      this.expandRowForPanel();
    }

    return {
      create: function($scope) {
        return new DashboardViewState($scope);
      }
    };

  });
});
