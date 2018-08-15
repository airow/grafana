///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import * as graphutils from 'app/core/utils/graphutils';

export class CumulativeEditorCtrl {
  panel: any;
  panelCtrl: any;
  allChecked: boolean;

  /** @ngInject **/
  constructor(private $scope, private $q, private templateSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.panel.calcSeriesConf = this.panel.calcSeriesConf || [];
    this.panel.hideMetrics = this.panel.hideMetrics || [];
    $scope.ctrl = this;
    this.allChecked = _.isEmpty(_.find(this.panel.calcSeriesConf, { enable: false }));
  }

  metricsTarget() {
    var filterDataList = _.filter(this.panelCtrl.dataList, item => { return true !== item.calcSerie; });
    var refId = [] || _.map(this.panel.targets, 'refId');
    var groupKey = _.map(filterDataList, 'groupKey');
    var dataTaget = _.map(filterDataList, 'target');
    return _.union(refId, groupKey, dataTaget);
  }


  dashVars() {
    return graphutils.dashVars(this.templateSrv.variables);
  }

  checkedAll() {
    _.each(this.panel.calcSeriesConf, item => { item.enable = this.allChecked; });
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
export function cumulativeEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/graph/cumulative_editor.html',
    controller: CumulativeEditorCtrl,
  };
}

export function cumulative(cumulativeConf, dataList) {
  if (cumulativeConf && cumulativeConf.enable) {
    if (cumulativeConf.enableInit) {
      var initMapping = cumulativeConf.initMapping;
      _.each(initMapping, item => {
        var initRefId = _.find(dataList, { refId: item.initRefId });
        if (initRefId) {
          //hideMetrics.push(item.S);
          var sumValue = _.sumBy(initRefId.datapoints, dp => { return dp[0]; });
          var sets = _.filter(dataList, i => { return _.includes(item.sets, i.refId); });
          _.each(sets, data => {
            var cumulative = 0;
            _.each(data.datapoints, dp => {
              cumulative += (+dp[0]);
              dp[0] = (cumulative + sumValue);
            });
          });
          _.pull(dataList, initRefId);
        }
      });
    } else {
      _.each(dataList, data => {
        var cumulative = 0;
        _.each(data.datapoints, dp => {
          cumulative += (+dp[0]);
          dp[0] = cumulative;
        });
      });
    }
  }
}
