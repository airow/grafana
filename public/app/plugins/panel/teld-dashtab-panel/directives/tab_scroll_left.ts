///<reference path="../../../../headers/common.d.ts" />

import _ from 'lodash';
import coreModule from 'app/core/core_module';
import angular from 'angular';


export function TabScrollLeft() {
  'use strict';

  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      if (scope.ctrl.dashboard.title === scope.target.dash) {
        element.closest('.buttons-tab').scrollLeft(element.offset().left);
      }
    }
  };
}

coreModule.directive('tabScrollLeft', TabScrollLeft);

/** @ngInject */
export function dashSwitch($window, $location, contextSrv) {
  'use strict';

  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      /* 通过scriptdashboard进行 */
      let ctrl = scope.ctrl;
      let ctrlPanel = ctrl.panel;
      let search = $location.search();
      if (contextSrv.hasRole('Viewer') && ctrlPanel.isSaveTabIndex) {
        let dashs = _.map(scope.ctrl.tabs, 'dash');
        let lskey = search.lskey || ctrlPanel.localStorageKey;
        // let lastDash = window.localStorage.getItem(`dashTabs.${lskey}.lastDash`);
        // if (_.isNil(lastDash) === false && lastDash !== ctrl.dashboard.title) {
        //   if (false === _.includes(dashs, lastDash)) {
        //     lastDash = dashs.shift();
        //   }
        //   $location.path(`dashboard/db/${lastDash}`);
        // } else {
        //   if (false === _.includes(dashs, lastDash)) {
        //     lastDash = dashs.shift();
        //     $location.path(`dashboard/db/${lastDash}`);
        //   }
        // }
      }
    }
  };
}

coreModule.directive('dashSwitch', dashSwitch);
