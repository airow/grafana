///<reference path="../../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

import config from 'app/core/config';
import coreModule from 'app/core/core_module';

/** @ngInject **/
function ecClearValDirective($compile, datasourceSrv, $rootScope, $q, $http, $templateCache) {

  return {
    restrict: 'E',
    scope: true,
    // scope: {
    //   target: '=',
    //   key: '=',
    // },
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/directives/ecClearVal.html',
    link: function(scope, elem, attrs) {

      var i = 1;
      i++;

      var p = _.split(attrs.ecTarget, '.');
      var key = scope.key = p.pop();
      var prefix = _.join(p, '.');

      var tip = scope.tip = attrs.clTip;

      scope.removeTarget = function () {
        delete _.get(scope, prefix)[key];
      };

      scope.class = attrs.ecClass;

      scope.isShow = function () {
        return undefined !== _.get(scope, attrs.ecTarget);
      };
    }
  };
}

coreModule.directive('ecClearVal', ecClearValDirective);


/** @ngInject **/
function ecValwrapDirective($compile, datasourceSrv, $rootScope, $q, $http, $templateCache) {

  return {
    restrict: 'A',
    scope: true,
    link: function(scope, elem, attrs) {
      if (attrs.ngModel) {
        elem.blur(() => {
          if (_.isEmpty(elem.val())) {
            _.unset(scope, attrs.ngModel);
            scope.$apply();
          } else {
            var num = _.toNumber(elem.val());
            if (_.isNumber(num) && _.isNaN(num) === false) {
              _.set(scope, attrs.ngModel, num);
              //scope.apply();
              scope.$apply();
            }
          }
        });
        elem.on("$destroy", function () {
          elem.unbind();
        });
      }
    }
  };
}

coreModule.directive('ecValwrap', ecValwrapDirective);
