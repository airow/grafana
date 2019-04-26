///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import kbn from 'app/core/utils/kbn';
import { getAdvancedSearchKeys } from '../conf';

export class KibanaEditorCtrl {
  panel: any;
  panelCtrl: any;
  searchVars: any;
  advancedSearchKeys: any;

  /** @ngInject */
  constructor($scope, private $q, private uiSegmentSrv, private templateSrv) {
    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    if (_.isNil(this.panel.kibanaConf.filters)) {
      this.panel.kibanaConf.filters = [{}];
    }
    this.searchVars = function (queryStr, callback) {
      callback(_.map(templateSrv.variables, 'name'));
    };
    this.advancedSearchKeys = getAdvancedSearchKeys();

  }

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
export function kibanaEditor($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-iframe-panel/editor/kibana.html',
    controller: KibanaEditorCtrl,
  };
}
