define([
  'angular',
  'lodash'
],
function (angular, _) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('elasticScriptFields', function() {
    return {
      templateUrl: 'public/app/plugins/datasource/teld-elasticsearch-datasource/directives/script_fields.html',
      controller: 'ElasticScriptFieldsCtrl',
      restrict: 'E',
      scope: {
        target: "=",
        onChange: "&",
      }
    };
  });

  module.controller('ElasticScriptFieldsCtrl', function($scope, uiSegmentSrv, $q, $rootScope) {

    $rootScope.onAppEvent('elastic-query-updated', function() {
      $scope.validateModel();
    }, $scope);

    $scope.init = function() {
      $scope.scriptFields = ($scope.target.ScriptFieldsConf = $scope.target.ScriptFieldsConf || []);
      $scope.validateModel();
    };

    $scope.onChangeInternal = function() {
      $scope.onChange();
    };

    $scope.validateModel = function() {
      $scope.raw_document = false === _.isUndefined(_.find($scope.target.metrics, { type: 'raw_document' }));
      $scope.ScriptFieldCount = $scope.scriptFields.length;

      var settingsLinkText = "";

      $scope.settingsLinkText = settingsLinkText;
      return true;
    };

    $scope.addScriptField = function () {
      $scope.scriptFields.push({});
      $scope.onChange();
    };

    $scope.removeScriptField = function(field) {
      _.remove($scope.scriptFields, field);
      $scope.onChange();
    };

    $scope.init();

  });

});
