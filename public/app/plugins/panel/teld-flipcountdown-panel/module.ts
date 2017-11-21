///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import moment from 'moment';
import $ from 'jquery';
import 'jquery.flot';
import 'jquery.flot.gauge';
import 'flipcountdown';

import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import TimeSeries from 'app/core/time_series2';
import {MetricsPanelCtrl, loadPluginCssPath} from 'app/plugins/sdk';

import { flipcountdownEchartsEventEditorComponent } from '../teld-eventhandler-editor/echarts_eventhandler_editor';

loadPluginCssPath({
  //cssPath: '/public/app/plugins/panel/teld-flipcountdown-panel/css/singlestat.css',
  dark: '/public/app/plugins/panel/teld-flipcountdown-panel/css/flipcountdown.built-in.css',
  light: '/public/app/plugins/panel/teld-flipcountdown-panel/css/flipcountdown.built-in.css'
});

class FlipCountdownCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';

  dataType = 'timeseries';
  series: any[];
  data: any;
  fontSizes: any[];
  unitFormats: any[];
  invalidGaugeRange: boolean;
  panel: any;
  events: any;
  valueNameOptions: any[] = ['min','max','avg', 'current', 'total', 'name', 'first', 'delta', 'diff', 'range'];
  tableColumnOptions: any;

  // Set and populate defaults
  panelDefaults = {
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
    prefixFontSize: '50%',
    valueFontSize: '80%',
    postfixFontSize: '50%',
    thresholds: '',
    colorBackground: false,
    colorValue: false,
    colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
    stepValSubscriber: {
      enabled: false,
      interval: 1000,
      incrementModel: 'totalStep',
      varName: `currentVal`
    },
    size: 'teld',
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

  /** @ngInject */
  constructor($scope, $injector, private $location, private $parse, private linkSrv, private variableSrv) {
    super($scope, $injector);
    _.defaults(this.panel, this.panelDefaults);

    this.events.on('panel-teardown', this.onTearDown.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  onTearDown() {
    if (angular.isDefined(this.flipcountdown)) {
      let intervalHandle = this.flipcountdown.data('intervalHandle');
      clearInterval(intervalHandle);
    }
  }



  onInitEditMode() {
    this.fontSizes = ['20%', '30%','50%','70%','80%','100%', '110%', '120%', '150%', '170%', '200%'];
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-flipcountdown-panel/editor.html', 2);
    this.addEditorTab('Echarts Events', flipcountdownEchartsEventEditorComponent);
    // this.addEditorTab('Value Mappings', 'public/app/plugins/panel/teld-flipcountdown-panel/mappings.html', 3);
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError(err) {
    this.onDataReceived([]);
  }
  initflipcountdown = false;
  onDataReceived(dataList) {
    const data: any = {};
    if (dataList.length > 0 && dataList[0].type === 'table') {
      this.dataType = 'table';
      const tableData = dataList.map(this.tableHandler.bind(this));
      this.setTableValues(tableData, data);
    } else {
      this.dataType = 'timeseries';
      this.series = dataList.map(this.seriesHandler.bind(this));
      this.setValues(data);
    }
    this.flipcountdownData.initValue = data.value;
    this.flipcountdownData.valueFormatted = data.valueFormatted;
    this.flipcountdownData.value = data.value;
    this.flipcountdownData.step = 0;

    this.data = data;
    this.render();

    if (this.initflipcountdown === false) {
      this.flipcountdown.flipcountdown(
        {
          period: this.panel.stepValSubscriber.interval,
          size: this.panel.size,
          tick: this.tick.bind(this)
        });

      this.initflipcountdown = true;
    }
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
      // data.value = 0;
      // data.valueRounded = 0;
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

  getVal(value) {
    if (this.data && this.data.scopedVars) {
      value = this.templateSrv.replace(value, this.data.scopedVars);
    }
    return value;
  }

  tick() {
    //return (this.flipcountdownData.value += this.flipcountdownData.step);

    let step = 0;
    let val = +this.flipcountdownData.valueFormatted;
    if (this.panel.stepValSubscriber.enabled) {
      let { varName, incrementModel } = this.panel.stepValSubscriber;
      varName = `teld.${varName}`;
      let stepVal = _.get(this.$scope.$root, varName, {});
      step = _.get(stepVal, 'step', 0);
      let totalStep = _.get(stepVal, 'totalStep', 0);
      let stepValInitVal = _.get(stepVal, 'initVal', 0);
      //console.log(step);
      if (this.panel.stepValSubscriber.incrementModel === 'totalStep') {
        val = +this.flipcountdownData.initValue + totalStep;
      } else if (this.panel.stepValSubscriber.incrementModel === 'totalStepAndInit') {
        val = +this.flipcountdownData.initValue + stepValInitVal + totalStep;
      } else {
        val += step;
      }
    }

    var decimalInfo = this.getDecimalsForValue(val);
    var formatFunc = kbn.valueFormats[this.panel.format];
    val = kbn.roundValue(val, decimalInfo.decimals);
    val = kbn.toFixed(val, decimalInfo.decimals);
    this.flipcountdownData.valueFormatted = val;
    val = val / (this.panel.divisor);
    val = kbn.toFixed(val, decimalInfo.decimals);
    //return val;

    var returnVal = val;
    if (this.panel.calcExpression.enable) {
      var context = this.genCalcExpressionContext({ val: val });
      returnVal = this.calcExpression(context);

      // if (isNaN(returnVal)) {
      //   this.$timeout(() => {
      //     this.tick();
      //   }, 300);
      // }
    }

    let varName = this.panel.publishVal.varName;
    if (this.panel.publishVal.enable && varName !== "") {
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
      var variable = this.variableSrv.createVariableFromModel(variableMode);
      _.remove(this.variableSrv.variables, item => {
        return item.name === variable.name;
      });
      this.variableSrv.variables.push(variable);
      this.variableSrv.templateSrv.variableInitialized(variable);
    }

    return returnVal;

    //return "1023456789.0"
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

  flipcountdownData = {
    initValue: 0,
    valueFormatted: 0,
    value: 0,
    step: 0,
  };

  flipcountdown: any;
  link(scope, elem, attrs, ctrl) {
    var $location = this.$location;
    var linkSrv = this.linkSrv;
    var $timeout = this.$timeout;
    var panel = ctrl.panel;
    var templateSrv = this.templateSrv;
    var data, linkInfo;
    var $panelContainer = elem.find('.panel-container');
    elem = elem.find('.teld-flipcountdown-panel');

    //this.onMetricsPanelRefresh();

    this.flipcountdown = elem.find('.flipcountdown');

    function setElementHeight() {
      elem.css('height', ctrl.height + 'px');
    }

    function render() {
      if (!ctrl.data) { return; }
      data = ctrl.data;

      setElementHeight();

      //elem.html(body);
    }

    this.events.on('render', function() {
      render();
      ctrl.renderingCompleted();
    });
  }
}

export {
  FlipCountdownCtrl,
  FlipCountdownCtrl as PanelCtrl
};
