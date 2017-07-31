///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class PanelEditorCtrl {
  panel: any;
  panelCtrl: any;
  cityCoord: any;

  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;
  }

  render() {
    this.panelCtrl.render();
  }
}

/** @ngInject **/
export function panelEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-chargingbill-panel/partials/panel_editor.html',
    controller: PanelEditorCtrl,
  };
}
