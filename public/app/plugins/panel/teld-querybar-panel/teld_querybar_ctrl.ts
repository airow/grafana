///<reference path="../../../headers/common.d.ts" />

import { PanelCtrl } from 'app/plugins/sdk';
import { metricsEditorComponent } from './editor_component/metrics_editor';
import { optionsEditorComponent } from './editor_component/options_editor';
import $ from 'jquery';
import _ from 'lodash';
import numeral from 'numeral';
import angular from 'angular';
import kbn from 'app/core/utils/kbn';
import * as dateMath from 'app/core/utils/datemath';
import moment from 'moment';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import './directives/all';
import { loadPluginCss } from 'app/plugins/sdk';

loadPluginCss({
  dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css',
  light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css'
});

export class TeldQuerybarCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  time = { from: moment("2013-01-01"), to: "now" };
  ALL_VALUE = '-全部-';
  isFirstLoaded = false;
  spin = true;

  isQuerybar: true;
  //currentTab: string;
  datasource: string;
  metricSources: any[];
  $q: any;
  datasourceSrv: any;
  timeSrv: any;
  templateSrv: any;
  variableSrv: any;
  alertSrv: any;
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
    height: 100,
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
    this.alertSrv = $injector.get('alertSrv');

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
          current: { value: bindVariable.nullValue || '.', text: this.ALL_VALUE }
        });
        _.set(this.querybarVariable, variable.name, variable);
      });

      _.each(target.conf.dsQueryVariables, dsQueryVariable => {
        let dsQuery = this.variableSrv.addVariable({
          //hide: 2,
          type: 'teldCustom',
          name: `${target.conf.variablePrefix}_ds_${dsQueryVariable.name}`,
          query: '.',
          current: { value: dsQueryVariable.nullValue || '.', text: this.ALL_VALUE }
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
    let eachList = _.isArray(dataList) ? dataList : [dataList];

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
            value._original = datapoint;
            return value;
          });

          datapoints = _.concat(datapoints, mapData);
          break;
        case 'table':
          let columnsIndex = {
            colName: _.findIndex(item.columns, { text: targetConf.name || "name" }),
            colValue: _.findIndex(item.columns, { text: targetConf.value || "value" })
          };

          let columnsName = _.transform(item.columns, (result, n) => { result.push(n.text); }, []);

          mapData = _.map(item.rows, row => {
            let value = {
              name: row[columnsIndex.colName],
              value: row[columnsIndex.colValue],
              _original: _.zipObject(columnsName, row)
            };
            return value;
          });

          datapoints = _.concat(datapoints, mapData);
          break;
        default:
          if (_.has(item, 'meta.sql')) {
            datapoints.push({ _original: item.datapoints, name: item.target, value: _.sumBy(item.datapoints, i => { return i[0]; }) });
          } else {
            datapoints.push({ _original: item.datapoints, name: item.target, value: _.sumBy(item.datapoints, i => { return i[0]; }) });
            //datapoints = _.concat(datapoints, item.datapoints);
          }
          break;
      }
    });

    let sortDatapoints;
    if (_.size(datapoints) === 0) {
      sortDatapoints = [{ isNil: true, name: '无', value: 'N/A', _original: {} }];
    } else {
      sortDatapoints = _.orderBy(datapoints, item => { return Number(item.value); }, 'desc');
    }

    _.set(this.queryResult, this.currentTarget.refId, sortDatapoints);


    let target = this.currentTarget;
    if (target.conf.required) {
      let tabInfo = _.get(this.currentTabInfo, this.currentTarget.refId, {});
      if (_.isNil(tabInfo.selectedIndex)) {
        //_.set(tabInfo, '.selectedIndex', 0);
        let predicateValue = target.conf.predicateValue || 0;
        let index = _.toNumber(predicateValue);
        if (_.isNaN(index)) {
          let predicate = (new Function("return " + predicateValue))();
          index = _.findIndex(sortDatapoints, predicate);
          index = index === -1 ? 0 : index;
        }
        this.setQueryBarVariable(target, index, sortDatapoints[index]);
        if (false === this.isFirstLoaded) {
          this.isFirstLoaded = true;

        }this.query();
      }
    }

    this.render();
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    this.renderingCompleted();
    this.spin = false;
  }

  onReadySwiper(swiper) {
    console.log('onReadySwiper');
    _.set(this.currentTabInfo, this.currentTarget.refId + '.swiper', swiper);
    this.$scope.$watch(
      () => { return this.$window.innerWidth; },
      (value) => {
        console.log(1);
        //swiper.params.slidesPerView = _.floor(value / 325);
        swiper.params.slidesPerView = _.floor(value / 287);
        swiper.onResize();
      });
  }

  changeQueryBarTab(target) {
    //this.currentTab = refId;
    if (target) {
      this.currentTarget = target;
      if (false === _.has(this.queryResult, target.refId)) {
        _.set(this.currentTabInfo, target.refId + '.spin', true);
        this.onMetricsPanelRefresh();
      } else {
        //this.swiper[target.refId].update(true);
        let tabInfo = this.currentTabInfo[target.refId];
        if (tabInfo.swiper) {
          //this.$timeout(function () { tabInfo.swiper.slideTo(tabInfo.selectedIndex, 0, false); }, 100);
          let moveToIndex = tabInfo.selectedIndex || tabInfo.swiper.snapIndex;
          this.$timeout(function () { tabInfo.swiper.slideTo(moveToIndex, 0, false); }, 100);
        }
      }
    }
  }

  refreshTab() {
    delete this.queryResult[this.currentTarget.refId];
    this.onMetricsPanelRefresh();
  }

  getExprVariables() {
    let exprVariables = _.transform(this.panel.targets, (result, target, index) => {
      let bindVariable = _.first(target.conf.bindVariables);
      let variable = _.get(this.querybarVariable, `${target.conf.variablePrefix}_${bindVariable.name}`);
      if (variable.current.text !== this.ALL_VALUE) {
        _.set(result, target.refId, variable);
      }
    }, {});

    //let exprVariables = this.querybarVariable;
    return exprVariables;
  }

  toggleQuery(target) {
    this.setQuerybarDs(target);
    delete this.queryResult[this.currentTarget.refId];
    this.onMetricsPanelRefresh();
  }

  setQuerybarDs(target) {
    let conf = target.conf;
    _.each(conf.dsQueryVariables, dsQueryVariable => {
      let nullValue = dsQueryVariable.nullValue || '.';
      let valuePath = `${target.refId}.dsQuery.${dsQueryVariable.name}.value`;
      let value = _.get(this.currentTabInfo, valuePath, nullValue);

      let variablePath = `${target.conf.variablePrefix}_ds_${dsQueryVariable.name}`;
      let variable = _.get(this.querybarDsVariable, variablePath);

      value = value === "" ? nullValue : value;
      variable.current = { text: value, value: value };
    });
    this.templateSrv.updateTemplateData();
  }

  getSliderCls(target, index) {
    let tabInfo = this.currentTabInfo[target.refId];
    let selectedIndex = _.get(tabInfo, 'selectedIndex');
    return selectedIndex === index ? 'sliderCls-active' : '';
  }

  setQueryBarVariable(target, index, selectedItem) {
    let tabInfo = this.currentTabInfo[target.refId];
    let conf = target.conf;
    let selectedIndex = tabInfo.selectedIndex;
    if (selectedIndex === index) {
      if (target.conf.required) {
        this.alertSrv.set("警告", '条件为必须', "warning", 2000);
        return;
      }
      delete tabInfo.selectedIndex;
      this.clearTargetBindVariables(target);
    } else {
      _.set(tabInfo, 'selectedIndex', index);
      _.each(conf.bindVariables, bindVariable => {
        let variablePath = `${conf.variablePrefix}_${bindVariable.name}`;
        let variable = _.get(this.querybarVariable, variablePath);
        //let value = _.get(selectedItem, bindVariable.field, ".");
        let nullValue = bindVariable.nullValue || '.';
        let value = _.get(selectedItem, bindVariable.field);
        if (_.isNil(value)) {
          value = _.get(selectedItem._original, bindVariable.field);
          if (_.isNil(value)) {
            value = _.get(selectedItem, "_original." + bindVariable.field, nullValue);
            if (_.isNil(value)) {
              value = nullValue;
            }
          }
        }
        variable.current = { text: value, value: value };
      });
      this.templateSrv.updateTemplateData();
    }
    this.syncLinkageTarget(target);
  }

  clearTargetBindVariables(target) {
    let conf = target.conf;
    _.each(conf.bindVariables, bindVariable => {
      let variablePath = `${conf.variablePrefix}_${bindVariable.name}`;
      let variable = _.get(this.querybarVariable, variablePath);
      let nullValue = bindVariable.nullValue || '.';
      variable.current = { text: this.ALL_VALUE, value: nullValue };
    });
    this.templateSrv.updateTemplateData();
  }

  //设置状态
  syncLinkageTarget(target) {
    _.each(target.conf.linkage || [], item => {
      let refId = item.refId;
      delete this.queryResult[refId];
      let tabInfo = this.currentTabInfo[refId];
      if (tabInfo) {
        delete tabInfo.dsQuery;
        delete tabInfo.selectedIndex;
      }

      let itemTarget = _.find(this.panel.targets, { refId });
      let itemTargetConf = itemTarget.conf;
      let variablePrefix = `${itemTargetConf.variablePrefix}_ds_`;

      _.each(this.querybarDsVariable, (variable, key) => {
        if (_.startsWith(key, variablePrefix)) {
          let nameField = _.replace(key, variablePrefix, '');
          let dsQueryVariableConf = _.find(itemTargetConf.dsQueryVariables, { name: nameField });
          variable.current = { text: this.ALL_VALUE, value: dsQueryVariableConf.nullValue || '.' };
        }
      });

      let bindVariablePrefix = `${itemTargetConf.variablePrefix}_`;
      _.each(this.querybarVariable, (variable, key) => {
        if (_.startsWith(key, bindVariablePrefix)) {
          let nameField = _.replace(key, bindVariablePrefix, '');
          let queryVariableConf = _.find(itemTargetConf.bindVariables, { name: nameField });
          variable.current = { text: this.ALL_VALUE, value: queryVariableConf.nullValue || '.' };
        }
      });
    });

    this.templateSrv.updateTemplateData();
  }

  spinSliderCls(target) {
    //return true;
    return _.get(this.currentTabInfo, target.refId + '.spin', true);
  }
  getQueryResult(target) {
    let refId = (target || this.currentTarget).refId;
    //let refId = this.currentTarget.refId;

    let returnValue = _.get(this.queryResult, refId);

    returnValue = _.map(returnValue, item => {
      return item;
    });

    returnValue = _.slice(returnValue, 0, target.conf.size || 40);
    _.set(this.currentTabInfo, target.refId + '.spin', false);

    return returnValue;
  }


  onMetricsPanelRefresh() {
    this.spin = true;
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
        this.inspector = { error: err };
        this.events.emit('data-error', err);
        console.log('Panel data error:', err);
      });
  }

  timeRange() {
    var raw = {
      from: moment.isMoment(this.time.from) ? moment(this.time.from) : this.time.from,
      to: moment.isMoment(this.time.to) ? moment(this.time.to) : this.time.to,
    };

    return {
      from: dateMath.parse(raw.from, false),
      to: dateMath.parse(raw.to, true),
      raw: raw
    };
  }
  updateTimeRange() {
    //this.range = this.timeSrv.timeRange();
    this.range = this.timeRange();
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
      "__interval": { text: this.interval, value: this.interval },
      "__interval_ms": { text: this.intervalMs, value: this.intervalMs },
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
      result = { data: [] };
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
    return true;
  }

  alert(s) {
    window.alert(s);
  }
}
