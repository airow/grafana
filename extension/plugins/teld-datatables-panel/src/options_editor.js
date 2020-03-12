import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';

import { transformers } from './transformers';
import kbn from 'app/core/utils/kbn';

export class optionsEditorCtrl {
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
      { text: 'link', value: 'link' },
      { text: 'calc', value: 'calc' }
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

    this.columnAlign = [
      { text: '左对齐', value: 'text-align:left;' },
      { text: '居中', value: 'text-align:center;' },
      { text: '右对齐', value: 'text-align:right;' },
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

  getColumnOptions() {
    if (!this.panelCtrl.dataRaw) {
      return this.$q.when([]);
    }
    var columns = this.transformers[this.panel.transform].getColumns(this.panelCtrl.dataRaw);
    var segments = _.map(columns, (c) => this.uiSegmentSrv.newSegment({ value: c.text }));
    return this.$q.when(segments);
  }

  addColumn() {
    var columns = transformers[this.panel.transform].getColumns(this.panelCtrl.dataRaw);
    var column = _.find(columns, { text: this.addColumnSegment.value });

    if (column) {
      this.panel.columns.push(column);
      this.render();
    }

    var plusButton = this.uiSegmentSrv.newPlusButton();
    this.addColumnSegment.html = plusButton.html;
    this.addColumnSegment.value = plusButton.value;
  }

  transformChanged() {
    if (this.panel.transform !== "json") {
      this.panel.jsonr2c = false;
    }
    this.panel.columns = [];
    this.render();
  }

  render() {
    this.panelCtrl.render();
  }

  removeColumn(column) {
    this.panel.columns = _.without(this.panel.columns, column);
    this.panelCtrl.render();
  }

  // extColumn;
  addExtColumn() {
    this.extColumn = { text: 'this.addColumnSegment.value' };

    if (this.extColumn) {
      this.panel.extColumns.push(this.extColumn);
      this.render();
    }

    var plusButton = this.uiSegmentSrv.newPlusButton();
  }

  removeExtColumn(column) {
    this.panel.extColumns = _.without(this.panel.extColumns, column);
    this.panelCtrl.render();
  }

  setUnitFormat(column, subItem) {
    column.unit = subItem.value;
    this.panelCtrl.render();
  };

  addColumnStyle() {
    var columnStyleDefaults = {
      unit: 'short',
      type: 'number',
      decimals: 2,
      colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
      colorMode: null,
      pattern: '/.*/',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      thresholds: [],
    };

    this.panel.styles.push(angular.copy(columnStyleDefaults));
  }

  removeColumnStyle(style) {
    this.panel.styles = _.without(this.panel.styles, style);
  }

  moveColumnStyle(style, index, newIndex) {
    _.move(style, index, newIndex);
  }

  invertColorOrder(index) {
    var ref = this.panel.styles[index].colors;
    var copy = ref[0];
    ref[0] = ref[2];
    ref[2] = copy;
    this.panelCtrl.render();
  }

  addColumnSortingRule() {
    const defaultRule = {
      columnData: 0,
      sortMethod: 'desc',
    };
    // check if this column already exists
    this.panel.sortByColumns.push(angular.copy(defaultRule));
    this.columnSortChanged();
  }

  removeSortByColumn(column) {
    this.panel.sortByColumns = _.without(this.panel.sortByColumns, column);
    this.columnSortChanged();
  }

  columnSortChanged() {
    // take the values in sortByColumns and convert them into datatables format
    const data = [];
    if (this.panel.sortByColumns.length > 0) {
      for (let i = 0; i < this.panel.sortByColumns.length; i++) {
        // allow numbers and column names
        const columnData = this.panel.sortByColumns[i].columnData;
        let columnNumber = 0;
        try {
          columnNumber = parseInt(columnData, 10);
        } catch (e) {
          // check if empty
          if (columnData === '') {
            columnNumber = 0;
          }
          // find the matching column index
          for (let j = 0; j < this.panel.columns.length; j++) {
            if (this.panel.columns[j].text === columnData) {
              columnNumber = j;
              break;
            }
          }
        }
        const sortDirection = this.panel.sortByColumns[i].sortMethod;
        data.push([columnNumber, sortDirection]);
      }
    } else {
      // default to column 0, descending
      data.push([0, 'desc']);
    }
    this.panel.sortByColumnsData = data;
    this.render();
  }

  addColumnWidthHint() {
    const defaultHint = {
      name: '',
      width: '80px',
    };
    // check if this column already exists
    this.panel.columnWidthHints.push(angular.copy(defaultHint));
    this.columnWidthHintsChanged();
  }

  removeColumnWidthHint(column) {
    this.panel.columnWidthHints = _.without(this.panel.columnWidthHints, column);
    this.columnWidthHintsChanged();
  }

  columnWidthHintsChanged() {
    this.render();
  }
}

/** @ngInject */
export function optionsEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/plugins/teld-datatables-panel/options_editor.html',
    controller: optionsEditorCtrl,
    dateUTCOffset: '',
  };
}
