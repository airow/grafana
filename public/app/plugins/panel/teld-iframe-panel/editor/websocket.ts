///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import kbn from 'app/core/utils/kbn';

export class WebsocketEditorCtrl {
  panel: any;
  panelCtrl: any;
  websocketConf: any;
  /** @ngInject */
  constructor($scope, private $q, private uiSegmentSrv) {
    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.websocketConf = this.panel.websocketConf;
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
export function WebsocketEditor($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-iframe-panel/editor/websocket.html',
    controller: WebsocketEditorCtrl,
  };
}
