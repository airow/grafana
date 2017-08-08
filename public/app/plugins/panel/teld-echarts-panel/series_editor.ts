///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class SeriesEditorCtrl {
  panel: any;
  panelCtrl: any;
  seriesConf: any;
  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;

    this.seriesConf = this.panel.echarts.series;
  }

  render() {
    this.panelCtrl.render();
  }
}

/** @ngInject **/
export function seriesEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/partials/series_editor.html',
    controller: SeriesEditorCtrl,
  };
}
