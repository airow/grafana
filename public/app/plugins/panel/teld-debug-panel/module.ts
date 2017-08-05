///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';

import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import appEvents from 'app/core/app_events';
import TimeSeries from 'app/core/time_series2';

import { MetricsPanelCtrl, loadPluginCss } from 'app/plugins/sdk';


export class DebugCtrl extends MetricsPanelCtrl {
  static templateUrl = `partials/module.html`;

  dataListStringify: any;

  // Set and populate defaults
  panelDefaults = {

  };

  /** @ngInject **/
    constructor($scope, $injector, private backendSrv) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));
  }

  onDataReceived(dataList) {
    console.group('onDataReceived(dataList)');
    console.log(dataList);
    console.groupEnd();
    this.dataListStringify = JSON.stringify(dataList, null, '\t')
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    this.renderingCompleted();
  }
}

export {DebugCtrl as PanelCtrl}
