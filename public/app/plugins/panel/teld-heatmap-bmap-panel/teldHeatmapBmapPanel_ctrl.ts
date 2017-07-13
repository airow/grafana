///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />

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
import bmapStyle from './bmapStyle';

export class TeldHeatmapBmapPanelCtrl extends MetricsPanelCtrl {
  static templateUrl = `partials/module.html`;

  isloaded = true;

  ecInstance: echarts.ECharts;
  ecConfig: any;
  ecOption: any;

  currentEvent: any;
  watchEvents: any[];

  city: any;

  sgConfig: any;
  isPlay: Boolean;
  isLoadAllData: Boolean;
  timelineIndex: any;
  loadCount: any;
  isSelected: Boolean;

  timelineDataOpts: any;

  // Set and populate defaults
  panelDefaults = {
    legend: {
      data: []
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

    this.isPlay = this.panel.timeline.autoPlay;
    this.isLoadAllData = false;
    this.isSelected = false;

    this.timelineDataOpts = { "每小时": [] };
    //this.timelineDataOpts = { "每2小时": [] };
    for (var index = 0; index < 24; index++) {
      this.timelineDataOpts["每小时"].push(`${index}`);
    }

    this.city = {
      "china": { g: [116.395645, 39.929986], zoom: 5 },
      "北京": { g: [116.395645, 39.929986], zoom: 12 },
      "天津": { g: [117.210813, 39.14393], zoom: 12 },
      "河北": { g: [115.661434, 38.61384], zoom: 7 },
      "山西": { g: [112.515496, 37.866566], zoom: 7 },
    };

    this.action_paly.text = this.isPlay ? "暂停" : "播放";

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));
    //this.events.on('refresh', this.onRefresh.bind(this));
    //this.events.on('render', this.onRender.bind(this));
    //this.events.on('data-received', this.onDataReceived.bind(this));

    //this.initEcharts();

    this.sgConfig = {
      sgUrl: function () {
        return "/public/mockJson/hangzhou-tracks.json";
      },
      positioning: function (echartsInstance, center, zoom?) {
        let bmap = echartsInstance.getModel().getComponent('bmap');
        if (bmap) {
          bmap = bmap.getBMap();
          //bmap.centerAndZoom(center, zoom);
        }
      },
      transform: function (data, context) {
        return [].concat.apply([], data.map(function (track) {
          return track.map(function (seg) {
            return seg.coord.concat([context.timelineIndex + 1]);
          });
        }));
      }
    };

    //注册事件
    this.watchEvents = this.panel.watchEvents;
    this.watchEvents.forEach(element => {
      this.$scope.$on(element.name, this.watchEventHandler.bind(this));
    });
  }

  action_paly = { text: '播放', click: 'ctrl.paly()' };
  onInitPanelActions(actions) {
    //actions.push({ text: '最小化', click: 'ctrl.min()' });
    actions.push(this.action_paly);
  }

  paly() {
    this.isPlay = !this.isPlay;
    this.ecOption.baseOption.timeline.autoPlay = this.isPlay;
    this.action_paly.text = this.isPlay ? "暂停" : "播放";
  }

  getBmap(echartsInstance) {
    let bmap = echartsInstance.getModel().getComponent('bmap');
    if (bmap) {
      bmap = bmap.getBMap();
    }

    return bmap;
  }

  watchEventHandler(event, eventArgs) {
    //$injector.get(eve)

    let watchEvent = _.find(this.watchEvents, { name: event.name });

    let eventHandlerSrv = this.$injector.get('heatmapEventHandlerSrv');

    let config = {};
    this.isSelected = eventArgs.isSelected;
    watchEvent.methodArgs.forEach(element => {
      config[element.key] = element.value;
    });

    this.sgConfig = eventHandlerSrv[watchEvent.method](eventArgs, config, this);
    console.group('watchEventHandler');
    this.onRender();
    console.groupEnd();
  }

  add() {
    this.currentEvent = { methodArgs: [{}] };
    this.watchEvents.push(this.currentEvent);
  }

  remove(watchEvent) {
    var index = _.indexOf(this.watchEvents, watchEvent);
    this.watchEvents.splice(index, 1);
    this.panel.Variables = this.watchEvents;
  }

  addMethodArg(watchEvent) {
    watchEvent.methodArgs = watchEvent.methodArgs || [];
    watchEvent.methodArgs.push({});
  }

  removeMethodArg(methodArgs, arg) {
    var index = _.indexOf(methodArgs, arg);
    methodArgs.splice(index, 1);
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    this.addEditorTab('Timeline', 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/timeline.html');
    this.addEditorTab('Legend', legendEditorComponent);
    this.addEditorTab('watchEvents', 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/watchEvents.html');
    this.editorTabIndex = 1;
  }

  onRefresh() {
    this.render();
  }

  genJJ() {
    let returnValue = this.sgConfig.sgUrl();
    // let returnValue = '/public/mockJson/hangzhou-tracks.json';
    // let variable = this.templateSrv.getVariable("$code", 'custom');
    // // if (variable && variable.current && variable.current.value) {
    // //   returnValue = `/public/mockJson/tracks-${variable.current.value}.json`;
    // // }
    return returnValue;
  }

  setLegendSelect(value) {
    let variableType = 'custom';
    let teldCustomModel = { type: variableType, name: 'fff' };
    let variable = this.getLegendSelect();
    let current = { text: value, value: value };

    if (variable) {

    } else {
      variable = this.variableSrv.addVariable({ type: variableType, canSaved: false });
      variable.hide = 2;
      variable.name = variable.label = teldCustomModel.name;
    }
    variable.current === current;

    this.variableSrv.setOptionAsCurrent(variable, current);
    this.variableSrv.templateSrv.updateTemplateData();
    this.dashboardSrv.getCurrent().updateSubmenuVisibility();
  }

  getLegendSelect() {
    return this.templateSrv.getVariable("$fff", 'custom');
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
    this.ecOption.baseOption.timeline.autoPlay = false;
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
      this.onMetricsPanelRefresh2(params.currentIndex).then(() => {
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
        //this.isPlay = false;
        let that = this;
        this.$scope.$apply(function () {
          that.isPlay = false;
        });
      }else{
        if (this.isPlay) {
          this.ecOption.baseOption.timeline.autoPlay = true;
        }
      }
    }
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

  initEcharts() {
    this.ecConfig = {
      theme: 'default',
      event: [{
        'legendselectchanged': this.legendselectchanged.bind(this),

        'timelinechanged': this.timelinechanged.bind(this),
        'timelineplaychanged': (params) => {
          // console.group('timelineplaychanged');
          // console.log(`${params.playState}=${this.ecOption.baseOption.timeline.autoPlay}`);
          // console.groupEnd();
        }
      }],
      dataLoaded: true
    };

    let timelineData = [
      '北京市',
      '青岛市',
      '天津市',
      '上海市',
      '重庆市',
      '杭州市',
      '武汉市',
      '深圳市',
      '广州市'
      // '天津市', '北京市', '青岛市', {
      //   value: '上海市'
      // }
    ];

    timelineData = this.timelineDataOpts[this.panel.timelineOptData] || timelineData;

    // for (var i = 0; i < 24; i++) {
    //   var day = i + 5;
    //   timelineData.push(`2017070${day}`);
    // }

    let timeline = {
      controlStyle: {
        show: true,
        showPlayBtn: false
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

    let cityVar = this.templateSrv.getVariable(`$name`, "custom");

    let c = this.city[cityVar.current.value];

    //let confLegend = [{ name: '总电量', selected: false }, { name: '快充收入(元)', selected: true }];
    let confLegend = _.cloneDeep(this.panel.legend.data);

    let legendSelect;

    let bmap;

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
      selectedMode: 'single',
      data: confLegend.map(legend => { return legend.name; }),
      selected: _.fromPairs(confLegend.map(legend => { return [legend.name, legend.name === legendSelect]; })),
      align: 'left'
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
      pointSize: 20,
      blurSize: 20
    };


    let mockLegendSeries = legend.data.map(item => { return { show: false, name: item, type: 'bar', data: [] }; });

    let baseOption = {
      legend: legend,
      xAxis: {
        show: false
      },
      yAxis: {
        show: false
      },
      timeline: _.defaults(_.cloneDeep(this.panel.timeline), timeline),
      tooltip: { trigger: "item", show: true },
      animation: true,
      visualMap: {
        show: true,
        top: 'top',
        seriesIndex: 0,
        calculable: true,
        inRange: {
          color: ['blue', 'blue', 'green', 'yellow', 'red']
        }
      },
      bmap: {
        //center: [120.13066322374, 30.240018034923],
        center: c.g,/*天津 */
        //center: [116.403903, 39.915743],
        zoom: c.zoom,
        mapStyle: { styleJson: bmapStyle.drak },
        roam: true
      },
      series: [].concat(
        heatmapSerie,
        mockLegendSeries
      )
    };


    if (this.ecInstance) {
      /*处理黑色背景时间轴播放地图闪烁的问题*/
      delete baseOption.bmap.mapStyle;
    }

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

  loadData() {
    this.initEcharts();
  }

  callSG(timelineIndex: any) {

    timelineIndex = timelineIndex || 0;

    //let timeline = this.ecInstance.getOption().timeline[timelineIndex];
    //let tlData = timeline.data[timelineIndex];
    //console.log(tlData);

    return this.$http.get(this.genJJ()).then(
      response => {
        let option = this.ecOption.options[timelineIndex];
        if (false === this.isLoadAllData) {
          option = {
            series: [
              {
                data: this.sgConfig.transform(response.data, { timelineIndex })
              }
            ]
          };
          this.ecOption.options[timelineIndex] = option;
        }
      },
      response => {
        this.ecInstance.clear();
        console.log(response);
      },
    );
  }

  onDataReceived(dataList) {
    console.log("onDataReceived");
    if (dataList.length > 0) {
      let option = this.ecOption.options[this.timelineIndex];
      let max = 100;
      let min = 9000000;
      let sum = 0;
      if (false === this.isLoadAllData) {
        let he = [];
        option = {
          series: [
            {
              data: dataList[0].datapoints.map(item => {
                let r = item["电站位置"].split(',');
                r = [parseFloat(r[1]), parseFloat(r[0])];
                r.push(item.Sum);
                sum += item.Sum;
                //r = [120.13066322374 + this.timelineIndex, 30.240018034923 + this.timelineIndex, item.Sum];
                //r = [120.13066322374, 30.240018034923, (item.Sum + 1) * this.timelineIndex];
                //r = [120.13066322374, 30.240018034923, item.Sum];
                //console.log(r);
                he.push({ "lat": parseFloat(r[1]), "lng": parseFloat(r[0]), "count": item.Sum });
                if (item.Sum > max) {
                  max = item.Sum;
                }
                if (item.Sum < min) {
                  min = item.Sum;
                }
                return r;
              })
            }
          ]
        };
         this.ecOption.baseOption.visualMap.min = min;
         this.ecOption.baseOption.visualMap.max = sum / dataList[0].datapoints.length * 2;
         //console.log(JSON.stringify(he));
        option.visualMap = _.cloneDeep(this.ecOption.baseOption.visualMap);
        // option.visualMap.min = min;
        // option.visualMap.max = 1000;
        this.ecOption.options[this.timelineIndex] = option;
      }
    }
  }

  clearCache() {
    this.ecOption.options = this.ecOption.baseOption.timeline.data.map(item => {
      return {
        series: [
          {
            data: []
          }
        ]
      };
    });
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
      if (this.ecInstance) {
        this.clearCache();
        //this.ecInstance.clear();
      }else{
        this.initEcharts();
      }
    }
  }
}
