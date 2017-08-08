///<reference path="../../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

import config from 'app/core/config';
import coreModule from 'app/core/core_module';

/** @ngInject **/
function ecOptLeftTopRightBottomDirective($compile, datasourceSrv, $rootScope, $q, $http, $templateCache) {

  return {
    restrict: 'E',
    scope: {
      ctrl: '=',
      option: '=',
    },
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/directives/ecOptLeftTopRightBottom.html',
    link: function(scope, elem, attrs) {
      scope.refresh = function () {
        if (this.ctrl) { this.ctrl.refresh(); }
        //this.$root.$broadcast('refresh');
      };
    }
  };
}

coreModule.directive('ecOptLeftTopRightBottom', ecOptLeftTopRightBottomDirective);
