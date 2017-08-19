///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

export class EventHandlerEditorCtrl {
  panel: any;
  panelCtrl: any;

  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;
  }

  render() {
    this.panelCtrl.render();
  }

  refresh() {
    this.panelCtrl.refresh();
  }
}
