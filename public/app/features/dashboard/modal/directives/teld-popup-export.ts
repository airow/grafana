///<reference path="../../../../headers/common.d.ts" />

import kbn from 'app/core/utils/kbn';
import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
export class PopupExportCtrl {
  alertSrv: any;
  panel: any;
  panelCtrl: any;
  dashboard: any;
  targetExport: any;
  links: any[];
  getListIntervalHandle: any;

  domain: string;
  slug: string;
  analysis: string;
  /** @ngInject */
  constructor(alertSrv, private $http, private templateSrv, private $interval, private $scope, private $routeParams) {
    this.alertSrv = alertSrv;
    this.panel = this.$scope.panel;
    this.panelCtrl = this.$scope.panelCtrl;
    this.dashboard = this.$scope.dashboard;
    this.targetExport = this.$scope.targetExport;

    this.slug = _.get(this.targetExport, 'conf.exprotConf.slug', "");
    this.domain = _.get(this.targetExport, 'conf.exprotConf.domain', "");
    if (this.slug === "") { this.slug = this.dashboard.title; }
    this.analysis = this.templateSrv.replace(_.get(this.targetExport, 'conf.exprotConf.analysis', ""));

    this.getList();

    this.$scope.$on("$destroy", () => {
      if (angular.isDefined(this.getListIntervalHandle)) {
        this.$interval.cancel(this.getListIntervalHandle);
        this.getListIntervalHandle = undefined;
      }
    });

  }

  getList() {
    this.$http.get(`${this.domain}/BizSafeRpt/list/${this.slug}/${this.analysis}`, {

    }).then((response, status, headers, config) => {
      this.links = response.data;
    });
  }

  exportUrl(link) {
    return `${this.domain}/BizSafeRpt/download/${this.slug}/${this.analysis}/${link.name}`;
  }

  export() {
    var date = moment().subtract(1, 'd').format("YYYYMMDD");
    this.$http.get(`${this.domain}/BizSafeRpt/exprot/${this.slug}/${this.analysis}/${date}`, {

    }).then((response, status, headers, config) => {
      var data = response.data;
      this.getList();
      this.alertSrv.set("", data.message, "success", 4000);
      if (data.message === '报告已生成') {
        var a = document.createElement('a');
        a.href = `${this.domain}/BizSafeRpt/download/${this.slug}/${this.analysis}/${date}`;
        a.target = "target";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });

    if (!angular.isDefined(this.getListIntervalHandle)) {
      this.getListIntervalHandle = this.$interval(this.getList.bind(this), 1000 * 60);
    }
  }
}

export function popupExportDirective() {
  return {
    restrict: 'E',
    templateUrl: 'public/app/features/dashboard/modal/directives/teld-popup-export.html',
    controller: PopupExportCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
  };
}

coreModule.directive('teldPopupExport', popupExportDirective);
