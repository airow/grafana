///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import angular from 'angular';

export class SeriesEditorCtrl {
  panel: any;
  panelCtrl: any;
  seriesConf: any;
  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;

    this.seriesConf = this.panel.echarts.series;
  }

  addExpressionArgument() {
    let calcExpression = this.seriesConf[this.panel.serieType].markPoint.formatterExpression;
    calcExpression.args = calcExpression.args || [];
    calcExpression.args.push({});
  }

  removeExpressionArgument(index) {
    this.seriesConf[this.panel.serieType].markPoint.formatterExpression.args.splice(index, 1);
  }

  addMarkPointData() {

    let serie = _.get(this.seriesConf, this.panel.serieType, { markPoint: { data: [] } });
    this.seriesConf[this.panel.serieType] = serie;

    let markPoint = _.get(serie, "markPoint", { data: [] });
    serie["markPoint"] = markPoint;
    markPoint.data.push({});
  }

  removeMarkPointData(index) {
    this.seriesConf[this.panel.serieType].markPoint.data.splice(index, 1);
  }

  addArgument(args) {
    args.push({});
  }

  removeArgument(args,index) {
    args.splice(index, 1);
  }

  removeTargetByKey = (target, key) => {
    delete target[key];
  }

  addMarkLine() {
    var columnMarkLineDefaults = {
      type: 'average',
      label: {
        position: 'middle'
      },
      lineStyle: {
        width: 1
      }
    };

    let marklines = this.panel.marklines || [];
    this.panel.marklines = marklines;

    this.panel.marklines.push(angular.copy(columnMarkLineDefaults));
  }

  removeMarkLine(markline) {
    this.panel.marklines = _.without(this.panel.marklines, markline);
  }

  render() {
    this.panelCtrl.render();
  }
}

/** @ngInject **/
export function seriesEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/partials/series_editor.html',
    controller: SeriesEditorCtrl,
  };
}
