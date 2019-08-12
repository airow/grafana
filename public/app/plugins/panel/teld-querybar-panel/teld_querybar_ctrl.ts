///<reference path="../../../headers/common.d.ts" />

import { PanelCtrl } from 'app/plugins/sdk';
import { metricsEditorComponent } from './editor_component/metrics_editor';
import { optionsEditorComponent } from './editor_component/options_editor';
import $ from 'jquery';
import _ from 'lodash';
import async from 'async';
import numeral from 'numeral';
import angular from 'angular';
import kbn from 'app/core/utils/kbn';
import * as dateMath from 'app/core/utils/datemath';
import moment from 'moment';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import './directives/all';
import { loadPluginCss } from 'app/plugins/sdk';
import * as rangeUtil from 'app/core/utils/rangeutil';

loadPluginCss({
  dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.3.0.8.built-in.css',
  light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.3.0.8.built-in.css'
});

loadPluginCss({
  dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css',
  light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css'
});

export class TeldQuerybarCtrl extends PanelCtrl {
  static templateUrl = window.navigator.userAgent.indexOf("TeldIosWebView") !== -1 ? 'partials/module.ios.html' : `partials/module.html`;

  //time = { from: moment("2013-01-01"), to: "now" };
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

  isFetchDatabar: true;
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
  currentTargetRefId: any;
  currentTabInfo: any;

  querybarPanelStyle: any;
  originalWidth: any;
  device: any;
  rtClickQueryBtn2Fetch: boolean;
  tabGroup: any;

  datasourceNullValue = {
    "teld-servicegateway-datasource": "",
    "mssql": '%',
    "mysql": '%',
    "teld-elasticsearch-datasource": ".",
    "elasticsearch": "."
  };

  // Set and populate defaults
  panelDefaults = {
    height: 10,
    isCollapse: false,
    datasource: 'default',
    slideWidth: 250,
    targets: [],
    saveVariable: false,
    saveTabGroup: false,
    timeRangeConf: {},
    saveVariableLocalStoragePrefix: _.uniqueId('def')
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
      if (window.navigator.userAgent.indexOf("TeldIosWebView") === -1) {
        this.$scope.$watch('$viewContentLoaded', (event) => {
          $("div.main-view .dash-row .panels-wrapper").width(this.originalWidth - 11.187);
          //alert($("div.main-view .dash-row .panels-wrapper").length);
        });
      }
    }

    _.defaults(this.panel, this.panelDefaults);
    this.isFirstWithSaveVariable = true;
    this.defineQuery = true;
    this.queryResult = {};
    this.querybarVariable = {};
    this.generalVariable = {};
    this.querybarDsVariable = {};
    this.currentTabInfo = {};
    //this.currentTarget = _.head(this.panel.targets);
    this.rtClickQueryBtn2Fetch = this.panel.clickQueryBtn2Fetch;

    this.currentTarget = _.find(this.panel.targets, { refId: this.panel.selectTab }) || this.panel.targets[0];
    // debugger;
    this.initTabGroup();

    this.setCurrentTargetRefId(this.currentTarget);
    this.row.notWatchHeight = true;

    _.each(this.panel.targets, (target, index) => {
      this.initDashboardVariables(target);
    });
    this.localStorage2Variables();

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


    $scope.$root.onAppEvent('metricePanel-fetch', (data) => {
      this.quering = false;
    }, $scope);
    $scope.$root.onAppEvent('teld-fullscreen', function (evt, payload) {
      console.time("teld-fullscreen snapshot querybar");
      this.snapshot = {
        querybarVariable: _.map(_.values(this.querybarVariable), eachItem => {
          return { name: eachItem.name, current: eachItem.current };
        }),
        queryResult: _.cloneDeep(this.queryResult),
        currentTarget: _.cloneDeep(this.currentTarget),
        currentTabInfo: _.cloneDeep(this.currentTabInfo)
      };
      console.timeEnd("teld-fullscreen snapshot querybar");
    }.bind(this), $scope);

    $scope.$root.onAppEvent('teld-exitFullscreen', function (evt, payload) {
      if (this.snapshot) {
        _.each(this.snapshot.querybarVariable, item => {
          var t = _.find(this.templateSrv.variables, { name: item.name });
          if (t) {
            t.current = item.current;
          }
          t = _.find(this.querybarVariable, { name: item });
          if (t) {
            t.current = item.current;
          }
        });
        this.queryResult = this.snapshot.queryResult;
        this.currentTarget = this.snapshot.currentTarget;
        this.currentTabInfo = this.snapshot.currentTabInfo;
      }
      this.templateSrv.updateTemplateData();
      this.eh_clearCycle();
      this.eh_query();
    }.bind(this), $scope);

    if (this.panel.isCollapse) {
      this.row.height = 1;
      this.defineQuery = false;
    }
  }

  addDsQueryVariable(target, dsQueryVariable, nullValue) {
    let variable = this.variableSrv.addVariable({
      hide: 2,
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
      hide: 2,
      type: 'teldCustom',
      name: `${target.conf.variablePrefix}_${variableConf.name}`,
      query: '',
      current: { value: variableConf.value, text: variableConf.text }
    });
    _.set(this.generalVariable, variable.name, variable);
    return variable;
  }

  setGeneralVariable(target, variableConf) {
    var variable = _.find(this.generalVariable, { name: `${target.conf.variablePrefix}_${variableConf.name}` });
    if (_.isNil(variable)) {
      this.addGeneralVariable(target, variableConf);
    } else {
      variable.current = { text: variableConf.value, value: variableConf.value };
    }
  }


  addBindVariable(target, bindVariable, nullValue) {
    let variable = this.variableSrv.addVariable({
      hide: 2,
      type: 'teldCustom',
      name: `${target.conf.variablePrefix}_${bindVariable.name}`,
      query: '',
      current: { value: bindVariable.nullValue || nullValue, text: bindVariable.nullText || this.ALL_TEXT }
    });
    variable.querybarRequired = target.conf.required;
    variable.confVarValue = { value: bindVariable.nullValue || nullValue, text: bindVariable.nullText || this.ALL_TEXT };
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

    _.set(this.currentTabInfo, `${target.refId}`, { swiper: { slideTo: _.noop } });

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
    //end initDashboardVariables
  }

  setTimeRangeVariable(timeRange?) {
    var enable = _.get(this.panel, 'timeRangeConf.enable', false);
    if (enable !== true) { return; }
    timeRange = timeRange || this.timeSrv.timeRange();
    var targetConf = { conf: { variablePrefix: "_timeRange" } };
    _.each(["from", "to"], item => {
      var value = timeRange[item].format();
      this.setGeneralVariable(targetConf, { name: item, text: value, value: value });
    });
  }

  setTimeRange(range) {

    if (false === moment.isMoment(range.from)) {
      var from = moment(range.from);
      if (from.isValid()) {
        range.from = from;
      }
    }

    if (false === moment.isMoment(range.to)) {
      var to = moment(range.to);
      if (to.isValid()) {
        range.to = to;
      }
    }
    this.timeSrv.setTime(range);
    this.setTimeRangeVariable();
    this.variables2LocalStorage();
  }

  enableTimeRange() {
    this.getRangeString();
    var enable = _.get(this.panel, 'timeRangeConf.enable', false);
    return enable ? [0] : [];
  }

  localStorage2Variables() {
    if (false === this.panel.saveVariable) {
      this.variables2LocalStorage();
      this.setTimeRangeVariable();
      return;
    }
    //this.isFirstWithSaveVariable = true;

    var findTargetBy = (valuePath): any => {
      var variablePrefix = _.head(valuePath);
      var target = _.find(this.panel.targets, item => {
        return item.conf.variablePrefix === variablePrefix;
      });
      if (target) {
        valuePath[0] = target.refId;
      }

      return { valuePath, target };
    };

    var set = (valuePath, value) => {
      var findItem = findTargetBy(valuePath);
      if (findItem.target) {
        if (value.value === findItem.target.conf.meta.datasource.nullValue) {
          return;
        }
        _.set(this.currentTabInfo, findItem.valuePath.join("."), value);
      }
    };
    var dashLocalStorage = this.dashboard.dashLocalStorage || "";
    var saveVariableLocalStoragePrefix = this.panel.saveVariableLocalStoragePrefix;
    var localStorageKey = _.remove([dashLocalStorage, saveVariableLocalStoragePrefix, "querybar"]).join("_");
    _.each(_.keys(window.localStorage), (key, index) => {
      if (_.endsWith(key, localStorageKey)) {
        var ls = window.localStorage.getItem(key);
        ls = JSON.parse(ls);

        _.each(ls, (lsVal, varKey) => {

          if (varKey === "timeRange") {
            if (this.denyTimeRangeSave()) {
              this.setTimeRangeVariable();
              this.variables2LocalStorage();
            } else {
              this.setTimeRange(lsVal);
            }
            return;
          }

          var bindVars = this[varKey];

          _.each(bindVars, (varVal, varName) => {
            if (lsVal[varName]) {
              varVal.current = lsVal[varName];
              switch (varKey) {
                case "generalVariable":
                  var { valuePath, target } = findTargetBy(varName.replace("orderby", "orderBy").split("_"));
                  if (target) {
                    var value = _.find(target.conf.orderByOptions, { text: lsVal[varName].text });
                    _.set(this.currentTabInfo, valuePath.join("."), value);
                  }
                  break;
                case "querybarDsVariable":
                  set(varName.replace("_ds_", "_dsQuery_").split("_"), { value: lsVal[varName].value });
                  break;
              }
            }
          });
        });

        this.variableSrv.templateSrv.updateTemplateData();
      }
    });
  }

  denyTimeRangeSave() {
    return this.panel.saveVariable && _.get(this.panel, 'timeRangeConf.denySave', false);
  }

  lsTimeRange(item) {
    return moment.isMoment(item) ? item.format("YYYY-MM-DD HH:mm:ss") : item;
  }

  variables2LocalStorage() {

    var dashLocalStorage = this.dashboard.dashLocalStorage;
    var localStorageKey = _.remove([dashLocalStorage, this.panel.saveVariableLocalStoragePrefix, "querybar"]).join("_");
    if (false === this.panel.saveVariable) {
      window.localStorage.removeItem(localStorageKey);
      return;
    }

    // debugger;
    var lsVariables = ['querybarVariable', 'generalVariable', 'querybarDsVariable'];

    var ls = {};
    var enable = _.get(this.panel, 'timeRangeConf.enable', false);
    var getls = window.localStorage.getItem(localStorageKey);
    if (getls) {
      getls = JSON.parse(getls);
      if (_.isNil(getls['timeRange']) === false) {
        ls['tagGroup'] = getls['timeRange'];
      }
      _.each(['tagGroup'], item => {
        if (_.isNil(getls[item]) === false) {
          ls[item] = getls[item];
        }
      });
    }
    if (enable && this.denyTimeRangeSave() === false) {
      var timeRange = this.timeSrv.timeRange();
      ls['timeRange'] = {
        from: this.lsTimeRange(timeRange.raw.from),
        to: this.lsTimeRange(timeRange.raw.to)
      };
    }

    _.each(lsVariables, item => {
      ls[item] = _.transform(this[item], (result, variable) => {
        result[variable.name] = variable.current;
      }, {});
    });

    window.localStorage.setItem(localStorageKey, JSON.stringify(ls));
  }

  tabGroup2LocalStorage() {
    var dashLocalStorage = this.dashboard.dashLocalStorage;
    var localStorageKey = _.remove([dashLocalStorage, this.panel.saveVariableLocalStoragePrefix, "querybar"]).join("_");
    if (false === this.panel.saveVariable) {
      window.localStorage.removeItem(localStorageKey);
      return;
    }

    // debugger;
    var lsVariables = ['tagGroup'];

    var ls = {};
    // var groupBy = groupItem.groupBy;
    var getls = window.localStorage.getItem(localStorageKey);
    if (getls) {
      ls = JSON.parse(getls);
    }

    _.each(lsVariables, item => {
      ls[item] = _.transform(this.tabGroup, (result, tabGroupItem, key) => {
        result[key] = { 'selectTab': tabGroupItem.selectTab };
      }, {});
    });

    window.localStorage.setItem(localStorageKey, JSON.stringify(ls));
  }

  initTabGroup() {
    var groupBy = _.filter(this.panel.targets, item => { return !_.isEmpty(item.conf.groupBy); });
    this.tabGroup = _.groupBy(groupBy, 'conf.groupBy');

    _.each(this.tabGroup, (item, key) => {
      item.selectTab = item[0].refId;
    });

    this.localStorage2tabGroup();
    this.overwriteCurrentTargetByGroupBy();
  }

  overwriteCurrentTargetByGroupBy() {
    if (this.currentTarget && false === _.isEmpty(this.currentTarget.conf.groupBy)) {
      var ctGroup = this.tabGroup[this.currentTarget.conf.groupBy];
      if (false === _.isNil(ctGroup)) {
        this.currentTarget = _.find(this.panel.targets, { refId: ctGroup.selectTab });
      }
    }
  }

  localStorage2tabGroup() {
    // debugger;
    if (false === this.panel.saveVariable || true !== this.panel.saveTabGroup) {
      this.tabGroup2LocalStorage();
      return;
    }

    var dashLocalStorage = this.dashboard.dashLocalStorage;
    var localStorageKey = _.remove([dashLocalStorage, this.panel.saveVariableLocalStoragePrefix, "querybar"]).join("_");
    if (false === this.panel.saveVariable) {
      window.localStorage.removeItem(localStorageKey);
      return;
    }

    var ls = {};
    // var groupBy = groupItem.groupBy;
    var getls = window.localStorage.getItem(localStorageKey);
    if (getls) {
      ls = JSON.parse(getls);
    }

    // debugger;
    if (ls['tagGroup']) {
      _.each(ls['tagGroup'], (item,key) => {
        if (this.tabGroup[key]) {
          this.tabGroup[key].selectTab = item.selectTab;
          // var size = _.size(this.tabGroup[key]);
          // var tabItem = _.find(this.tabGroup[key], { refId: item.selectTab });
          // var index = _.findIndex(this.tabGroup[key], tabItem);
          // var arrIndex = _.findIndex(this.panel.targets, tabItem);
          // _.move(this.panel.targets, arrIndex, arrIndex - index);
        }
      });
    }
  }


  onInitEditMode() {
    this.addEditorTab('Metrics', metricsEditorComponent);
    // this.addEditorTab('Options', optionsEditorComponent);
    //this.editorTabIndex = 1;
  }

  onDataError() {
    this.render();
  }

  isSelectGroupTab(target) {
    // debugger;
    var returnValue = true;
    if (false === _.isEmpty(target.conf.groupBy)) {
      // debugger;
      if (_.isNil(this.tabGroup[target.conf.groupBy])) {
        this.tabGroup[target.conf.groupBy] = [target];
        this.tabGroup[target.conf.groupBy].selectTab = target.refId;
      }
      returnValue = this.tabGroup[target.conf.groupBy].selectTab === target.refId;
    }
    return returnValue;
  }

  setTabGroup(target) {
    // debugger;
    if (false === _.isEmpty(target.conf.groupBy)) {
      var group = this.tabGroup[target.conf.groupBy];
      // debugger;
      if (_.isNil(group)) {
        group = this.tabGroup[target.conf.groupBy] = [];
      }
      _.each(this.tabGroup, groupItme => {
        _.remove(groupItme, target);
        if (_.size(groupItme) > 0) {
          groupItme.selectTab = groupItme[0].refId;
        } else {
          groupItme = null;
        }
      });
      this.tabGroup[target.conf.groupBy].push(target);
      this.tabGroup[target.conf.groupBy].selectTab = target.refId;
      this.tabGroup = _.pickBy(this.tabGroup, item => { return _.size(item) > 0; });
    }
  }

  hideDropdownMenu(target) {
    if (_.isEmpty(target.conf.groupBy)) { return; }
    this.tabGroup[target.conf.groupBy].showDDM = false;
  }

  toggleDropdownMenu(target, $event) {
    if (_.isEmpty(target.conf.groupBy)) { return; }
    var showDropdownMenu = this.tabGroup[target.conf.groupBy].showDDM;
    this.tabGroup[target.conf.groupBy].showDDM = (showDropdownMenu === target.refId ? false : target.refId);
    if (target === this.currentTarget) {
      $event.stopPropagation();
    }
  }

  changeTabGroup(groupItem, target) {
    this.eh_clearBindVariables(target, true);
    this.manualChangeQueryBarTab(groupItem);
    this.tabGroup[groupItem.conf.groupBy].selectTab = groupItem.refId;
    this.tabGroup[groupItem.conf.groupBy].showDDM = false;
    this.undoQuery(groupItem);

    // debugger;
    this.tabGroup2LocalStorage();
  }

  isGroupItem(target){
    return false === _.isEmpty(target.conf.groupBy);
  }

  setCurrentTargetRefId(currentTarget) {
    currentTarget = currentTarget || {};
    this.currentTargetRefId = currentTarget.refId;
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
      sortDatapoints = [{ isNil: true, field: '无', fieldValue: 'NA', _original: {} }];
    } else {
      if (_.size(targetConf.orderByOptions) === 0 && targetConf.defOrder !== true) {
        sortDatapoints = _.orderBy(datapoints, item => { return Number(item.fieldValue); }, targetConf.fieldOrder || 'desc');
      } else {
        sortDatapoints = datapoints;
      }
    }

    _.set(this.queryResult, this.currentTarget.refId, sortDatapoints);


    let target = this.currentTarget;
    //if (target.conf.required || (this.panel.saveVariable && this.isFirstWithSaveVariable)) {
    if (target.conf.required) {
      let tabInfo = _.get(this.currentTabInfo, this.currentTarget.refId, {});
      delete tabInfo.selectedIndex;
      if (_.isNil(tabInfo.selectedIndex)) {
        //_.set(tabInfo, '.selectedIndex', 0);
        let predicateValue = target.conf.predicateValue || 0;
        let index = _.toNumber(predicateValue);
        if (_.isNaN(index)) {
          let replaceTemplatePredicateValue = this.templateSrv.replace(predicateValue);
          let predicate = new Function('eachItem', "return " + replaceTemplatePredicateValue);
          index = _.findIndex(sortDatapoints, predicate);
          index = index === -1 ? 0 : index;
        }
        let itemIndex = (index >= sortDatapoints.length ? sortDatapoints.length - 1 : index);
        if (this.panel.saveVariable && this.queryCount === 0) {
          let lsIndex = this.targetSelectedIndex(target);
          if (lsIndex > -1) {
            index = lsIndex;
            this.setQueryBarVariableWithSaveVariable(target, index);
          } else {
            this.setQueryBarVariable(target, index, sortDatapoints[itemIndex]);
          }
        } else {
          this.setQueryBarVariable(target, index, sortDatapoints[itemIndex]);
        }
        if (false === this.isFirstLoaded) {
          this.isFirstLoaded = true;
        }
        //this.query();
      }
    } else {
      if (this.panel.saveVariable) {
        if (target.conf.required) {
          let tabInfo = _.get(this.currentTabInfo, this.currentTarget.refId, {});
          this.setQueryBarVariable(target, tabInfo.selectedIndex, {});
        } else {
          if (this.queryCount > 0) {
            let tabInfo = _.get(this.currentTabInfo, this.currentTarget.refId, {});
            this.setQueryBarVariable(target, tabInfo.selectedIndex, {});
          }
        }
      } else {
        let tabInfo = _.get(this.currentTabInfo, this.currentTarget.refId, {});
        this.setQueryBarVariable(target, tabInfo.selectedIndex, {});
      }
    }

    this.render();
  }

  onRender() {
    console.log('onRender');
    this.renderingCompleted();
    if (this.device.ios) {
      this.$timeout(() => {
        this.spin = false;
        this.isFetchData = false;
      }, 2000);
    } else {
      this.spin = false;
      this.isFetchData = false;
    }
  }

  isLoading() {
    return this.isFetchData || this.spin;
  }

  targetSelectedIndex(target) {
    var filters = _.transform(target.conf.bindVariables, (result, n) => {
      var { name, field } = n;
      var varName = `${target.conf.variablePrefix}_${name}`;
      var bindVar = this.querybarVariable[varName];
      if (bindVar) {
        var { value } = bindVar.current;
        result.push(`eachItem._original.${field}=='${value}'`);
      }
    }, []);

    var iteratee = new Function('eachItem', "return " + filters.join(" && "));
    var result = this.queryResult[this.currentTarget.refId];
    var selectedIndex = _.findIndex(result, iteratee);

    return selectedIndex;
  }

  onReadySwiper(swiper) {

    console.log('onReadySwiper');
    if (false === _.has(this.currentTabInfo, this.currentTarget.refId)) {

      // var filters = _.transform(this.currentTarget.conf.bindVariables, (result, n) => {
      //   var { name, field } = n;
      //   var varName = `${this.currentTarget.conf.variablePrefix}_${name}`;
      //   var bindVar = this.querybarVariable[varName];
      //   if (bindVar) {
      //     var { value } = bindVar.current;
      //     result.push(`eachItem._original.${field}=='${value}'`);
      //   }
      // }, []);

      // var iteratee = new Function('eachItem', "return " + filters.join(" && "));
      // var result = this.queryResult[this.currentTarget.refId];
      var selectedIndex = this.targetSelectedIndex(this.currentTarget);

      _.set(this.currentTabInfo, this.currentTarget.refId + '.selectedIndex', selectedIndex);
      swiper.slideTo(selectedIndex, 0, false);
      //this.$timeout(function () { swiper.slideTo(6, 0, false); }, 100);
    }
    _.set(this.currentTabInfo, this.currentTarget.refId + '.swiper', swiper);
    this.$scope.$watch(
      () => { return this.$window.innerWidth; },
      (value) => {
        // console.log(1);
        console.log(this.panel);
        let slideWidth = this.currentTarget.slideWidth;
        slideWidth = slideWidth || (this.panel.slideWidth || this.panelDefaults.slideWidth);
        // swiper.params.slidesPerView = (value / slideWidth);
        // swiper.params.slidesPerView = Math.round(value / slideWidth / (12 / this.panel.span));
        swiper.params.slidesPerView = value / slideWidth / (12 / this.panel.span);
        swiper.onResize();
      });
  }

  getLinkageOptions(target) {
    let options = _.filter(this.panel.targets, item => { return item !== target; });
    return options;
  }

  manualChangeQueryBarTab(target) {
    // this.tabGroup[target.conf.groupBy].showDDM = false;
    if (this.isMultiSyncLinkageModel()) {
      if (this.isFetchData || this.spin) {
        this.alertSrv.set("警告", "数据加载中请等待", "warning", 2000);
        return;
      }
    }
    // this.forbiddenRefreshDashboard = true;
    this.changeQueryBarTab(target);
  }

  changeQueryBarTab(target) {
    //this.currentTab = refId;
    if (target) {
      this.currentTarget = target;
      this.setCurrentTargetRefId(this.currentTarget);
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

  eh_clearBindVariables(target, ignoreRequiredCheck?) {
    this.forbiddenRefreshDashboard = false;
    if (ignoreRequiredCheck !== true && target.conf.required) {
      this.alertSrv.set("警告", `${target.conf.title}为必选项`, "warning", 2000);
      return;
    }
    let tabInfo = this.currentTabInfo[target.refId] || { swiper: { slideTo: _.noop } };
    delete tabInfo.selectedIndex;
    tabInfo.swiper.slideTo(0, 1000, false);
    this.resetTargetBindVariables(target);
    this.query();
  }

  exprVariables = {};
  getExprVariables() {
    let exprVariables = _.transform(this.panel.targets, (result, target, index) => {
      target.conf.variablePrefix = target.conf.variablePrefix || target.refId;
      this.setPublishSelectVlaue(target);
      let bindVariable = _.first(target.conf.bindVariables);
      if (bindVariable) {
        let variable = _.get(this.querybarVariable, `${target.conf.variablePrefix}_${bindVariable.name}`);
        if (variable && variable.current.text !== (bindVariable.nullText || this.ALL_TEXT)) {
          _.set(result, target.conf.title, { index, variable, target });
        }
      }
    }, {});
    this.exprVariables = exprVariables;
    return this.exprVariables;
  }

  isFetchData = false;
  queryDelay = false;
  toggleQuery(target) {
    if (this.isLoading() || this.queryDelay) { return; }
    this.queryDelay = true;
    this.$timeout(() => { this.queryDelay = false; }, 1000);
    this.isFetchData = true;
    this.setQuerybarDs(target);
    if (_.isNil(this.currentTarget)) {
      this.currentTarget = target;
      this.setCurrentTargetRefId(this.currentTarget);
    }
    delete this.queryResult[this.currentTarget.refId];
    this.onMetricsPanelRefresh();
  }

  undoQuery(target) {
    _.each(this.currentTabInfo[target.refId].dsQuery, item => {
      item.value = '';
    });
    this.toggleQuery(target);
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
    //this.variables2LocalStorage();
  }

  getSliderCls(target, index) {
    let tabInfo = this.currentTabInfo[target.refId];
    let selectedIndex = _.get(tabInfo, 'selectedIndex');
    return selectedIndex === index ? 'sliderCls-active' : '';
  }

  showExport(target) {
    var returnValue = false;
    if (_.get(target, 'conf.exprotConf.enable', false)) {
      let tabInfo = this.currentTabInfo[target.refId];
      let selectedIndex = _.get(tabInfo, 'selectedIndex');
      returnValue = !_.isNil(selectedIndex);
    }
    return returnValue;
  }

  swiperSlide_ClickHandler(target, index, selectedItem) {
    // this.forbiddenRefreshDashboard = false;
    if (this.panel.saveVariable) {
      this.isFirstWithSaveVariable = false;
    }
    this.setQueryBarVariable(target, index, selectedItem);
  }

  setQueryBarVariable(target, index, selectedItem) {
    // this.forbiddenRefreshDashboard = false;
    let tabInfo = this.currentTabInfo[target.refId] || { swiper: { slideTo: _.noop } };
    let conf = target.conf;
    let selectedIndex = tabInfo.selectedIndex;
    if (selectedIndex === index || (index.isNil)) {
      if (target.conf.required) {
        this.alertSrv.set("警告", `${target.conf.title}为必选项`, "warning", 2000);
        return;
      }
      delete tabInfo.selectedIndex;
      // this.forbiddenRefreshDashboard = true;
      this.clearTargetBindVariables(target);
    } else {
      this.forbiddenRefreshDashboard = false;
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
        if (selectedItem && selectedItem.isNil) {
          variable.current = { text: selectedItem.field, value: selectedItem.fieldValue };
          return;
        }
        let value = _.get(selectedItem, bindVariable.field);
        let text = value;
        if (_.isNil(value)) {
          if (selectedItem) {
            text = value = _.get(selectedItem._original, bindVariable.field);
            if (_.isNil(value)) {
              text = value = _.get(selectedItem, "_original." + bindVariable.field, nullValue);
              if (_.isNil(value)) {
                value = nullValue;
                text = nullText;
              }
            }
          }
        }
        if (_.isString(value) && _.isEmpty(value)) {
          value = nullValue;
          text = nullText;
        }
        variable.current = { text: text, value: value };
      });
      this.templateSrv.updateTemplateData();
      //this.variables2LocalStorage();
      //this.$timeout(function () { tabInfo.swiper.slideTo(index, 1000, false); }, 100);
      tabInfo.swiper.slideTo(index, 1000, false);
      if (this.panel.stopClickRefresh !== true) {
        this.query();
      }
    }
    if (true === this.skipSyncLinkageTarget) {
      return;
    }
    this.syncLinkageTarget(target);

  }

  setQueryBarVariableWithSaveVariable(target, index) {
    let tabInfo = this.currentTabInfo[target.refId] || { swiper: { slideTo: _.noop } };
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
      //this.$timeout(function () { tabInfo.swiper.slideTo(index, 1000, false); }, 100);
      tabInfo.swiper.slideTo(index, 1000, false);
      if (this.panel.stopClickRefresh !== true) {
        this.query();
      }
    }
    if (true === this.skipSyncLinkageTarget) {
      return;
    }
    this.multistageSyncLinkage(target);
  }
  enterkey(target) {
    if (window.event['keyCode'] === 13) {
      this.toggleQuery(target);
    }
  }

  resetTargetBindVariables(target) {
    let conf = target.conf;
    _.each(conf.bindVariables, bindVariable => {
      let variablePath = `${conf.variablePrefix}_${bindVariable.name}`;
      let variable = _.get(this.querybarVariable, variablePath);
      let nullValue = bindVariable.nullValue || conf.meta.datasource.nullValue;
      variable.current = { text: bindVariable.nullText || this.ALL_TEXT, value: nullValue };
    });
    this.templateSrv.updateTemplateData();
  }

  isMultiSyncLinkageModel() {
    return this.panel.stopClickRefresh && this.panel.multiSyncLinkage;
  }

  clearTargetBindVariables(target) {
    this.resetTargetBindVariables(target);
    if (this.isMultiSyncLinkageModel()) {
      this.getExprVariables();
    } else {
      this.query();
    }
  }

  isFirstWithSaveVariable = false;
  skipSyncLinkageTarget = false;
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
      if (_.isNil(itemTarget)) {
        return;
      }
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
    //this.variables2LocalStorage();

    if (this.isMultiSyncLinkageModel()) {
      this.multistageSyncLinkage(target);
    }
  }

  multistageSyncLinkage(target) {
    this.isFetchData = true;
    let linkages = [];
    this.linkageMap(linkages, target);

    // if (_.size(linkages) === 0) {
    //   this.currentTarget = target;
    //   this.skipSyncLinkageTarget = false;
    //   this.isFetchData = false;
    //   this.query();
    //   this.changeQueryBarTab(target);
    //   return;
    // }

    async.mapSeries(linkages, (item, cb) => {
      this.skipSyncLinkageTarget = true;
      this.isFetchData = true;
      let refId = item.refId;
      let linkTarget = _.find(this.panel.targets, { refId: refId });

      this.currentTarget = linkTarget;

      this.onMetricsPanelRefresh().then(() => {
        cb();
      });
    }, (err, r) => {
      this.currentTarget = target;
      this.skipSyncLinkageTarget = false;
      this.isFetchData = false;
      this.query();
      this.changeQueryBarTab(target);
    });
  }

  linkageMap(linkages, target) {

    let subLiages = [];
    _.each(target.conf.linkage || [], item => {
      linkages.push(item);

      let itemTarget = _.find(this.panel.targets, { refId: item.refId });
      if (itemTarget && _.size(itemTarget.conf.linkage) > 0) {
        subLiages.push(itemTarget);
      }
    });

    _.each(subLiages || [], item => {
      this.linkageMap(linkages, item);
    });
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
    //returnValue = _.slice(returnValue, 0, target.conf.size || 40);
    let displayCount = target.conf.displayCount || this.panel.displayCount || 40;
    if (_.isString(displayCount)) {
      displayCount = _.toNumber(this.templateSrv.replaceWithText(displayCount + "", {}));
    }
    returnValue = _.slice(returnValue, 0, displayCount);

    let templateSettings = { imports: this.imports, variable: 'value' };

    returnValue = _.map(returnValue, item => {

      item.label = _.template(target.conf.titleTemplate || item.field, templateSettings)(item._original);
      item.labelBottom = _.template(target.conf.bottomTemplate || item.fieldValue, templateSettings)(item._original);
      item.labelTop = _.template(target.conf.topTemplate || item.topTitle, templateSettings)(item._original);

      item.conf = _.defaultsDeep({}, target.conf);
      item.conf.topStyle = (new Function('item', 'return ' + target.conf.topStyle))(item._original);
      item.conf.titleStyle = (new Function('item', 'return ' + target.conf.titleStyle))(item._original);
      item.conf.titleDivStyle = (new Function('item', 'return ' + target.conf.titleDivStyle))(item._original);
      item.conf.bottomStyle = (new Function('item', 'return ' + target.conf.bottomStyle))(item._original);
      return item;
    });

    return returnValue;
  }


  onMetricsPanelRefresh() {
    // debugger;
    console.log('onMetricsPanelRefresh');
    this.spin = true;
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode()) { return; }

    // clear loading/error state
    delete this.error;
    this.updateTimeRange();
    // load datasource service
    this.setTimeQueryStart();
    if (_.isNil(this.currentTarget) || _.isNil(this.currentTarget.datasource)) {
      return Promise.resolve();
    }
    return this.datasourceSrv.get(this.currentTarget.datasource)
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
    var time = { from: moment("2013-01-01"), to: "now" };
    if (this.panel.dashboardTime) {
      time = this.timeSrv.time;
    }
    var raw = {
      from: moment.isMoment(time.from) ? moment(time.from) : time.from,
      to: moment.isMoment(time.to) ? moment(time.to) : time.to,
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

    var from = this.range.from.clone();
    var to = this.range.to.clone();
    var fromYYYMMDD = moment(from.format("YYYYMMDD"));
    var toYYYYMMDD = moment(to.format("YYYYMMDD"));
    Object.assign(scopedVars, {
      "dash_timeFrom": { text: from.valueOf(), value: from.valueOf() },
      "dash_timeTo": { text: to.valueOf(), value: to.valueOf() },

      "dash_dateFrom": { text: fromYYYMMDD.valueOf(), value: fromYYYMMDD.valueOf() },
      "dash_dateTo": { text: toYYYYMMDD.valueOf(), value: toYYYYMMDD.valueOf() }
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
    // this.forbiddenRefreshDashboard = true;
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

  queryCount = 0;
  query() {
    /*查看面板Json是虽然包含querybarInitFinish属性，但不会影响程序逻辑，在为执行到这里是，querybarInitFinish为undefined*/
    this.dashboard.querybarInitFinish = true;
    if (this.queryCount === 0 || true !== this.rtClickQueryBtn2Fetch) {
      this.eh_query();
    } else {
      this.getExprVariables();
    }
  }

  quering = false;
  forbiddenRefreshDashboard = false;
  eh_query() {
    // if (this.queryCount === 0 && this.panel.stopClickRefresh) {
    //   this.dashboard.querybarInitFinish = true;
    // }
    this.queryCount++;
    // debugger;
    console.log('query');
    if (false === this.forbiddenRefreshDashboard) {
      this.quering = true;
    }
    this.triggerRefresh = true;
    this.dashboard.meta.hasQuerybarPanel = false;
    if (this.panel.subscribeRefresh) {

    } else {

      if (this.panel.clickQueryBtn2Fetch && this.panel.checkRequiredVariableIsPass) {
        var requiredVariableIsPass = _.find(this.variableSrv.variables, item => item.querybarRequired
          && item.confVarValue.value === item.current.value);

        if (requiredVariableIsPass) {
          this.alertSrv.set("警告", `必选项不能为空`, "warning", 2000);
          return;
        }
      }

      if (false === this.forbiddenRefreshDashboard) {
        this.timeSrv.refreshDashboard();
      }
      this.forbiddenRefreshDashboard = false;
      this.getExprVariables();
      this.$scope.$root.appEvent("gfilter-fetch", { panelType: 'querybar', target: this });
    }
    this.variables2LocalStorage();
    //this.isFetchData = false;
    return true;
  }

  eh_clearCycle() {
    this.$scope.$root.appEvent("emit-clearCycle");
  }

  eh_queryWithCycle(cycle) {
    this.$scope.$root.appEvent("emit-cycle", { cycle: cycle.key });
  }

  getTimeButton() {
    return _.filter(this.panel.cycleConf, 'enable');
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

  variableIsHide(variable) {
    return _.includes(['%', ".", "N/A", "NA"], variable.current.text);
  }

  defineQuerySwitch() {
    this.row.height = 1;
    this.defineQuery = !this.defineQuery;
    this.$scope.$root.appEvent("querybar-queryswitch", this);
  }

  absolute: any;
  tooltip: any;
  isUtc: boolean;
  rangeString: any;
  getRangeString() {

    // this.panel = this.dashboard.timepicker;

    var time = angular.copy(this.timeSrv.timeRange());
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
    } else {
      this.isUtc = true;
    }

    // var rangeString = rangeUtil.describeTimeRange(timeRaw);
    var absoluteFormat = { from: { absoluteFormat: "YYYY-MM-DD" }, to: { absoluteFormat: "YYYY-MM-DD" } };
    // _.defaultsDeep(absoluteFormat, timeRaw);
    // var rangeString = rangeUtil_querybar.describeTimeRange_zh_CN(absoluteFormat);
    // _.defaultsDeep(timeRaw, absoluteFormat);
    this.rangeString = rangeUtil.describeTimeRangeRTZ(timeRaw);
    this.absolute = { fromJs: time.from.toDate(), toJs: time.to.toDate() };
    this.tooltip = this.dashboard.formatDate(time.from) + ' <br>to<br>';
    this.tooltip += this.dashboard.formatDate(time.to);

    // do not update time raw when dropdown is open
    // as auto refresh will reset the from/to input fields

    return this.rangeString;

    // return "asdfasdfasf";
  }

  popup() {

    //debugger;
    var popupModalScope = this.$scope.$new();
    popupModalScope.$on("$destroy", function () {
      popupModalScope.dismiss();
    });
    popupModalScope.panel = this.panel;
    // popupModalScope.links = links;
    popupModalScope.panelCtrl = this;
    popupModalScope.modalTitle = this.panel.title;
    popupModalScope.syncTimeRange = this.setTimeRange.bind(this);
    popupModalScope.dashboard = this.dashboard;

    var scrollY = window.scrollY;
    this.publishAppEvent('show-modal', {
      modalClass: "teld-go-to-detail",
      //src: 'public/app/features/dashboard/partials/shareModal.html',
      templateHtml: '<querybar-time-picker dash3board="ctrl.dashboard"></querybar-time-picker>',
      // src: 'public/app/features/dashboard/timepicker/dropdown.html',
      scope: popupModalScope
    });

    popupModalScope.$on('modal-shown', function (ve) {
      window.scrollTo(0, scrollY);
      $(".teld-go-to-detail").css('top', scrollY + $(window).height() / 4);
    });
  }

  popupExport(targetExport) {
    var popupModalScope = this.$scope.$new();
    popupModalScope.$on("$destroy", function () {
      popupModalScope.dismiss();
    });
    popupModalScope.panel = this.panel;
    popupModalScope.panelCtrl = this;
    popupModalScope.dashboard = this.dashboard;
    popupModalScope.targetExport = targetExport;

    var scrollY = window.scrollY;
    this.$scope.$root.appEvent('show-modal', {
      modalClass: "teld-popup-export",
      //src: 'public/app/features/dashboard/partials/shareModal.html',
      templateHtml: '<teld-popup-export></teld-popup-export>',
      scope: popupModalScope
    });

    popupModalScope.$on('modal-shown', function (ve) {
      window.scrollTo(0, scrollY);
      $(".teld-popup-export").css('top', scrollY + $(window).height() / 4);
    });
  }

  alert(s) {
    window.alert(s);
  }

}
