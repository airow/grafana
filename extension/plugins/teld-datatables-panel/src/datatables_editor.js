import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import { transformers } from './transformers';
import kbn from 'app/core/utils/kbn';

export class datatablesEditorCtrl {
  /** @ngInject */
  constructor($scope, $q, uiSegmentSrv) {
    this.$q = $q;
    this.uiSegmentSrv = uiSegmentSrv;

    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.transformers = transformers;
    this.unitFormats = kbn.getUnitFormats();
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
  showCellBordersChanged() {
    if (this.panel.showCellBorders) {
      this.panel.showRowBorders = false;
    }
  }
  render() {
    this.panelCtrl.render();
  }
}

/** @ngInject */
export function datatablesEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/plugins/teld-datatables-panel/datatables_editor.html',
    controller: datatablesEditorCtrl,
    dateUTCOffset: '',
  };
}
