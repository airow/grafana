///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';

import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import appEvents from '../../../core/app_events';
import TimeSeries from '../../../core/time_series2';
import { colors as gfColors } from '../../../core/core';
import { MetricsPanelCtrl, loadPluginCss } from '../../sdk';

import echarts from 'echarts';
import echartsTheme, { echartsThemeName, echartsThemeMap } from './theme/all';

import * as FileExport from '../../../core/utils/file_export';
import {transformDataToTable} from '../table/transformers';
import {tablePanelEditor} from '../table/editor';
import {TableRenderer} from '../table/renderer';

import { styleEditorComponent } from './style_editor';
import { tabStyleEditorComponent } from './tab_style_editor';
import { seriesEditorComponent } from './series_editor';

import { echartsEventEditorComponent } from '../teld-eventhandler-editor/echarts_eventhandler_editor';
import * as graphutils from '../../../core/utils/graphutils';
import {calcSeriesEditorComponent} from '../graph/calcSeries_editor';
import {seriesTypeEditorComponent} from './editor/seriesType_editor';
import {cycleEditorComponent} from './editor/cycle_editor';
import { cumulativeEditorComponent, cumulative } from '../graph/cumulative_editor';
import empty_option from './theme/empty_option';

loadPluginCss({
  dark: '/public/app/plugins/panel/teld-echarts-panel/css/style.built-in.css',
  light: '/public/app/plugins/panel/teld-echarts-panel/css/style.built-in.css'
});

export class ModuleCtrl extends MetricsPanelCtrl {
  static templateUrl = `partials/module.html`;

  ecInstance: echarts.ECharts;
  ecConfig: any;
  ecOption: any;

  ecSeries: any[];

  seriesLabel = {};
  echartColors: any[];

  valueFormats = kbn.valueFormats;

  ecConf = {
    axis: {
      category: {
        show: true,
        type: 'category',
        //boundaryGap: false,
        /**
         * 在类目轴中，也可以设置为类目的序数（如类目轴 data: ['类A', '类B', '类C'] 中，序数 2 表示 '类C'。也可以设置为负数，如 -3）。
         * min: 'dataMin',
         * max: 'dataMax',
         */
        axisLabel: {
          formatter: function (value) { return value; }
        }
      },
      value: {
        show: true,
        type: 'value',
        // min: 'dataMin',
        // max: 'dataMax',
        axisLabel: {
          //formatter: this.panel.formatter.yAxis.axisLabel.formatter.bind(this)
          formatter: this.axisLableFormatter
          // formatter: function(){
          //   var f = '' ;
          //   var ff = this.axisLableFormatter;
          // }

        }
      }
    },
    series: {
      line: { type: 'line' },
      bar: { type: 'bar' },
      pie: { type: 'pie' }
    }
  };

  echartsTheme: any;
  echartsThemeName: any;

  currentMode = 'chart';
  dataRaw: any;
  table: any;
  tbodyHtml: any;

  // Set and populate defaults
  panelDefaults = {
    hideTimeOverride: true,
    xAxisMode: "time",
    //xAxisMode: "series",
    formatter: {
      value: { format: 'teldString' },
      category: { format: 'teldString' },
      xAxis: { axisLabel: { format: 'teldString' } },
      yAxis: { axisLabel: { format: 'teldString' } },
      tooltip_category: { enable: false, format: 'teldString' },
      tooltip_value: { enable: false, format: 'teldString' }
    },
    serieType: 'line',
    style: {
      themeName: 'default',
      innerRing: { show: false, color: '', width: 1 }
    },
    legendExt: {
      twoSides: false
    },
    echarts: {
      title: { show: true },
      legend: { show: false, orient: 'vertical', left: 'left' },
      xAxis: {},
      yAxis: {},
      tooltip: { show: false, trigger: 'none' },
      grid: { show: false },
      // axis: {
      //   category: {},
      //   value: {}
      // },
      series: {
        line: {
          label: { normal: { show: false } }
        },
        bar: {
          label: { normal: { show: false } }
        },
        pie: {
          label: { normal: { show: false } },
          center: ['50%', '50%'],
          radius: [0, '67%']
        }
      },
    },

    pieExt: {
      dataExt: {
        enable: false,
        items: [{}]
      }
    },

    eventSubscribe: {
      enable: false,
      eventPanels: []
    },

    showTable: false,/** 是否显示表格 */
    /** 表格展示配置信息，参考table面板 */
    transform: 'timeseries_to_columns',
    pageSize: null,
    showHeader: true,
    styles: [
      {
        type: 'date',
        pattern: 'Time',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      {
        unit: 'short',
        type: 'number',
        decimals: 2,
        colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
        colorMode: null,
        pattern: '/.*/',
        thresholds: [],
      }
    ],
    columns: [],
    scroll: true,
    fontSize: '100%',
    sort: {col: 0, desc: true},
    filterNull: false,
  };

  $parse: any;
  cache: any;
  dataListMetric: any[];
  alertSrv: any;

  /** @ngInject **/
  constructor($scope, $injector, private $sce, private $rootScope, private variableSrv,
    private dashboardSrv, private uiSegmentSrv, private $http, private $location, private $interval, private $sanitize, private $window) {
    super($scope, $injector);
    this.templateSrv = $injector.get('templateSrv');
    this.alertSrv = $injector.get('alertSrv');

    _.defaultsDeep(this.panel, this.panelDefaults);
    this.ecConf.axis.value.axisLabel = this.panel.formatter.yAxis.axisLabel;
    //this.panel.title = '';
    //this.panel.hideTimeOverride = true;

    this.echartsTheme = echartsTheme;
    this.echartsThemeName = echartsThemeName;

    this.$parse = this.$injector.get('$parse');

    this.currentCycle = _.find(this.panel.cycleConf, { key: this.panel.initCycle });
    this.currentCycle = this.setIntervalVariable(this.currentCycle);

    //this.ecConf.axis.category.axisLabel.formatter = this.formatter.bind(this);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-initialized', this.onPanelInitialized.bind(this));
    // this.events.on('refresh', this.onRefresh.bind(this));
    // this.events.on('render', this.onRender.bind(this));

    this.events.on('panel-teardown', this.onTearDown.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));

    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));

    // this.$rootScope.onAppEvent('panel-change-view', this.ecInstanceResizeWithSeft.bind(this));
    // this.$rootScope.onAppEvent('panel-fullscreen-exit', this.ecInstanceResizeWithSeft.bind(this));
    this.$rootScope.onAppEvent('panel-fullscreen-exit', () => { this.currentMode = 'chart'; });
    this.$rootScope.onAppEvent('panel-teld-changePanelState', this.ecInstanceResize.bind(this));

    this.$rootScope.onAppEvent('emit-cycle', this.emitCycle.bind(this));
    this.$rootScope.onAppEvent('emit-clearCycle', function () {
      this.initCycle(this.currentCycle);
    }.bind(this));

    if (this.panel.eventSubscribe.enable) {
      this.dashboard.events.on('teld-singlestat-panel-click', this.onTeldSinglestatClick.bind(this));
      this.dashboard.events.on('teld-flipcountdown-panel-click', this.onTeldSinglestatClick.bind(this));
    }

    //this.currentMode = 'chart';
    let t = this.$window.sessionStorage["echartsPanelArgs"];
    if (t) {
      this.echartsPanelArgs = JSON.parse(t);
      if (this.panel.id === this.echartsPanelArgs.panelId) {
        this.$window.sessionStorage.removeItem("echartsPanelArgs");
        this.currentMode = 'list';
      }
    }
  }

  changeCurrentMode() {
    this.currentMode = (this.currentMode === 'list' ? 'chart' : 'list');
    //this.refreshDashboard();
    this.onMetricsPanelRefresh();
  }
  currentCycle: any;
  mouseEventState: boolean;
  clickEventState: any;
  setCurrentCycle_handler(cycle) {
    if (this.editMode) {
      this.alertSrv.set("警告", "编辑模式下不支持切换", "warning", 2000);
      return;
    }
    if (window.innerWidth < 768) {
      console.log('setCurrentCycle_handler');
      if (this.clickEventState !== true) {
        this.clickEventState = true;
        return;
      }
    }
    this.setCurrentCycle(cycle);
  }

  mouseover() {
    if (window.innerWidth < 768) {
      console.log('mouseover');
      this.mouseEventState = true;
    }
  }

  mouseleave() {
    if (window.innerWidth < 768) {
      console.log('mouseleave');
      this.mouseEventState = false;
      this.clickEventState = false;
    }
  }

  panelGenVars = {};
  setCurrentCycle(cycle) {
    this.initCycle(cycle);
    this.onMetricsPanelRefresh();
  }

  setIntervalVariable(cycle) {
    if (this.panel.cycleEnableVar) {
      if (_.isNil(cycle)) {
        cycle = _.first(this.getTimeButton());
      }
      var intervalVariable = _.get(this.panelGenVars, `interval_${name}`);
      var intervalVariableValue = { text: cycle.name, value: cycle.interval };
      if (intervalVariable) {
        var current = intervalVariable.current;
        current.text = intervalVariableValue.text;
        current.value = intervalVariableValue.value;
      } else {
        this.addGeneralVariable(this.panel.cycleVarSuffix, intervalVariableValue);
      }
      this.variableSrv.templateSrv.updateTemplateData();
    }
    return cycle;
  }

  initCycle(cycle) {
    this.currentCycle = this.currentCycle === cycle && _.isEmpty(this.panel.initCycle) ? undefined : cycle;
    this.setIntervalVariable(cycle);
  }

  emitCycle(e, data) {
    var { cycle } = data;
    var selectCycle = _.find(this.getTimeButton(), { key: cycle });
    if (selectCycle) {
      this.currentCycle = selectCycle;
      this.setIntervalVariable(this.currentCycle);
    }
  }

  addGeneralVariable(name, value) {
    let variable = this.variableSrv.addVariable({
      hide: 2,
      type: 'teldCustom',
      name: `interval_${name}`,
      query: '',
      current: value
    });
    _.set(this.panelGenVars, variable.name, variable);
    return variable;
  }

  echartsPanelArgs: any;
  onTeldSinglestatClick(payload) {
    let payloadEchartsPanel = payload.panel.echartsPanel;
    if (this.panel.eventSubscribe.enable && this.panel.showTable && payloadEchartsPanel && payloadEchartsPanel.enable) {

      //let findIndex = _.findIndex(this.panel.eventSubscribe.eventPanels, ['id', payload.panelId]);
      let findIndex = _.findIndex(this.panel.eventSubscribe.eventPanels, ['keyword', payload.panelId]);
      if (findIndex === -1) {
        findIndex = _.findIndex(this.panel.eventSubscribe.eventPanels, ['keyword', payloadEchartsPanel.args.title]);
      }

      if (findIndex !== -1) {
        this.echartsPanelArgs = { args: _.cloneDeep(payloadEchartsPanel.args), triggerId: payload.panelId, panelId: this.panel.id };
        this.$window.sessionStorage["echartsPanelArgs"] = JSON.stringify(this.echartsPanelArgs);
        this.viewPanel();
      }
    }
  }

  dblclick() {
    if (this.isfullscreen()) {
      this.exitFullscreen();
    } else {
      if (this.echartsPanelArgs) { this.echartsPanelArgs.title = ''; }
      this.viewPanel();
    }
  }

  onInitPanelActions(actions) {
    actions.push({ text: 'Export CSV', click: 'ctrl.exportCsv()' });
  }

  isfullscreen() {
    let viewState = this.$rootScope.g_DashboardViewState;
    let editMode = viewState.edit === null || viewState.edit === false;
    return viewState.fullscreen && editMode;
  }

  axisLableFormatter(axis, value, index) {
    var formatterConf = this.panel.formatter[axis].axisLabel;
    var decimals = formatterConf.decimals;
    let formater = this.valueFormats[formatterConf.format];
    return formater(value, decimals);
  }

  // axisLableFormatter2(axis, value, index) {
  //   var formatterConf = this.panel.formatter[axis].axisLabel;
  //   var decimals = formatterConf.decimals;
  //   let formater = this.valueFormats[formatterConf.format];
  //   return formater(value, decimals);
  // }

  callFormatter(type, value) {
    var formatterConf = this.panel.formatter[type];
    if (type === 'tooltip_category' && this.currentCycle) {
      formatterConf = { format: "teldMoment", decimals: this.currentCycle.format || this.currentCycle.defaultFormat };
    }
    var decimals = formatterConf.decimals;
    let formater = this.valueFormats[formatterConf.format];
    return formater(value, decimals);
  }

  yAxisLableFormatter(value, index) {
    var returnValue = this.axisLableFormatter('yAxis', value, index);
    return returnValue;
  }

  xAxisLableFormatter(value, index) {
    if (this.currentCycle) {
      var formatterConf = { format: "teldMoment", decimals: this.currentCycle.format||this.currentCycle.defaultFormat };
      var decimals = formatterConf.decimals;
      let formater = this.valueFormats[formatterConf.format];
      return formater(value, decimals);
    }
    var returnValue = this.axisLableFormatter('xAxis', value, index);
    return returnValue;
  }

  onTearDown() {

  }

  ecInstanceResizeWithSeft(evt, payload) {
    if (payload.panelId === this.panel.id) {
      this.ecInstanceResize(evt, payload);
    }
  }

  ecInstanceResize(evt, payload) {
    console.log('=ecInstanceResize=');
    console.log(this.ecInstance);
    console.log('=ecInstanceResize=');
    if (this.ecInstance) {
      this.$timeout(() => {
        this.ecInstance.resize();
      }, 1000);
    }
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    this.addEditorTab('Time cycle', cycleEditorComponent);
    this.addEditorTab('Style', tabStyleEditorComponent);
    this.addEditorTab('Series', seriesEditorComponent);
    this.addEditorTab('Options', tablePanelEditor);
    this.addEditorTab('Events', echartsEventEditorComponent);
    this.addEditorTab('Calc', calcSeriesEditorComponent);
    this.addEditorTab('Cumulative', cumulativeEditorComponent);
    this.addEditorTab('SerieType', seriesTypeEditorComponent);
    this.editorTabIndex = 1;
  }

  //step.1
  onPanelInitialized() {
    this.$timeout(() => {
      this.initEcharts();
      this.events.on('refresh', this.onRefresh.bind(this));
      this.events.on('render', this.onRender.bind(this));
      this.refresh();
    }, 1000);
  }

  onRefresh() {
    this.render();
  }

  clearEcharts() {
    this.ecOption.baseOption.visualMap.show = false;
    this.ecOption.baseOption.timeline.show = false;
    this.ecOption.baseOption.legend.show = false;
  }

  //step.2
  initEcharts() {

    let theme = `${this.panel.serieType}Theme-${this.panel.style.themeName}`;
    this.echartColors = _.concat(echartsThemeMap[theme].color, gfColors);
    if (this.panel.customColor) {
      this.echartColors = _.concat(this.panel.echarts.color, this.echartColors);
    }
    this.ecConfig = {
      theme: theme,
      //theme: config.bootData.user.lightTheme ? 'light' : 'drak',
      //theme: 'teld',
      dataLoaded: true
    };

    var option: any = {
      series: []
    };

    this.ecOption = {
      baseOption: option,
      options: []
    };
  }

  valueFormat(value) {
    let formater = this.valueFormats[this.panel.formatter.value.format];
    return formater(value);
  }

  categoryFormat(value) {
    let formater = this.valueFormats[this.panel.formatter.category.format];
    return formater(value, this.panel.formatter.category.formatArgs);
  }

  exportCsv() {
    var renderer = new TableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize);
    FileExport.exportTableDataToCsv(renderer.render_values());
  }

  toggleColumnSort(col, colIndex) {
    // remove sort flag from current column
    if (this.table.columns[this.panel.sort.col]) {
      this.table.columns[this.panel.sort.col].sort = false;
    }

    if (this.panel.sort.col === colIndex) {
      if (this.panel.sort.desc) {
        this.panel.sort.desc = false;
      } else {
        this.panel.sort.col = null;
      }
    } else {
      this.panel.sort.col = colIndex;
      this.panel.sort.desc = true;
    }
    this.renderTableRows();
  }

  renderTable(dataList) {

    //if (false === this.panel.showTable) { return; }

    this.dataRaw = dataList;

    if (this.dataRaw && this.dataRaw.length) {
      if (this.dataRaw[0].type === 'table') {
        this.panel.transform = 'table';
      } else {
        if (this.dataRaw[0].type === 'docs') {
          this.panel.transform = 'json';
        } else {
          if (this.panel.transform === 'table' || this.panel.transform === 'json') {
            this.panel.transform = 'timeseries_to_rows';
          }
        }
      }
    }

    this.table = transformDataToTable(this.dataRaw, this.panel);
    this.renderTableRows();
  }

  renderTableRows() {
    this.table.sort(this.panel.sort);
    var renderer = new TableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize, this.templateSrv);
    this.tbodyHtml = this.$sce.trustAsHtml(renderer.render(0));
  }

  getTimeButton() {
    return _.filter(this.panel.cycleConf, 'enable');
  }

  pieMerge(dataList) {

    if (this.panel.pieExt.dataExt.enable !== true) {
      return;
    }

    let mergeItem = _.transform(this.panel.pieExt.dataExt.items, (result, argument) => {
      let variable = _.find(this.variableSrv.variables, { name: argument.varname });
      if (variable) {
        let temp = { target: argument.title, val: variable.current.value, argument: argument };
        result.push(temp);
      }

    }, []);

    if (dataList.length > 0) {
      let first = dataList[0];
      if (first.type === "docs" && first.datapoints && first.datapoints.length > 0) {
        let objKeys = _.keys(first.datapoints[0]);
        _.each(mergeItem, eachItme => {

          _.remove(first.datapoints, (n) => {
            return n[objKeys[0]] === eachItme.target;
          });

          let temp = _.zipObject(objKeys, [eachItme.target, eachItme.val]);
          // temp[eachItme.argument.propKey || propKey] = eachItme.target;
          // temp[eachItme.argument.propValue || propValue] = eachItme.val;
          first.datapoints.push(temp);
        });
      } else {
        if (first && first.datapoints && first.datapoints.length > 0) {
          let timeseries = first.datapoints[0][1];
          _.each(mergeItem, eachItme => {
            let dataItem: any = { target: eachItme.target };
            dataItem = _.find(dataList, dataItem) || dataItem;
            if (dataItem.datapoints) {
              dataItem.datapoints[0][0] = eachItme.val;
            } else {
              dataItem.datapoints = [[eachItme.val, timeseries]];
              dataList.push(dataItem);
            }
          });
        }
      }
    }
  }
  calcSeries(calcSeriesConf, data, hideMetrics) {

    var calcSeriesFun = this.isSeriesBar() ?
      (this.panel.calcSeriesGropuBar ? graphutils.calcSeriesGropuBar : graphutils.calcSeriesBar)
      : graphutils.calcSeries;

    return calcSeriesFun(calcSeriesConf, data, hideMetrics, this.templateSrv.variables);
  }
  dataList: any = [];

  get_moment_zhCn(key, format?) {
    return moment.apply(null, arguments).locale('zh-cn', { week: { dow: 1 } });
  }

  groupTime(dataList) {
    if (false === _.isNil(this.currentCycle)) {
      if (this.panel.cycleEnableVar) {
        return;
      }
      var moment_zhCn = this.get_moment_zhCn;
      _.each(dataList, dl => {
        var dp = dl.datapoints;
        var dddd = _.groupBy(dp, item => {
          var time = _.isArray(item) ? item[1] : _.values(item)[0];
          var m = moment_zhCn(time);
          if (this.currentCycle.startOf) {
            m.startOf(this.currentCycle.startOf);
          }
          return m.format('x');
        });

        var ndp = _.transform(dddd, (r, value, timeGroup) => {
          var sum = _.sumBy(value, vv => {
            return _.isArray(vv) ? vv[0] : _.values(vv)[1];
          });
          //var time = moment_zhCn(key, format).format('x');
          //var time = timeGroup;
          r.push([sum, timeGroup]);
        }, []);
        dl.datapoints = ndp;
      });
    }
  }

  onDataReceived(dataList) {
    //debugger;
    if (_.size(dataList) === 1 && dataList[0].type === 'docs') {
      dataList[0].target = _.get(this.panel.metricsLegend, 'legends[0].legend.name', dataList[0].target);
    }

    this.groupTime(dataList);

    this.dataList = dataList;

    if (this.isSeriesBar() && this.panel.groupBar) {
      if (this.panel.groupBarByTermValue) {
        _.each(this.dataList, s => { s.orgTarget = s.target, s.target = s.target.split(' ')[0]; });
      }
    }

    var hideMetrics = _.cloneDeep(this.panel.hideMetrics);

    let cumulativeConf = this.panel.cumulativeConf;
    if (cumulativeConf && cumulativeConf.enable) {
      cumulative(cumulativeConf, dataList);
    }

    dataList = this.calcSeries(this.panel.calcSeriesConf, dataList, hideMetrics);
    this.pieMerge(dataList);

    this.renderTable(dataList);

    /**
     * {datapoints: Array(5), metric: "sum", field: "总电量", props: {…}, target: "SUM_总电量"}
     * {datapoints: Array(5), metric: "max", field: "总电量", props: {…}, target: "MAX_总电量"}
     * datapoints[0]: [31016.81, 1483200000000]
     */

    this.dataListMetric = _.groupBy(dataList, item => { return item.metric || item.target; });
    let series = this.dataList2Serie(dataList);

    series = this.seriesSort(series);

    this.ecSeries = series;

    this.render();
  }

  seriesSort(series) {
    if (true !== _.get(this.panel, 'seriesSort.enable', false)) {
      return series;
    }
    let sortSeries = _.groupBy(series, 'refId');
    let sortKey = this.panel.seriesSort.serieName || "占比";

    let index = 0;
    let sorted = _.orderBy(sortSeries[sortKey], (o, i) => { o._index = index++; return o.data[0]; }, 'desc');

    let sordMapping = _.map(sorted, '_index');
    _.each(sortSeries, (value, keyd) => {
      _.each(sordMapping, (index, _index) => {
        value[index]._index = _index;
      });
      value = _.sortBy(value, '_index');
      sortSeries[keyd] = value;
    });
    series = _.flatten(_.map(sortSeries));
    let returnValue = sortSeries[sortKey];
    let other = _.omit(sortSeries, sortKey);
    returnValue = _.concat(returnValue, _.flatten(_.map(other)));

    return returnValue;
  }

  dataList2Serie(dataList) {
    let series: any;
    let serieType = this.panel.serieType;
    switch (serieType) {
      default:
        series = this.defaultSeries(dataList);
        break;
      case this.ecConf.series.pie.type:
        series = this.peiSeries(dataList);
        break;
    }
    return series;
  }

  fillingDataList(dataList) {
    let merge = this.panel.merge;
    if (merge && merge.enable && dataList.length > 1) {
      let times = {};
      dataList.forEach((element) => {
        element.datapoints.forEach(datapoint => {
          let time = datapoint[1];
          let value = datapoint[0];

          //times[time] = (times[time] || 0) + 1;
          times[time] = time;
        });
      });

      dataList.forEach((element) => {
        let newdatapoints = [];

        for (let key in times) {
          let dp = _.find(element.datapoints, function (datapoint) {
            return times[key] === datapoint[1];
          });

          newdatapoints.push(dp || [0, times[key]]);
        }
        element.datapoints = newdatapoints;
      });
    }
  }

  defaultSeries(dataList) {

    this.fillingDataList(dataList);

    let series = _.map(dataList, item => {

      let { target, metric, field, refId } = item;

      let serieType = this.panel.serieType;

      let data: any;

      data = _.map(item.datapoints, point => {

        let pointArray = point;
        let isArray = _.isArray(pointArray);
        let zipObject = ['value', 'name'];

        if (false === isArray) {
          pointArray = _.values(pointArray);
          zipObject = _.reverse(zipObject);
        }

        let { value, name } = _.zipObject(zipObject, pointArray);
        if (this.isSeriesBar()) {
          value = this.valueFormat(value);
          return value;
        } else {
          name = this.categoryFormat(name);
          value = this.valueFormat(value);
          return { value: [`${name}`, value] };
        }
        //return { value: value };
      });

      let encode: any = {};
      // if (this.panel.exchangeAxis) {
      //   encode.x = 1;
      //   encode.y = 0;
      // };

      let serie = this.getDefaultSerie();
      _.defaultsDeep(serie, {
        refId,
        metric,
        encode,
        name: target,
        type: serieType,
        data
      });
      return serie;
    });

    return series;
  }

  genCalcExpressionContext(calcExpression, context) {

    let variableSrv = this.variableSrv;

    context = _.transform(calcExpression.args, function (result, argument) {
      result[argument.name] = argument.defVal;

      let variable = _.find(variableSrv.variables, { name: argument.name });
      if (variable) {
        result[argument.name] = +variable.current.value;
      }

    }, context);

    return context;
  }

  calcExpression(calcExpression, context) {

    if (false === _.isObject(context)) {
      return 0;
    }

    var parseFunc = this.$parse(calcExpression.expression);
    var returnVal = parseFunc(context);

    return returnVal;
  }

  getDefaultSerie() {
    let serieType = this.panel.serieType;
    let serie = this.panel.echarts.series[serieType] || this.ecConf.series[serieType];

    if (serie.markPoint && serie.markPoint.label && serie.markPoint.label.normal) {
      let formatterExpression = serie.markPoint.formatterExpression;
      if (formatterExpression && formatterExpression.enable) {
        serie.markPoint.label.normal.formatter = (params) => {
          let context = this.genCalcExpressionContext(formatterExpression, { params: params });
          let returnVal = this.calcExpression(formatterExpression, context);

          if (returnVal && returnVal !== "") {
            window["gcache"] = returnVal;
          }
          return (formatterExpression.prefixes || "") + (returnVal || window["gcache"]) + (formatterExpression.suffix || "");
          //return returnVal;
        };
      }
    }

    serie.markLine = { data: this.getMarklineDate() };

    return _.cloneDeep(serie);
  }

  peiSeries(dataList) {

    let serieType = this.panel.serieType;

    let data = _.map(dataList, item => {
      let dataItem: any;
      let { target, metric, field } = item;
      if (target === "docs") {
        dataItem = _.map(item.datapoints, point => {
          let ecData = _.zipObject(['name', 'value'], _.values(point));
          ecData.name = this.categoryFormat(ecData.name);
          ecData.value = this.valueFormat(ecData.value);
          return ecData;
        });
      } else {
        let values = _.map(item.datapoints, point => {
          return point[0];
        });
        dataItem = { name: this.categoryFormat(target), value: this.valueFormat(_.sum(values)) };
      }

      return dataItem;
    });

    data = _.flatten(data);
    data = _.sortBy(data, ['value']);
    data = _.reverse(data);

    let serie = this.getDefaultSerie();
    _.defaultsDeep(serie, {
      type: serieType,
      label: {
        normal: {
          formatter: (params) => {
            let { name, percent } = this.seriesLabel[params.name] = params;
            return `${name}: ${percent}%`;
          }
        }
      },
      data
    });

    let series = [serie];

    if (this.panel.style.innerRing.show) {

      let innerR = serie.radius[0];
      let w = parseInt(this.panel.style.innerRing.width);
      let ispercent = _.endsWith(innerR, '%');
      if (ispercent) {
        innerR = innerR.replace("%", "");
        //w = 0.1;
      }

      innerR = parseInt(innerR);
      let outerR = innerR + w;
      let radius = [innerR, outerR];

      if (ispercent) {
        radius = radius.map(r => { return `${r}%`; });
      }

      series.push({
        type: 'pie',
        radius: radius,
        center: serie.center,
        silent: true,
        label: {
          normal: {
            show: false,
          }
        },
        data: [{
          value: 1,
          itemStyle: {
            normal: {
              width: 2,
              color: this.panel.style.innerRing.color
            }
          }
        }]
      });
    }

    return series;
  }

  //坐标轴构建
  series2categoryAxis(series, axis) {
    let that = this;
    let returnValue = series.map(serie => {

      let axisData = serie.data.map(this.serie2cateAxis.bind(this));

      return axisData;
    });

    return returnValue;
  }
  serie2cateAxisSerie(series, axis) {
    let axisData = (series || []).map(serie => serie.name);

    return _.defaultsDeep({ data: axisData }, axis);
  }

  serie2cateAxis(serie, axis) {
    let axisData = serie.data.map(serieData => {

      let axisDataItem = {
        value: serieData.value[0]
      };
      return axisDataItem;
    });

    return _.defaultsDeep({ data: axisData }, axis);
  }

  axisAdapter(serie, axisType) {

    let axis: any;

    switch (axisType) {
      case  this.ecConf.axis.category:
        if (this.isSeriesBar()) {
          axis = this.serie2cateAxisSerie(serie, _.defaultsDeep(this.ecConf.axis.category, this.panel.echarts.xAxis));
          if (this.panel.groupBar) {
            axis.data = _.uniq(axis.data);
          }
        } else {
          axis = this.categoryAxisAdapter(serie);
        }
        if (this.panel.formatter.xAxis.axisLabel) {
          _.set(axis, 'axisLabel.formatter', this.xAxisLableFormatter.bind(this));
          //axis.axisLabel.formatter = this.xAxisLableFormatter.bind(this);
        }
        break;

      case this.ecConf.axis.value:
        axis = this.valueAxisAdapter();
        break;

      default:
        axis = undefined;
        break;
    }

    return axis;
  }

  categoryAxisAdapter(serie){
    let axis: any;
    switch (this.panel.serieType) {
      case this.ecConf.series.line.type:
        if (this.panel.xAxisMode === 'series') {
          var groupBySerieKeys = _.map(serie, function (item) { return item.name.toLocaleLowerCase().split(' ' + item.metric)[0]; });
          //groupBySerieKeys = _.groupBy(groupBySerieKeys, function (item) { return item; });
          //groupBySerieKeys = _.map(groupBySerieKeys, function (val, key) { return { name: key }; });
          groupBySerieKeys = _.groupBy(groupBySerieKeys, function (item) { return "sort."+item; });
          groupBySerieKeys = _.map(groupBySerieKeys, function (val, key) { return { name: _.first(val) }; });
          axis = this.serie2cateAxisSerie(groupBySerieKeys, _.defaultsDeep(this.ecConf.axis.category, this.panel.echarts.xAxis));
        } else {
          axis = this.serie2cateAxis(serie, _.defaultsDeep(this.ecConf.axis.category, this.panel.echarts.xAxis));
        }

        break;
      case this.ecConf.series.bar.type:
        axis = this.serie2cateAxis(serie, _.defaultsDeep(this.ecConf.axis.category, this.panel.echarts.xAxis));
        if (this.panel.formatter.xAxis.axisLabel) {
          _.set(axis, 'axisLabel.formatter', this.xAxisLableFormatter.bind(this));
          //axis.axisLabel.formatter = this.xAxisLableFormatter.bind(this);
        }
        break;
      case this.ecConf.series.pie.type:
        axis = undefined;
        break;
    }
    return axis;
  }

  valueAxisAdapter() {
    let axis: any;
    switch (this.panel.serieType) {
      case this.ecConf.series.line.type:
      case this.ecConf.series.bar.type:
        axis = _.defaultsDeep(this.ecConf.axis.value, this.panel.echarts.yAxis);
        if (this.panel.formatter.yAxis.axisLabel) {
          _.set(axis, 'axisLabel.formatter', this.yAxisLableFormatter.bind(this));
          //axis.axisLabel.formatter = this.yAxisLableFormatter.bind(this);
        }
        break;
      case this.ecConf.series.pie.type:
        axis = undefined;
        break;
    }
    return axis;
  }
  //坐标轴构建

  legend(series) {
    series = series || [];
    let legendData: any;
    if (this.panel.serieType === this.ecConf.series.pie.type) {
      legendData = series.map(serie => {
        //return _.flatten(serie.data).map(item => { return { name: item.name, item }; });
        return serie.data.map(item => { return { name: item.name, item }; });
      });
      legendData = _.flatten(legendData);
    } else if (this.panel.serieType === this.ecConf.series.line.type) {
      if (this.panel.xAxisMode === 'series') {
        var groupBySeries = _.groupBy(this.ecSeries, 'metric');
        legendData = _.map(groupBySeries, function (val, key) { return key; });
      } else {
        legendData = series.map(serie => {
          return { name: serie.name, serie };
        });
      }
    } else {
      legendData = series.map((serie, index) => {

        var colorIndex = index % this.echartColors.length;
        var color = this.echartColors[colorIndex];

        return {
          //name: serie.name, textStyle: _.first(serie.data).itemStyle.normal
          name: serie.name, textStyle: { color: color }
        };
      });
    }
    return legendData;
  }

  stackSumLabel(series){

    if (this.panel.groupBarStackSumLabel) {
      var barSeries = _.filter(series, { type: 'bar' });
      _.each(_.groupBy(barSeries, 'stack'), (stackSeries, key) => {
        _.each(stackSeries, s => {
          _.set(s, 'label.normal.show', false);
        });

        var defaultSerie = _.first(stackSeries);

        var sumSerie = {
          stack: key,
          type: 'bar',
          yAxisIndex: defaultSerie.yAxisIndex,
          xAxisIndex: defaultSerie.xAxisIndex,
          isSumLabel: true,
          data: _.map(stackSeries[0].data, i => { return { value: 0 }; }),
          label: {
            normal: {
              show: true,
              position: this.panel.exchangeAxis ? "right" : "top",
              formatter: function (params) {
                var filter = (item) => {
                  return item.data[params.dataIndex].value;
                };
                if (this.ctrl && this.ctrl.ecInstance) {
                  var ecO = this.ctrl.ecInstance.getOption();
                  var selectedLegends = _.first(_.map(ecO.legend, 'selected'));
                  selectedLegends = _.transform(selectedLegends, (r, v, k) => { if (v) { r.push(k); } }, []);
                  filter = item => {
                    return _.includes(selectedLegends, item.name) ? item.data[params.dataIndex].value : 0;
                  };
                }

                var sum = _.sumBy(this.stackSeries, filter);
                return sum;
              }.bind({ stackSeries: stackSeries, ctrl: this })
            }
          }
        };
        series.push(sumSerie);
      });
    }
  }

  getGroupBarSerieMode() {

    var series = [];
    var isStack =  this.panel.groupBarStack ? 'stack' : null;
    if (this.ecSeries) {
      var d = {};
      var groupName = _.union(_.map(this.ecSeries, 'name'));
      var group = _.groupBy(this.ecSeries, t => t.name);
      var groupArray = _.transform(groupName, function (result, value, key) {
        result.push(group[value]);
      }, []);

      _.each(groupArray, (value, groupIndex) => {
        _.each(value, (s, index) => {
          let serie = this.getDefaultSerie();
          serie = d[index] = d[index] || _.defaultsDeep(serie, {
            refId: s.refId,
            type: 'bar',
            stack: isStack,
            data: []
          });

          var colorIndex = index % this.echartColors.length;
          var color = this.echartColors[colorIndex];
          var itemStyle = { normal: { color } };
          serie.data.push({ value: s.data[0], itemStyle });
        });
      });

      if (_.get(this.panel, 'groupBarLegendsConf.enable', false)) {
        var legends = _.filter(this.panel.groupBarLegendsConf.legends, { enable: true });
        this.panel.groupBarLegends = _.map(legends, 'legend.name').join(",");
      }
      var groupBarLegends = (this.panel.groupBarLegends || "").split(',');
      _.each(d, (serie, index) => {
        serie.itemStyle = _.first(serie.data).itemStyle;
        serie.name = groupBarLegends[index];
        series.push(serie);
      });
    }

    if (this.panel.groupBar && this.panel.groupBarStack) {
      //var barGroup = _.map(this.panel.groupBarStackGroupConf, 'gName');
      _.each(this.panel.groupBarStackGroupConf, conf => {
        _.each(series, s => {
          if (_.includes(conf.sets, s.name)) {
            s.stack = conf.gName;
            s.groupBarStack = true;
          } else {
            if (true !== s.groupBarStack) {
              delete s.stack;
            }
          }
        });
      });
    }

    return series;
  }

  getBarSerieMode() {

    if (this.panel.groupBar) { return this.getGroupBarSerieMode(); }

    let serie = this.getDefaultSerie();
    serie = _.defaultsDeep(serie, {
      type: 'bar',
      data: (this.ecSeries || []).map((s, index) => {
        var colorIndex = index % this.echartColors.length;
        var color = this.echartColors[colorIndex];
        var itemStyle = { normal: { color } };
        return { value: s.data[0], itemStyle };
      })
    });

    var series = [serie];

    return series;
  }

  markLineformatter(params) {
    var valueFormatter = this.yAxisLableFormatter.bind(this);
    var returnValue = [];
    var param = _.isArray(params) ? params[0] : params;
    // returnValue.push(paramArray[0].name);
    // _.each(paramArray, function (param, index) {
    //   var item = [param.marker];
    //   switch (param.seriesName) {
    //     case "\u0000-":
    //       break;
    //     default:
    //       item.push(param.seriesName + "：");
    //       break;
    //   }
    //   param.value = valueFormatter(param.value);
    //   item.push(param.value);
    //   returnValue.push(_.join(item, ''));
    // }
    return valueFormatter(param.value);
  }

  getMarklineDate() {
    var markLineData = [];
    if (this.panel.marklines) {
      markLineData = this.panel.marklines.map(item => {
        item.label.formatter = this.markLineformatter.bind(this);
        return {
          type: item.type,
          label: {
            normal: item.label
          },
          lineStyle: {
            normal: item.lineStyle
          }
        };
      });
    }
    return markLineData;
  }

  getLineSerieMode() {

    var series = [];
    var groupBySeries = _.groupBy(this.ecSeries, 'metric');

    var markLineData = this.getMarklineDate();

    for (var metric in groupBySeries) {

      var s = groupBySeries[metric];

      let serie = this.getDefaultSerie();
      serie = _.defaultsDeep(serie, {
        type: 'line',
        name: metric,
        markLine: { data: markLineData },
        markPoint: _.first(s).markPoint,
        data: s.map((s, index) => {
          var colorIndex = index % this.echartColors.length;
          var color = this.echartColors[colorIndex];
          var itemStyle = {};
          if (s.data.length > 0 && s.data[0].value) {
            return { value: s.data[0].value[1], itemStyle };
          } else {
            return { value: 0, itemStyle };
          }
        })
      });

      series.push(serie);
    }

    return series;
  }

  getSeries() {
    let series = this.ecSeries;
    switch (this.panel.serieType) {
      case this.ecConf.series.line.type:
        if (this.panel.xAxisMode === 'series') {
          series = this.getLineSerieMode();
        } else {
          var that = this;
          series = _.cloneDeep(this.ecSeries).map(item => {
            item.data.map(d => {
              d.value = d.value[1];
              return d;
            });
            return item;
          });
        }
        break;
      case this.ecConf.series.bar.type:
        if (this.isSeriesBar()) {
          series = this.getBarSerieMode();
        } else {
          series = _.cloneDeep(this.ecSeries).map(item => { item.data.map(d => { d.value = d.value[1]; return d; }); return item; });
        }
        break;
    }
    return series;
  }

  isSeriesBar() {
    var mode = this.panel.xAxisMode;
    return this.panel.serieType === "bar" && mode === "series";
  }

  setAxis(axis) {
    if (axis) {
      if (_.isNil(axis.axisLabel.interval)) {
        axis.axisLabel.interval = 'auto';
      }
    }
  }

  onRender() {

    if (_.size(_.flatten(_.map(this.dataList, 'datapoints'))) === 0) {
      //this.ecOption.baseOption = empty_option;
      if (this.ecInstance) {
        this.ecOption.baseOption = {};
        this.ecInstance.clear();
        return;
      }
    }

    if (this.enablePanelRefresh && (!this.ecSeries || this.ecSeries.length === 0)) {
      /**处理面板自刷新，取不到数无法显示的问题 */
      this.onMetricsPanelRefresh();
      return;
    }
    if (_.isNil(this.ecSeries)) {
      return;
    }
    let xAxis, categoryAxis;
    //if (this.isSeriesBar()) {
    if (this.panel.xAxisMode === 'series') {
      xAxis = categoryAxis = this.axisAdapter(this.ecSeries, this.ecConf.axis.category);
    } else {
      let firstSeries = _.first(this.ecSeries) || {};
      xAxis = categoryAxis = this.axisAdapter(firstSeries, this.ecConf.axis.category);
    }

    let yAxis, valueAxis;
    yAxis = valueAxis = this.valueAxisAdapter();

    if (categoryAxis) {
      xAxis = _.cloneDeep(this.panel.echarts.xAxis);
      _.defaultsDeep(xAxis, categoryAxis);
    }

    this.setAxis(xAxis);

    if (valueAxis) {
      yAxis = _.cloneDeep(this.panel.echarts.yAxis);
      _.defaultsDeep(yAxis, valueAxis);
    }

    this.setAxis(yAxis);

    function formatter(n) {
      if (this.panel.serieType === this.ecConf.series.pie.type) {
        let { name, percent, value } = this.seriesLabel[n];
        name = _.head(_.split(name, "[:]"));

        let returnVal = `${name}: ${percent}%`;

        let formatTmpl = this.panel.echarts.legend.formatTmpl;
        if (formatTmpl) {
          let compiled = _.template(formatTmpl);
          returnVal = compiled({ name, percent, value });
        }
        return returnVal;
      } else {
        return n;
      }
    }


    // let legend: any = { name: 'legend', formatter: formatter.bind(this), data: this.legend(this.ecSeries) };
    // legend = _.defaultsDeep(legend, this.panel.echarts.legend);

    let grid = _.defaultsDeep({}, this.panel.echarts.grid);

    let option: any = {
      backgroundColor: this.panel.echarts.backgroundColor,
      title: _.cloneDeep(this.panel.echarts.title),
      tooltip: _.cloneDeep(this.panel.echarts.tooltip),
      xAxis,
      yAxis: _.cloneDeep(yAxis),
      grid,
      //series: this.ecSeries,
      series: this.getSeries()
      //legend: [legend]
      //legend: legend
    };

    let legend: any = { name: 'legend', formatter: formatter.bind(this), data: this.legend(option.series) };
    legend = _.defaultsDeep(legend, this.panel.echarts.legend);
    legend.selected = _.zipObject(_.map(legend.data, 'name'), _.map(legend.data, () => { return true; }));
    option.legend = legend;

    if (_.get(this.panel, 'metricsLegend.enable', false)) {
      var legendsConf = _.filter(this.panel.metricsLegend.legends, { 'enable': true });
      this.setLegendsConf(option, legendsConf);
    }

    if (_.get(this.panel, 'groupBarLegendsConf.enable', false)) {
      var legendsConf = _.cloneDeep(this.panel.groupBarLegendsConf.legends);
      legendsConf = _.filter(legendsConf, l => {
        if (l.enable) {
          l.key = l.legend.name;
          return l;
        }
      });
      this.setLegendsConf(option, legendsConf);
    }

    let merge = this.panel.merge;
    if (merge && merge.enable && option.series.length > 1) {
      let var1 = option.series[0].data;
      let var2 = option.series[1].data;

      let news = _.map(var1, (item, index) => {
        let value = item.value;
        let c = var2[index].value;
        return { c1: value, c2: c };
      });

      let that = this;
      var parseFunc = that.$parse("n.c1 / n.c2 * 100");
      news = _.transform(news, (result, n) => {
        // var parseFunc = that.$parse("n.c1 / n.c2 * 100");
        // var returnVal = parseFunc(n);
        // result.push({ value: returnVal });

        var returnVal = n.c1 / n.c2 * 100;
        // if (returnVal > 6) {
        //   returnVal = _.random(3, 5);
        // }
        result.push({ value: returnVal.toFixed(2) });
      }, []);

      option.series[0].data = news;
      option.series.length = 1;
      // let lll = _.cloneDeep(option.series[0]);
      // lll.data = news;
      // option.series.push(lll);
    }

    // let cumulativeConf = this.panel.cumulativeConf;
    // if (cumulativeConf && cumulativeConf.enable) {
    //   _.each(option.series, function (serie, index) {
    //     var cumulative = 0;
    //     _.each(serie.data, function (item, dataIndex) {
    //       var current = _.get(item, 'value', item);
    //       cumulative += (+current);
    //       if (_.has(item, 'value')) {
    //         item.value = cumulative;
    //       } else {
    //         item = cumulative;
    //       }
    //     });
    //   });
    // }


    /** 左右布局legend */

    if (this.panel.legendExt.twoSides) {

      let splitIndex = _.round(legend.data.length / 2);

      let leftLegend = _.slice(legend.data, 0, splitIndex);
      let rightLegend = _.slice(legend.data, splitIndex);

      let left = {
        name: 'leftLegend', formatter: legend.formatter,
        padding: 10, align: 'left', left: 'left',
        orient: 'vertical', data: leftLegend
      };
      let right = {
        name: 'rightLegend', formatter: legend.formatter,
        padding: 10, align: 'right', left: 'right',
        orient: 'vertical', data: rightLegend
      };
      option.legend = [
        _.defaultsDeep(left, this.panel.echarts.legend),
        _.defaultsDeep(right, this.panel.echarts.legend)
      ];
    }
    /** 左右布局legend */

    switch (this.panel.serieType) {
      case this.ecConf.series.line.type:
      case this.ecConf.series.bar.type:
        if (this.panel.exchangeAxis) {
          option.yAxis = xAxis;
          option.xAxis = yAxis;
          option.yAxis.data = option.yAxis.data.reverse();
          _.each(option.series, series => {
            series.data = series.data.reverse();
          });
        }
        break;
    }

    //option.legend = this.panel.echarts.legend.show ? option.legend : undefined;
    //this.ecOption.baseOption = _.defaultsDeep (option, this.ecOption.baseOption);
    //let baseOption = _.defaultsDeep(option, this.ecOption.baseOption);
    let o = _.cloneDeep(this.ecOption.baseOption);
    for (var key in option) {
      o[key] = option[key];
    }
    // delete o.series[0].markLine;

    // o.series[0].markLine = {
    //   // label: { show: false, position: 'start' },
    //   // lineStyle: { color: 'black', width: 4 },
    //   lable: { normal: { show: false } },
    //   lineStyle: { normal: { color: 'blue' } },
    //   data: [{
    //     name: '平均线',
    //     // label: { show: false, position: 'start' },
    //     // lineStyle: { color: 'black', width: 3 },
    //     // 支持 'average', 'min', 'max'
    //     type: 'average'
    //   }]
    // };
    //let baseOption = _.defaultsDeep(option, this.ecOption.baseOption);
    let baseOption = o;
    // if (false === this.panel.echarts.legend.show) {
    //   baseOption.legend = undefined;
    // }
    //this.ecConfig.theme = this.panel.style.themeName;
    baseOption = this.useSerieTypeConf(baseOption);
    baseOption.color = this.echartColors;
    this.ecOption.baseOption = baseOption;

    if (this.ecInstance) {
      //this.ecInstance.setOption({ legend: this.panel.echarts.legend.show ? option.legend : undefined });
      this.ecInstance.resize();
    }

    // if (false === this.panel.echarts.legend.show) {
    //   this.ecOption.baseOption.legend = undefined;
    // }

  }

  setLegendsConf(option, legendsConf) {
    option.legend.selected = _.transform(legendsConf, (r, item) => {
      r[item.legend.name] = item.legend.selected;
    }, {});

    var keys = _.map(legendsConf, 'key');
    var mapping = _.zipObject(keys, legendsConf);
    _.each(option.legend.data, item => {
      var conf = mapping[item.name];
      if (conf && false === _.isEmpty(conf.legend.name)) {
        item.name = conf.legend.name;
        if (item.serie) { item.serie.name = conf.legend.name; }
      }
    });
  }

  useSerieTypeConf(option) {
    if (this.panel.serieType === "pie") {
      return option;
    }
    var isSeriesBar = this.isSeriesBar();
    var axis = { axis: 'yAxis', axisIndex: 'yAxisIndex' };
    if (this.panel.exchangeAxis) {
      axis = { axis: 'xAxis', axisIndex: 'xAxisIndex' };
    }

    var yAxis = _.cloneDeep(_.filter(this.panel.yAxisConf, { show: true }));
    if (_.size(yAxis) > 0) {
      var leftYAxis = option[axis.axis];
      leftYAxis.axisLabel.formatter = function (value) {
        return value;
      };
      option[axis.axis] = [leftYAxis];
      var defaultAxis = _.cloneDeep(leftYAxis);
      _.unset(defaultAxis, 'max');/** 处理最大值 */
      _.each(yAxis, (yAxis, index) => {
        var y = _.cloneDeep(_.defaultsDeep(yAxis, defaultAxis));
        //y.offset = (index + 1) * -80;
        var { format, decimals } = y.axisLabel;
        //var formatterConf = { format: format, decimals: decimals } = y.axisLabel;
        var formatterConf = { format: format, decimals: decimals };
        if (false === _.isUndefined(format)) {
          y.axisLabel.formatter = (value) => {
            //debugger;
            var decimals = formatterConf.decimals;
            let formater = this.valueFormats[formatterConf.format];
            //return formater(value, decimals);
            return value;
          };
        }
        option[axis.axis].push(y);
      });
    }

    let seriesTypeConf = _.filter(this.panel.seriesTypeConf, { enable: true });
    _.each(seriesTypeConf, type => {
      var series = _.find(option.series, s => {
        var returnValue = (s["name"] === type.target || s["refId"] === type.target);
        return returnValue;
        //return s[isSeriesBar ? 'refId' : 'name'] === type.target;
      });
      if (series) {
        series.type = type.type;
        series.areaStyle = type.areaStyle;
        series.areaStyle = type.areaStyle;
        series.smooth = type.smooth;
        series.smooth = type.smooth;
        _.each(type[type.type] || {}, (value, key) => {
          series[key] = value;
        });
        //series = _.defaultsDeep(_.cloneDeep(type), series);
        if (type.yAxis) {
          var axisIndex = 0;
          if (type.yAxis !== "yAxis") {
            axisIndex = _.findIndex(option[axis.axis], { key: type.yAxis });
          }
          if (axisIndex > -1) {
            series[axis.axisIndex] = axisIndex;
            if (false === _.isEmpty(type.stack)) {
              series.stack = type.stack;
            }
            if (series.type === "line") {
              delete series.stack;
            }
            series.markPoint = _.cloneDeep(type.markPoint);
            series.markLine = _.cloneDeep(type.markLine);
            if (_.has(type, 'label.normal')) {
              _.set(series, 'label.normal', _.cloneDeep(type.label.normal));
            }

            var y = option[axis.axis][axisIndex] || option[axis.axis];
            var { format, decimals } = y.axisLabel;
            var formatterConf = { format: format, decimals: decimals };

            var formatter = (params) => {
              var {
                componentType,
                // 系列类型
                seriesType,
                // 系列在传入的 option.series 中的 index
                seriesIndex,
                // 系列名称
                seriesName,
                // 数据名，类目名
                name,
                // 数据在传入的 data 数组中的 index
                dataIndex,
                // 传入的原始数据项
                data,
                // 传入的数据值
                value,
                // 数据图形的颜色
                color
              } = params;
              //debugger;
              //console.log(this);
              var decimals = formatterConf.decimals;
              let formater = this.valueFormats[formatterConf.format] || function (val) { return val; };
              return formater(value, decimals);
            };

            if (false === _.isUndefined(format)) {
              series.label.normal.formatter = formatter.bind({ type: 'label' });
              _.set(series, 'markPoint.label.normal.formatter', formatter.bind({ type: 'markPoint' }));
              _.set(series, 'markLine.label.normal.formatter', formatter.bind({ type: 'markLine' }));
            }
          }
        }
      }
      //console.log(type);
    });

    _.each(option.series, serie => {
      var labelFormatter = _.get(serie, 'label.normal.formatter');
      if (_.isUndefined(labelFormatter) || true) {
        var axisIndex = _.get(serie, axis.axisIndex, 0);
        //var axisIndex = axis.axisIndex;
        var y = option[axis.axis][axisIndex] || { axisLabel: {} };
        var { format, decimals } = y.axisLabel;
        var formatterConf = { format: format, decimals: decimals, valueFormats: this.valueFormats };

        var formatter = function (params) {
          var { value } = params;
          //console.log(this);
          var decimals = this.decimals;
          let formater = this.valueFormats[this.format] || function (val) { return val; };
          return formater(value, decimals);
        };

        if (false === _.isUndefined(format)) {
          serie.label.normal.formatter = formatter.bind(formatterConf);
          _.set(serie, 'markPoint.label.normal.formatter', formatter.bind(formatterConf));
          _.set(serie, 'markLine.label.normal.formatter', formatter.bind(formatterConf));
        }
      }
    });

    if (_.isEmpty(option.tooltip.formatter)) {
      option.tooltip.formatter = (params, ticket, callback) => {
        var valueFormatter = this.yAxisLableFormatter.bind(this);
        var xFormatter = this.xAxisLableFormatter.bind(this);

        if (_.get(this.panel.formatter, 'tooltip_category.enable', false)) {
          xFormatter = (function (value, index) {
          var returnValue = this.callFormatter('tooltip_category', value, index);
          return returnValue;
          }).bind(this);
        }
        if (_.get(this.panel.formatter, 'tooltip_value.enable', false)) {
          valueFormatter = (function (value, index) {
          var returnValue = this.callFormatter('tooltip_value', value, index);
          return returnValue;
          }).bind(this);
        }
        var returnValue = [];
        var paramArray = _.isArray(params) ? params : [params];
        returnValue.push(xFormatter(paramArray[0].name));
        var ctrl = this;
        _.each(paramArray, function (param, index) {
          var item = [param.marker];
          switch (param.seriesName) {
            case "\u0000-":
              if (ctrl.panel.emptySerieNameNoDisplayTooltip) {
                return;
              }
              break;
            default:
              item.push(param.seriesName + "：");
              break;
          }

          var s = option.series[param.seriesIndex];
          if (s.isSumLabel) { return; }
          var tooltipVal = param.value;
          var formatter = _.get(s, 'label.normal.formatter');
          if (_.isNil(formatter)) {
            var yAxisIndex = _.get(s, axis.axisIndex, 0);
            //option[axis.axis] 为了处理轴切换 this.panel.exchangeAxis==true
            formatter = _.get(option[axis.axis][yAxisIndex], 'axisLabel.formatter', valueFormatter);
            tooltipVal = formatter(param.value);
          } else {
            tooltipVal = formatter(param);
          }
          item.push(tooltipVal);
          returnValue.push(_.join(item, ''));
        });
        return _.join(returnValue, '<br/>');
      };
    }
    this.stackSumLabel(option.series);

    this.calcMin(option, axis);
    return option;
  }

  calcMinseries(yAxis, series) {
    if (yAxis && yAxis.calcMin) {
      //let min = _.min(_.map(_.map(series, 'data'), dataItem => { return dataItem.value || 0; }));
      let min = _.min(_.map(series.data, dataItem => { return dataItem.value || 0; }));
      let c = _.toNumber("1" + _.repeat(0, ("" + _.toInteger(min)).length - 2));
      c = yAxis.min;
      if (min > c) {
        yAxis.min = _.toInteger(min / c) * c;
      } else {
        delete yAxis.min;
      }
    }
  }

  calcMin(option, axis) {
    if (this.panel.serieType === "pie") {
      return option;
    }
    if (_.isUndefined(axis)) {
      var isSeriesBar = this.isSeriesBar();
      axis = { axis: 'yAxis', axisIndex: 'yAxisIndex' };
      if (this.panel.exchangeAxis) {
        axis = { axis: 'xAxis', axisIndex: 'xAxisIndex' };
      }
    }
    _.each(option.series, series => {
      var axisIndex = series[axis.axisIndex] || 0;
      var yAxis = option[axis.axis][axisIndex] || option[axis.axis];
      this.calcMinseries(yAxis, series);
    });
  }
}
