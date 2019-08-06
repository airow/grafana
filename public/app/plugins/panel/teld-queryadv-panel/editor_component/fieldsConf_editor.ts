///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import kbn from 'app/core/utils/kbn';

export class FieldsConfEditorCtrl {
  panel: any;
  panelCtrl: any;
  OperatorConf: any;
  /** @ngInject */
  constructor($scope, private $q, private uiSegmentSrv) {
    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;

    this.OperatorConf = {
      "string": [
        { key: "=", display: "等于" },
        { key: "like", display: "包含" },
      ],
      "date": [
        { key: "=", display: "=" },
        { key: ">", display: ">" },
        { key: ">=", display: ">=" },
        { key: "<", display: "<" },
        { key: "<=", display: "<=" },
      ],
      "number": [
        { key: "=", display: "=" },
        { key: ">", display: ">" },
        { key: ">=", display: ">=" },
        { key: "<", display: "<" },
        { key: "<=", display: "<=" },
      ]
    };
  }

  addField() {
    this.panel.fieldsConf.push({ operatorList: [], ds: [] });
  }

  add(array, def?) {
    array.push(def || {});
  }

  remove(array, index) {
    array.splice(index, 1);
  }

  getOpList(field) {
    if (field) {
      var operatorList = this.OperatorConf[field.type] || [];
      return operatorList;
    } else {
      return [];
    }
  }

  getTypeList(field) {
    return _.keys(this.OperatorConf);
  }

  render() {
    this.panelCtrl.render();
  }
}

/** @ngInject */
export function fieldsConfEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-queryadv-panel/editor_component/fieldsConf_editor.html',
    controller: FieldsConfEditorCtrl,
  };
}
