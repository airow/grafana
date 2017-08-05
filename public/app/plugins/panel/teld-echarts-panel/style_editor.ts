///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class StyleEditorCtrl {
  panel: any;
  panelCtrl: any;
  cityCoord: any;

  getSerieType = () => {
    return _.keys(this.panelCtrl.ecConf.series);
  }
  getThemeName: Function;


  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;

    this.getThemeName = () => {
      let serieType = this.panel.serieType || 'line';
      return _.get(this.panelCtrl.echartsThemeName, `${serieType}Theme`);
    };
  }

  render() {
    this.panelCtrl.render();
  }
}

/** @ngInject **/
export function styleEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/partials/style_editor.html',
    controller: StyleEditorCtrl,
  };
}
