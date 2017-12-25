///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import $ from 'jquery';
import 'jquery.flot';
import 'jquery.flot.gauge';

import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import TimeSeries from 'app/core/time_series2';
import {MetricsPanelCtrl, loadPluginCssPath} from 'app/plugins/sdk';

import { finglestatEchartsEventEditorComponent } from '../teld-eventhandler-editor/echarts_eventhandler_editor';
import { submenuDirective } from '../../../features/dashboard/submenu/submenu';

loadPluginCssPath({
  //cssPath: '/public/app/plugins/panel/teld-singlestat-panel/css/singlestat.css',
  dark: '/public/app/plugins/panel/teld-singlestat-panel/css/singlestat.built-in.css',
  light: '/public/app/plugins/panel/teld-singlestat-panel/css/singlestat.built-in.css',
  //light: '/public/app/plugins/panel/teld-singlestat-panel/css/singlestat.built-in.css'
});

class SingleStatCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';
  updateSubScopeCounter = 0;
  dataType = 'timeseries';
  series: any[];
  data: any;
  fontSizes: any[];
  //subScope: any;
  position: any[] = ['left', 'right'];
  layouts: any = {
    LR: {
      name: '左右',
      tmpl: [
        '<div ng-dblclick="click()" ng-style="customStyle" ng-class="{\'panelAutoHeight\':autoHeight}" ',
        ' class="{{layout}} {{borderClass}} {{bgClass}} {{iconClass}} {{heightClass}}">',
        ' <span ng-if="tip.enable" ng-style="tip.style" style="z-index:1;position: absolute;">',
        '  <i class="grafana-tip fa fa-question-circle" bs-tooltip="tip.context"></i>',
        ' </span>',
        ' <div class="titleRight">',
        '   <span ng-style="postfixStyle" ng-bind="postfix"></span>&nbsp;<span ng-style="valueStyle" ng-bind="rightValue"></span>',
        ' </div>',
        ' <div class="titleLeft">',
        '   <div class="iconTitle"></div>',
        '   <div class="titleValue">',
        '     <span ng-style="valueStyle" ng-bind="leftValue"></span>&nbsp;<span ng-style="prefixStyle" ng-bind="prefix"></span>',
        '   </div>',
        ' </div>',
        '</div>'
      ].join('')
    },
    UD: {
      name: '上下', tmpl: [
        '<div ng-dblclick="click()" class="{{layout}} {{borderClass}} {{bgClass}} {{iconClass}} {{heightClass}}">',
        ' <div class="titleRight">',
        '   <div class="iconTitle"></div>',
        '   <div class="subValue"><span ng-bind="value"></span>&nbsp;</div>',
        ' </div>',
        ' <div class="titleLeft">',
        '   <div class="titleName"><span ng-bind="prefix"></span>&nbsp;</div>',
        '   <div class="titleValue"><span ng-bind="postfix"></span>&nbsp;</div>',
        ' </div>',
        '</div>'
      ].join('')
    },
    listlunbo: {
      name: '电站状态', tmpl: [
        '<div class="listMain">',
        ' <div class="listTip {{bgClass}} {{iconClass}}">',
        '   <span class="chargeIcon"><img src="../img/charg.png"></span>',
        '   <div class="listInfo"><span ng-bind="prefix"></span>&nbsp;</div>',
        ' </div>',
        ' <div class="listVaule"><span ng-bind="value"></span>&nbsp;</div>',
        '</div>'
      ].join('')
    }
  };
  styleClass: any = {
    borderClass: {
      LR: [{ name: 'top', value: 'penelBorder' }, { name: 'bottom', value: 'chargeBorder' },{ name: '', value: '' }],
      UD: [{ name: 'default', value: 'panelSubBor' }]
    },
    bgClass: {
      LR: [
        { name: '渐变-蓝', value: 'chargeBg1' },
        { name: '渐变-紫', value: 'chargeBg2' },
        { name: '渐变-黄', value: 'chargeBg3' },
        { name: '纯色-蓝', value: 'penelBg' },
        { name: '', value: '' }
      ],
      UD: [
        { name: '纯色-蓝', value: 'panelSubBg' }
      ],
      listlunbo: [
        { name: 'pile', value: 'pile' },
        { name: '蓝', value: 'pile-b' },
        { name: '灰', value: 'pile-g' },
        { name: '红', value: 'pile-r' },
        { name: '黄', value: 'pile-y' },
      ]
    },
    iconClass: [
      { name: '无', value: '' },
      { group: 'screen', name: '充电量及充电次数', value: 'charg_capacity' },
      { group: 'screen', name: '充电人数', value: 'charg_num' },
      { group: 'screen', name: '工单数', value: 'orders_num' },
      { group: 'screen', name: '注册人数', value: 'register_num' },
      { group: 'screen', name: '订单数', value: 'work_num' },
      { group: 'screen', name: '预警数', value: 'warning_num' },
      { group: 'screen', name: '公司', value: 'company' },
      { group: 'screen', name: '公司_r', value: 'company2' },
      { group: 'screen', name: '公司_w', value: 'company3' },
      { group: 'screen', name: '失败订单', value: 'fail_order' },
      { group: 'screen', name: '失败订单_r', value: 'fail_order2' },
      { group: 'screen', name: '失败订单_w', value: 'fail_order3' },
      { group: 'screen', name: '客户数', value: 'customer' },
      { group: 'screen', name: '客户数_r', value: 'customer2' },
      { group: 'screen', name: '客户数_w', value: 'customer3' },
      { group: 'screen', name: '开发平台伙伴', value: 'platform' },
      { group: 'screen', name: '开发平台伙伴_r', value: 'platform2' },
      { group: 'screen', name: '开发平台伙伴_w', value: 'platform3' },
      { group: 'screen', name: '异常订单', value: 'abnormal' },
      { group: 'screen', name: '异常订单_r', value: 'abnormal2' },
      { group: 'screen', name: '异常订单_w', value: 'abnormal3' },
      { group: 'screen', name: '离网率', value: 'loserate' },
      { group: 'screen', name: '离网率_r', value: 'loserate2' },
      { group: 'screen', name: '离网率_w', value: 'loserate3' },
      { group: 'screen', name: '覆盖城市', value: 'coveredCity' },
      { group: 'screen', name: '覆盖城市_r', value: 'coveredCity2' },
      { group: 'screen', name: '覆盖城市_w', value: 'coveredCity3' },
      { group: 'screen', name: '运营商', value: 'operator' },
      { group: 'screen', name: '运营商_r', value: 'operator2' },
      { group: 'screen', name: '运营商_w', value: 'operator3' },
      { group: 'screen', name: '电站', value: 'dianzh' },

      {group: 'yunwei', name: '服务器', value: '服务器' },
      {group: 'yunwei', name: '工单', value: '工单' },
      {group: 'yunwei', name: '互联互通', value: '互联互通' },
      {group: 'yunwei', name: '机器', value: '机器' },
      {group: 'yunwei', name: '集群', value: '集群' },
      {group: 'yunwei', name: '节点', value: '节点' },
      {group: 'yunwei', name: '进程', value: '进程' },
      {group: 'yunwei', name: '平台', value: '平台' },
      {group: 'yunwei', name: '容器服务', value: '容器服务' },
      {group: 'yunwei', name: '时间', value: '时间' },
      {group: 'yunwei', name: '新增', value: '新增' },
      {group: 'yunwei', name: '修复', value: '修复' },
      {group: 'yunwei', name: '遗留', value: '遗留' },
      {group: 'yunwei', name: '预警', value: '预警' },
      {group: 'yunwei', name: '站点', value: '站点' },

      {group: 'default', name: 'charg', value: 'iconTip0' },
      {group: 'default', name: 'rise-o', value: 'iconTip1' },
      {group: 'default', name: 'rise-r', value: 'iconTip2' },
      {group: 'default', name: 'rise-b', value: 'iconTip3' },
      {group: 'default', name: 'fall-o', value: 'iconTip4' },
      {group: 'default', name: 'fall-r', value: 'iconTip5' },
      {group: 'default', name: 'fall-b', value: 'iconTip6' },
      {group: 'default', name: '充电', value: 'iconCharg' },

      { group: 'dataAnalysis', name: '1_1', value: 'da1_1' },
      { group: 'dataAnalysis', name: '1_2', value: 'da1_2' },
      { group: 'dataAnalysis', name: '2_1', value: 'da2_1' },
      { group: 'dataAnalysis', name: '2_2', value: 'da2_2' },
      { group: 'dataAnalysis', name: '3_1', value: 'da3_1' },
      { group: 'dataAnalysis', name: '3_2', value: 'da3_2' },
      { group: 'dataAnalysis', name: '4_1', value: 'da4_1' },
      { group: 'dataAnalysis', name: '4_2', value: 'da4_2' },
      { group: 'dataAnalysis', name: 'allsta', value: 'daallsta' },
      { group: 'dataAnalysis', name: 'appBrisk', value: 'daappBrisk' },
      { group: 'dataAnalysis', name: 'avgservecost', value: 'daavgservecost' },
      { group: 'dataAnalysis', name: 'BuildPile', value: 'daBuildPile' },
      { group: 'dataAnalysis', name: 'buildsta', value: 'dabuildsta' },
      { group: 'dataAnalysis', name: 'chargeDegrees', value: 'dachargeDegrees' },
      { group: 'dataAnalysis', name: 'chargingNumberCount', value: 'dachargingNumberCount' },
      { group: 'dataAnalysis', name: 'consumeMoney', value: 'daconsumeMoney' },
      { group: 'dataAnalysis', name: 'H', value: 'daH' },
      { group: 'dataAnalysis', name: 'H1', value: 'daH1' },
      { group: 'dataAnalysis', name: 'OperatePile', value: 'daOperatePile' },
      { group: 'dataAnalysis', name: 'rechargeMoney', value: 'darechargeMoney' },
      { group: 'dataAnalysis', name: 'revers', value: 'darevers' },
      { group: 'dataAnalysis', name: 'runsta', value: 'darunsta' },
      { group: 'dataAnalysis', name: 'Strategy', value: 'daStrategy' },
      { group: 'dataAnalysis', name: 'YYZDS', value: 'daYYZDS' },
      { group: 'dataAnalysis', name: 'ZDRJCDL', value: 'daZDRJCDL' },
      { group: 'dataAnalysis', name: 'ZJFWDBS', value: 'daZJFWDBS' },
    ],
    heightClass: {
      LR: [
        { name: '76px', value: 'penelHeight' },
        { name: '90px', value: 'penelHeight2' },
        { name: 'auto', value: 'penelHeight' },
      ],
      UD: [{ name: '95px', value: 'panelSubHeight' },]
    }
  };
  unitFormats: any[];
  invalidGaugeRange: boolean;
  panel: any;
  events: any;
  valueNameOptions: any[] = ['min','max','avg', 'current', 'total', 'name', 'first', 'delta', 'diff', 'range'];
  tableColumnOptions: any;

  // Set and populate defaults
  panelDefaults = {
    autoHeight: false,
    customStyle: { enable: false, style: {} },
    tip: {
      enable: false,
      context: '',
      style: {
        top: '-24px',
        right: '10px'
      }
    },
    layout: 'LR',
    borderClass: '',
    bgClass: '',
    iconClass: '',
    links: [],
    datasource: null,
    maxDataPoints: 100,
    interval: null,
    targets: [{}],
    cacheTimeout: null,
    format: 'none',
    prefix: '',
    postfix: '',
    nullText: null,
    valueMaps: [
      { value: 'null', op: '=', text: 'N/A' }
    ],
    mappingTypes: [
      {name: 'value to text', value: 1},
      {name: 'range to text', value: 2},
    ],
    rangeMaps: [
      { from: 'null', to: 'null', text: 'N/A' }
    ],
    mappingType: 1,
    nullPointMode: 'connected',
    valueName: 'avg',
    // prefixFontSize: '100%',
    // valueFontSize: '100%',
    // postfixFontSize: '100%',
    valuePosition: 'left',
    thresholds: '',
    colorBackground: false,
    colorValue: false,
    colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
    sparkline: {
      show: false,
      full: false,
      lineColor: 'rgb(31, 120, 193)',
      fillColor: 'rgba(31, 118, 189, 0.18)',
    },
    gauge: {
      show: false,
      minValue: 0,
      maxValue: 100,
      thresholdMarkers: true,
      thresholdLabels: false
    },
    stepVal: {
      enabled: false,
      cardinal: '基数',
      increment: '增量',
      interval: 1000,
      publish: false,
      varName: `currentVal${this.panel.id}`
    },
    stepValSubscriber: {
      enabled: false,
      interval: 1000,
      incrementModel: 'totalStep',
      varName: `currentVal`
    },

    echartsPanel: {
      enabled: false,
      args: {
        title: ''
      }
    },
    divisor: 1,
    calcExpression: {
      enable: false,
      expression: "val",
      args: []
    },
    publishVal: {
      enable: false,
      varName: '',
    }
  };

  getLayout() {
    return _.keys(this.layouts);
  }

  getBorderClass() {
    return this.styleClass.borderClass[this.panel.layout];
  }

  getBgClass() {
    return this.styleClass.bgClass[this.panel.layout];
  }

  getIconClass() {
    return this.styleClass.iconClass;
  }

  getHeightClass() {
    return this.styleClass.heightClass[this.panel.layout];
  }

  /** @ngInject */
  constructor($scope, $injector, private $location, private linkSrv, private $compile, private $interval,
    private variableSrv, private $parse, $timeout) {
    super($scope, $injector);
    _.defaults(this.panel, this.panelDefaults);

    this.events.on('panel-teardown', this.onTearDown.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  intervalHandle: any;
  stepValSubscriberIntervalHandle: any;
  onTearDown() {
    if (angular.isDefined(this.intervalHandle)) {
      this.$interval.cancel(this.intervalHandle);
      this.intervalHandle = undefined;
    }
    if (angular.isDefined(this.stepValSubscriberIntervalHandle)) {
      this.$interval.cancel(this.stepValSubscriberIntervalHandle);
      this.stepValSubscriberIntervalHandle = undefined;
    }
  }

  onInitEditMode() {
    this.fontSizes = ['20%', '30%','50%','70%','80%','100%', '110%', '120%', '150%', '170%', '200%'];
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-singlestat-panel/editor.html', 2);
    this.addEditorTab('Echarts Events', finglestatEchartsEventEditorComponent);
    //this.addEditorTab('Value Mappings', 'public/app/plugins/panel/teld-singlestat-panel/mappings.html', 3);
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError(err) {
    this.onDataReceived([]);
  }

  currentVal = { initVal: 0, val: 0, step: 0, totalStep: 0 };

  stepValModel(mapSeries) {
    let { cardinal, increment } = this.panel.stepVal;
    let cardinalSeries = _.filter(mapSeries, ['alias', cardinal]);
    let incrementSeries = _.filter(mapSeries, ['alias', increment]);


    this.series = incrementSeries;
    var incrementData: any = {};
    this.setValues(incrementData);

    this.currentVal.step = _.round(incrementData.value / 60, 2);

    this.series = cardinalSeries;
    var data: any = {};
    this.setValues(data);

    this.currentVal.initVal = this.currentVal.val = data.value;

    this.data = data;

    return this.data;
  }

  normalModel(mapSeries) {

    this.series = mapSeries;
    var data: any = {};
    this.setValues(data);

    this.currentVal.initVal = this.currentVal.val = data.value;

    this.data = data;

    return this.data;
  }

  onDataReceived(dataList) {
    this.updateSubScopeCounter = 0;
    const data: any = {};
    if (dataList.length > 0 && dataList[0].type === 'table') {
      this.dataType = 'table';
      const tableData = dataList.map(this.tableHandler.bind(this));
      this.setTableValues(tableData, data);
      this.data = data;
    } else {
      this.dataType = 'timeseries';
      // this.series = dataList.map(this.seriesHandler.bind(this));
      // this.setValues(data);
      let mapSeries = dataList.map(this.seriesHandler.bind(this));
      if (this.panel.stepVal.enabled) {
        this.stepValModel(mapSeries);
      } else {
        this.normalModel(mapSeries);
      }
    }
    this.render();

    // let mapSeries = dataList.map(this.seriesHandler.bind(this));

    // console.log(mapSeries);

    // if (this.panel.stepVal.enabled) {
    //   this.stepValModel(mapSeries);
    // } else {
    //   this.normalModel(mapSeries);
    // }

    // this.render();
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  tableHandler(tableData) {
    const datapoints = [];
    const columnNames = {};

    tableData.columns.forEach((column, columnIndex) => {
      columnNames[columnIndex] = column.text;
    });

    this.tableColumnOptions = columnNames;
    if (!_.find(tableData.columns, ['text', this.panel.tableColumn])) {
      this.setTableColumnToSensibleDefault(tableData);
    }

    tableData.rows.forEach((row) => {
      const datapoint = {};

      row.forEach((value, columnIndex) => {
        const key = columnNames[columnIndex];
        datapoint[key] = value;
      });

      datapoints.push(datapoint);
    });

    return datapoints;
  }

  setTableColumnToSensibleDefault(tableData) {
    if (this.tableColumnOptions.length === 1) {
      this.panel.tableColumn = this.tableColumnOptions[0];
    } else {
      this.panel.tableColumn = _.find(tableData.columns, (col) => { return col.type !== 'time'; }).text;
    }
  }

  setTableValues(tableData, data) {
    if (!tableData || tableData.length === 0) {
      return;
    }

    if (tableData[0].length === 0 || tableData[0][0][this.panel.tableColumn] === undefined) {
      return;
    }

    const datapoint = tableData[0][0];
    data.value = datapoint[this.panel.tableColumn];

    if (_.isString(data.value)) {
      data.valueFormatted = _.escape(data.value);
      data.value = 0;
      data.valueRounded = 0;
    } else {
      const decimalInfo = this.getDecimalsForValue(data.value);
      const formatFunc = kbn.valueFormats[this.panel.format];
      data.valueFormatted = formatFunc(datapoint[this.panel.tableColumn], decimalInfo.decimals, decimalInfo.scaledDecimals);
      data.valueRounded = kbn.roundValue(data.value, this.panel.decimals || 0);
    }

    //this.setValueMapping(data);
  }

  setColoring(options) {
    if (options.background) {
      this.panel.colorValue = false;
      this.panel.colors = ['rgba(71, 212, 59, 0.4)', 'rgba(245, 150, 40, 0.73)', 'rgba(225, 40, 40, 0.59)'];
    } else {
      this.panel.colorBackground = false;
      this.panel.colors = ['rgba(50, 172, 45, 0.97)', 'rgba(237, 129, 40, 0.89)', 'rgba(245, 54, 54, 0.9)'];
    }
    this.render();
  }

  invertColorOrder() {
    var tmp = this.panel.colors[0];
    this.panel.colors[0] = this.panel.colors[2];
    this.panel.colors[2] = tmp;
    this.render();
  }

  getDecimalsForValue(value) {
    if (_.isNumber(this.panel.decimals)) {
      return {decimals: this.panel.decimals, scaledDecimals: null};
    }

    var delta = value / 2;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);

    var magn = Math.pow(10, -dec),
      norm = delta / magn, // norm is between 1.0 and 10.0
      size;

    if (norm < 1.5) {
      size = 1;
    } else if (norm < 3) {
      size = 2;
      // special case for 2.5, requires an extra decimal
      if (norm > 2.25) {
        size = 2.5;
        ++dec;
      }
    } else if (norm < 7.5) {
      size = 5;
    } else {
      size = 10;
    }

    size *= magn;

    // reduce starting decimals if not needed
    if (Math.floor(value) === value) { dec = 0; }

    var result: any = {};
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

    return result;
  }

  setValues(data) {
    data.flotpairs = [];

    if (this.series.length > 1) {
      var error: any = new Error();
      error.message = 'Multiple Series Error';
      error.data = 'Metric query returns ' + this.series.length +
        ' series. Single Stat Panel expects a single series.\n\nResponse:\n'+JSON.stringify(this.series);
      throw error;
    }

    if (this.series && this.series.length > 0) {
      var lastPoint = _.last(this.series[0].datapoints);
      var lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

      if (this.panel.valueName === 'name') {
        data.value = 0;
        data.valueRounded = 0;
        data.valueFormatted = this.series[0].alias;
      } else if (_.isString(lastValue)) {
        data.value = 0;
        data.valueFormatted = _.escape(lastValue);
        data.valueRounded = 0;
      } else {
        data.value = this.series[0].stats[this.panel.valueName];
        data.flotpairs = this.series[0].flotpairs;

        var decimalInfo = this.getDecimalsForValue(data.value);
        // var formatFunc = kbn.valueFormats[this.panel.format];
        // data.valueFormatted = formatFunc(data.value, decimalInfo.decimals, decimalInfo.scaledDecimals);
        // data.valueRounded = kbn.roundValue(data.value, decimalInfo.decimals);
        data.valueRounded = data.valueFormatted = data.value;
      }

      // Add $__name variable for using in prefix or postfix
      data.scopedVars = _.extend({}, this.panel.scopedVars);
      data.scopedVars["__name"] = {value: this.series[0].label};
    }

    // check value to text mappings if its enabled
    if (this.panel.mappingType === 1) {
      for (var i = 0; i < this.panel.valueMaps.length; i++) {
        var map = this.panel.valueMaps[i];
        // special null case
        if (map.value === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = map.text;
            return;
          }
          continue;
        }

        // value/number to text mapping
        var value = parseFloat(map.value);
        if (value === data.valueRounded) {
          data.valueFormatted = map.text;
          return;
        }
      }
    } else if (this.panel.mappingType === 2) {
      for (var i = 0; i < this.panel.rangeMaps.length; i++) {
        var map = this.panel.rangeMaps[i];
        // special null case
        if (map.from === 'null' && map.to === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = map.text;
            return;
          }
          continue;
        }

        // value/number to range mapping
        var from = parseFloat(map.from);
        var to = parseFloat(map.to);
        if (to >= data.valueRounded && from <= data.valueRounded) {
          data.valueFormatted = map.text;
          return;
        }
      }
    }

    if (data.value === null || data.value === void 0) {
      data.valueFormatted = "no value";
    }
  };

  removeValueMap(map) {
    var index = _.indexOf(this.panel.valueMaps, map);
    this.panel.valueMaps.splice(index, 1);
    this.render();
  };

  addValueMap() {
    this.panel.valueMaps.push({value: '', op: '=', text: '' });
  }

  removeRangeMap(rangeMap) {
    var index = _.indexOf(this.panel.rangeMaps, rangeMap);
    this.panel.rangeMaps.splice(index, 1);
    this.render();
  };

  addRangeMap() {
    this.panel.rangeMaps.push({from: '', to: '', text: ''});
  }


  genCalcExpressionContext(context) {

    let variableSrv = this.variableSrv;
    let calcExpression = this.panel.calcExpression;

    context = _.transform(calcExpression.args, function (result, argument) {
      result[argument.name] = argument.defVal;

      let variable = _.find(variableSrv.variables, { name: argument.name });
      if (variable) {
        result[argument.name] = +variable.current.value;
      }

    }, context);

    return context;
  }

  addExpressionArgument() {
    let calcExpression = this.panel.calcExpression;
    calcExpression.args.push({});
  }

  removeExpressionArgument(index) {
    this.panel.calcExpression.args.splice(index, 1);
  }

  calcExpressionDebug() {
    let calcExpression = this.panel.calcExpression;
    let context = _.transform(calcExpression.args, function (result, argument) {
      result[argument.name] = argument.defVal;
    }, {});
    return this.calcExpression(context);
  }

  calcExpression(context) {
    let calcExpression = this.panel.calcExpression;

    if (false === _.isObject(context)) {
      return 0;
    }

    var parseFunc = this.$parse(calcExpression.expression);
    var returnVal = parseFunc(context);

    return returnVal;
  }

  link(scope, elem, attrs, ctrl) {
    var that = this;
    var $location = this.$location;
    var linkSrv = this.linkSrv;
    var $timeout = this.$timeout;
    var panel = ctrl.panel;
    var templateSrv = this.templateSrv;
    var compile = this.$compile;
    var data, linkInfo;
    var $panelContainer = elem.find('.panel-container');
    var layouts = this.layouts;
    var layout = this.layouts[this.panel.layout];
    elem = elem.find('.teld-singlestat-panel');

    scope.click = this.echartsEventPublish.bind(this);

    var subScope = scope.$new();

    if (this.panel.stepVal.enabled) {
      this.intervalHandle = this.$interval(() => {
        this.currentVal.totalStep += this.currentVal.step;
        updateSubScope(parseInt(subScope.value) + this.currentVal.step);

        if (this.panel.stepVal.publish) {
          let setValName = _.get(this.panel.stepVal, 'varName', 'currentVal');
          _.set(this.$scope.$root, `teld.${setValName}`, this.currentVal);
        }
      }, this.panel.stepVal.interval);
    } else {
      if (this.panel.stepValSubscriber.enabled) {

        this.stepValSubscriberIntervalHandle = this.$interval(() => {

          let val = +subScope.value;
          let { varName, incrementModel } = this.panel.stepValSubscriber;
          varName = `teld.${varName}`;
          let stepVal = _.get(this.$scope.$root, varName, {});
          let step = _.get(stepVal, incrementModel, 0);

          if (this.panel.stepValSubscriber.incrementModel === 'totalStep') {
            val = +this.currentVal.initVal + step;
          } else {
            val += step;
          }

          updateSubScope(val);

        }, this.panel.stepValSubscriber.interval);
      }
    }




    // this.$interval(() => {
    //   this.refresh();
    // }, 5 * 1000);


    function setElementHeight() {
      elem.css('height', ctrl.height + 'px');
    }

    function applyColoringThresholds(value, valueString) {
      if (!panel.colorValue) {
        return valueString;
      }

      var color = getColorForValue(data, value);
      if (color) {
        return '<span style="color:' + color + '">'+ valueString + '</span>';
      }

      return valueString;
    }

    function getSpan(className, fontSize, value)  {
      value = templateSrv.replace(value, data.scopedVars);
      return '<span class="' + className + '" style="font-size:' + fontSize + '">' +
        value + '</span>';
    }

    function getBigValueHtml() {

      var value = applyColoringThresholds(data.value, data.valueFormatted);

      subScope.layout = panel.layout;
      subScope.borderClass = panel.borderClass;
      subScope.bgClass = panel.bgClass;
      subScope.autoHeight = panel.autoHeight;
      delete subScope.customStyle;
      if (panel.customStyle.enable) {
        //{ 'backgroundColor': 'green', color: 'red' };
        subScope.customStyle = panel.customStyle.style;
      }
      subScope.tip = panel.tip;
      subScope.iconClass = panel.iconClass;
      subScope.heightClass = panel.heightClass;

      subScope.prefix = panel.prefix;
      subScope.postfix = panel.postfix;

      subScope.prefixStyle = {};
      if (panel.prefixFontSize2 !== "") {
        subScope.prefixStyle["font-size"] = panel.prefixFontSize2;
      }

      subScope.postfixStyle = {};
      if (panel.postfixFontSize2 !== "") {
        subScope.postfixStyle["font-size"] = panel.postfixFontSize2;
      }

      subScope.valueStyle = {};
      if (panel.valueFontSize2 !== "") {
        subScope.valueStyle["font-size"] = panel.valueFontSize2;
      }

      updateSubScope(value);
      // if (panel.layout === 'LR') {
      //   subScope[`${panel.valuePosition}Value`] = subScope.value;
      //   if (panel.valuePosition === 'left') { subScope.prefix = ''; }
      //   if (panel.valuePosition === 'right') { subScope.postfix = ''; }
      // }

      //subScope.alert = window.alert;
      subScope.alert = function () { alert(12); };

      var jqHtml = compile(layout.tmpl)(subScope);
      //var jqHtml = compile(layout.tmpl)(subScope);
      //var jqHtml = compile(html.join(''))(s);
      elem.empty().append(jqHtml);

      // var html = '<button ng-click="alert(1);">button3</button>';
      // html = '<button ng-click=\'alert(1)\'>I\'m button</button>';
      // elem.append(html);
      // compile(elem.contents())(subScope);
    }

    function updateSubScope(value) {
      var orgiValue = value;
      var decimalInfo = that.getDecimalsForValue(+value);
      value = kbn.roundValue(value, decimalInfo.decimals);
      value = kbn.toFixed(value, decimalInfo.decimals);

      value = value / (that.panel.divisor);
      value = kbn.toFixed(value, decimalInfo.decimals);

      var returnVal = value;
      if (that.panel.calcExpression.enable) {
        var context = that.genCalcExpressionContext({ val: value });
        value = returnVal = that.calcExpression(context);

        if (isNaN(returnVal)) {
          if (that.updateSubScopeCounter++ < 10) {
            that.$timeout(() => {
              updateSubScope(orgiValue);
              console.log('补偿计算-updateSubScope');
            }, 300);
          }
          value = "";
        } else {
          value = kbn.toFixed(value, decimalInfo.decimals);
        }
      }

      let varName = that.panel.publishVal.varName;
      if (that.panel.publishVal.enable && varName !== "") {
        let variableMode = {
          "allValue": null,
          "canSaved": false,
          "current": {
            "text": returnVal,
            "value": returnVal
          },
          "hide": 0,
          "includeAll": false,
          "label": varName,
          "name": varName,
          "multi": false,
          "options": [
            {
              "selected": true,
              "text": returnVal,
              "value": returnVal
            }
          ],
          "query": returnVal,
          "type": "custom"
        };
        var variable = that.variableSrv.createVariableFromModel(variableMode);
        _.remove(that.variableSrv.variables, item => {
          return item.name === variable.name;
        });
        that.variableSrv.variables.push(variable);
        that.variableSrv.templateSrv.variableInitialized(variable);
      }

      subScope.value = value;
      if (panel.layout === 'LR') {
        subScope[`${panel.valuePosition}Value`] = subScope.value;
        if (panel.valuePosition === 'left') { subScope.prefix = ''; }
        if (panel.valuePosition === 'right') { subScope.postfix = ''; }
      }
    }


    function getBigValueHtml_grafana() {
      var body = '<div class="teld-singlestat-panel-value-container">';

      if (panel.prefix) { body += getSpan('teld-singlestat-panel-prefix', panel.prefixFontSize, panel.prefix); }

      var value = applyColoringThresholds(data.value, data.valueFormatted);
      body += getSpan('teld-singlestat-panel-value', panel.valueFontSize, value);

      if (panel.postfix) { body += getSpan('teld-singlestat-panel-postfix', panel.postfixFontSize, panel.postfix); }

      body += '</div>';

      return body;
    }

    function getValueText() {
      var result = panel.prefix ? panel.prefix : '';
      result += data.valueFormatted;
      result += panel.postfix ? panel.postfix : '';

      return result;
    }

    function render() {
      if (!ctrl.data) { return; }
      data = ctrl.data;

      // get thresholds
      data.thresholds = panel.thresholds.split(',').map(function(strVale) {
        return Number(strVale.trim());
      });
      data.colorMap = panel.colors;

      setElementHeight();

      getBigValueHtml();
    }

    function hookupDrilldownLinkTooltip() {
      // drilldown link tooltip
      var drilldownTooltip = $('<div id="tooltip" class="">hello</div>"');

      elem.mouseleave(function() {
        if (panel.links.length === 0) { return;}
        $timeout(function() {
          drilldownTooltip.detach();
        });
      });

      elem.click(function(evt) {
        if (!linkInfo) { return; }
        // ignore title clicks in title
        if ($(evt).parents('.panel-header').length > 0) { return; }

        if (linkInfo.target === '_blank') {
          var redirectWindow = window.open(linkInfo.href, '_blank');
          redirectWindow.location;
          return;
        }

        if (linkInfo.href.indexOf('http') === 0) {
          window.location.href = linkInfo.href;
        } else {
          $timeout(function() {
            $location.url(linkInfo.href);
          });
        }

        drilldownTooltip.detach();
      });

      elem.mousemove(function(e) {
        if (!linkInfo) { return;}

        drilldownTooltip.text('click to go to: ' + linkInfo.title);
        drilldownTooltip.place_tt(e.pageX, e.pageY-50);
      });
    }

    //hookupDrilldownLinkTooltip();

    this.events.on('render', function() {
      render();
      ctrl.renderingCompleted();
    });
  }
}

function getColorForValue(data, value) {
  for (var i = data.thresholds.length; i > 0; i--) {
    if (value >= data.thresholds[i-1]) {
      return data.colorMap[i];
    }
  }
  return _.first(data.colorMap);
}

export {
  SingleStatCtrl,
  SingleStatCtrl as PanelCtrl,
  getColorForValue
};
