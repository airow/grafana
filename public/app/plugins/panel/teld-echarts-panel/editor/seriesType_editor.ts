///<reference path="../../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class SeriesTypeEditorCtrl {
  panel: any;
  panelCtrl: any;
  allChecked: boolean;

  /** @ngInject **/
  constructor(private $scope, private $q, private templateSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.panel.seriesTypeConf = this.panel.seriesTypeConf || [];
    this.panel.yAxisConf = this.panel.yAxisConf || [];
    $scope.ctrl = this;
    this.allChecked = _.isEmpty(_.find(this.panel.seriesTypeConf, { enable: false }));
  }

  metricsTarget() {
    var filterDataList = this.panelCtrl.dataList;
    var refId = [] || _.map(this.panel.targets, 'refId');
    var groupKey = _.map(filterDataList, 'groupKey');
    var dataTaget = _.map(filterDataList, 'target');
    var calcSeriesTaget = _.map(this.panel.calcSeriesConf, 'target');
    return _.union(refId, groupKey, dataTaget, calcSeriesTaget);
  }

  yAxisList() {
    return _.union([''], _.map(_.filter(this.panel.yAxisConf, 'show'), 'name'));
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
