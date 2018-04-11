///<reference path="../../../headers/common.d.ts" />

import { PanelCtrl } from 'app/plugins/sdk';
import { metricsEditorComponent } from './editor_component/metrics_editor';
import { optionsEditorComponent } from './editor_component/options_editor';
import $ from 'jquery';
import _ from 'lodash';
import angular from 'angular';
import kbn from 'app/core/utils/kbn';
import moment from 'moment';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import './directives/all';

export class TeldQuerybarCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  isQuerybar: true;
  //currentTab: string;
  datasource: string;
  metricSources: any[];
  $q: any;
  datasourceSrv: any;
  timeSrv: any;
  templateSrv: any;
  variableSrv: any;
  timing: any;

  range: any;
  rangeRaw: any;
  interval: any;
  intervalMs: any;
  resolution: any;
  defineQuery: boolean;
  queryResult: any;

  querybarVariable: any;

  querybarDsVariable: any;

  $window: any;
  currentTarget: any;
  currentTabInfo: any;

  // Set and populate defaults
  panelDefaults = {
    datasource: 'default',
    targets: []
  };

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.$window = this.$injector.get("$window");
    this.$q = $injector.get('$q');
    this.datasourceSrv = $injector.get('datasourceSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.templateSrv = $injector.get('templateSrv');
    this.variableSrv = $injector.get('variableSrv');

    _.defaults(this.panel, this.panelDefaults);

    this.defineQuery = true;
    this.queryResult = {};
    this.querybarVariable = {};
    this.querybarDsVariable = {};
    this.currentTabInfo = {};
    this.currentTarget = _.head(this.panel.targets);

    _.each(this.panel.targets, target => {

      let defTargetConf = {
        conf: {
          linkage: [],
          variablePrefix: _.camelCase(target.refId),
          dsQueryVariables: [{ name: 'query', label: 'query' }],
          bindVariables: [{ name: 'value', field: 'value' }]
        }
      };
      _.defaultsDeep(target, defTargetConf);
      //_.defaults(target, defTargetConf);
      target.conf.variablePrefix = target.conf.variablePrefix || target.refId;

      _.each(target.conf.bindVariables, bindVariable => {
        let variable = this.variableSrv.addVariable({
          //hide: 2,
          type: 'teldCustom',
          name: `${target.conf.variablePrefix}_${bindVariable.name}`,
          query: '.',
          current: { value: '.', text: '' }
        });
        _.set(this.querybarVariable, variable.name, variable);
      });

      _.each(target.conf.dsQueryVariables, dsQueryVariable => {
        let dsQuery = this.variableSrv.addVariable({
          //hide: 2,
          type: 'teldCustom',
          name: `${target.conf.variablePrefix}_ds_${dsQueryVariable.name}`,
          query: '.',
          current: { value: '.', text: '' }
        });
        _.set(this.querybarDsVariable, dsQuery.name, dsQuery);
      });

      // this.variableSrv.updateOptions(variable);
      // this.variableSrv.setOptionAsCurrent(variable, variable.current);
      this.variableSrv.templateSrv.updateTemplateData();
    });

    this.changeQueryBarTab(this.currentTarget);

    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Metrics', metricsEditorComponent);
    this.addEditorTab('Options', optionsEditorComponent);
    //this.editorTabIndex = 1;
  }

  onDataError() {
    this.render();
  }

  onDataReceived(dataList) {

    let currentTarget = this.currentTarget;
    let targetConf = currentTarget.conf || {};
    let eachList = _.size(dataList) === 0 ? [dataList] : dataList;

    let datapoints = [];
    _.each(eachList, item => {
      let mapData;
      switch (item.type) {
        case 'docs':
          mapData = _.map(item.datapoints, datapoint => {
            let value;
            if (_.isArray(datapoint)) {
              value = _.zipObject(['key', 'name'], datapoint);
            } else {

              value = {
                name: _.get(datapoint, targetConf.name, "未设置显示字段"),
                value: _.get(datapoint, targetConf.value, '')
              };

              if (value.name === "未设置显示字段" && _.size(datapoint) === 2) {
                value = _.mapKeys(datapoint, (value, key) => { return _.isNumber(value) ? "value" : "name"; });
              }
            }
            return value;
          });

          datapoints = _.concat(datapoints, mapData);
          break;
        case 'table':
          let columnIndex = {
            colName: _.findIndex(item.columns, { text: "name" }),
            colValue: _.findIndex(item.columns, { text: "value" })
          };

          mapData = _.map(item.rows, row => {
            let value = {
              name: row[columnIndex.colName],
              value: row[columnIndex.colValue]
            };
            return value;
          });

          datapoints = _.concat(datapoints, mapData);
          break;
        default:
          if (_.has(item, 'meta.sql')) {
            datapoints.push({ name: item.target, value: _.sumBy(item.datapoints, i => { return i[0]; }) });
          } else {
            datapoints.push({ name: item.target, value: _.sumBy(item.datapoints, i => { return i[0]; }) });
            //datapoints = _.concat(datapoints, item.datapoints);
          }
          break;
      }
    });

    let sortDatapoints = _.sortBy(datapoints, 'value');
    sortDatapoints = _.reverse(sortDatapoints);
    _.set(this.queryResult, this.currentTarget.refId, sortDatapoints);
    this.render();
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    this.renderingCompleted();
  }

  onReadySwiper(swiper) {
    console.log('onReadySwiper');
    _.set(this.currentTabInfo, this.currentTarget.refId + '.swiper', swiper);
    this.$scope.$watch(
      () => { return this.$window.innerWidth; },
      (value) => {
        console.log(1);
        swiper.params.slidesPerView = value / 380;
        swiper.onResize();
      });
  }

  changeQueryBarTab(target) {
    //this.currentTab = refId;
    this.currentTarget = target;
    if (false === _.has(this.queryResult, target.refId)) {
      this.onMetricsPanelRefresh();
    } else {
      //this.swiper[target.refId].update(true);
    }
  }

  refreshTab(){
    delete this.queryResult[this.currentTarget.refId];
    this.onMetricsPanelRefresh();
  }

  toggleQuery(target) {
    this.setQuerybarDs(target);
    delete this.queryResult[this.currentTarget.refId];
    // let swiper = _.get(this.currentTabInfo, this.currentTarget.refId + '.swiper');
    // swiper.removeAllSlides();
    this.onMetricsPanelRefresh();
  }

  setQuerybarDs(target) {
    let conf = target.conf;
    _.each(conf.dsQueryVariables, dsQueryVariable => {
      let valuePath = `${target.refId}.${dsQueryVariable.name}.value`;
      let value = _.get(this.currentTabInfo, valuePath, '.');

      let variablePath = `${target.conf.variablePrefix}_ds_${dsQueryVariable.name}`;
      let variable = _.get(this.querybarDsVariable, variablePath);

      value = value === "" ? "." : value;
      variable.current = { text: value, value: value };
    });
    this.templateSrv.updateTemplateData();
  }

  setQueryBarVariable(target, selectedItem) {

    let conf = target.conf;
    _.each(conf.bindVariables, bindVariable => {
      let variablePath = `${conf.variablePrefix}_${bindVariable.name}`;
      let variable = _.get(this.querybarVariable, variablePath);
      let value = _.get(selectedItem, bindVariable.field, ".");
      variable.current = { text: value, value: value };
    });
    this.templateSrv.updateTemplateData();

    //let orgtarget = this.currentTarget;
    _.each(target.conf.linkage || [], item => {
      let refId = item.refId;
      delete this.queryResult[refId];
      // let refTaget = _.find(this.panel.targets, { refId: refId });
      // if (refTaget) {
      //   //this.onMetricsPanelRefresh();
      //   // this.$q.all([() => {this.currentTarget=refTaget; }, this.onMetricsPanelRefresh()]).then(() => {
      //   //   this.currentTarget = target;
      //   // });
      //   // this.$q.all([this.onMetricsPanelRefresh()]this.changeQueryBarTab(refTaget)).then(() => {
      //   //   this.currentTarget = target;
      //   // });
      // }
    });
    //this.currentTarget = target;
  }

  getQueryResult(target) {
    let refId = (target || this.currentTarget).refId;
    //let refId = this.currentTarget.refId;

    let returnValue = _.get(this.queryResult, refId);

    returnValue = _.map(returnValue, item => {
      return  item;
    });

    returnValue = _.slice(returnValue, 0, 40);

    return returnValue;
  }


  onMetricsPanelRefresh() {
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode()) { return; }

    // clear loading/error state
    delete this.error;
    this.updateTimeRange();
    // load datasource service
    this.setTimeQueryStart();
    this.datasourceSrv.get(this.currentTarget.datasource)
    .then(this.issueQueries.bind(this))
    .then(this.handleQueryResult.bind(this))
    .catch(err => {
      // if cancelled  keep loading set to true
      if (err.cancelled) {
        console.log('Panel request cancelled', err);
        return;
      }

      this.error = err.message || "Request Error";
      this.inspector = {error: err};
      this.events.emit('data-error', err);
      console.log('Panel data error:', err);
    });
  }

  updateTimeRange() {
    this.range = this.timeSrv.timeRange();
    this.rangeRaw = this.range.raw;

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
    }
    // if (intervalOverride) {
    //   intervalOverride = this.templateSrv.replace(intervalOverride, this.panel.scopedVars);
    // } else if (this.datasource && this.datasource.interval) {
    //   intervalOverride = this.datasource.interval;
    // }

    var res = kbn.calculateInterval(this.range, this.resolution, intervalOverride);
    this.interval = res.interval;
    this.intervalMs = res.intervalMs;
  }

  setTimeQueryStart() {
    this.timing.queryStart = new Date().getTime();
  }

  setTimeQueryEnd() {
    this.timing.queryEnd = new Date().getTime();
  }

  issueQueries(datasource) {
    this.datasource = datasource;

    if (!this.panel.targets || this.panel.targets.length === 0) {
      return this.$q.when([]);
    }

    // make shallow copy of scoped vars,
    // and add built in variables interval and interval_ms
    var scopedVars = Object.assign({}, this.panel.scopedVars, {
      "__interval":     {text: this.interval,   value: this.interval},
      "__interval_ms":  {text: this.intervalMs, value: this.intervalMs},
    });

    var metricsQuery = {
      panelId: this.panel.id,
      //range: this.range,
      range: { raw: this.range.raw, from: this.range.from.clone(), to: this.range.to.clone() },
      rangeRaw: this.rangeRaw,
      interval: this.interval,
      intervalMs: this.intervalMs,
      //targets: this.panel.targets,
      targets: [this.currentTarget],
      format: this.panel.renderer === 'png' ? 'png' : 'json',
      maxDataPoints: this.resolution,
      scopedVars: scopedVars,
      cacheTimeout: this.panel.cacheTimeout
    };

    if (this.panel.enableFromStartOf) {
      metricsQuery.range.from.startOf(this.panel.fromStartOf);
    }


    return datasource.query(metricsQuery);
  }

  handleQueryResult(result) {
    this.setTimeQueryEnd();
    //this.loading = false;

    if (this.dashboard.snapshot) {
      this.panel.snapshotData = result.data;
    }

    if (!result || !result.data) {
      console.log('Data source query result invalid, missing data field:', result);
      result = {data: []};
    }

    return this.events.emit('data-received', result.data);
  }

  newVariable(variableArray) {
    variableArray.push({});
  }

  removeVariable(variableArray, variable) {
    var index = _.indexOf(variableArray, variable);
    variableArray.splice(index, 1);
  }

  move(variableArray, index, newIndex) {
    _.move(variableArray, index, newIndex);
  }

  query() {
    //this.refresh();
    this.timeSrv.refreshDashboard();
  }

  alert(s){
    window.alert(s);
  }
}
