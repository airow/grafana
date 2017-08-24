///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';

import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import appEvents from 'app/core/app_events';
import TimeSeries from 'app/core/time_series2';

import { MetricsPanelCtrl, loadPluginCss } from 'app/plugins/sdk';

import echarts from 'echarts';
import echartsTheme, { echartsThemeName } from './theme/all';

import * as FileExport from 'app/core/utils/file_export';
import {transformDataToTable} from '../table/transformers';
import {tablePanelEditor} from '../table/editor';
import {TableRenderer} from '../table/renderer';

import { styleEditorComponent } from './style_editor';
import { tabStyleEditorComponent } from './tab_style_editor';
import { seriesEditorComponent } from './series_editor';

import { echartsEventEditorComponent } from '../teld-eventhandler-editor/echarts_eventhandler_editor';

loadPluginCss({
  dark: '/public/app/plugins/panel/teld-chargingbill-panel/css/dark.built-in.css',
  light: '/public/app/plugins/panel/teld-chargingbill-panel/css/light.built-in.css'
});
export class ModuleCtrl extends MetricsPanelCtrl {
  static templateUrl = `partials/module.html`;

  ecInstance: echarts.ECharts;
  ecConfig: any;
  ecOption: any;

  ecSeries: any[];

  seriesLabel = {};

  valueFormats = kbn.valueFormats;

  ecConf = {
    axis: {
      category: {
        show: true,
        type: 'category',
        boundaryGap: false,
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
        min: 'dataMin',
        max: 'dataMax',
        // axisLabel: {
        //   formatter: this.panel.formatter.yAxis.axisLabel.formatter.bind(this)
        // }
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
    formatter: {
      value: { format: 'teldString' },
      category: { format: 'teldString' },
      xAxis: { axisLabel: { format: 'teldString' } },
      yAxis: { axisLabel: { format: 'teldString' } },
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

  /** @ngInject **/
  constructor($scope, $injector, private $sce, private $rootScope, private variableSrv,
    private dashboardSrv, private uiSegmentSrv, private $http, private $location, private $interval, private $sanitize, private $window) {
    super($scope, $injector);

    _.defaultsDeep(this.panel, this.panelDefaults);
    this.panel.title = '';
    this.panel.hideTimeOverride = true;

    this.echartsTheme = echartsTheme;
    this.echartsThemeName = echartsThemeName;

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

  onInitPanelActions(actions) {
    actions.push({ text: 'Export CSV', click: 'ctrl.exportCsv()' });
  }

  isfullscreen() {
    let viewState = this.$rootScope.g_DashboardViewState;
    let editMode = viewState.edit === null || viewState.edit === false;
    return viewState.fullscreen && editMode;
  }

  axisLableFormatter(axis, value, index) {
    let formater = this.valueFormats[this.panel.formatter[axis].axisLabel.format];
    return formater(value);
  }

  onTearDown() {

  }

  ecInstanceResizeWithSeft(evt, payload) {
    if (payload.panelId === this.panel.id) {
      this.ecInstanceResize(evt, payload);
    }
  }

  ecInstanceResize(evt, payload) {
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
    this.addEditorTab('Style', tabStyleEditorComponent);
    this.addEditorTab('Series', seriesEditorComponent);
    this.addEditorTab('Options', tablePanelEditor);
    this.addEditorTab('Events', echartsEventEditorComponent);
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

    this.ecConfig = {
      theme: theme,
      //theme: config.bootData.user.lightTheme ? 'light' : 'drak',
      //theme: 'teld',
      dataLoaded: true
    };

    var option: any = {
      // title: {
      //   text: '1990 与 2015 年各国家人均寿命与 GDP'
      // },
      // legend: {
      //   show: true,
      // },
      // tooltip: {
      //   trigger: 'axis'
      // },
      // xAxis: this.panel.echarts.xAxis,
      // yAxis: [{
      //   boundaryGap: [0, '100%'],
      //   splitLine: {
      //     show: false
      //   }
      // }],
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
    return formater(value);
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

    if (false === this.panel.showTable) { return; }

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
    var renderer = new TableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize);
    this.tbodyHtml = this.$sce.trustAsHtml(renderer.render(0));
  }

  onDataReceived(dataList) {

    this.renderTable(dataList);

    /**
     * {datapoints: Array(5), metric: "sum", field: "总电量", props: {…}, target: "SUM_总电量"}
     * {datapoints: Array(5), metric: "max", field: "总电量", props: {…}, target: "MAX_总电量"}
     * datapoints[0]: [31016.81, 1483200000000]
     */

    let series = this.dataList2Serie(dataList);

    this.ecSeries = series;

    this.render();
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

  defaultSeries(dataList) {
    let series = _.map(dataList, item => {

      let { target, metric, field } = item;

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
        name = this.categoryFormat(name);
        value = this.valueFormat(value);
        return { value: [`${name}`, value] };
        //return { value: value };
      });

      // if (target === "docs") {
      //   data = _.map(item.datapoints, point => {
      //     let { value, name } = _.zipObject(['name', 'value'], _.values(point));
      //     name = this.categoryFormat(name);
      //     value = this.valueFormat(value);
      //     return { value: [`${name}`, value] };;
      //   });
      // } else {
      //   data = _.map(item.datapoints, point => {

      //     let { value, name } = _.zipObject(['value', 'name'], point);

      //     name = this.categoryFormat(name);
      //     value = this.valueFormat(value);

      //     let ecData = { value: [`${name}`, value] };

      //     return ecData;
      //   });
      // }



      let encode: any = {};
      if (this.panel.exchangeAxis) {
        encode.x = 1;
        encode.y = 0;
      };

      let serie = this.getDefaultSerie();
      _.defaultsDeep(serie, {
        encode,
        name: target,
        type: serieType,
        data
      });
      return serie;
    });

    return series;
  }

  /*
  defaultSeries33(dataList) {
    let series = _.map(dataList, item => {

      let { target, metric, field } = item;

      let serieType = this.panel.serieType;

      let data: any;

      if (target === "docs") {
        data = _.map(item.datapoints, point => {
          let { value, name } = _.zipObject(['name', 'value'], _.values(point));
          name = this.categoryFormat(name);
          value = this.valueFormat(value);
          return { value: [`${name}`, value] };;
        });
      } else {
        data = _.map(item.datapoints, point => {

          let { value, name } = _.zipObject(['value', 'name'], point);

          name = this.categoryFormat(name);
          value = this.valueFormat(value);

          let ecData = { value: [`${name}`, value] };

          return ecData;
        });
      }



      let encode: any = {};
      if (this.panel.exchangeAxis) {
        encode.x = 1;
        encode.y = 0;
      };

      let serie = this.getDefaultSerie();
      _.defaultsDeep(serie, {
        encode,
        name: target,
        type: serieType,
        data
      });
      return serie;
    });

    return series;
  }

  defaultSeries22(dataList) {
    let series = _.map(dataList, item => {

      let { target, metric, field } = item;

      let serieType = this.panel.serieType;

      let data = _.map(item.datapoints, point => {

        let { value, timestamp } = _.zipObject(['value', 'timestamp'], point);

        timestamp = this.categoryFormat(timestamp);
        value = this.valueFormat(value);

        let ecData = { value: [`${timestamp}`, value] };

        return ecData;
      });

      let encode: any = {};
      if (this.panel.exchangeAxis) {
        encode.x = 1;
        encode.y = 0;
      };

      let serie = this.getDefaultSerie();
      _.defaultsDeep(serie, {
        encode,
        name: target,
        type: serieType,
        data
      });
      return serie;
    });

    return series;
  }
  */

  getDefaultSerie() {
    let serieType = this.panel.serieType;
    let serie = this.panel.echarts.series[serieType] || this.ecConf.series[serieType];
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
        axis = this.categoryAxisAdapter(serie);
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
      case this.ecConf.series.bar.type:

        axis = this.serie2cateAxis(serie, _.defaultsDeep(this.ecConf.axis.category, this.panel.echarts.xAxis));
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
        break;
      case this.ecConf.series.pie.type:
        axis = undefined;
        break;
    }
    return axis;
  }
  //坐标轴构建

  legend(series) {
    let legendData: any;
    if (this.panel.serieType === this.ecConf.series.pie.type) {
      legendData = series.map(serie => {
        //return _.flatten(serie.data).map(item => { return { name: item.name, item }; });
        return serie.data.map(item => { return { name: item.name, item }; });
      });
      legendData = _.flatten(legendData);
    } else {
      legendData = series.map(serie => {
        return { name: serie.name, serie };
      });
    }
    return legendData;
  }

  getSeries() {
    let series = this.ecSeries;
    switch (this.panel.serieType) {
      case this.ecConf.series.line.type:
      case this.ecConf.series.bar.type:
        series = _.cloneDeep(this.ecSeries).map(item => { item.data.map(d => { d.value = d.value[1]; return d; }); return item; });
        break;
    }
    return series;
  }

  onRender() {

    if (this.enablePanelRefresh && (!this.ecSeries || this.ecSeries.length === 0)) {
      /**处理面板自刷新，取不到数无法显示的问题 */
      this.onMetricsPanelRefresh();
      return;
    }

    let xAxis, categoryAxis;
    xAxis = categoryAxis = this.axisAdapter(this.ecSeries[0], this.ecConf.axis.category);

    let yAxis, valueAxis;
    yAxis = valueAxis = this.valueAxisAdapter();

    if (categoryAxis) {
      xAxis = _.cloneDeep(this.panel.echarts.xAxis);
      _.defaultsDeep(xAxis, categoryAxis);
    }

    if (valueAxis) {
      yAxis = _.cloneDeep(this.panel.echarts.yAxis);
      _.defaultsDeep(yAxis, valueAxis);
    }

    function formatter(n) {
      if (this.panel.serieType === this.ecConf.series.pie.type) {
        let { name, percent } = this.seriesLabel[n];
        name = _.head(_.split(name, "[:]"));
        return `${name}: ${percent}%`;
      } else {
        return n;
      }
    }


    let legend: any = { name: 'legend', formatter: formatter.bind(this), data: this.legend(this.ecSeries) };
    legend = _.defaultsDeep(legend, this.panel.echarts.legend);

    let grid = _.defaultsDeep({}, this.panel.echarts.grid);

    let option: any = {
      backgroundColor: this.panel.echarts.backgroundColor,
      title: _.cloneDeep(this.panel.echarts.title),
      tooltip: _.cloneDeep(this.panel.echarts.tooltip),
      xAxis,
      yAxis,
      grid,
      //series: this.ecSeries,
      series: this.getSeries(),
      legend: [legend]
    };


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
        padding: 10, align: 'left', left: 'right',
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
        }
        break;
    }

    //option.legend = this.panel.echarts.legend.show ? option.legend : undefined;
    //this.ecOption.baseOption = _.defaultsDeep (option, this.ecOption.baseOption);
    let baseOption = _.defaultsDeep(option, this.ecOption.baseOption);
    // if (false === this.panel.echarts.legend.show) {
    //   baseOption.legend = undefined;
    // }
    //this.ecConfig.theme = this.panel.style.themeName;
    this.ecOption.baseOption = baseOption;

    if (this.ecInstance) {
      //this.ecInstance.setOption({ legend: this.panel.echarts.legend.show ? option.legend : undefined });
      this.ecInstance.resize();
    }

    // if (false === this.panel.echarts.legend.show) {
    //   this.ecOption.baseOption.legend = undefined;
    // }

  }
}
