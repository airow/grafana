///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class LegendEditorCtrl {
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

  add() {
    this.panel.legend.data.push({ });
  }

  remove(legend) {
    _.remove(this.panel.legend.data, legend);
  }
}

/** @ngInject **/
export function legendEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/legend_editor.html',
    controller: LegendEditorCtrl,
  };
}
