///<reference path="../../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

import config from 'app/core/config';
import coreModule from 'app/core/core_module';

/** @ngInject **/
function ecOptTextstyleDirective($compile, datasourceSrv, $rootScope, $q, $http, $templateCache) {

  return {
    restrict: 'E',
    scope: {
      ctrl: '=',
      textStyle: '=',
    },
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/directives/ecOptTextstyle.html',
    link: function(scope, elem, attrs) {
      scope.refresh = function () {
        if (this.ctrl) { this.ctrl.refresh(); }
        //this.$root.$broadcast('refresh');
      };

      var fontWeight = ['normal', 'bold', 'bolder', 'lighter', '100', '130', '200', '300'];
      scope.getFontWeight = () => {
        return fontWeight;
      };

      var fontFamily = ['sans-serif', 'Arial', 'Microsoft YaHei', 'Helvetica', 'Tahoma', 'Heiti SC'];
      scope.getFontFamily = () => {
        return fontFamily;
      };
    }
  };
}

coreModule.directive('ecOptTextstyle', ecOptTextstyleDirective);
