///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import {QueryCtrl} from 'app/plugins/sdk';

export interface TeldServiceGatewayQuery {
  refId: string;
  format: string;
  alias: string;
  rawSql: string;
  parameters: any[];
}

export interface QueryMeta {
  sql: string;
}

export class TeldServiceGatewayQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  showLastQuerySQL: boolean;
  formats: any[];
  target: TeldServiceGatewayQuery;
  lastQueryMeta: QueryMeta;
  lastQueryError: string;
  showHelp: boolean;

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);

    this.target.format = this.target.format || 'time_series';
    this.target.alias = "";
    this.target.parameters = this.target.parameters || [];
    this.formats = [
      {text: 'Time series', value: 'time_series'},
      //{text: 'Time series Objs', value: 'time_series_objs'},
      {text: 'Table', value: 'table'},
      //{text: 'Objects', value: 'object'},
    ];

    if (!this.target.rawSql) {

      // special handling when in table panel
      if (this.panelCtrl.panel.type === 'table') {
        this.target.format = 'table';
        this.target.rawSql = "SELECT 1";
      } else {

      }
    }

    this.panelCtrl.events.on('data-received', this.onDataReceived.bind(this), $scope);
    this.panelCtrl.events.on('data-error', this.onDataError.bind(this), $scope);
  }

  onDataReceived(dataList) {
    this.lastQueryMeta = null;
    this.lastQueryError = null;

    let anySeriesFromQuery = _.find(dataList, {refId: this.target.refId});
    if (anySeriesFromQuery) {
      this.lastQueryMeta = anySeriesFromQuery.meta;
    }
  }

  onDataError(err) {
    if (err.data && err.data.results) {
      let queryRes = err.data.results[this.target.refId];
      if (queryRes) {
        this.lastQueryMeta = queryRes.meta;
        this.lastQueryError = queryRes.error;
      }
    }
  }

  paramToString(param) {
    let returnValue = `${param.key}=${angular.toJson(param.value)}`;
    return returnValue;
  }

  removeItem(itemArray, item) {
    var index = _.indexOf(itemArray, itemArray);
    itemArray.splice(index, 1);
  }

  moveItem(itemArray, index, newIndex) {
    _.move(itemArray, index, newIndex);
  }
}


