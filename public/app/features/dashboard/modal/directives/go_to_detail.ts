///<reference path="../../../../headers/common.d.ts" />

import kbn from 'app/core/utils/kbn';
import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import _ from 'lodash';
import angular from 'angular';
export class GoToDetailCtrl {
  alertSrv: any;
  bindData: any;
  fieldConf: any;
  panel: any;
  modalTitle: any;
  links: any[];
  dashVars: any[];
  /** @ngInject */
  constructor(alertSrv, private templateSrv, private $location, private $scope, private $routeParams) {
    this.alertSrv = alertSrv;
    this.bindData = this.$scope.bindData;
    this.panel = this.$scope.panel;
    this.modalTitle = this.templateSrv.replace(this.$scope.modalTitle);

    this.links = this.$scope.links;
    //this.links =  this.parsing(this.$scope.links);
  }
}

export function gotoDetailDirective() {
  return {
    restrict: 'E',
    templateUrl: 'public/app/features/dashboard/modal/directives/go_to_detail.html',
    controller: GoToDetailCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
  };
}

coreModule.directive('teldGoToDetail', gotoDetailDirective);
