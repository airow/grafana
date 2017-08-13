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
import { tabStyleEditorComponent } from './tab_style_editor';
import { seriesEditorComponent } from './series_editor';

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
    }
  };

  /** @ngInject **/
  constructor($scope, $injector, private $sce, private $rootScope, private variableSrv,
    private dashboardSrv, private uiSegmentSrv, private $http, private $interval) {
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

    this.$rootScope.onAppEvent('panel-change-view', this.ecInstanceResizeWithSeft.bind(this));
    this.$rootScope.onAppEvent('panel-fullscreen-exit', this.ecInstanceResizeWithSeft.bind(this));
    this.$rootScope.onAppEvent('panel-teld-changePanelState', this.ecInstanceResize.bind(this));
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
      this.ecInstance.resize();
      this.$timeout(() => {
        this.ecInstance.resize();
      }, 1000);
    }
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    //this.addEditorTab('Style1', styleEditorComponent);
    this.addEditorTab('Style', tabStyleEditorComponent);
    this.addEditorTab('Series', seriesEditorComponent);
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
      //series: [{ type: 'line', data: [1, 2, 3, 4, 5] }]
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
    //return moment(value).format("YYYY-MM-DD");
    //return value;
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
        return { value: [`${name}`, value] };;
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

      let innerR = parseInt(serie.radius[0]);
      let outerR = innerR + parseInt(this.panel.style.innerRing.width);
      series.push({
        type: 'pie',
        radius: [innerR, outerR],
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

  onRender() {

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
      xAxis,
      yAxis,
      grid,
      series: this.ecSeries,
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

  // link(scope, elem, attrs, ctrl) {
  //   var $panelContainer = elem.find('.panel-container');

  //   elem = elem.find('.panel-content');
  //   elem.css('height', ctrl.height + 'px');

  //   function setElementHeight() {
  //     elem.css('height', ctrl.height + 'px');
  //   }
  // }
}


