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

loadPluginCssPath({
  //cssPath: '/public/app/plugins/panel/teld-singlestat-panel/css/singlestat.css',
  dark: '/public/app/plugins/panel/teld-singlestat-panel/css/singlestat.built-in.css',
  light: '/public/app/plugins/panel/teld-singlestat-panel/css/singlestat.built-in.css'
});

class SingleStatCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';

  series: any[];
  data: any;
  fontSizes: any[];
  //subScope: any;
  position: any[] = ['left', 'right'];
  layouts: any = {
    LR: {
      name: '左右',
      tmpl: [
        '<div ng-dblclick="click()" class="{{layout}} {{borderClass}} {{bgClass}} {{iconClass}} {{heightClass}}">',
        ' <div class="titleRight"><span ng-bind="postfix"></span>&nbsp;<span ng-bind="rightValue"></span></div>',
        ' <div class="titleLeft">',
        '   <div class="iconTitle"></div>',
        '   <div class="titleValue"><span ng-bind="leftValue"></span>&nbsp;<span ng-bind="prefix"></span></div>',
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
    }
  };
  styleClass: any = {
    borderClass: {
      LR: [{ name: 'top', value: 'penelBorder' }, { name: 'bottom', value: 'chargeBorder' }],
      UD: [{ name: 'default', value: 'panelSubBor' }]
    },
    bgClass: {
      LR: [
        { name: '渐变-蓝', value: 'chargeBg1' },
        { name: '渐变-紫', value: 'chargeBg2' },
        { name: '渐变-黄', value: 'chargeBg3' },
        { name: '纯色-蓝', value: 'penelBg' }
      ],
      UD: [
        { name: '纯色-蓝', value: 'panelSubBg' }
      ]
    },
    iconClass: [
      { name: '无', value: 'iconTip0' },
      { name: 'charg', value: 'iconTip0' },
      { name: 'rise-o', value: 'iconTip1' },
      { name: 'rise-r', value: 'iconTip2' },
      { name: 'rise-b', value: 'iconTip3' },
      { name: 'fall-o', value: 'iconTip4' },
      { name: 'fall-r', value: 'iconTip5' },
      { name: 'fall-b', value: 'iconTip6' }
    ],
    heightClass: {
      LR: [
        { name: '76px', value: 'penelHeight' },
        { name: '90px', value: 'penelHeight2' },
      ],
      UD: [{ name: '95px', value: 'panelSubHeight' },]
    }
  };
  unitFormats: any[];
  invalidGaugeRange: boolean;
  panel: any;
  events: any;
  valueNameOptions: any[] = ['min','max','avg', 'current', 'total', 'name', 'first', 'delta', 'diff', 'range'];

  // Set and populate defaults
  panelDefaults = {
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
    prefixFontSize: '50%',
    valueFontSize: '80%',
    valuePosition: 'left',
    postfixFontSize: '50%',
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
  constructor($scope, $injector, private $location, private linkSrv, private $compile, private $interval) {
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

    let mapSeries = dataList.map(this.seriesHandler.bind(this));

    console.log(mapSeries);

    if (this.panel.stepVal.enabled) {
      this.stepValModel(mapSeries);
    } else {
      this.normalModel(mapSeries);
    }

    this.render();
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
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
        data.valueFormated = this.series[0].alias;
      } else if (_.isString(lastValue)) {
        data.value = 0;
        data.valueFormated = _.escape(lastValue);
        data.valueRounded = 0;
      } else {
        data.value = this.series[0].stats[this.panel.valueName];
        data.flotpairs = this.series[0].flotpairs;

        var decimalInfo = this.getDecimalsForValue(data.value);
        // var formatFunc = kbn.valueFormats[this.panel.format];
        // data.valueFormated = formatFunc(data.value, decimalInfo.decimals, decimalInfo.scaledDecimals);
        // data.valueRounded = kbn.roundValue(data.value, decimalInfo.decimals);
        data.valueRounded = data.valueFormated = data.value;
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
            data.valueFormated = map.text;
            return;
          }
          continue;
        }

        // value/number to text mapping
        var value = parseFloat(map.value);
        if (value === data.valueRounded) {
          data.valueFormated = map.text;
          return;
        }
      }
    } else if (this.panel.mappingType === 2) {
      for (var i = 0; i < this.panel.rangeMaps.length; i++) {
        var map = this.panel.rangeMaps[i];
        // special null case
        if (map.from === 'null' && map.to === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormated = map.text;
            return;
          }
          continue;
        }

        // value/number to range mapping
        var from = parseFloat(map.from);
        var to = parseFloat(map.to);
        if (to >= data.valueRounded && from <= data.valueRounded) {
          data.valueFormated = map.text;
          return;
        }
      }
    }

    if (data.value === null || data.value === void 0) {
      data.valueFormated = "no value";
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

          console.log(_.get(this.$scope.$root, `teld.${setValName}`));
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

      var value = applyColoringThresholds(data.value, data.valueFormated);

      subScope.layout = panel.layout;
      subScope.borderClass = panel.borderClass;
      subScope.bgClass = panel.bgClass;
      subScope.iconClass = panel.iconClass;
      subScope.heightClass = panel.heightClass;

      subScope.prefixFontSize = panel.prefixFontSize;
      subScope.prefix = panel.prefix;
      subScope.postfixFontSize = panel.postfixFontSize;
      subScope.postfix = panel.postfix;
      subScope.valueFontSize = panel.valueFontSize;

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
      var decimalInfo = that.getDecimalsForValue(value);
      value = kbn.roundValue(value, decimalInfo.decimals);
      value = kbn.toFixed(value, decimalInfo.decimals);

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

      var value = applyColoringThresholds(data.value, data.valueFormated);
      body += getSpan('teld-singlestat-panel-value', panel.valueFontSize, value);

      if (panel.postfix) { body += getSpan('teld-singlestat-panel-postfix', panel.postfixFontSize, panel.postfix); }

      body += '</div>';

      return body;
    }

    function getValueText() {
      var result = panel.prefix ? panel.prefix : '';
      result += data.valueFormated;
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

    hookupDrilldownLinkTooltip();

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
