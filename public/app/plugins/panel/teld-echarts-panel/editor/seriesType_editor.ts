///<reference path="../../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class SeriesTypeEditorCtrl {
  panel: any;
  panelCtrl: any;
  allChecked: boolean;
  unitFormats: any;

  /** @ngInject **/
  constructor(private $scope, private $q, private templateSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.panel.seriesTypeConf = this.panel.seriesTypeConf || [];
    this.panel.yAxisConf = this.panel.yAxisConf || [];
    $scope.ctrl = this;
    this.allChecked = _.isEmpty(_.find(this.panel.seriesTypeConf, { enable: false }));

    this.unitFormats = kbn.getUnitFormats();
  }

  metricsTarget() {
    var filterDataList = this.panelCtrl.dataList;
    //var refId = [] || _.map(this.panel.targets, 'refId');
    var refId = _.map(this.panel.targets, 'refId');
    var groupKey = _.map(filterDataList, 'groupKey');
    var dataTaget = _.map(filterDataList, 'target');
    var calcSeriesTaget = _.map(this.panel.calcSeriesConf, 'target');
    var ecOptionSeries = _.get(this.panelCtrl, 'ecOption.baseOption.series', []);
    var seriesName = _.map(ecOptionSeries, 'name');
    return _.union(refId, groupKey, dataTaget, calcSeriesTaget, seriesName);
  }

  yAxisList() {
    return _.union(['', 'yAxis'], _.map(_.filter(this.panel.yAxisConf, 'show'), 'key'));
  }

  appendAxisConf() {
    var conf = { show: true, position: 'right', axisLabel: { show: true }, axisTick: { show: true }, offset: 0, name: '' };
    this.panel.yAxisConf.push(conf);
  }

  appendSeriesTypeConf() {
    var conf = {
      enable: true, target: '', label: { normal: {} },
      markPoint: { data: [] }, markLine: { data: [] }, markArea: { data: [] }
    };
    this.panel.seriesTypeConf.push(conf);
  }

  setUnitFormat(axis, subItem) {
    axis.format = subItem.value;
    this.panelCtrl.render();
  }

  appendItem(itemArray) {
    if (_.size(itemArray) === 0) { itemArray = []; }
    itemArray.push({});
  }

  checkedAll(array) {
    _.each(array, item => { item.enable = this.allChecked; });
    this.refresh();
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

  render() {
    this.panelCtrl.render();
  }

  refresh() {
    this.panelCtrl.refresh();
  }
}

/** @ngInject **/
export function seriesTypeEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/editor/seriesType_editor.html',
    controller: SeriesTypeEditorCtrl,
  };
}
