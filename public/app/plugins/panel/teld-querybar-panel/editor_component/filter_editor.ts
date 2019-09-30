///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';
import config from 'app/core/config';
import timeCycleConf from 'app/features/panel/timeCycleConf';

import kbn from 'app/core/utils/kbn';

export class FilterEditorCtrl {
  panel: any;
  panelCtrl: any;
  timeSrv: any;
  /** @ngInject */
  constructor(private $scope, private $q, private templateSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.panel.filterConf = this.panel.filterConf || [];
    if (_.isUndefined(this.panel.filterPrefix)) {
      this.panel.filterPrefix = "qfilter";
    }
    $scope.ctrl = this;
  }

  appendFilterConf() {
    var conf = { enable: true, scope: 'g' };
    this.panel.filterConf.push(conf);
  }

  addSelectOpts(filterItem, item) {
    var choices = filterItem.field.choices || (filterItem.field.choices = [], filterItem.field.choices);
    this.addItem(choices, item);
  }

  addItem(itemArray, item) {
    itemArray.push(item);
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

/** @ngInject */
export function filterEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-querybar-panel/editor_component/filter_editor.html',
    controller: FilterEditorCtrl,
  };
}
