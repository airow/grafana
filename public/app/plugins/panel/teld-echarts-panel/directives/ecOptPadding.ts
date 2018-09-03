///<reference path="../../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

import config from 'app/core/config';
import coreModule from 'app/core/core_module';

/** @ngInject **/
function ecOptPaddingDirective($compile, datasourceSrv, $rootScope, $q, $http, $templateCache) {

  return {
    restrict: 'E',
    scope: {
      ctrl: '=',
      padding: '=',
    },
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/directives/ecOptPadding.html',
    link: function(scope, elem, attrs) {
      scope.padding = scope.padding || [0, 0, 0, 0];
      scope.refresh = function () {
        if (this.ctrl) { this.ctrl.refresh(); }
      };
    }
  };
}

coreModule.directive('ecOptPadding', ecOptPaddingDirective);
