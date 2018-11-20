///<reference path="../../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import timeCycleConf from 'app/features/panel/timeCycleConf';
export class CycleEditorCtrl {
  panel: any;
  panelCtrl: any;

  /** @ngInject **/
  constructor(private $scope, private $q, private templateSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.panel.cycleConf = this.panel.cycleConf || [];
    var filterCycle = _.filter(this.timeCycleConf, item => { return item.disable !== true; });
    _.defaults(this.panel.cycleConf, filterCycle);
    $scope.ctrl = this;
  }

  timeCycleConf = _.clone(timeCycleConf);

  render() {
    this.panelCtrl.render();
  }

  setInitCycle(cycle) {
    this.panel.initCycle === cycle.key ? this.panel.initCycle = '' : this.panel.initCycle = cycle.key;
    this.panelCtrl.setCurrentCycle(cycle);
  }

  refresh() {
    this.panelCtrl.refresh();
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

/** @ngInject **/
export function cycleEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-echarts-panel/editor/cycle_editor.html',
    controller: CycleEditorCtrl,
  };
}
