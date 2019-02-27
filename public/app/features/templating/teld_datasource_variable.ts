///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import kbn from 'app/core/utils/kbn';
import { Variable, containsVariable, assignModelProperties, variableTypes } from './variable';
import { SingleStatCtrl } from 'app/plugins/panel/singlestat/module';
import { MetricsPanelCtrl } from 'app/features/panel/metrics_panel_ctrl';

export var teldDatasourceConf = {
  getPanel() {
    return {
      datasource: "", targets: [],
      nullPointMode: 'connected',
      valueName: 'total',
      format: 'none',
      onDashboardRefresh: true
    };
  },
  // panel: {
  //   datasource: "", targets: [],
  //   nullPointMode: 'connected',
  //   valueName: 'total',
  //   format: 'none'
  // },
  events: { on: _.noop },
  refresh: _.noop,
  unitFormats: kbn.getUnitFormats(),
  setDatasource: MetricsPanelCtrl.prototype.setDatasource,
  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
  },
  valueNameOptions: ['min', 'max', 'avg', 'current', 'total', 'name', 'first', 'delta', 'diff', 'range', 'join'],
  refresh_intervals: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d'],
};

export class TeldDatasourceVariable implements Variable {
  query: string;
  options: any[];
  current: any;
  refresh: any;
  targets: any[];
  panel: any;
  dashboard: any;
  refreshTimer: any;

  defaults = {
    type: 'teldDatasource',
    name: '',
    hide: 0,
    label: '',
    current: {},
    query: '',
    options: [],
    includeAll: false,
    multi: false,
    canSaved: true,
    panel: teldDatasourceConf.getPanel()
  };

  /** @ngInject **/
  constructor(private model, private datasourceSrv, private variableSrv, private templateSrv,
    private timeSrv, private $q, private $injector, private timer, private $timeout, private $rootScope) {
    assignModelProperties(this, model, this.defaults);
    this.dashboard = this.variableSrv.dashboard;

    if (this.panel.autoRefresh) {
      this.setAutoRefresh(this.panel.interval);
    }
  }

  runQuery() {
    console.log('autoRefresh runQuery');
    return this.variableSrv.updateOptions(this).then(null, function (err) {
      if (err.data && err.data.message) { err.message = err.data.message; }
      // $scope.appEvent("alert-error", ['Templating', 'Template variables could not be initialized: ' + err.message]);
    });
  }

  setAutoRefresh(interval) {
    if (interval) {
      var intervalMs = kbn.interval_to_ms(interval);

      this.$timeout(() => {
        this.startNextRefreshTimer(intervalMs);
        this.runQuery();
      }, intervalMs);

    } else {
      this.cancelNextRefresh();
    }
  }

  private startNextRefreshTimer(afterMs) {
    this.cancelNextRefresh();
    this.refreshTimer = this.timer.register(this.$timeout(() => {
      this.startNextRefreshTimer(afterMs);
      this.runQuery();
    }, afterMs));
  }

  private cancelNextRefresh() {
    this.timer.cancel(this.refreshTimer);
  };

  processTeldVariable(initLock) {
    var pickMethods = ['updateTimeRange', 'applyPanelTimeOverrides', 'setRangeString',
      'calculateInterval', 'issueQueries'
    ];
    var instanceMetricsPanelCtrl = _.pick(MetricsPanelCtrl.prototype, pickMethods);
    _.assign(instanceMetricsPanelCtrl, _.pick(this, ['panel', 'timeSrv', 'templateSrv', 'dashboard']));
    //instanceMetricsPanelCtrl.updateTimeRange.bind(this)();
    instanceMetricsPanelCtrl.updateTimeRange();
    return this.datasourceSrv.get(this.panel.datasource)
      .then(instanceMetricsPanelCtrl.issueQueries.bind(instanceMetricsPanelCtrl))
      .then(this.handleQueryResult.bind(this))
      .then(this.handleVariable.bind(this))
      .finally(() => {
        initLock.resolve();
      });
  }

  mockSingleStatCtrl() {
    var instance = {
      variable: this,
      panel: _.assign({}, this.defaults.panel, this.panel),
      render: function () {
        var variable = this.variable;
        // if (this.panel.unescape) {
        //   this.data.valueFormatted = _.unescape(this.data.valueFormatted);
        // }
        this.data.valueFormatted = _.unescape(this.data.valueFormatted);
        variable.query = this.data.valueFormatted;
        variable.current = { text: variable.query, value: variable.query, selected: true };
        variable.options = [variable.current];
      }
    };

    var pickMethods = [
      'onDataReceived',
      'tableHandler', 'setTableValues', 'setValueMapping', 'setTableColumnToSensibleDefault',
      'seriesHandler', 'setValues',
      'getDecimalsForValue'
    ];

    var instanceSingleStatCtrl = _.pick(SingleStatCtrl.prototype, pickMethods);
    _.assign(instanceSingleStatCtrl, instance);
    return instanceSingleStatCtrl;
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
    var instanceSingleStatCtrl = this.mockSingleStatCtrl();
    _.each(rowsTables, table => {
      _.each(table.columns, (item, colIndex) => {
        item.dataList = [
          {
            "target": item.text,
            "datapoints": _.map(table.rows, function (row) {
              var val = +row[colIndex];
              return [val, 1];
            })
          }
        ];

        instanceSingleStatCtrl.series = item.dataList.map(instanceSingleStatCtrl.seriesHandler.bind(instanceSingleStatCtrl));
        item.data = {};
        instanceSingleStatCtrl.setValues(item.data);
        delete item.dataList;
        delete instanceSingleStatCtrl.series;
      });

      table.rows = [_.map(table.columns, 'data.valueFormatted')];
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

  handleVariable(result) {
    var instanceSingleStatCtrl = this.mockSingleStatCtrl();
    instanceSingleStatCtrl.onDataReceived(result.data);
  }

  getSaveModel() {
    assignModelProperties(this.model, this, this.defaults);

    // dont persist options
    this.model.options = [];
    this.model.current = {};
    this.model.query = "";
    return this.model;
  }

  setValue(option) {
    return this.variableSrv.setOptionAsCurrent(this, option);
  }

  updateOptions() {
    return this.processTeldVariable(Promise).then(() => {
      return this.variableSrv.validateVariableSelectionState(this);
    });
  }

  dependsOn(variable) {
    return false;
  }

  setValueFromUrl(urlValue) {
    return this.variableSrv.setOptionFromUrl(this, urlValue);
  }

  getValueForUrl() {
    return this.current.value;
  }
}

variableTypes['teldDatasource'] = {
  name: 'TeldDatasource',
  ctor: TeldDatasourceVariable,
  description: '数据源变量',
};
