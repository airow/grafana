///<reference path="../../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class LayoutEditorCtrl {
  panel: any;
  panelCtrl: any;

  /** @ngInject **/
  constructor(private $scope, private $q, private templateSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.panel.LayoutConf = this.panel.LayoutConf || {};
    $scope.ctrl = this;
  }

  render() {
    this.panelCtrl.render();
  }

  precastSolutions = [
    {
      sln: "大屏-终端总数",
      layout: {
        rightStyle: { 'position': 'relative', 'float': 'left', 'left': '10px', 'height': '70px' }
      }
    },
    {
      sln: "大屏-充电量",
      layout: {
        leftStyle: { 'position': 'absolute', 'left': '-54px' },
        rightStyle: { 'position': 'relative', 'float': 'left', 'left': '150px', 'height': '70px' }
      }
    },
    {
      sln: "大屏-充电次数",
      layout: {
        leftStyle: { 'position': 'relative', 'left': '30px' },
        rightStyle: { 'position': 'relative', 'float': 'left', 'left': '40px', 'height': '70px' }
      }
    }
  ];

  setPrecastSolutions(precastSln) {
    _.assign(this.panel.LayoutConf, precastSln.layout);
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
export function LayoutEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-flipcountdown-panel/editor/layout_editor.html',
    controller: LayoutEditorCtrl,
  };
}
