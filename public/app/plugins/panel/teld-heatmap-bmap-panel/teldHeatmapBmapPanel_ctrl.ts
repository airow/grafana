///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import { PanelCtrl } from 'app/plugins/sdk';
import appEvents from 'app/core/app_events';
import echarts from 'echarts';
import './eventHandler_srv';

export class TeldHeatmapBmapPanelCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  isloaded = true;

  ecInstance: echarts.ECharts;
  ecConfig: any;
  ecOption: any;

  currentEvent: any;
  watchEvents: any[];

  sgConfig: any;
  isPlay: Boolean;
  isLoadAllData: Boolean;
  timelineIndex: any;
  loadCount: any;

  // Set and populate defaults
  panelDefaults = {
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
  constructor($scope, $injector, private templateSrv, private $sce, private $rootScope, private timeSrv,
    private variableSrv, private dashboardSrv, private uiSegmentSrv, private datasourceSrv, private $http) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.isPlay = this.panel.timeline.autoPlay;
    this.isLoadAllData = false;

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));

    this.sgConfig = {
      sgUrl: function () {
        return "/public/mockJson/hangzhou-tracks.json";
      }
    };

    //注册事件
    this.watchEvents = this.panel.watchEvents;
    this.watchEvents.forEach(element => {
      this.$scope.$on(element.name, this.watchEventHandler.bind(this));
    });
  }

  watchEventHandler(event, eventArgs) {
    //$injector.get(eve)

    let watchEvent = _.find(this.watchEvents, { name: event.name });

    let eventHandlerSrv = this.$injector.get('heatmapEventHandlerSrv');

    let config = {};

    watchEvent.methodArgs.forEach(element => {
      config[element.key] = element.value;
    });

    this.sgConfig = eventHandlerSrv[watchEvent.method](eventArgs, config, this);
    console.log(eventArgs);
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
    //this.addEditorTab('Options', 'partials/editor.html');
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/editor.html');
    this.addEditorTab('Timeline', 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/timeline.html');
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

  timelinechanged(params) {
    console.group('timelinechanged');

    console.log(params.currentIndex + '@');
    this.timelineIndex = params.currentIndex;
    this.ecOption.baseOption.timeline.autoPlay = false;
    this.loadCount++;

    let isLast = params.currentIndex === this.ecOption.baseOption.timeline.data.length - 1;
    this.isLoadAllData = this.loadCount >= this.ecOption.baseOption.timeline.data.length;
    if (false === this.isLoadAllData) {
      this.callSG(params.currentIndex).then(() => {
        if (this.isPlay) {
          if (isLast) {
            if (false === this.ecOption.baseOption.timeline.loop) {
              this.isPlay = false;
            }else{
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
      }
    }
    console.groupEnd();
  }
  initEcharts() {
    this.ecConfig = {
      theme: 'default',
      event: [{
        'timelinechanged': this.timelinechanged.bind(this),
        'timelineplaychanged': (params) => {
          console.group('timelineplaychanged');
          console.log(`${params.playState}=${this.ecOption.baseOption.timeline.autoPlay}`);
          console.groupEnd();
        }
      }],
      dataLoaded: true
    };

    let timelineData = [
      '2002-01-01', '2003-01-01', '2004-01-01',
      {
        value: '2005-01-01',
        tooltip: {
          formatter: '{b} GDP达到一个高度'
        },
        symbol: 'diamond',
        symbolSize: 16
      },
      '2006-01-01', '2007-01-01', '2008-01-01', '2009-01-01', '2010-01-01',
      {
        value: '2011-01-01',
        tooltip: {
          formatter: function (params) {
            return params.name + 'GDP达到又一个高度';
          }
        },
        symbol: 'diamond',
        symbolSize: 18
      },
    ];

    let timeline = {
      controlStyle: {
        show: true,
        showPlayBtn: false
      },
      axisType: 'category',
      data: timelineData,
      autoPlay: false,
      label: {
        formatter: function (s) {
          return (new Date(s)).getFullYear();
        }
      }
    };
    this.ecOption = {
      baseOption: {
        timeline: _.defaults(_.cloneDeep(this.panel.timeline), timeline),
        //timeline: timeline,
        tooltip: { trigger: "item", show: true },
        animation: true,
        bmap: {
          center: [120.13066322374, 30.240018034923],
          zoom: 14,
          roam: true
        },
        visualMap: {
          show: true,
          top: 'top',
          min: 0,
          max: 10,
          seriesIndex: 0,
          calculable: true,
          inRange: {
            color: ['blue', 'blue', 'green', 'yellow', 'red']
          }
        },
        series: [{
          type: 'heatmap',
          coordinateSystem: 'bmap',
          geoIndex: 1,
          label: {
            normal: {
              show: true
            }
          },
          pointSize: 5,
          blurSize: 6
        }]
      },
      options: timelineData.map(item => { return {}; })
    };
  }

  loadData() {
    this.initEcharts();

    this.callSG(this.timelineIndex);
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
            //title: { text: '2002全国宏观经济指标' },
            series: [
              {
                data: [].concat.apply([], response.data.map(function (track) {
                  return track.map(function (seg) {
                    return seg.coord.concat([timelineIndex + 1]);
                  });
                }))
              }
            ]
          };
          this.ecOption.options[timelineIndex] = option;
        }
      },
      response => {
        console.log(response);
      },
    );
  }

  onRender() {
    this.isLoadAllData = false;
    this.isPlay = this.panel.timeline.autoPlay;
    this.timelineIndex = 0;
    this.loadCount = 0;
    this.loadData();
  }
}
