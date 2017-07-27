///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class LegendGroupEditorCtrl {
  panel: any;
  panelCtrl: any;

  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;
  }

  render() {
    this.panelCtrl.render();
  }

  addLegend() {
    this.panel.legendGroup.push({
      name: `lg${this.panel.legendGroup.length}`,
      show: true,
      data: [{}]
    });
  }

  removeLegend(legend) {
    _.remove(this.panel.legendGroup, legend);
  }

  addData(legend) {
    legend.data.push({});
  }

  removeData(legend, data) {
    _.remove(legend.data, data);
  }
}

/** @ngInject **/
export function legendGroupEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/legendgroup_editor.html',
    controller: LegendGroupEditorCtrl,
  };
}
