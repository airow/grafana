///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import kbn from 'app/core/utils/kbn';

export class SaikuEditorCtrl {
  panel: any;
  panelCtrl: any;
  saikuConf: any;
  searchVars: any;
  // templateSrv: any;
  /** @ngInject */
  constructor($scope, private $q, private uiSegmentSrv, private templateSrv) {
    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.saikuConf = this.panel.saikuConf || { filters: [] };
    this.panel.saikuConf = this.saikuConf;
    this.searchVars = function (queryStr, callback) {
      callback(_.map(templateSrv.variables, 'name'));
    };
    // this.templateSrv = templateSrv;
  }

  // searchVars(queryStr, callback) {
  //   callback(_.map(templateSrv.variables, 'name'));
  // }

  render() {
    this.panelCtrl.render();
  }

  remove(itemArray, item) {
    var index = _.indexOf(itemArray, item);
    itemArray.splice(index, 1);
  }

  move(itemArray, index, newIndex) {
    _.move(itemArray, index, newIndex);
  }
}

/** @ngInject */
export function SaikuEditor($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-iframe-panel/editor/saiku.html',
    controller: SaikuEditorCtrl,
  };
}
