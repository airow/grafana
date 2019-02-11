import { QueryCtrl } from 'app/plugins/sdk';
import './css/query-editor.css!';
import _ from 'lodash';

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector) {
    super($scope, $injector);

    this.scope = $scope;
    //this.target.target = this.target.target || 'select metric';
    this.target.type = this.target.type || (this.panel.type === "teld-querybar-panel" ? 'table' : 'timeserie');

    this.target.table = this.target.table || { columns: [], rows: [] };
    this.target.timeserie = this.target.timeserie || { columns: [], rows: [] };
  }

  getTarget() {
    return this.target[this.target.type];
  }

  addColumns(type) {
    var target = this.getTarget();
    var columns = target.columns;
    if (this.target.type === 'timeserie') {
      var tsCol = { name: "time_sec" };
      if (undefined === _.find(columns, tsCol)) {
        columns.unshift(tsCol);
      }
    }
    columns.push({ name: "", type: type });
    if (_.size(target.rows) === 0) {
      target.rows.push({});
    }
  }

  move(variableArray, index, newIndex) {
    _.move(variableArray, index, newIndex);
  }

  remove(variableArray, variable) {
    var index = _.indexOf(variableArray, variable);
    variableArray.splice(index, 1);
  }

  addRow() {

  }

  getOptions(query) {
    return this.datasource.metricFindQuery(query || '');
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

