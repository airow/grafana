///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

import { EventHandlerEditorCtrl } from './event_handler_editor';

export class EchartsEventHandlerEditorCtrl extends EventHandlerEditorCtrl {

  /** @ngInject **/
  constructor($scope, $q) {
    super($scope, $q);
  }

  addEventPanel() {
    let eventSubscribe = _.get(this.panel, "eventSubscribe", { eventPanels: [] });
    this.panel.eventSubscribe = eventSubscribe;

    let eventPanels = _.get(eventSubscribe, "eventPanels", []);
    eventSubscribe.eventPanels = eventPanels;
    eventSubscribe.eventPanels.push({});
  }

  removeEventPanel(index) {
    this.panel.eventSubscribe.eventPanels.splice(index, 1);
  }
}

/** @ngInject **/
export function echartsEventEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-eventhandler-editor/echarts_eventhandler_editor.html',
    controller: EchartsEventHandlerEditorCtrl,
  };
}
