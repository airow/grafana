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
  metricsTarget: Function;

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

    this.metricsTarget = () => {
      return _.map(this.panelCtrl.dataList, 'target');
    };

    this.panel.metricsLegend = this.panel.metricsLegend || { enable: false, legends: [] };
    this.panel.groupBarLegendsConf = this.panel.groupBarLegendsConf || { enable: false, legends: [] };
  }

  addGroupBarLegend() {
    this.panel.groupBarLegendsConf.legends.push({ enable: true, legend: { selected: true } });
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

  removeBarStackGroup(arrayItem, item) {
    _.pull(arrayItem.sets, item);
    if (_.size(arrayItem.sets) === 0) {
      _.pull(this.panel.groupBarStackGroupConf, arrayItem);
    }
  }

  metricsLegendFun() {
    var metrics = _.keys(this.panelCtrl.dataListMetric);
    var legends = this.panel.metricsLegend.legends;
    var dataTaget = _.map(metrics, (value, index) => {
      if (_.get(legends[index], 'key') === value) {
        return legends[index];
      } else {
        return { key: value, enable: false, legend: { name: value, selected: true } };
      }
    });

    this.panel.metricsLegend.legends = dataTaget;
  }

  refreshMetricsLegendFun(metricsLegend) {
    var metrics = _.keys(this.panelCtrl.dataListMetric);
    var legends = metricsLegend.legends;
    var dataTaget = _.map(metrics, (value, index) => {
      if (_.get(legends[index], 'key') === value) {
        return legends[index];
      } else {
        return { key: value, enable: true, legend: { name: value, selected: true } };
      }
    });

    metricsLegend.legends = dataTaget;
  }

  metricsLegendFun2() {

    var filterDataList = this.panelCtrl.dataList;
    var legends = this.panel.metricsLegend.legends;
    var dataTaget = _.map(filterDataList, (item, index) => {
      if (_.get(legends[index], 'key') === item.target) {
        return legends[index];
      } else {
        return { key: item.target, enable: false, legend: { name: item.target, selected: true } };
      }
    });

    this.panel.metricsLegend.legends = dataTaget;
  }

  removeItem(itemArray, item) {
    var index = _.indexOf(itemArray, item);
    itemArray.splice(index, 1);
    this.refresh();
  }

  move(itemArray, index, newIndex) {
    _.move(itemArray, index, newIndex);
    this.refresh();
  }

  appendColor() {
    var color = this.panel.echarts.color || (this.panel.echarts.color = [], this.panel.echarts.color);
    color.push("");
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
