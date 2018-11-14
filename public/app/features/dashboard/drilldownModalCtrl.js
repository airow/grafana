define(['angular',
  'lodash',
  'jquery',
  'moment',
  'require',
  'app/core/config',
],
function (angular, _/*, $, moment, require, config*/) {
  'use strict';

  var module = angular.module('grafana.controllers');

  module.controller('DrilldownModalCtrl', function($scope/*, $rootScope, $location, $timeout, timeSrv, templateSrv*/, linkSrv) {
    $scope.init = function() {
      $scope.modePanel = $scope.panel ? true : false;
      $scope.modalTitle = '联查';

      $scope.links = _.map($scope.panel.drillConf.links,function(link) {
        var info = linkSrv.getPanelLinkAnchorInfo(link, $scope.modePanel.scopedVars);
        return info;
      });
    };
  });

});
