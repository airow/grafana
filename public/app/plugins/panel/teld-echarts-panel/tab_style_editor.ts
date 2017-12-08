///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import './directives/all';

export class TabStyleEditorCtrl {
  panel: any;
  panelCtrl: any;
  cityCoord: any;

  subTab: any;
  unitFormats: any;

  getSerieType = () => {
    return _.keys(this.panelCtrl.ecConf.series);
  }

  getXAxisMode = () => {
    return ['time', 'series'];
  }

  getThemeName: Function;


  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;

    this.subTab = 0;

    this.unitFormats = kbn.getUnitFormats();

    this.getThemeName = () => {
      let serieType = this.panel.serieType || 'line';
      return _.get(this.panelCtrl.echartsThemeName, `${serieType}Theme`);
    };
  }

  setUnitFormat(axis, subItem) {
    axis.format = subItem.value;
    this.panelCtrl.render();
  }

  render() {
    this.panelCtrl.render();
  }

  refresh() {
    this.panelCtrl.refresh();
  }
}

/** @ngInject **/
export function tabStyleEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/partials/tab_style_editor.html',
    controller: TabStyleEditorCtrl,
  };
}
