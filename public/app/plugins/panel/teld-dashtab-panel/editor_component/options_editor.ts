///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import kbn from 'app/core/utils/kbn';

export class OptionsEditorCtrl {
  panel: any;
  panelCtrl: any;
  dashboards: any;
  /** @ngInject */
  constructor($scope, private $q, private uiSegmentSrv) {
    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.dashboards = this.panel.dashboards;
  }

  render() {
    this.panelCtrl.render();
  }

  newDashboard() {
    this.dashboards.push({});
  }
}

/** @ngInject */
export function optionsEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-dashtab-panel/editor_component/options_editor.html',
    controller: OptionsEditorCtrl,
  };
}
