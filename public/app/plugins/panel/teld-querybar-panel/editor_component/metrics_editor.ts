///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';
import config from 'app/core/config';

import kbn from 'app/core/utils/kbn';

export class MetricsEditorCtrl {
  panel: any;
  panelCtrl: any;
  datasource: any;
  datasourceName: any;
  datasourceSrv: any;
  timeSrv: any;
  templateSrv: any;
  /** @ngInject */
  constructor($scope, $injector) {
    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;

    this.datasourceSrv = $injector.get('datasourceSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.templateSrv = $injector.get('templateSrv');
  }

  render() {
    this.panelCtrl.render();
  }

  setDatasource(datasource) {
    // switching to mixed
    if (datasource.meta.mixed) {
      _.each(this.panel.targets, target => {
        target.datasource = this.panel.datasource;
        if (!target.datasource) {
          target.datasource = config.defaultDatasource;
        }
      });
    } else if (this.datasource && this.datasource.meta.mixed) {
      _.each(this.panel.targets, target => {
        delete target.datasource;
      });
    }

    this.panel.datasource = datasource.value;
    this.datasourceName = datasource.name;
    this.datasource = null;
  }
}

/** @ngInject */
export function metricsEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-querybar-panel/editor_component/metrics_editor.html',
    controller: MetricsEditorCtrl,
  };
}
