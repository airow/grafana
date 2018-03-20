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
    link: {
      //https://docs.angularjs.org/api/ng/service/$compile
      pre: function preLink(scope, elem, attrs) {


        //public\vendor\angular-other\angular-strap.js @ 143
        var fontWeight = ['normal', 'bold', 'bolder', 'lighter', '100', '130', '200', '300'];
        /* scope.sw = fontWeight; 这样不行*/
        scope.getFontWeight = () => {
          /**
           * return ['normal', 'bold', 'bolder', 'lighter', '100', '130', '200', '300'];
           * 不可以 * https://docs.angularjs.org/error/$rootScope/infdig
           */
          return fontWeight;
        };

        var fontStyle = ['normal','italic','oblique'];
        scope.getFontStyle = () => {
          /**
           * return ['normal', 'bold', 'bolder', 'lighter', '100', '130', '200', '300'];
           * 不可以 * https://docs.angularjs.org/error/$rootScope/infdig
           */
          return fontStyle;
        };

        var fontFamily = ['sans-serif', 'Arial', 'Microsoft YaHei', 'Helvetica', 'Tahoma', 'Heiti SC'];
        scope.getFontFamily = () => {
          return fontFamily;
        };
        scope.delItem = (key) => {
          delete scope.textStyle[key];
        };
      },
      post: function postLink(scope, elem, attrs) {
        scope.refresh = function () {
          if (this.ctrl) { this.ctrl.refresh(); }
          //this.$root.$broadcast('refresh');
        };
      }
    }
  };
}

coreModule.directive('ecOptTextstyle', ecOptTextstyleDirective);
