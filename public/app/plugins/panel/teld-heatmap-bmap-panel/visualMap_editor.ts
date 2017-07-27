///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class VisualMapEditorCtrl {
  panel: any;
  panelCtrl: any;
  unitFormats: any;

  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;

    this.unitFormats = kbn.getUnitFormats();
  }

  render() {
    this.panelCtrl.render();
  }

  setUnitFormat(visualMap, subItem) {
    visualMap.formatter = subItem.value;
    this.panelCtrl.render();
  }
}

/** @ngInject **/
export function visualMapEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/visualMap_editor.html',
    controller: VisualMapEditorCtrl,
  };
}
