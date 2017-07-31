///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';

import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import appEvents from 'app/core/app_events';
import TimeSeries from 'app/core/time_series2';

import { MetricsPanelCtrl } from 'app/plugins/sdk';

import echarts from 'echarts';
import 'echarts.china';
import '../teld-theme/echarts/all';
import { geoCoordMap, transformGeoMap } from './BaiduMap_cityCenter';

import { fromCitiesEditorComponent } from './fromcities_editor';
import { panelEditorComponent } from './panel_editor';
// import {visualMapEditorComponent} from './visualMap_editor';

export class ModuleCtrl extends MetricsPanelCtrl {
  static templateUrl = `partials/module.html`;



  isloaded = true;

  ecInstance: echarts.ECharts;
  ecConfig: any;
  ecOption: any;
  cityCoord: any;

  teld: any;
  serieBar: any;
  intervalHandle: any;
  intervalFullHandle: any;
  totalVal: any;
  minuteLastVal: any;
  initialVal: any;
  currentVal: any;
  stepVal: any;
  dispalyValue: any;
  valStyle: any;

  lines: any;
  cityRange: any;

  // Set and populate defaults
  panelDefaults = {
    end: {
      cityName: "青岛",
    },
    toCiytConf: {
      style: {
        label: {
          normal: {
            textStyle: {
              fontStyle: 'normal',
              fontWeight: 'normal',
              fontFamily: 'sans-serif',
              fontSize: 24
            },
            formatter: '{b}',
            position: 'right',
            offset: [10, 50],
            show: false
          }
        },
        itemStyle: {
          normal: {
            color: '#f4e925',
            shadowBlur: 10,
            shadowColor: '#333'
          }
        }
      }
    },
    visualMap: {
      show: false,
      type: 'continuous',
    },
    fromCityConf: {
      cities: []
    }
  };

  /** @ngInject **/
  constructor($scope, $injector, private $sce, private $rootScope, private variableSrv,
    private dashboardSrv, private uiSegmentSrv, private $http, private $interval) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    // this.events.on('refresh', this.onRefresh.bind(this));
    // this.events.on('render', this.onRender.bind(this));
    this.events.on('panel-teardown', this.onTearDown.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));

    this.events.on('panel-initialized', this.onPanelInitialized.bind(this));

    this.$rootScope.onAppEvent('panel-change-view', this.ecInstanceResizeWithSeft.bind(this));
    this.$rootScope.onAppEvent('panel-fullscreen-exit', this.ecInstanceResizeWithSeft.bind(this));
    this.$rootScope.onAppEvent('panel-teld-changePanelState', this.ecInstanceResize.bind(this));

    this.cityCoord = transformGeoMap();

    this.panel.end.geoCoord = this.cityCoord[this.panel.end.cityName];


    let textStyle = this.panel.toCiytConf.style.label.normal.textStyle;
    let itemStyle = this.panel.toCiytConf.style.label.normal.textStyle;

    this.valStyle = {
      'font-size': `${textStyle.fontSize}px`,
      'color': itemStyle.color,
      'font-style': textStyle.fontStyle,
      'font-weight': textStyle.fontWeight
    };

    this.teld = {
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: [{
        //name: this.panel.end.cityName,
        value: [this.panel.end.geoCoord.lng, this.panel.end.geoCoord.lat, 100]
      }],

      // symbolSize: function (val) {
      //   return val[2] / 10;
      // },
      showEffectOn: 'render',
      rippleEffect: {
        brushType: 'stroke'
      },
      hoverAnimation: true,
      label: this.panel.toCiytConf.style.label,
      itemStyle: this.panel.toCiytConf.style.itemStyle,
      zlevel: 3
    };

    this.serieBar = {
      name: '预购队列',
      type: 'bar',
      label: {
        normal: {
          show: true,
          position: 'right'
        }
      },
      data: (function () {
        var res = [];
        var len = 5;
        while (len--) {
          //res.push(Math.round(Math.random() * 1000));
          res.push(0);
        }
        return res;
      })()
    };

    this.cityRange = [
      { name: '武汉', code: 4201 },
      { name: '商丘', code: 4114 },
      { name: '北京', code: 11 },
      { name: '青岛', code: 3702 },
      { name: '临沂', code: 3713 },
      { name: '南京', code: 3201 },
      { name: '上海', code: 31 },
      { name: '厦门', code: 3502 },
      { name: '成都', code: 5101 },
      { name: '福州', code: 3501 },
      { name: '惠州', code: 4413 },
      { name: '扬州', code: 3210 },
      { name: '重庆', code: 50 },
      { name: '杭州', code: 3301 },
      { name: '常德', code: 4307 },

      { name: '成都', code: 50 },
      { name: '常州', code: 40 },
      { name: '北海', code: 20 },
      { name: '海口', code: 10 },
      { name: '广州', code: 90 },
      { name: '大连', code: 80 },
      { name: '南宁', code: 70 },
      { name: '南昌', code: 60 },
      { name: '拉萨', code: 50 },
      { name: '长春', code: 40 },
      { name: '包头', code: 30 },
    ];

    this.cityRange = this.panel.fromCityConf.cities;
  }

  onTearDown() {
    if (angular.isDefined(this.intervalHandle)) {
      this.$interval.cancel(this.intervalHandle);
      this.intervalHandle = undefined;
    }

    if (angular.isDefined(this.intervalFullHandle)) {
      this.$interval.cancel(this.intervalFullHandle);
      this.intervalFullHandle = undefined;
    }
  }

  ecInstanceResizeWithSeft(evt, payload) {
    if (payload.panelId === this.panel.id) {
      this.ecInstanceResize(evt, payload);
    }
  }

  ecInstanceResize(evt, payload) {
    if (this.ecInstance) {
      //this.ecInstance.resize();
      this.$timeout(() => {
        this.ecInstance.resize();
      }, 1000);
    }
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    this.addEditorTab('Options', panelEditorComponent);
    this.addEditorTab('From Cities', fromCitiesEditorComponent);
    // this.addEditorTab('Legend', legendEditorComponent);
    // this.addEditorTab('Legend Group', legendGroupEditorComponent);
    this.editorTabIndex = 1;
  }

  refreshMinuteVal() {
    this.intervalHandle = this.$interval(() => {
      this.currentVal += this.stepVal;
      // if (this.currentVal >= this.totalVal) {
      //   this.$interval.cancel(this.intervalHandle);
      // }

      this.setTeldData();

    }, 500);
  }

  setTeldData() {
    // this.teld.data = [{
    //   name: `[${kbn.valueFormats["thousandsSeparator"](this.currentVal, 2)}]`,
    //   value: [this.panel.end.geoCoord.lng, this.panel.end.geoCoord.lat, 100]
    // }];

    this.dispalyValue = kbn.valueFormats["thousandsSeparator"](this.currentVal, 2);
  }

  onPanelInitialized() {
    //alert('onPanelInitialized');
    this.refreshMinuteVal();
    this.intervalFullHandle = this.$interval(() => {
      this.refresh();
    }, 1000 * 60);

    this.$timeout(() => {
      this.initEcharts();
      //this.events.on('refresh', this.onRefresh.bind(this));
      this.events.on('render', this.onRender.bind(this));
    }, 1000);
  }

  onRefresh() {
    this.render();
  }

  getVariableByName(variableName) {

    let variableType = 'custom';

    let variable = this.templateSrv.getVariable(`$${variableName}`, variableType);
    if (variable) {

    } else {
      variable = this.variableSrv.addVariable({ type: variableType, canSaved: false });
      variable.hide = 2;
      variable.name = variable.label = variableName;
    }
    return variable;
  }

  initEcharts() {
    this.ecConfig = {
      theme: 'default',
      //theme: config.bootData.user.lightTheme ? 'light' : 'drak',
      //theme: 'teld',
      dataLoaded: true
    };

    var color = ['#a6c84c', '#ffa022', '#46bee9'];
    var series = this.getSeries();
    var option: any = {
      // visualMap: {
      //   min: 0,
      //   max: 1500,
      //   left: 'left',
      //   top: 'bottom',
      //   text: ['High', 'Low'],
      //   seriesIndex: [0],
      //   inRange: {
      //     color: ['#e0ffff', '#006edd']
      //   },
      //   calculable: true
      // },
      color,
      // backgroundColor: '#404a59',
      tooltip: {
        trigger: 'item'
      },
      grid: {
        z: 99,
        show: false,
        // backgroundColor: '#ccc',
        top: '50%',
        left: '5%',
        right: '50%'
      },
      geo: {
        // regions: [{
        //   name: '广东',
        //   itemStyle: {
        //     normal: {
        //       areaColor: 'red',
        //       color: 'red'
        //     }
        //   }
        // }],
        // left: 100,
        // right: 100,
        // top: 100,
        // bottom: 100,
        layoutCenter: ['50%', '50%'],
        // 如果宽高比大于 1 则宽度为 100，如果小于 1 则高度为 100，保证了不超过 100x100 的区域
        layoutSize: '130%',
        map: 'china',
        //zoom: 2,
        label: {
          normal: {
            show: true,
            textStyle: { color: '#fff' }
          },
          emphasis: {
            show: false
          }
        },
        roam: true,
        itemStyle: {
          normal: {
            areaColor: '#323c48',
            borderColor: '#ffffff'
          },
          emphasis: {
            areaColor: '#2a333d'
          }
        }
      },
      series: series.concat(this.teld)
    };

    if (option.grid.show) {
      option.yAxis = [
        {
          type: 'category',
          boundaryGap: true,
          data: (function () {
            var res = [];
            var len = 5;
            while (len--) {
              res.push(len + 1);
            }
            return res;
          })()
        }
      ];
      option.xAxis = [
        {
          type: 'value',
          scale: true,
          name: '预购量',
          max: 1200,
          min: 0,
          boundaryGap: [0.2, 0.2]
        }
      ];
    }

    this.ecOption = {
      baseOption: option
    };
  }

  onDataReceived(dataList) {

    this.$interval.cancel(this.intervalHandle);

    let total = _.find(dataList, { target: "电量" });

    let minute = _.find(dataList, { target: "分钟电量" });

    let cityMinutePower = _.filter(dataList, item => { return _.endsWith(item.target, '[:]城市电量'); });
    cityMinutePower = cityMinutePower.map(item => {
      let code = _.replace(item.target, "[:]城市电量", "");
      return { code, value: item.datapoints[0][0] };
    });
    this.lines = {};
    //合并直辖市数据
    let crownCity = {
      "11": { code: "11", value: 0 },/* 北京 */
      "12": { code: "12", value: 0 },/* 天津 */
      "31": { code: "31", value: 0 },/* 上海 */
      "50": { code: "50", value: 0 },/* 重庆 */
    };

    _.forEach(cityMinutePower, item => {
      let codeFirstTwo = item.code.substr(0, 2);
      switch (codeFirstTwo) {
        case "11":
        case "12":
        case "31":
        case "50":
          crownCity[codeFirstTwo].value += item.value;
          break;
        default:
          this.lines[`code.${item.code}`] = item;
          break;
      }
    });

    _.forEach(crownCity, (value, key) => {
      this.lines[`code.${key}`] = value;
    });

    let minuteSorted = _.sortBy(minute.datapoints, function (item) { return item[1]; });

    let minuteLast = _.last(minuteSorted);

    this.minuteLastVal = _.isEmpty(minuteLast) ? 0 : minuteLast[0];

    console.log(this.minuteLastVal);

    this.totalVal = total.datapoints[0][0];

    this.stepVal = this.minuteLastVal / 120;

    //this.currentVal = this.initialVal = this.totalVal - this.minuteLastVal;
    this.currentVal = this.initialVal = this.totalVal;

    //console.log("onDataReceived" + dataList);
    this.render();

    this.refreshMinuteVal();
  }

  clearEcharts() {
    this.ecOption.baseOption.visualMap.show = false;
    this.ecOption.baseOption.timeline.show = false;
    this.ecOption.baseOption.legend.show = false;
  }

  getLinesData() {

    let fromCity = this.cityRange;

    var toName = this.panel.end.cityName;
    var toCoord = this.cityCoord[toName].coord;

    let returnValue = [];
    let i = 0;
    fromCity.forEach((item: any, index) => {
      let fromCity = item.geoCoord || (item.geoCoord = this.cityCoord[item.name]);
      fromCity.coord = [fromCity.lng, fromCity.lat];
      let line;
      try {
        line = this.lines[`code.${item.code}`];
      } catch (error) {
        console.log(error);
        //alert(error);
        this.onRefresh();
        //debugger;
      }

      if (item.enable) {
        returnValue.push({
          fromCityIndex: i++,
          fromName: item.name,
          fromCode: item.code,
          value: line ? line.value : 1,
          line,
          toName,
          coords: [fromCity.coord, toCoord]
        });
      }
    });

    returnValue = _.sortBy(returnValue, ['value']);
    returnValue = _.forEach(_.reverse(returnValue), (value, index) => {
      value.index = index;
    });

    returnValue = _.reverse(returnValue);

    return returnValue;
  }

  getSeries() {
    let color = [
      '#c12e34', '#e6b600', '#0098d9', '#2b821d',
      '#005eaa', '#339ca8', '#cda819', '#32a487',/**shine */
      '#61a0a8', '#d48265',
      '#91c7ae', '#749f83', '#ca8622', '#bda29a',
      '#6e7074', '#546570', '#c4ccd3'];

    let dataSource = this.getLinesData();

    let scatterData = dataSource.map(item => {

      let label = {
        normal: {
          show: item.index < 10 && false,
          textStyle: {
            fontSize: 20 - item.index,
            color: color[item.index]
          }
        }
      };

      let itemStyle = { normal: { color: color[item.index] || (item.line ? '#7fdeb6' : '#cbebdd') } };

      return {
        name: item.fromName,
        value: item.coords[0].concat(kbn.valueFormats["none"](item.value, 2)),
        label,
        itemStyle,
        symbolSize: (item.line ? 6 : 4),
        tooltip: { formatter: '{b}' }
        //label: { normal: { show: true, textStyle: { fontSize: item.value } } }
      };
    });

    let linesData = _.filter(dataSource, item => {
      // let returnValue = this.lines[item.fromCode];
      // if (returnValue) {
      //   item.value = this.lines[item.fromCode].value;
      // };
      return item.line;
    });
    function randomValue() {
      return Math.round(Math.random() * 1000);
    }
    let series = [
      {
        type: 'map',
        geoIndex: 0,
        tooltip: { show: false },
        data: [
          { name: '北京', value: randomValue() },
          { name: '天津', value: randomValue() },
          { name: '上海', value: randomValue() },
          { name: '重庆', value: randomValue() },
          { name: '河北', value: randomValue() },
          { name: '河南', value: randomValue() },
          { name: '云南', value: randomValue() },
          { name: '辽宁', value: randomValue() },
          { name: '黑龙江', value: randomValue() },
          { name: '湖南', value: randomValue() },
          { name: '安徽', value: randomValue() },
          { name: '山东', value: randomValue() },
          { name: '新疆', value: randomValue() },
          { name: '江苏', value: randomValue() },
          { name: '浙江', value: randomValue() },
          { name: '江西', value: randomValue() },
          { name: '湖北', value: randomValue() },
          { name: '广西', value: randomValue() },
          { name: '甘肃', value: randomValue() },
          { name: '山西', value: randomValue() },
          { name: '内蒙古', value: randomValue() },
          { name: '陕西', value: randomValue() },
          { name: '吉林', value: randomValue() },
          { name: '福建', value: randomValue() },
          { name: '贵州', value: randomValue() },
          { name: '广东', value: randomValue() },
          { name: '青海', value: randomValue() },
          { name: '西藏', value: randomValue() },
          { name: '四川', value: randomValue() },
          { name: '宁夏', value: randomValue() },
          { name: '海南', value: randomValue() },
          { name: '台湾', value: randomValue() },
          { name: '香港', value: randomValue() },
          { name: '澳门', value: randomValue() }
        ]
      },
      {
        type: 'lines',
        zlevel: 1,
        effect: {
          show: true,
          period: 3,
          trailLength: 0,
          color: '#fff',
          symbolSize: 3
        },
        label: { normal: { show: false } },
        lineStyle: {
          normal: {
            width: 0,
            curveness: 0.2
          }
        },
        data: linesData
      },
      {
        type: 'lines',
        zlevel: 2,
        effect: {
          show: true,
          period: 6,
          delay: 3,
          trailLength: 0,
          color: '#fff',
          symbolSize: 3
        },
        label: { normal: { show: false }, emphasis: { show: false } },
        tooltip: {
          formatter: function (params, ticket, callback) {
            //return JSON.stringify(params.data);
            return `${params.data.fromName}:${kbn.valueFormats["none"](params.value, 2)}`;
          }
        },
        lineStyle: {
          normal: {
            width: 1,
            curveness: 0.2
          }
        },
        data: linesData.map(item => {
          let conf: any = {};
          //console.log(item.value);
          conf.lineStyle = {
            normal: {
              width: item.index < 10 ? item.value / 10 : 1,
              color: color[item.index] || undefined
            }
          };
          return _.defaults(item, conf);
        })
      },
      {
        z: 50,
        type: 'scatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: function (val) {
          //return val[2] / 10;
          return 5;
        },
        label: {
          normal: {
            formatter: '{b}',
            position: 'right',
            show: false
          },
          emphasis: {
            show: true
          }
        },
        itemStyle: {
          normal: {
            color: '#ddb926'
          }
        }
      },
      {
        z: 100,
        type: 'scatter',
        coordinateSystem: 'geo',
        data: [{ value: [120.384428, 36.105215, 100] }],
        symbol: 'image:///public/img/Teld.png',
        symbolSize: [100, 50],
        symbolOffset: [55, 10],
      }
    ];

    // if (this.ecOption.baseOption.grid.show) {
    //   series.push(this.serieBar);
    // }

    return series;
  }

  onRender() {
    console.log("onRender");

    this.setTeldData();

    let option: any = { series: this.getSeries().concat(this.teld) };

    // if (this.ecOption.baseOption.grid.show) {
    //   this.serieBar.data.shift();
    //   this.serieBar.data.push(this.minuteLastVal);
    //   console.log(this.minuteLastVal);
    //   let axisData = (new Date()).toLocaleTimeString().replace(/^\D*/, '');
    //   let yAxisData = this.ecOption.baseOption.yAxis[0].data;
    //   yAxisData.shift();
    //   yAxisData.push(axisData);

    //   option.yAxis = [{ data: yAxisData }];
    // }

    this.ecOption.baseOption = option;
  }
}
