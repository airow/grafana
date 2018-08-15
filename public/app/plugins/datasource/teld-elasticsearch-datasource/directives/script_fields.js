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
        index: "=",
        onChange: "&",
        onAddscriptfield: "&"
      }
    };
  });

  module.controller('ElasticScriptFieldsCtrl', function($scope, uiSegmentSrv, $q, $rootScope) {
    var scriptFields = $scope.target.scriptFieldsConf;

    $scope.init = function() {
      $scope.current = scriptFields[$scope.index];
      $scope.validateModel();
    };

    $rootScope.onAppEvent('elastic-query-updated', function() {
      $scope.index = _.indexOf(scriptFields, $scope.current);
      $scope.validateModel();
    }, $scope);

    $scope.validateModel = function() {
      $scope.isFirst = $scope.index === 0;
      $scope.isSingle = scriptFields.length === 1;
      $scope.settingsLinkText = 'Options';

      if ($scope.current.name) {
        var settings = [];
        settings.push('name:' + $scope.current.name);
        settings.push('script:' + $scope.current.script.script.source);

        if ($scope.current.sort) {
          settings.push('order:' + $scope.current.script.order);
          settings.push('type:' + $scope.current.script.type);
        }

        $scope.settingsLinkText = settings.join(", ");
      }
    };

    $scope.toggleOptions = function() {
      $scope.showOptions = !$scope.showOptions;
    };

    $scope.onChangeInternal = function() {
      $scope.onChange();
    };

    $scope.onChangeClearInternal = function() {
      $scope.onChange();
    };

    $scope.addScriptField = function() {
      $scope.onAddscriptfield();
      $scope.onChange();
    };

    $scope.removeScriptField = function() {
      scriptFields.splice($scope.index, 1);
      $scope.onChange();
    };

    $scope.toggleShow = function() {
      $scope.current.hide = !$scope.current.hide;
      if (!$scope.current.hide) {
        delete $scope.current.hide;
      }
      $scope.onChange();
    };

    $scope.init();

  });

});
