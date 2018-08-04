///<reference path="../../../headers/common.d.ts" />

import kbn from 'app/core/utils/kbn';
import angular from 'angular';
import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import _ from 'lodash';

import {DashboardExporter} from './exporter';

export class DashExportCtrl {
  dash: any;
  exporter: DashboardExporter;
  dismiss: () => void;

  /** @ngInject */
  constructor(private backendSrv, dashboardSrv, datasourceSrv, $scope, private $rootScope) {
    this.exporter = new DashboardExporter(datasourceSrv);

    this.exporter.makeExportable(dashboardSrv.getCurrent()).then(dash => {
      $scope.$apply(() => {
        this.dash = dash;
      });
    });
  }

  save() {
    var blob = new Blob([angular.toJson(this.dash, true)], { type: "application/json;charset=utf-8" });
    var wnd: any = window;
    wnd.saveAs(blob, this.dash.title + '-' + new Date().getTime() + '.json');
  }

  saveJson1() {
    var html = angular.toJson(this.dash, true);
    var uri = "data:application/json," + encodeURIComponent(html);
    var newWindow = window.open(uri);
  }

  saveJson() {
    var clone = this.dash;
    let editScope = this.$rootScope.$new();
    editScope.object = clone;
    // editScope.canCopy = true;
    // editScope.canUpdate = true;


    this.$rootScope.appEvent('show-modal', {
      src: 'public/app/partials/edit_json.html',
      scope: editScope,
    });

    this.dismiss();
  }

}

export function dashExportDirective() {
  return {
    restrict: 'E',
    templateUrl: 'public/app/features/dashboard/export/export_modal.html',
    controller: DashExportCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
  };
}

coreModule.directive('dashExportModal', dashExportDirective);
