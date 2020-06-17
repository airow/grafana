///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import { TeldServiceGatewayQueryCtrl, TeldServiceGatewayQuery } from 'app/plugins/datasource/teld-servicegateway-datasource/query_ctrl';

export interface QueryMeta {
  sql: string;
}

export class TeldESSQLQueryCtrl extends TeldServiceGatewayQueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  GroupKey: any[];
  ESSql: any;
  DataType: any;

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.GroupKey = [
      { text: 'BZGroup1 ', value: 'BZGroup1' },
      { text: 'BZGroup2', value: 'BZGroup2' },
      { text: 'ESBiz', value: 'ESBiz' },
      { text: 'ESLog', value: 'ESLog' },
      { text: 'ESLog2', value: 'ESLog2' }
    ];
    this.target.url = "${urlHelper.sghost('sgi')}/api/invoke?SID=BIDA-GetEsData";
    this.target.filterWrap = true;
    this.target.filterKey = 'filter';

    if (_.isNil(_.find(this.target.parameters, { key: 'ESGroup' }))) {
      this.target.parameters.push({ required: true, type: 'value', key: 'ESGroup', value: '' });
    }

    this.DataType = _.find(this.target.parameters, { key: 'DataType' });
    if (_.isNil(this.DataType)) {
      this.DataType = { uiHide: true, required: true, type: 'value', key: 'DataType', value: '' };
      this.target.parameters.push(this.DataType);
    }

    if (_.isNil(_.find(this.target.parameters, { key: 'GroupField' }))) {
      this.target.parameters.push({ required: true, type: 'value', key: 'GroupField', value: '' });
    }

    this.ESSql = (_.find(this.target.parameters, { key: 'ESSql' }));
    if (_.isNil(this.ESSql)) {
      this.ESSql = { uiHide: true, required: true, type: 'value', key: 'ESSql', value: '' };
      this.target.parameters.push(this.ESSql);
    }

    if (_.isNil(_.find(this.target.parameters, { key: 'DataAuthFunID' }))) {
      this.target.parameters.push({ required: true, type: 'value', key: 'DataAuthFunID', value: '' });
    }

    if (_.isNil(_.find(this.target.parameters, { key: 'DataAuthPerID' }))) {
      this.target.parameters.push({ type: 'value', key: 'DataAuthPerID', value: '' });
    }
  }

  onDataReceived(dataList) {
    this.lastQueryMeta = null;
    this.lastQueryError = null;

    let anySeriesFromQuery = _.find(dataList, { refId: this.target.refId });
    if (anySeriesFromQuery) {
      this.lastQueryMeta = anySeriesFromQuery.meta;
    }
  }

  getCollapsedText() {
    return super.getCollapsedText();
  }
}
