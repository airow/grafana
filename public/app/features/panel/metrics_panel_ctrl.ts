///<reference path="../../headers/common.d.ts" />

import config from 'app/core/config';
import $ from 'jquery';
import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import kbn from 'app/core/utils/kbn';
import graftrace from 'app/core/utils/graftrace';
import { PanelCtrl } from './panel_ctrl';

import * as rangeUtil from 'app/core/utils/rangeutil';
import * as dateMath from 'app/core/utils/datemath';

import { Subject } from 'vendor/npm/rxjs/Subject';

class MetricsPanelCtrl extends PanelCtrl {
  loading: boolean;
  datasource: any;
  datasourceName: any;
  $q: any;
  $timeout: any;
  datasourceSrv: any;
  timeSrv: any;
  templateSrv: any;
  timing: any;
  range: any;
  rangeRaw: any;
  interval: any;
  intervalMs: any;
  resolution: any;
  timeInfo: any;
  skipDataOnInit: boolean;
  dataStream: any;
  dataSubscription: any;
  rangeStringPanel: string;

  $panelInterval: any;
  panelIntervalHandle: any;

  enablePanelRefresh: boolean;
  triggerRefresh: boolean;
  thiskbn = kbn;
  constructor($scope, $injector) {
    super($scope, $injector);

    // make metrics tab the default
    this.editorTabIndex = 1;
    this.$q = $injector.get('$q');
    this.datasourceSrv = $injector.get('datasourceSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.templateSrv = $injector.get('templateSrv');

    if (!this.panel.targets) {
      this.panel.targets = [{}];
    }

    let panelRefresh = _.get(this.panel, 'panelRefresh', {});
    if (panelRefresh.enable) {
      if (panelRefresh.intervalEnable) {
        this.enablePanelRefresh = true;
        let refreshInterval = this.thiskbn.interval_to_ms(panelRefresh.value || '1m');

        this.$panelInterval = $injector.get('$interval');
        this.panelIntervalHandle = this.$panelInterval(() => {
          this.onMetricsPanelRefresh();
        }, refreshInterval);
      }
      this.onMetricsPanelRefresh();
    } else {
      this.events.on('refresh', this.onMetricsPanelRefresh.bind(this));
    }

    // $scope.$watch(this.panel.panelRefresh, function (newValue) {
    //   alert(newValue);
    //   //elem.toggleClass('playlist-active', _.isObject(newValue));
    // });

    this.events.on('init-edit-mode', this.onInitMetricsPanelEditMode.bind(this));
    this.events.on('panel-teardown', this.onPanelTearDown.bind(this));
  }

  onTearDownCancelPanelInterval() {
    if (angular.isDefined(this.panelIntervalHandle)) {
      this.$panelInterval.cancel(this.panelIntervalHandle);
      this.panelIntervalHandle = undefined;
    }
  }

  private onPanelTearDown() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }

    this.onTearDownCancelPanelInterval();
  }

  private onInitMetricsPanelEditMode() {
    this.addEditorTab('Metrics', 'public/app/partials/metrics.html');
    this.addEditorTab('Time range', 'public/app/features/panel/partials/panelTime.html');
  }


  dashboardHasQuerybarPanel;
  waitQuerybarInitFinish() {
    var returnValue = false;

    //配置为“忽略querybar延时查询”直接返回，执行后续的取数
    if (this.panel.ignoreQueryBarDelayQuery) {
      return returnValue;
    }

    //配置为“不随dash刷新”直接返回，执行后续的取数
    if ((this.panel.panelRefresh && this.panel.panelRefresh.enable)) {
      return returnValue;
    }

    if (_.isUndefined(this.dashboardHasQuerybarPanel)) {
      this.dashboardHasQuerybarPanel = _.findIndex(_.flatten(_.map(this.dashboard.rows, 'panels')), { type: "teld-querybar-panel" }) !== -1;
    }

    if (this.dashboardHasQuerybarPanel) {
      returnValue = this.dashboard.querybarInitFinish !== true;
    }
    return returnValue;
  }


  onMetricsPanelRefresh() {
    // debugger;
    if (this.panel.type === "teld-datatables-panel") {
      if (this['ignoreOtherPublishEventLoadDataFlag']) {
        this['ignoreOtherPublishEventLoadDataFlag'] = false;
        return;
      }
    }
    // debugger;
    console.log(this.panel.title, "this.dashboard.dt_defaultSelected@@@@", this.dashboard.dt_defaultSelected);
    console.log(this.panel.title, "this.dashboard.dt_defaultSelected@@@@defaultSelected",
      _.get(this.panel, 'publishVariables.defaultSelected'));
    // let panels = _.map(this.dashboard.rows, 'panels');
    // let dddd = _.filter(_.flatten(panels), 'publishVariables.defaultSelected');
    // if (this.dashboard.dt_defaultSelected && false === _.includes(dddd, this.panel)) {
    // if (this.dashboard.dt_defaultSelected && this.panel.title === '电站明细列表【按快充装机功率前2000】') {
    // if (this.dashboard.dt_defaultSelected && this.panel.type === "teld-datatables-panel") {
    if (this.dashboard.dt_defaultSelected && _.get(this.panel, 'publishVariables.defaultSelected', false) === false) {
      console.log(this.panel.title, "this.dashboard.dt_defaultSelected@return", this.dashboard.dt_defaultSelected);
      return;
    }
    console.log(this.panel.title, "this.dashboard.dt_defaultSelected@@@@END", this.dashboard.dt_defaultSelected);
    if (this.triggerRefresh) { this.triggerRefresh = false; return; }
    this.triggerRefresh = false;
    if (this.dashboard.meta.hasQuerybarPanel && this.dashboard.meta.fromScript) {
      return;
    }

    if (this.waitQuerybarInitFinish()) {
      return;
    }

    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode()) { return; }

    // if we have snapshot data use that
    if (this.panel.snapshotData) {
      this.updateTimeRange();
      var data = this.panel.snapshotData;
      // backward compatability
      if (!_.isArray(data)) {
        data = data.data;
      }

      this.events.emit('data-snapshot-load', data);
      return;
    }

    // // ignore if we have data stream
    if (this.dataStream) {
      return;
    }

    // clear loading/error state
    delete this.error;
    this.loading = true;

    this.updateTimeRange();

    // load datasource service
    this.setTimeQueryStart();
    this.datasourceSrv.get(this.panel.datasource)
      .then(this.issueQueries.bind(this))
      .then(this.handleQueryResult.bind(this))
      .catch(err => {
        // if cancelled  keep loading set to true
        if (err.cancelled) {
          console.log('Panel request cancelled', err);
          return;
        }

        this.loading = false;
        this.error = err.message || "Request Error";
        this.inspector = { error: err };
        this.events.emit('data-error', err);
        console.log('Panel data error:', err);
      });
  }


  setTimeQueryStart() {
    this.timing.queryStart = new Date().getTime();
  }

  setTimeQueryEnd() {
    this.timing.queryEnd = new Date().getTime();
  }

  setRangeString() {
    //var time = angular.copy(this.timeSrv.timeRange());
    var time = angular.copy(this.range);
    var timeRaw = angular.copy(time.raw);

    if (!this.dashboard.isTimezoneUtc()) {
      time.from.local();
      time.to.local();
      if (moment.isMoment(timeRaw.from)) {
        timeRaw.from.local();
      }
      if (moment.isMoment(timeRaw.to)) {
        timeRaw.to.local();
      }
    }
    this.rangeStringPanel = rangeUtil.describeTimeRange(timeRaw);
  }

  updateTimeRange() {
    this.range = this.timeSrv.timeRange();
    this.rangeRaw = this.range.raw;

    this.applyPanelTimeOverrides();

    this.setRangeString();

    if (this.panel.maxDataPoints) {
      this.resolution = this.panel.maxDataPoints;
    } else {
      this.resolution = Math.ceil($(window).width() * (this.panel.span / 12));
    }

    this.calculateInterval();
  };

  calculateInterval() {
    var intervalOverride = this.panel.interval;

    // if no panel interval check datasource
    if (intervalOverride) {
      intervalOverride = this.templateSrv.replace(intervalOverride, this.panel.scopedVars);
    } else if (this.datasource && this.datasource.interval) {
      intervalOverride = this.datasource.interval;
    }

    var res = kbn.calculateInterval(this.range, this.resolution, intervalOverride);
    this.interval = res.interval;
    this.intervalMs = res.intervalMs;
  }

  applyPanelTimeOverrides() {
    this.timeInfo = '';

    // check panel time overrrides
    if (this.panel.timeFrom) {
      var timeFromInterpolated = this.templateSrv.replace(this.panel.timeFrom, this.panel.scopedVars);
      var timeFromInfo = rangeUtil.describeTextRange(timeFromInterpolated);
      if (timeFromInfo.invalid) {
        this.timeInfo = 'invalid time override';
        return;
      }

      if (_.isString(this.rangeRaw.from)) {
        var timeFromDate = dateMath.parse(timeFromInfo.from);
        this.timeInfo = timeFromInfo.display;
        this.rangeRaw.from = timeFromInfo.from;
        this.rangeRaw.to = timeFromInfo.to;
        this.range.from = timeFromDate;
        this.range.to = dateMath.parse(timeFromInfo.to);
      }
    }

    if (this.panel.timeShift) {
      var timeShiftInterpolated = this.templateSrv.replace(this.panel.timeShift, this.panel.scopedVars);
      var timeShiftInfo = rangeUtil.describeTextRange(timeShiftInterpolated);
      if (timeShiftInfo.invalid) {
        this.timeInfo = 'invalid timeshift';
        return;
      }

      var timeShift = '-' + timeShiftInterpolated;
      this.timeInfo += ' timeshift ' + timeShift;
      this.range.from = dateMath.parseDateMath(timeShift, this.range.from, false);
      this.range.to = dateMath.parseDateMath(timeShift, this.range.to, true);

      this.rangeRaw = this.range;
    }

    if (this.panel.hideTimeOverride) {
      this.timeInfo = '';
    }
  };


  // addBindVariable(variableSrv, bindVariable, nullValue): any {
  //   let variable = variableSrv.addVariable({
  //     hide: 2,
  //     type: 'teldCustom',
  //     name: `${target.conf.variablePrefix}_${bindVariable.name}`,
  //     query: '',
  //     current: { value: bindVariable.nullValue || nullValue, text: bindVariable.nullText || this.ALL_TEXT }
  //   });
  //   variable.querybarRequired = target.conf.required;
  //   variable.confVarValue = { value: bindVariable.nullValue || nullValue, text: bindVariable.nullText || this.ALL_TEXT };
  //   _.set(this.querybarVariable, variable.name, variable);
  //   return variable;
  // }
  replaceVariableValue(str: any, variablePrefix: any, replacement: any): any {
    var returnValue = _.replace(str, new RegExp(_.escapeRegExp("$" + variablePrefix), 'g'), "$" + replacement);
    return returnValue;
  }

  metricsQueryTargets(ctrl): any {
    console.log(this === ctrl);
    var dynaCondPrefix = "_dynaCond_";

    var targets = _.cloneDeep(ctrl.panel.targets);
    // var row = _.find(ctrl.dashboard.rows, { "ShadowContainer": true });
    var row = this.dashboard.ShadowContainerRow;
    if (row) {
      var dynaCondArray = _.filter(ctrl.templateSrv.variables, item => {
        return _.startsWith(item.name, dynaCondPrefix);
      });


      _.each(row.panels, (clonePanel, index) => {
        if (index === 0) {
          _.each(targets, cloneTarget => {
            cloneTarget.refId = `shadow_${clonePanel.id}_${clonePanel.dynamCondTitle}`;
          });
          return;
        }

        var panelIdPrefix = `vs${clonePanel.id}`;
        _.each(ctrl.panel.targets, target => {
          var cloneTarget = _.cloneDeep(target);
          cloneTarget.refId = `shadow_${clonePanel.id}_${clonePanel.dynamCondTitle}`;

          // if (cloneTarget.alias) {
          //   cloneTarget.alias = clonePanel.title;
          // }

          if (cloneTarget.query) {
            //target.query = _.replace(target.query, new RegExp(_.escapeRegExp("$" + dynaCondPrefix), 'g'), "$" + dynaCondPrefix + "sync");

            _.each(dynaCondArray, globalVariable => {
              // debugger;
              var replacement = `${panelIdPrefix}_${globalVariable.name}`;
              cloneTarget.query = this.replaceVariableValue(cloneTarget.query, globalVariable.name, replacement);
            });

            cloneTarget.query = this.replaceVariableValue(cloneTarget.query, dynaCondPrefix, dynaCondPrefix);
          }

          targets.push(cloneTarget);
        });
      });
    }
    // ctrl.templateSrv.updateTemplateData();
    return targets;
  }

  issueQueries(datasource) {
    this.datasource = datasource;

    if (!this.panel.targets || this.panel.targets.length === 0) {
      return this.$q.when([]);
    }

    // make shallow copy of scoped vars,
    // and add built in variables interval and interval_ms
    var scopedVars = Object.assign({}, this.panel.scopedVars, {
      "__interval": { text: this.interval, value: this.interval },
      "__interval_ms": { text: this.intervalMs, value: this.intervalMs },
    });

    var from = this.range.from.clone();
    var to = this.range.to.clone();
    // var fromYYYMMDD = moment(from.format("YYYYMMDD"));
    // var toYYYYMMDD = moment(to.format("YYYYMMDD"));
    var fromYYYMMDD = moment(from.valueOf()).startOf('day');
    var toYYYYMMDD = moment(to.format()).startOf('day');
    Object.assign(scopedVars, {
      "dash_timeFrom": { text: from.valueOf(), value: from.valueOf() },
      "dash_timeTo": { text: to.valueOf(), value: to.valueOf() },

      "dash_dateFrom": { text: fromYYYMMDD.valueOf(), value: fromYYYMMDD.valueOf() },
      "dash_dateTo": { text: toYYYYMMDD.valueOf(), value: toYYYYMMDD.valueOf() }
    });

    var _graftrace_ = graftrace.gen(this);
    // debugger;
    // this.metricsQueryTargets(this);

    var targets = this.panel.targets;
    if (this.metricsQueryTargets) {
      targets = this.metricsQueryTargets(this) || targets;
    }

    var metricsQuery = {
      _graftrace_: _graftrace_,
      panelId: this.panel.id,
      //range: this.range,
      range: { raw: this.range.raw, from: this.range.from.clone(), to: this.range.to.clone() },
      rangeRaw: this.rangeRaw,
      interval: this.interval,
      intervalMs: this.intervalMs,
      targets: targets,
      format: this.panel.renderer === 'png' ? 'png' : 'json',
      maxDataPoints: this.resolution,
      scopedVars: scopedVars,
      cacheTimeout: this.panel.cacheTimeout
    };

    if (this.panel.enableFromStartOf) {
      metricsQuery.range.from.startOf(this.panel.fromStartOf);
    }

    // debugger;
    return datasource.query(metricsQuery);
  }

  handleQueryResult(result) {
    this.setTimeQueryEnd();
    this.loading = false;

    // check for if data source returns subject
    if (result && result.subscribe) {
      this.handleDataStream(result);
      return;
    }

    if (this.dashboard.snapshot) {
      this.panel.snapshotData = result.data;
    }

    if (!result || !result.data) {
      console.log('Data source query result invalid, missing data field:', result);
      result = { data: [] };
    }

    this.$scope.$root.appEvent("metricePanel-fetch", { target: this });
    return this.events.emit('data-received', result.data);
  }

  handleDataStream(stream) {
    // if we already have a connection
    if (this.dataStream) {
      console.log('two stream observables!');
      return;
    }

    this.dataStream = stream;
    this.dataSubscription = stream.subscribe({
      next: (data) => {
        console.log('dataSubject next!');
        if (data.range) {
          this.range = data.range;
        }
        this.events.emit('data-received', data.data);
      },
      error: (error) => {
        this.events.emit('data-error', error);
        console.log('panel: observer got error');
      },
      complete: () => {
        console.log('panel: observer got complete');
        this.dataStream = null;
      }
    });
  }

  setDatasource(datasource) {
    // switching to mixed
    if (datasource.meta.mixed) {
      _.each(this.panel.targets, target => {
        target.datasource = this.panel.datasource;
        if (!target.datasource) {
          target.datasource = config.defaultDatasource;
        }
      });
    } else if (this.datasource && this.datasource.meta.mixed) {
      _.each(this.panel.targets, target => {
        delete target.datasource;
      });
    }

    this.panel.datasource = datasource.value;
    this.datasourceName = datasource.name;
    this.datasource = null;
    this.refresh();
  }
}

export { MetricsPanelCtrl };
