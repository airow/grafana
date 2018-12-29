///<reference path="../../../../headers/common.d.ts" />
import appEvents from 'app/core/app_events';
import { SeriesDrilldownEditorCtrlBase } from 'app/features/dashboard/modal/SeriesDrilldownEditorCtrlBase';

export class SeriesDrilldownEditorCtrl extends SeriesDrilldownEditorCtrlBase {
  /** @ngInject **/
  constructor($scope, $q, templateSrv, timeSrv) {
    super($scope, $q, templateSrv, timeSrv);
    appEvents.on('emit-echartsclick', super.emitHandler.bind(this), $scope);
  }
}

/** @ngInject **/
export function seriesDrilldownEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/features/dashboard/modal/seriesDrilldown_editor.html',
    controller: SeriesDrilldownEditorCtrl,
  };
}
