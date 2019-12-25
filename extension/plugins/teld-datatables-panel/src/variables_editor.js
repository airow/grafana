import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import kbn from 'app/core/utils/kbn';

export class variablesEditorCtrl {
  /** @ngInject */
  constructor($scope, $q, uiSegmentSrv) {
    this.$q = $q;
    this.uiSegmentSrv = uiSegmentSrv;

    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.colorModes = [
      { text: 'Disabled', value: null },
      { text: 'Cell', value: 'cell' },
      { text: 'Value', value: 'value' },
      { text: 'Row', value: 'row' },
    ];
    this.columnTypes = [
      { text: 'Number', value: 'number' },
      { text: 'String', value: 'string' },
      { text: 'Date', value: 'date' },
      { text: 'Hidden', value: 'hidden' },
      { text: 'link', value: 'link' }
    ];
    this.timeRangeUnits = [
      { text: 'Second', value: 'seconds' },
      { text: 'Minute', value: 'minutes' },
      { text: 'Hour', value: 'hours' },
      { text: 'Day', value: 'days' },
      { text: 'Month', value: 'months' },
      { text: 'Quarter', value: 'quarters' },
      { text: 'Year', value: 'years' },
    ];
    this.fontSizes = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];
    this.dateFormats = [
      { text: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
      { text: 'MM/DD/YY h:mm:ss a', value: 'MM/DD/YY h:mm:ss a' },
      { text: 'MMMM D, YYYY LT', value: 'MMMM D, YYYY LT' },
    ];

    this.columnSortMethods = [
      { text: 'Ascending', value: 'asc' },
      { text: 'Descending', value: 'desc' }
    ];

    this.addColumnSegment = uiSegmentSrv.newPlusButton();

    // this is used from bs-typeahead and needs to be instance bound
    this.getColumnNames = () => {
      if (!this.panelCtrl.table) {
        return [];
      }
      return _.map(this.panelCtrl.table.columns, function (col) {
        return col.text;
      });
    };


  }

  removeVariable(variableArray, variable) {
    var index = _.indexOf(variableArray, variable);
    variableArray.splice(index, 1);
  }
  move(variableArray, index, newIndex) {
    _.move(variableArray, index, newIndex);
  }

  render() {
    this.panelCtrl.render();
  }
}

/** @ngInject */
export function variablesEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/plugins/teld-datatables-panel/variables_editor.html',
    controller: variablesEditorCtrl,
  };
}
