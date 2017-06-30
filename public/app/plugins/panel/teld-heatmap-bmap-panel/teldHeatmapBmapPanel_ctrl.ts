///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import { PanelCtrl } from 'app/plugins/sdk';
import appEvents from 'app/core/app_events';
import echarts from 'echarts';
import 'echarts.bmap';

export class TeldHeatmapBmapPanelCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  isloaded = true;
  src: string;
  datasource: string;
  style: any;
  myChart: echarts.ECharts;
  heatmapOpt: any;

  echartsContainer: string;

  ecInstance: echarts.ECharts;
  ecConfig: any;
  ecOption: any;

  // Set and populate defaults
  panelDefaults = {
    iframeWidth: '100%',
    iframeHeight: '100%',
    src: 'about:bank',
    staticPage: false,
    staticPageSrc: 'about:bank'
  };

  /** @ngInject **/
  constructor($scope, $injector, private templateSrv, private $sce, private $rootScope, private timeSrv,
    private variableSrv, private dashboardSrv, private uiSegmentSrv, private datasourceSrv, private $http) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));

  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    //this.addEditorTab('Options', 'partials/editor.html');
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-heatmap-bmap-panel/partials/editor.html');
    this.editorTabIndex = 1;
  }

  onRefresh() {
    this.render();
  }

  loadData2() {
    this.$http.get('/public/mockJson/hangzhou-tracks.json')
      .then(response => {
        console.log(response);

        var points = [].concat.apply([], response.data.map(function (track) {
          return track.map(function (seg) {
            return seg.coord.concat([1]);
          });
        }));

        this.ecConfig = {
          theme: 'default',
          event: [{
            'timelinechanged': function () { alert(1); },
            'click': function () { alert('click'); }
          }],
          dataLoaded: true
        };

        this.ecOption = {
          baseOption: {
            timeline: {
              controlStyle: {
                show: true
              },
              // y: 0,
              axisType: 'category',
              // realtime: false,
              loop: false,
              autoPlay: false,
              // currentIndex: 2,
              playInterval: 1000,
              // controlStyle: {
              //     position: 'left'
              // },
              data: [
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
              ],
              label: {
                formatter: function (s) {
                  return (new Date(s)).getFullYear();
                }
              }
            },
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
              data: points,
              label: {
                normal: {
                  show: true
                }
              },
              pointSize: 5,
              blurSize: 6
            }]
          },
          options: [
            {
              title: { text: '2002全国宏观经济指标' },
              series: [
                { data: points }//{data: dataMap.dataGDP['2002']}
              ]
            }
          ]
        };

      }, function errorCallback(response) {
        console.log(response);
      });

  }

  genJJ() {
    let variable = this.templateSrv.getVariable("$code", 'custom');
    let returnValue = '/public/mockJson/hangzhou-tracks.json';
    // if (variable && variable.current && variable.current.value) {
    //   returnValue = `/public/mockJson/tracks-${variable.current.value}.json`;
    // }
    return returnValue;
  }

  timelinechanged(params) {
    console.log(params.currentIndex);
    this.ecInstance.dispatchAction({type: 'timelinePlayChange',playState: false});

    this.callSG(params.currentIndex).then(() => {
      this.ecOption.baseOption.timeline.autoPlay = true;
    });
  }
  init() {
    this.ecConfig = {
      theme: 'default',
      event: [{
        'timelinechanged': this.timelinechanged.bind(this)
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

    this.ecOption = {
      baseOption: {
        timeline: {
          controlStyle: {
            show: true
          },
          // y: 0,
          axisType: 'category',
          // realtime: false,
          loop: false,
          autoPlay: false,
          // currentIndex: 2,
          playInterval: 1000,
          // controlStyle: {
          //     position: 'left'
          // },
          data: timelineData,
          label: {
            formatter: function (s) {
              return (new Date(s)).getFullYear();
            }
          }
        },
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
    this.init();

    this.callSG(0);
  }

  callSG(timelineIndex: any) {

    timelineIndex = timelineIndex || 0;

    //let timeline = this.ecInstance.getOption().timeline[timelineIndex];
    //let tlData = timeline.data[timelineIndex];
    //console.log(tlData);

    return this.$http.get(this.genJJ()).then(
      response => {

        this.ecOption.options[timelineIndex] = {
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
      },
      response => {
        console.log(response);
      },
    );
  }

  onRender() {
    this.loadData();
  }
}
