///<reference path="../../../../../headers/common.d.ts" />

import kbn from 'app/core/utils/kbn';
import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import { MetricsPanelCtrl } from 'app/features/panel/metrics_panel_ctrl';

export class PopupVariablesListCtrl {
  alertSrv: any;
  panel: any;
  panelCtrl: any;
  dashboard: any;
  targetExport: any;
  links: any[];
  variables: any[];
  getListIntervalHandle: any;
  fields: any[];
  ADMdtp: any;
  OperatorConf: any;

  domain: string;
  slug: string;
  analysis: string;
  variablesGroup: any;
  selectedTab: any;
  /** @ngInject */
  constructor(alertSrv, private $http, private templateSrv, private datasourceSrv
    , private $interval, private $scope, private $routeParams, private timeSrv) {
    this.alertSrv = alertSrv;
    this.panel = this.$scope.panel;
    this.panelCtrl = this.$scope.panelCtrl;
    this.dashboard = this.$scope.dashboard;
    this.targetExport = this.$scope.targetExport;
    this.variables = _.cloneDeep(this.$scope.variables);
  }

  submit() {
    //this.panelCtrl.fillVariable(this.variables);
    // this.timeSrv.refreshDashboard();
    this.$scope.dismiss();
  }

  processTeldVariable(varItem,initLock, isVariableSrvCall?) {
    // debugger;
    if (this.panel.onDashboardRefresh && isVariableSrvCall) {
      // alert(1);
      initLock.resolve();
      return Promise.resolve();
    }
    var pickMethods = ['updateTimeRange', 'applyPanelTimeOverrides', 'setRangeString',
      'calculateInterval', 'issueQueries'
    ];
    var instanceMetricsPanelCtrl = _.pick(MetricsPanelCtrl.prototype, pickMethods);
    _.assign(instanceMetricsPanelCtrl, _.pick(this.panelCtrl, ['timeSrv', 'templateSrv', 'dashboard']));
    instanceMetricsPanelCtrl.panel = varItem.field.panelCtrl.panel;
    //instanceMetricsPanelCtrl.updateTimeRange.bind(this)();
    instanceMetricsPanelCtrl.updateTimeRange();
    return this.datasourceSrv.get(instanceMetricsPanelCtrl.panel.datasource)
      .then(instanceMetricsPanelCtrl.issueQueries.bind(instanceMetricsPanelCtrl))
      .then(this.handleQueryResult.bind(this))
      // .then(this.handleVariable.bind(this))
      .finally(() => {
        alert(1);
        // initLock.resolve();
      });
  }
  handleQueryResult(result) {
    if (!result || !result.data) {
      console.log('Data source query result invalid, missing data field:', result);
      result = { data: [] };
    }
    //聚合table结构数据多行数据为一行
    this.aggregationTableRows(result);
    return result;
  }
  aggregationTableRows(result) {
    var rowsTables = _.filter(result.data, function (o) { return o.type === "table" && _.size(o.rows) > 1; });
    if (_.size(rowsTables) > 0) {
      switch (this.panel.valueName) {
        case 'join':
          this.aggregationTableRowsJoin(rowsTables);
          break;
        default:
          this.aggregationTableRowsNumber(rowsTables);
          break;
      }
    }
    return result;
  }
  aggregationTableRowsJoin(rowsTables) {
    var separator = this.panel.separator || ',';
    var fix = this.panel.fix || '';
    var prefix = this.panel.prefix || fix;
    var suffix = this.panel.suffix || fix;
    _.each(rowsTables, table => {
      table.rows = [_.map(_.zip.apply(_, table.rows), item => { return prefix + _.join(item, separator) + suffix; })];
    });
  }

  aggregationTableRowsNumber(rowsTables) {
    alert(1);
    // var instanceSingleStatCtrl = this.mockSingleStatCtrl();
    // _.each(rowsTables, table => {
    //   _.each(table.columns, (item, colIndex) => {
    //     item.dataList = [
    //       {
    //         "target": item.text,
    //         "datapoints": _.map(table.rows, function (row) {
    //           var val = +row[colIndex];
    //           return [val, 1];
    //         })
    //       }
    //     ];

    //     instanceSingleStatCtrl.series = item.dataList.map(instanceSingleStatCtrl.seriesHandler.bind(instanceSingleStatCtrl));
    //     item.data = {};
    //     instanceSingleStatCtrl.setValues(item.data);
    //     delete item.dataList;
    //     delete instanceSingleStatCtrl.series;
    //   });

    //   table.rows = [_.map(table.columns, 'data.valueFormatted')];
    // });
  }
}

export function PopupVariablesListDirective() {
  return {
    restrict: 'E',
    templateUrl: '/public/app/plugins/panel/teld-querybar-panel/modal/directives/teld-popup-variables-list.html',
    controller: PopupVariablesListCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
  };
}

coreModule.directive('teldPopupVariablesList', PopupVariablesListDirective);
