///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />
///<reference path="../../../headers/baidumap-web-sdk/index.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import { MetricsPanelCtrl, PanelCtrl } from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import appEvents from 'app/core/app_events';
import echarts from 'echarts';
import './eventHandler_srv';
import ZoomControl from './zoomControl';
import {legendEditorComponent} from './legend_editor';
import bmapStyle from './theme/bmap/all';
import symbol from './theme/symbol/all';
import './theme/echarts/all';
import config from 'app/core/config';

export class TeldHeatmapBmapPanelCtrl extends MetricsPanelCtrl {
  static templateUrl = `partials/module.html`;

  isloaded = true;

  ecBmap: BMap.Map;
  ecInstance: echarts.ECharts;
  ecConfig: any;
  ecOption: any;

  currentEvent: any;
  watchEvents: any[];

  city: any;

  bmapCL: {
    bounds: BMap.Bounds,
    center: any
    zoom: any
  };
  isPlay: Boolean;
  isLoadAllData: Boolean;
  timelineIndex: any;
  loadCount: any;
  isSelected: Boolean;

  timelineDataOpts: any;

  // Set and populate defaults
  panelDefaults = {
    varMetric: 'varMetric',
    legend: {
      data: [],
    },
    heatmap: {
      pointSize: 10,
      blurSize: 10
    },
    timeline: {
      // realtime: false,
      loop: false,
      autoPlay: false,
      // currentIndex: 2,
      playInterval: 1000
    },
    watchEvents: []
  };

  /** @ngInject **/
  constructor($scope, $injector, private $sce, private $rootScope, private variableSrv,
    private dashboardSrv, private uiSegmentSrv, private $http) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    //this.isPlay = this.panel.timeline.autoPlay;
    this.isLoadAllData = false;
    this.isSelected = false;
    this.bmapCL = { bounds: null, center: {}, zoom: 12 };

    this.timelineDataOpts = { "每小时": [], '城市': [] };
    for (var index = 1; index <= 24; index++) {
      this.timelineDataOpts["每小时"].push(_.padStart(`${index}`, 2, '0'));
    }
    this.timelineDataOpts["城市"] = ['北京市',
      '青岛市',
      '天津市',
      '上海市',
      '重庆市',
      '杭州市',
      '武汉市',
      '深圳市',
      '广州市'];

    this.city = {
      "china": { g: [116.395645, 39.929986], zoom: 5 },
      "北京": { g: [116.395645, 39.929986], zoom: 12 },
      "天津": { g: [117.210813, 39.14393], zoom: 12 },
      "河北": { g: [115.661434, 38.61384], zoom: 7 },
      "山西": { g: [112.515496, 37.866566], zoom: 7 },
    };

    this.$scope.$watch(() => { return this.isPlay; }, (newValue, oldValue, scope) => {
      //alert(`${newValue},${oldValue},${scope},${scope.ctrl.isPlay}`);
      this.action_paly.text = newValue ? "暂停" : "播放";
      // if (newValue) {
      //   this.ecOption.baseOption.timeline.controlStyle.playIcon = symbol.timeline.controlStyle.stopIcon;
      // } else {
      //   this.ecOption.baseOption.timeline.controlStyle.playIcon = symbol.timeline.controlStyle.playIcon;
      // }
    });

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));
    this.events.on('refresh', () => {
      /**处理界面切换，弊端会影响播放等待时间 */
      if (this.ecInstance) { this.ecInstance.resize(); }
    });
    // this.events.on('render', () => {
    //   if (this.ecInstance) this.ecInstance.resize();
    // });
    //this.events.on('refresh', this.onRefresh.bind(this));
    //this.events.on('render', this.onRender.bind(this));
    //this.events.on('data-received', this.onDataReceived.bind(this));

    //注册事件
    this.$scope.$on('heatmap', this.heatmapEventHandler.bind(this));
  }

  action_paly = { text: '播放', click: 'ctrl.paly()' };
  onInitPanelActions(actions) {
    actions.push(this.action_paly);
  }

  paly() {
    this.isPlay = !this.isPlay;
    this.ecOption.baseOption.timeline.autoPlay = this.isPlay;
  }

  heatmapEventHandler(event, eventArgs) {
    this.isSelected = eventArgs.isSelected;

    var varPID = _.find(eventArgs.rowVariables, variable => { return variable.name === 'PID'; });
    if (varPID && _.isEmpty(varPID.current.value)) {
      varPID.current = { text: '.', value: '.' };
    }

    this.onRender();
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    this.addEditorTab('Timeline', 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/timeline.html');
    this.addEditorTab('Legend', legendEditorComponent);
    this.editorTabIndex = 1;
  }

  onRefresh() {
    this.render();
  }

  setLegendSelect(value) {
    let variableType = 'custom';

    let currentTitle = { text: value, value: value };
    /**别名 */
    let legend = _.find(this.panel.legend.data, (item) => {
      return item.display === value || item.name === value;
    });
    if (legend) {
      value = legend.name;
      let display = legend.display || legend.name;
      currentTitle = { text: display, value: display };
    }


    let teldCustomModel = { type: variableType, name: this.panel.varMetric };
    let variable = this.getLegendSelect();
    let current = { text: value, value: value };

    if (variable) {

    } else {
      variable = this.variableSrv.addVariable({ type: variableType, canSaved: false });
      variable.hide = 2;
      variable.name = variable.label = teldCustomModel.name;
    }


    this.variableSrv.setOptionAsCurrent(variable, current);

    let legendTitle = this.getLegendSelectTitle();
    this.variableSrv.setOptionAsCurrent(legendTitle, currentTitle);
    this.variableSrv.templateSrv.updateTemplateData();
    this.dashboardSrv.getCurrent().updateSubmenuVisibility();
  }

  getLegendSelect() {
    return this.templateSrv.getVariable(`$${this.panel.varMetric}`, 'custom');
  }

  getLegendSelectTitle() {
    let variableName = `${this.panel.varMetric}Title`;

    let variable = this.getVariableByName(variableName);

    return variable;
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

  legendselectchanged(params) {
    this.setLegendSelect(params.name);

    let selected = _.clone(this.ecOption.baseOption.legend.selected);

    _.forEach(this.ecOption.baseOption.legend.selected, (value, key) => {
      selected[key] = key === params.name;
    });

    this.clearCache();

    this.ecOption.baseOption.legend.selected = selected;
    this.timelinechanged({ currentIndex: this.timelineIndex });
  }

  timelinechanged(params) {
    console.group('timelinechanged');

    this.rangeStringPanel = params.currentIndex;

    console.log(params.currentIndex + '@');
    this.timelineIndex = params.currentIndex;

    // if (this.isPlay) {
    //   this.ecOption.baseOption.timeline.controlStyle.playIcon = symbol.timeline.controlStyle.stopIcon;
    // }
    // this.ecOption.baseOption.timeline.autoPlay = false;

    this.loadCount++;

    let data = this.ecOption.baseOption.timeline.data[params.currentIndex];

    let variableType = 'custom';
    let teldCustomModel = { type: variableType, name: 'timeline' };
    let indexOf = _.findIndex(this.variableSrv.variables, teldCustomModel);
    let variable;
    let current = { text: data, value: data };

    if (indexOf === -1) {
      variable = this.variableSrv.addVariable({ type: variableType, canSaved: false });
      variable.hide = 2;
      variable.name = variable.label = teldCustomModel.name;
    } else {
      variable = this.variableSrv.variables[indexOf];
    }
    variable.current === current;

    this.variableSrv.setOptionAsCurrent(variable, current);
    this.variableSrv.templateSrv.updateTemplateData();
    this.dashboardSrv.getCurrent().updateSubmenuVisibility();


    let isLast = params.currentIndex === this.ecOption.baseOption.timeline.data.length - 1;
    //this.isLoadAllData = this.loadCount >= this.ecOption.baseOption.timeline.data.length;
    this.isLoadAllData = true;
    this.ecOption.options.forEach(item => {
      if (_.isEmpty(item)) {
        this.isLoadAllData = false;
      }
    });

    if (false === this.isLoadAllData) {
      this.ecOption.baseOption.timeline.controlStyle.playIcon = symbol.timeline.controlStyle.stopIcon;
      this.ecOption.baseOption.timeline.autoPlay = false;
      this.onMetricsPanelRefresh2(params.currentIndex).then(() => {
        this.ecOption.baseOption.timeline.controlStyle.playIcon = symbol.timeline.controlStyle.playIcon;
        if (this.isPlay) {
            if (isLast) {
              if (false === this.ecOption.baseOption.timeline.loop) {
                this.isPlay = false;
              } else {
                this.ecOption.baseOption.timeline.autoPlay = true;
              }
            } else {
              this.ecOption.baseOption.timeline.autoPlay = true;
            }
        }
      });
    } else {
      if (isLast && false === this.ecOption.baseOption.timeline.loop) {
        this.isPlay = false;
        /**
        let that = this;
        this.$scope.$apply(function () {
          that.isPlay = false;
        });
         */
      }else{
        if (this.isPlay) {
          this.ecOption.baseOption.timeline.autoPlay = true;
        }
      }
    }

    this.ecOption.baseOption.bmap.center = [this.bmapCL.center.lng, this.bmapCL.center.lat];
    this.ecOption.baseOption.bmap.zoom = this.bmapCL.zoom;
    console.groupEnd();
  }


  private onMetricsPanelRefresh2(params) {
    console.log("onMetricsPanelRefresh2");
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode()) { return; }

    // // ignore if we have data stream
    if (this.dataStream) {
      return;
    }

    // clear loading/error state
    delete this.error;
    this.loading = true;

    this.updateTimeRange();
    let isLast = params.currentIndex === this.ecOption.baseOption.timeline.data.length - 1;
    // load datasource service
    this.setTimeQueryStart();
    return this.datasourceSrv.get(this.panel.datasource)
      .then(this.issueQueries.bind(this))
      .then(this.handleQueryResultWithOutevents.bind(this))
      .catch(err => {
        // if cancelled  keep loading set to true
        if (err.cancelled) {
          console.log('Panel request cancelled', err);
          return;
        }

        this.loading = false;
        this.error = err.message || "Request Error";
        this.inspector = { error: err };
        this.events.emit('data-error', err);
        console.log('Panel data error:', err);
      });
  }

  handleQueryResultWithOutevents(result) {
    this.setTimeQueryEnd();
    this.loading = false;

    // check for if data source returns subject
    if (result && result.subscribe) {
      this.handleDataStream(result);
      return;
    }

    if (this.dashboard.snapshot) {
      this.panel.snapshotData = result.data;
    }

    if (!result || !result.data) {
      console.log('Data source query result invalid, missing data field:', result);
      result = {data: []};
    }

    this.onDataReceived(result.data);
  }

  bmapLocation(params) {
    let { type, target } = params;
    let location = { bounds: target.getBounds(), center: target.getCenter(), zoom: target.getZoom() };
    this.bmapCL = location;
  }

  initEcharts() {
    this.ecConfig = {
      //theme: 'default',
      //theme: config.bootData.user.lightTheme ? 'light' : 'drak',
      theme: 'teld',
      event: [{
        'legendselectchanged': this.legendselectchanged.bind(this),
        'timelinechanged': this.timelinechanged.bind(this),
        'timelineplaychanged': (params) => {
          this.isPlay = params.playState;
          console.log(params.playState);
        }
      }],
      bmap: { event: [{
        'moveend': this.bmapLocation.bind(this),
        'zoomend': this.bmapLocation.bind(this),
      }] },
      dataLoaded: true
    };

    let timelineData = this.timelineDataOpts[this.panel.timelineOptData] || [];

    let timeline = {
      symbol: symbol.timeline.symbol,
      symbolSize: 20,
      bottom: 20,
      controlStyle: {
        show: true,
        showPlayBtn: true,
        showPrevBtn: false,
        showNextBtn: false,
        itemGap: 22,
        playIcon: symbol.timeline.controlStyle.playIcon,
        stopIcon: symbol.timeline.controlStyle.stopIcon,
      },
      checkpointStyle: {
        symbol: symbol.timeline.checkpointStyle
      },
      axisType: 'category',
      data: timelineData,
      autoPlay: false,
      // label: {
      //   formatter: function (s) {
      //     return (new Date(s)).getFullYear();
      //   }
      // }
    };

    let varCityPosition = this.templateSrv.getVariable(`$CityPosition`, "custom");
    let coordinates = varCityPosition.current.value;
    //"china": { g: [116.395645, 39.929986], zoom: 5 },
    let position = { g: [116.395645, 39.929986], zoom: 5 };
    if (false === _.isEmpty(coordinates)) {
      position.g = _.reverse(_.split(coordinates, ',', 2));
      position.zoom = 9;
    }

    // let [lng, lat] = position.g;
    // this.bmapCL.center = { lng, lat };
    this.bmapCL.center = _.zipObject(['lng', 'lat'], position.g);
    this.bmapCL.zoom = position.zoom;
    //this.bmapCL = { center: { lng, lat }, zoom: position.zoom };

    //let c = this.city[cityVar.current.value];

    let confLegend = _.cloneDeep(this.panel.legend.data);

    let legendSelect;

    if (this.ecInstance === undefined) {
      confLegend.forEach(legend => {
        if (legend.selected) {
          legendSelect = legend.name;
          this.setLegendSelect(legend.name);
        }
      });
    } else {
      let varLegendSelect = this.getLegendSelect();
      if (varLegendSelect) {
        legendSelect = varLegendSelect.current.value;
      }
    }


    let legend = {
      padding: 15,
      selectedMode: 'single',
      orient: 'vertical',//horizontal
      // width: 800,
      // height: 500,
      top: 20,
      right: 20,
      data: confLegend.map(legend => {
        return {
          name: legend.display || legend.name,
          icon: legend.icon
        };
      }),
      selected: _.fromPairs(confLegend.map(legend => { return [legend.name, legend.name === legendSelect]; })),
      // align: 'left'
    };

    let heatmapSerie = {
      type: 'heatmap',
      coordinateSystem: 'bmap',
      geoIndex: 1,
      label: {
        normal: {
          show: true
        }
      },
      pointSize: this.panel.heatmap.pointSize,
      blurSize: this.panel.heatmap.blurSize
    };

    let mockLegendSeries = legend.data.map(item => { return { show: false, name: item.name, type: 'bar', data: [] }; });

    let bmap = {
      //center: [120.13066322374, 30.240018034923],
      center: position.g,/*天津 */
      //center: [116.403903, 39.915743],
      zoom: this.bmapCL.zoom,
      //mapStyle: { styleJson: config.bootData.user.lightTheme ?  bmapStyle.light : bmapStyle.drak },
      mapStyle: { styleJson: bmapStyle.default },
      roam: true
    };

    let baseOption = {
      /**关键配置*/
      bmap,
      legend,
      series: [].concat(
        heatmapSerie,
        mockLegendSeries
      ),
      timeline: _.defaults(_.cloneDeep(this.panel.timeline), timeline),
      /***/
      xAxis: {
        show: false
      },
      yAxis: {
        show: false
      },
      tooltip: { trigger: "item", show: true },
      animation: true,
      visualMap: {
        show: false,
        top: 'top',
        seriesIndex: 0,
        calculable: true,
        inRange: {
          color: ['blue', 'blue', 'green', 'yellow', 'red']
        }
      }
    };

    /**
     * 处理黑色背景时间轴播放地图闪烁的问题
     * 2017-07-15@ 次逻辑移动到 onDataReceived(dataList) 方法中效果更好，
     *             第一次时间轴播放也不会闪烁
    if (this.ecInstance) {
      delete baseOption.bmap.mapStyle;
    }
    */

    this.ecOption = {
      baseOption: baseOption,
      options: timelineData.map(item => { return {}; })
    };

    // let bmap = this.getBmap(this.ecInstance);

    // // 创建控件实例
    // var myZoomCtrl = new ZoomControl();
    // // 添加到地图当中
    // bmap.addControl(myZoomCtrl);
  }

  onDataReceived(dataList) {

    if (this.ecInstance) {
      /**
       * 处理黑色背景时间轴播放地图闪烁的问题 */
      delete this.ecOption.baseOption.bmap.mapStyle;
    }
    console.log("onDataReceived");

    let option = this.ecOption.options[this.timelineIndex];
    if (dataList.length > 0) {
      let max = 100;
      let min = 9000000;
      let sum = 0;
      if (false === this.isLoadAllData) {
        option = {
          series: [
            {
              data: dataList[0].datapoints.map(item => {

                let agg = this.panel.targets[0].bucketAggs[0].field;
                let metric = this.panel.targets[0].metrics[0].type;

                let metricValue = item[_.upperFirst(metric)];

                let r = item[agg].split(',');
                r = [parseFloat(r[1]), parseFloat(r[0])];
                r.push(metricValue);
                sum += metricValue;
                if (metricValue > max) {
                  max = metricValue;
                }
                if (metricValue < min && metricValue !== 0) {
                  min = metricValue;
                }
                return r;
              })
            }
          ]
        };
        this.ecOption.baseOption.visualMap.min = min;
        //this.ecOption.baseOption.visualMap.max = sum / dataList[0].datapoints.length * 2;
        this.ecOption.baseOption.visualMap.max = max;
        option.visualMap = _.cloneDeep(this.ecOption.baseOption.visualMap);

      }
    }else{
        option = {
          series: [
            {
              data: []
            }
          ]
        };
    }
    this.ecOption.options[this.timelineIndex] = option;
  }

  clearCache() {
    this.ecOption.options = this.ecOption.baseOption.timeline.data.map(item => { return {}; });
  }

onRender() {
    this.isLoadAllData = false;
    this.isPlay = this.panel.timeline.autoPlay;
    this.timelineIndex = 0;
    this.loadCount = 0;

    if (this.isSelected) {
      this.initEcharts();
      this.timelinechanged({ currentIndex: this.timelineIndex });
    } else {
      this.isPlay = false;
      this.clearCache();
      this.initEcharts();
    }
  }

  onRender2() {
    this.isLoadAllData = false;
    this.isPlay = this.panel.timeline.autoPlay;
    this.timelineIndex = 0;
    this.loadCount = 0;

    if (this.isSelected) {
      this.initEcharts();
      this.timelinechanged({ currentIndex: this.timelineIndex });
    } else {
      this.isPlay = false;
      if (this.ecInstance) {
        // this.ecInstance.dispatchAction({
        //   type: 'timelinePlayChange',
        //   // 播放状态，true 为自动播放
        //   playState: this.isPlay
        // });
        // this.clearCache();
        this.initEcharts();
      }else{
        this.initEcharts();
      }
    }
  }
}
