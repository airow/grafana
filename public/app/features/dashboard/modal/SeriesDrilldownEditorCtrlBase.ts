///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import appEvents from 'app/core/app_events';
import angular from 'angular';
import moment from 'moment';
import SeriesDrilldownParsing from 'app/core/series_drilldown';

export class SeriesDrilldownEditorCtrlBase {
  panel: any;
  panelCtrl: any;
  clickData: any;
  dashVars: any;
  seriesDrilldownParsing: any;

  /** @ngInject **/
  constructor(private $scope, private $q, private templateSrv, private timeSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.panel.seriesLinkConf = this.panel.seriesLinkConf || [];
    $scope.ctrl = this;
    this.panelCtrl.seriesDrillDebug = false;
    this.seriesDrilldownParsing = new SeriesDrilldownParsing(this.templateSrv, this.timeSrv);
    this.refreshDashVars();

    // appEvents.on('emit-echartsclick', this.emitHandler.bind(this), this.$scope);
    // appEvents.on('emit-plotclick', this.emitHandler.bind(this), this.$scope);
  }

  emitHandler(data) {
    var { clickData } = data;
    this.$scope.$apply(function () {
      this.clickData = clickData;
    }.bind(this));
  }

  print(link) {
    let bindLike = this.seriesDrilldownParsing.parsingLink(link, this.clickData || {});
    return bindLike.href;
  }

  refreshDashVars() {
    this.dashVars = this.seriesDrilldownParsing.refreshDashVars();
  }

  getDashVars() {
    return this.dashVars;
  }

  getTypeof(value) {
    return typeof value;
  }

  render() {
    this.panelCtrl.render();
  }

  refresh() {
    this.panelCtrl.refresh();
  }

  addLink() {
    this.panel.seriesLinkConf.push({ enable: true });
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
}
