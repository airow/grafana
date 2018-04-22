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
  dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.3.0.8.built-in.css',
  light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.3.0.8.built-in.css'
});

// loadPluginCss({
//   dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.ios.iframe.fix.built-in.css',
//   light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.ios.iframe.fix.built-in.css'
// });

loadPluginCss({
  dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css',
  light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css'
});

export class TeldQuerybarCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  time = { from: moment("2013-01-01"), to: "now" };
  ALL_TEXT = '-全部-';
  isFirstLoaded = false;
  spin = true;
  defTargetConf = {
    conf: {
      linkage: [],
      dsQueryVariables: [{ name: 'query', label: '过滤' }],
      bindVariables: [],
      predicateValue: 0,
      orderByOptions: [],
    }
  };

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
  uiSegmentSrv: any;

  range: any;
  rangeRaw: any;
  interval: any;
  intervalMs: any;
  resolution: any;
  defineQuery: boolean;
  queryResult: any;

  querybarVariable: any;
  generalVariable: any;
  querybarDsVariable: any;

  $window: any;
  currentTarget: any;
  currentTabInfo: any;

  querybarPanelStyle: any;
  originalWidth: any;
  device: any;

  datasourceNullValue = {
    "mssql": '%',
    "mysql": '%',
    "teld-elasticsearch-datasource": ".",
    "elasticsearch": "."
  };

  // Set and populate defaults
  panelDefaults = {
    height: 10,
    datasource: 'default',
    targets: []
  };

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.$window = $injector.get("$window");
    this.$q = $injector.get('$q');
    this.datasourceSrv = $injector.get('datasourceSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.templateSrv = $injector.get('templateSrv');
    this.variableSrv = $injector.get('variableSrv');
    this.alertSrv = $injector.get('alertSrv');
    this.uiSegmentSrv = $injector.get('uiSegmentSrv');

    this.device = (function () {
      var ua = window.navigator.userAgent;
      var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
      var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
      var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
      var iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
      return {
        ios: ipad || iphone || ipod,
        android: android
      };
    })();

    this.querybarPanelStyle = {};
    let panelsWrapper: any;
    this.originalWidth = this.$window.innerWidth;
    if (this.device.ios) {
      this.querybarPanelStyle.width = this.originalWidth - 33.187;
      //panelsWrapper.width = this.originalWidth - 11.187;
      this.$scope.$watch('$viewContentLoaded', (event) => {
        $("div.main-view .dash-row .panels-wrapper").width(this.originalWidth - 11.187);
        //alert($("div.main-view .dash-row .panels-wrapper").length);
      });
    }

    _.defaults(this.panel, this.panelDefaults);

    this.defineQuery = true;
    this.queryResult = {};
    this.querybarVariable = {};
    this.generalVariable = {};
    this.querybarDsVariable = {};
    this.currentTabInfo = {};
    //this.currentTarget = _.head(this.panel.targets);

    this.currentTarget = _.find(this.panel.targets, { refId: this.panel.selectTab }) || this.panel.targets[0];
    this.row.notWatchHeight = true;

    _.each(this.panel.targets, target => {
      this.initDashboardVariables(target);
    });

    if (this.panel.subscribeRefresh) {
      this.events.on('refresh', this.onRefresh.bind(this));
    } else {
      this.changeQueryBarTab(this.currentTarget);
    }

    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  addDsQueryVariable(target, dsQueryVariable, nullValue) {
    let variable = this.variableSrv.addVariable({
      //hide: 2,
      type: 'teldCustom',
      name: `${target.conf.variablePrefix}_ds_${dsQueryVariable.name}`,
      query: '',
      current: { value: dsQueryVariable.nullValue || nullValue, text: dsQueryVariable.nullText || this.ALL_TEXT }
    });
    _.set(this.querybarDsVariable, variable.name, variable);
    return variable;
  }

  addGeneralVariable(target, variableConf) {
    let variable = this.variableSrv.addVariable({
      //hide: 2,
      type: 'teldCustom',
      name: `${target.conf.variablePrefix}_${variableConf.name}`,
      query: '',
      current: { value: variableConf.value, text: variableConf.text }
    });
    _.set(this.generalVariable, variable.name, variable);
    return variable;
  }

  addBindVariable(target, bindVariable, nullValue) {
    let variable = this.variableSrv.addVariable({
      //hide: 2,
      type: 'teldCustom',
      name: `${target.conf.variablePrefix}_${bindVariable.name}`,
      query: '',
      current: { value: bindVariable.nullValue || nullValue, text: bindVariable.nullText || this.ALL_TEXT }
    });
    _.set(this.querybarVariable, variable.name, variable);
    return variable;
  }

  setVariableOrderByCurrent(variableOrderBy, itme) {
    variableOrderBy.current.text = itme.text;
    variableOrderBy.current.value = `<orderby='${itme.value}'/>`;
  }

  initDashboardVariables(target) {

    target.conf.variablePrefix = target.conf.variablePrefix || target.refId;

    let nullValue = target.conf.meta.datasource.nullValue;


    let orderByDefaultConf = _.first(target.conf.orderByOptions);
    if (false === _.isNil(orderByDefaultConf)) {
      let variableOrderBy = this.addGeneralVariable(target, _.defaults({ name: 'orderby' }, orderByDefaultConf));
      this.setVariableOrderByCurrent(variableOrderBy, orderByDefaultConf);
      _.set(this.currentTabInfo, `${target.refId}.orderBy`, orderByDefaultConf);
    }

    _.each(target.conf.bindVariables, bindVariable => {
      let variable = this.addBindVariable(target, bindVariable, nullValue);
    });

    _.each(target.conf.dsQueryVariables, dsQueryVariable => {
      let dsQuery = this.addDsQueryVariable(target, dsQueryVariable, nullValue);
    });

    this.variableSrv.templateSrv.updateTemplateData();
  }

  onInitEditMode() {
    this.addEditorTab('Metrics', metricsEditorComponent);
    // this.addEditorTab('Options', optionsEditorComponent);
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
              value = _.zipObject(['bottomTitle', 'field'], datapoint);
            } else {

              value = {
                field: _.get(datapoint, targetConf.field, "未设置显示字段"),
                fieldValue: _.get(datapoint, targetConf.fieldValue, '')
              };

              if (value.field === "未设置显示字段" && _.size(datapoint) === 2) {
                value = _.mapKeys(datapoint, (value, key) => { return _.isNumber(value) ? 'fieldValue' : 'field'; });
              }
            }
            value._original = datapoint;
            return value;
          });

          datapoints = _.concat(datapoints, mapData);
          break;
        case 'table':
          let columnsIndex = {
            colName: _.findIndex(item.columns, { text: targetConf.field || "name" }),
            colValue: _.findIndex(item.columns, { text: targetConf.fieldValue || "value" })
          };

          let columnsName = _.transform(item.columns, (result, col) => { result.push(col.text); }, []);

          mapData = _.map(item.rows, row => {
            let value = {
              field: row[columnsIndex.colName],
              fieldValue: row[columnsIndex.colValue],
              _original: _.zipObject(columnsName, row)
            };
            return value;
          });

          datapoints = _.concat(datapoints, mapData);
          break;
        default:
          if (_.has(item, 'meta.sql')) {
            datapoints.push({
              _original: item.datapoints, field: item.target,
              fieldValue: _.sumBy(item.datapoints, i => { return i[0]; })
            });
          } else {
            datapoints.push({
              _original: item.datapoints, field: item.target,
              fieldValue: _.sumBy(item.datapoints, i => { return i[0]; })
            });
          }
          break;
      }
    });

    let sortDatapoints;
    if (_.size(datapoints) === 0) {
      sortDatapoints = [{ isNil: true, field: '无', fieldValue: 'N/A', _original: {} }];
    } else {
      if (_.size(targetConf.orderByOptions) === 0) {
        sortDatapoints = _.orderBy(datapoints, item => { return Number(item.fieldValue); }, targetConf.fieldOrder || 'desc');
      } else {
        sortDatapoints = datapoints;
      }
    }

    _.set(this.queryResult, this.currentTarget.refId, sortDatapoints);


    let target = this.currentTarget;
    if (target.conf.required) {
      let tabInfo = _.get(this.currentTabInfo, this.currentTarget.refId, {});
      delete tabInfo.selectedIndex;
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
        }
        //this.query();
      }
    } else {
      let tabInfo = _.get(this.currentTabInfo, this.currentTarget.refId, {});
      this.setQueryBarVariable(target, tabInfo.selectedIndex, {});
    }

    this.render();
  }

  onRender() {
    console.log('onRender');
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
        swiper.params.slidesPerView = (value / 250);
        //swiper.params.slidesPerView = _.floor(value / 325);
        // swiper.params.slidesPerView = _.floor(value / 250);
        // if (swiper.params.slidesPerView === 1) {
        //   swiper.params.slidesPerView = 1.1;
        // }
        swiper.onResize();
      });
  }

  getLinkageOptions(target) {
    let options = _.filter(this.panel.targets, item => { return item !== target; });
    return options;
  }

  changeQueryBarTab(target) {
    //this.currentTab = refId;
    if (target) {
      this.currentTarget = target;
      if (false === _.has(this.queryResult, target.refId)) {
        this.onMetricsPanelRefresh();
      } else {
        //this.swiper[target.refId].update(true);
        let tabInfo = this.currentTabInfo[target.refId];
        if (tabInfo && tabInfo.swiper) {
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

  setPublishSelectVlaue(target) {
    let selectValue = { name: 'selectValue', field: target.conf.field };
    if (_.size(target.conf.bindVariables) === 0) {
      target.conf.bindVariables.push(selectValue);
    } else {
      let bindVariable = _.first(target.conf.bindVariables);
      if (_.isNil(bindVariable.field)) {
        bindVariable.field = selectValue.field;
      }
      if (_.isNil(bindVariable.name)) {
        bindVariable.name = selectValue.name;
      }
    }
  }

  getExprVariables() {
    let exprVariables = _.transform(this.panel.targets, (result, target, index) => {
      target.conf.variablePrefix = target.conf.variablePrefix || target.refId;
      this.setPublishSelectVlaue(target);
      let bindVariable = _.first(target.conf.bindVariables);
      if (bindVariable) {
        let variable = _.get(this.querybarVariable, `${target.conf.variablePrefix}_${bindVariable.name}`);
        if (variable && variable.current.text !== (bindVariable.nullText || this.ALL_TEXT)) {
          _.set(result, target.conf.title, variable);
        }
      }
    }, {});

    //let exprVariables = this.querybarVariable;
    return exprVariables;
  }

  toggleQuery(target) {
    this.setQuerybarDs(target);
    if (_.isNil(this.currentTarget)) {
      this.currentTarget = target;
    }
    delete this.queryResult[this.currentTarget.refId];
    this.onMetricsPanelRefresh();
  }

  setQuerybarDs(target) {
    let conf = target.conf;
    let tabInfo = this.currentTabInfo[target.refId];

    let orderBy = _.find(this.generalVariable, { name: `${conf.variablePrefix}_orderby` });
    if (false === _.isNil(orderBy) && false === _.isNil(tabInfo.orderBy)) {
      this.setVariableOrderByCurrent(orderBy, tabInfo.orderBy);
    }

    _.each(conf.dsQueryVariables, dsQueryVariable => {
      let nullValue = dsQueryVariable.nullValue || conf.meta.datasource.nullValue;
      let valuePath = `${target.refId}.dsQuery.${dsQueryVariable.name}.value`;
      let value = _.get(this.currentTabInfo, valuePath, nullValue);

      let variablePath = `${target.conf.variablePrefix}_ds_${dsQueryVariable.name}`;
      let variable = _.get(this.querybarDsVariable, variablePath);
      if (_.isNil(variable)) {
        variable = this.addDsQueryVariable(target, dsQueryVariable, nullValue);
      }
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
        this.alertSrv.set("警告", `${target.conf.title}为必选项`, "warning", 2000);
        return;
      }
      delete tabInfo.selectedIndex;
      this.clearTargetBindVariables(target);
    } else {
      _.set(tabInfo, 'selectedIndex', index);

      this.setPublishSelectVlaue(target);
      _.each(conf.bindVariables, bindVariable => {
        let nullValue = bindVariable.nullValue || conf.meta.datasource.nullValue;
        let nullText = bindVariable.nullText || this.ALL_TEXT;

        let variablePath = `${conf.variablePrefix}_${bindVariable.name}`;
        let variable = _.get(this.querybarVariable, variablePath);

        if (_.isNil(variable)) {
          variable = this.addBindVariable(target, bindVariable, nullValue);
        }
        let value = _.get(selectedItem, bindVariable.field);
        let text = value;
        if (_.isNil(value)) {
          text = value = _.get(selectedItem._original, bindVariable.field);
          if (_.isNil(value)) {
            text = value = _.get(selectedItem, "_original." + bindVariable.field, nullValue);
            if (_.isNil(value)) {
              value = nullValue;
              text = nullText;
            }
          }
        }
        if (_.isEmpty(value)) {
          value = nullValue;
          text = nullText;
        }
        variable.current = { text: text, value: value };
      });
      this.templateSrv.updateTemplateData();
      //this.$timeout(function () { tabInfo.swiper.slideTo(index, 1000, false); }, 100);
      tabInfo.swiper.slideTo(index, 1000, false);
      if (this.panel.stopClickRefresh !== true) {
        this.query();
      }
    }
    this.syncLinkageTarget(target);
  }

  enterkey(target) {
    if (window.event['keyCode'] === 13) {
      this.toggleQuery(target);
    }
  }

  clearTargetBindVariables(target) {
    let conf = target.conf;
    _.each(conf.bindVariables, bindVariable => {
      let variablePath = `${conf.variablePrefix}_${bindVariable.name}`;
      let variable = _.get(this.querybarVariable, variablePath);
      let nullValue = bindVariable.nullValue || conf.meta.datasource.nullValue;
      variable.current = { text: bindVariable.nullText || this.ALL_TEXT, value: nullValue };
    });
    this.templateSrv.updateTemplateData();
    this.query();
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
      let nullValue = itemTargetConf.meta.datasource.nullValue;

      _.each(this.querybarDsVariable, (variable, key) => {
        if (_.startsWith(key, variablePrefix)) {
          let nameField = _.replace(key, variablePrefix, '');
          let dsQueryVariableConf = _.find(itemTargetConf.dsQueryVariables, { name: nameField });
          variable.current = { text: dsQueryVariableConf.nullText || this.ALL_TEXT, value: dsQueryVariableConf.nullValue || nullValue };
        }
      });

      let bindVariablePrefix = `${itemTargetConf.variablePrefix}_`;
      _.each(this.querybarVariable, (variable, key) => {
        if (_.startsWith(key, bindVariablePrefix)) {
          let nameField = _.replace(key, bindVariablePrefix, '');
          let queryVariableConf = _.find(itemTargetConf.bindVariables, { name: nameField });
          variable.current = { text: queryVariableConf.nullText || this.ALL_TEXT, value: queryVariableConf.nullValue || nullValue };
        }
      });
    });

    this.templateSrv.updateTemplateData();
  }

  imports = {
    '_': _,
    'kbn': kbn,
    'valueFormats': (function (kbn) {
      let bindContext = {
        // kbn,
        // valueFormats: kbn.valueFormats,
        // kbnMap: _.mapKeys(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), (value) => { return value.text; }),
        valueFormats: _.transform(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), function (result, unitFormatConf, index) {
          result[unitFormatConf.text] = kbn.valueFormats[unitFormatConf.value];
        }, {})
      };

      return function (unitFormatName, size, decimals) {
        return this.valueFormats[unitFormatName](size, decimals);
      }.bind(bindContext);
    })(kbn)
  };

  getQueryResult(target) {
    let refId = (target || this.currentTarget).refId;
    //let refId = this.currentTarget.refId;

    let returnValue = _.get(this.queryResult, refId);
    returnValue = _.slice(returnValue, 0, target.conf.size || 40);

    let templateSettings = { imports: this.imports, variable: 'value' };

    returnValue = _.map(returnValue, item => {

      item.label = _.template(target.conf.titleTemplate || item.field, templateSettings)(item._original);
      item.labelBottom = _.template(target.conf.bottomTemplate || item.fieldValue, templateSettings)(item._original);
      item.labelTop = _.template(target.conf.topTemplate || item.topTitle, templateSettings)(item._original);

      item.conf = _.defaultsDeep({}, target.conf);
      item.conf.topStyle = (new Function('return ' + target.conf.topStyle))();
      item.conf.titleStyle = (new Function('return ' + target.conf.titleStyle))();
      item.conf.bottomStyle = (new Function('return ' + target.conf.bottomStyle))();
      return item;
    });


    // let tabInfo = this.currentTabInfo[target.refId];
    // delete tabInfo.selectedIndex;
    // this.clearTargetBindVariables(target);
    if (target.conf.required) {
      //this.setQueryBarVariable(target, target.conf.predicateValue, _.first(returnValue));
    }

    return returnValue;
  }


  onMetricsPanelRefresh() {
    console.log('onMetricsPanelRefresh');
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
  triggerRefresh = false;

  query() {
    console.log('query');
    this.triggerRefresh = true;
    if (this.panel.subscribeRefresh) {

    } else {
      this.timeSrv.refreshDashboard();
    }
    return true;
  }

  onRefresh() {
    //this.render();
    //this.changeQueryBarTab(this.currentTarget);
    console.log('onRefresh');
    //this.onMetricsPanelRefresh();
    if (this.triggerRefresh === true) {
      this.triggerRefresh = false;
    } else {
      this.toggleQuery(this.currentTarget);
    }
  }

  alert(s) {
    window.alert(s);
  }

}
