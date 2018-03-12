///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import angular from 'angular';

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

  addMarkLine() {
    var columnMarkLineDefaults = {
      type: 'average',
      label: {
        position: 'middle'
      },
      lineStyle: {}
    };

    this.panel.marklines.push(angular.copy(columnMarkLineDefaults));
  }

  removeMarkLine(markline) {
    this.panel.marklines = _.without(this.panel.marklines, markline);
  }
}

/** @ngInject **/
export function panelEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/partials/panel_editor.html',
    controller: PanelEditorCtrl,
  };
}
