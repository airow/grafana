///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import {QueryCtrl} from 'app/plugins/sdk';

export interface TeldServiceGatewayQuery {
  refId: string;
  url: string;
  format: string;
  time_sec: string;
  time_sec_format: string;
  alias: string;
  parameters: any[];
  filterWrap: boolean;
  filterKey: string;
}

export interface QueryMeta {
  sql: string;
}

export class TeldServiceGatewayQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  showLastQuerySQL: boolean;
  formats: any[];
  dateFormats: any[];
  target: TeldServiceGatewayQuery;
  lastQueryMeta: QueryMeta;
  lastQueryError: string;
  showHelp: boolean;

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.target.url = this.target.url || "${urlHelper.sghost('sgi')}/api/invoke?SID=";
    this.target.format = this.target.format || 'time_series';
    this.target.time_sec = this.target.time_sec || 'time_sec';
    this.target.time_sec_format = this.target.time_sec_format || 'x';
    this.target.alias = "";
    this.target.parameters = this.target.parameters || [];
    //this.target.filterWrap = _.isBoolean(this.target.filterWrap) ? this.target.filterWrap : false;
    this.target.filterKey = this.target.filterKey || 'filter';

    this.formats = [
      {text: 'Time series', value: 'time_series'},
      //{text: 'Time series Objs', value: 'time_series_objs'},
      {text: 'Table', value: 'table'},
      {text: 'Series', value: 'series'},
      {text: 'SG Table', value: 'sg_table'},
      //{text: 'Objects', value: 'object'},
    ];
    this.dateFormats = [
      {text: 'Unix ms timestamp',  value: 'x'},
      {text: 'Unix timestamp',  value: 'X'},
      {text: 'YYYYMMDD', value: 'YYYYMMDD'},
      {text: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss'},
      {text: 'MM/DD/YY h:mm:ss a', value: 'MM/DD/YY h:mm:ss a'},
      {text: 'MMMM D, YYYY LT',  value: 'MMMM D, YYYY LT'},
    ];


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
    var index = _.indexOf(itemArray, item);
    itemArray.splice(index, 1);
  }

  moveItem(itemArray, index, newIndex) {
    _.move(itemArray, index, newIndex);
  }

  addColumns(columns, type) {
    columns.push({ name: "", type: type });
  }

  delColumn(obj, key) {
    delete obj[key];
  }

  getCollapsedText() {
    var text = '';
    var format = _.find(this.formats, { value: this.target.format });
    text = `${this.target.url} Format as ${format.text}`;
    return text;
  }
}


