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


import { styleEditorComponent } from './style_editor';
import { panelEditorComponent } from './panel_editor';


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
          formatter: function (value, index) {
            //return `@${value}`;
            //return kbn.valueFormats["h"](value);
            //return moment.utc().format();
            return value;
            //return kbn._.transform(object, iteratee, accumulator)
          }
        }
      },
      value: {
        show: true,
        type: 'value',
        min: 'dataMin',
        max: 'dataMax'
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

  // Set and populate defaults
  panelDefaults = {
    serieType: 'line',
    style: {
      themeName: 'default',
    },
    baseConf: {
      isDelayRolling: true
    },
    echarts: {
      title: {},
      legend: {},
      xAxis: [this.ecConf.axis.category]
    }
  };

  /** @ngInject **/
  constructor($scope, $injector, private $sce, private $rootScope, private variableSrv,
    private dashboardSrv, private uiSegmentSrv, private $http, private $interval) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.echartsTheme = echartsTheme;
    this.echartsThemeName = echartsThemeName;

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-initialized', this.onPanelInitialized.bind(this));
    // this.events.on('refresh', this.onRefresh.bind(this));
    // this.events.on('render', this.onRender.bind(this));

    this.events.on('panel-teardown', this.onTearDown.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));

    this.$rootScope.onAppEvent('panel-change-view', this.ecInstanceResizeWithSeft.bind(this));
    this.$rootScope.onAppEvent('panel-fullscreen-exit', this.ecInstanceResizeWithSeft.bind(this));
    this.$rootScope.onAppEvent('panel-teld-changePanelState', this.ecInstanceResize.bind(this));
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
      //this.ecInstance.resize();
      // this.$timeout(() => {
      //   this.ecInstance.resize();
      // }, 1000);
    }
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    this.addEditorTab('Style', styleEditorComponent);
    this.addEditorTab('Line', panelEditorComponent);
    this.addEditorTab('Bar', panelEditorComponent);
    this.addEditorTab('Pie', panelEditorComponent);
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
    this.ecConfig = {
      theme: this.panel.style.themeName,
      //theme: config.bootData.user.lightTheme ? 'light' : 'drak',
      //theme: 'teld',
      dataLoaded: true
    };

    var option: any = {
      title: {
        text: '1990 与 2015 年各国家人均寿命与 GDP'
      },
      legend: {
        show: true,
      },
      tooltip: {
        trigger: 'axis'
      },
      // xAxis: this.panel.echarts.xAxis,
      // yAxis: [{
      //   boundaryGap: [0, '100%'],
      //   splitLine: {
      //     show: false
      //   }
      // }],
      //series: [{ type: 'line', data: [1, 2, 3, 4, 5] }]
    };

    this.ecOption = {
      baseOption: option,
      options: []
    };
  }

  onDataReceived(dataList) {

    console.group('onDataReceived(dataList)');
    console.log(dataList);
    console.groupEnd();

    console.group('转换数据');

    /**
     * {datapoints: Array(5), metric: "sum", field: "总电量", props: {…}, target: "SUM_总电量"}
     * {datapoints: Array(5), metric: "max", field: "总电量", props: {…}, target: "MAX_总电量"}
     * datapoints[0]: [31016.81, 1483200000000]
     */

    let series = this.dataList2Serie(dataList);

    this.ecSeries = series;
    console.groupEnd();

    //this.render();
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

      let data = _.map(item.datapoints, point => {

        let { value, timestamp } = _.zipObject(['value', 'timestamp'], point);
        let ecData = { value: [`${timestamp}`, value] };

        return ecData;
      });

      let serie = {
        name: target,
        type: serieType,
        data
      };
      return serie;
    });

    return series;
  }

  peiSeries(dataList) {

    let serieType = this.panel.serieType;


    let data = _.map(dataList, item => {
      let dataItem: any;
      let { target, metric, field } = item;
      if (target === "docs") {
        dataItem = _.map(item.datapoints, point => {
          let ecData = _.zipObject(['name', 'value'], _.values(point));
          return ecData;
        });
      } else {
        let values = _.map(item.datapoints, point => {
          return point[0];
        });

        dataItem = { name: target, value: _.sum(values) };
      }

      return dataItem;
    });


    data = _.sortBy(data, ['value']);
    data = _.reverse(data);

    let series = [{
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
    }];

    return series;
  }

  fff(dataList) {
    let series = _.map(dataList, item => {

      let { target, metric, field } = item;

      let serieType = this.panel.serieType;

      let data: any;
      switch (serieType) {
        default:
          data = _.map(item.datapoints, point => {

            let { value, timestamp } = _.zipObject(['value', 'timestamp'], point);
            let ecData = { value: [`${timestamp}`, value] };

            return ecData;
          });
          break;
        case this.ecConf.series.pie.type:

          if (target === "docs") {
            data = _.map(item.datapoints, point => {
              let ecData = _.zipObject(['name', 'value'], _.values(point));
              return ecData;
            });
          } else {
            data = _.map(item.datapoints, point => {
              let { value, timestamp } = _.zipObject(['value', 'timestamp'], point);
              let ecData = { value, name: timestamp };
              return ecData;
            });

            let ii = _.map(item.datapoints, point => {
              return point[0];
            });

            data = { name: target, value: _.sumBy(data, item => { return item.value; }) };
          }
          break;
      }

      let serie = {
        name: target,
        type: serieType,
        data
      };
      return serie;
    });
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

    return _.defaults({ data: axisData }, axis);
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
        axis = this.serie2cateAxis(serie, this.ecConf.axis.category);
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
        axis = this.ecConf.axis.value;
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

  onRender() {

    let categoryAxis = this.axisAdapter(this.ecSeries[0], this.ecConf.axis.category);
    let valueAxis = this.valueAxisAdapter();

    function formatter(n) {
      if (this.panel.serieType === this.ecConf.series.pie.type) {
        let { name, percent } = this.seriesLabel[n];
        return `${name}: ${percent}%`;
      } else {
        return n;
      }
    }

    let option: any = {
      title: { text: moment().valueOf() },
      xAxis: categoryAxis,
      yAxis: valueAxis,
      series: this.ecSeries,
      legend: { orient: 'vertical', left: 'right', formatter: formatter.bind(this), data: this.legend(this.ecSeries) }
    };


    /** 左右布局legend */
    var evens = _.pullAt(option.legend.data, 1, 2, 3, 4);
    option.legend = [
      { formatter: formatter.bind(this), padding: 10, align: 'left', left: 'left', orient: 'vertical', data: option.legend.data },
      { formatter: formatter.bind(this), padding: 10, align: 'left', left: 'right', orient: 'vertical', data: evens }
    ];
    /** 左右布局legend */


    //this.ecOption.baseOption = _.defaultsDeep (option, this.ecOption.baseOption);
     this.ecOption.baseOption = _.defaults(option, this.ecOption.baseOption);
  }
}

