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

    this.echartsContainer = `${this.panel.type}-${this.panel.id}`;

    // this.ecConfig = {
    //   theme: 'default',
    //   event: [{
    //     'timelinechanged': function () { alert(1); },
    //     'click': function () { alert('click'); }
    //   }],
    //   dataLoaded: true
    // };

    // this.ecOption = {
    //   title: {
    //     text: '未来一周气温变化(5秒后自动轮询)',
    //     subtext: '纯属虚构'
    //   },
    //   tooltip: {
    //     trigger: 'axis'
    //   },
    //   legend: {
    //     data: ['最高气温', '最低气温']
    //   },
    //   toolbox: {
    //     show: true,
    //     feature: {
    //       mark: { show: true },
    //       dataView: { show: true, readOnly: false },
    //       magicType: { show: true, type: ['line', 'bar'] },
    //       restore: { show: true },
    //       saveAsImage: { show: true }
    //     }
    //   },
    //   calculable: true,
    //   xAxis: [
    //     {
    //       type: 'category',
    //       boundaryGap: false,
    //       data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    //     }
    //   ],
    //   yAxis: [
    //     {
    //       type: 'value',
    //       axisLabel: {
    //         formatter: '{value} °C'
    //       }
    //     }
    //   ],
    //   series: [
    //     {
    //       name: '最高气温',
    //       type: 'line',
    //       data: [11, 11, 15, 13, 12, 13, 10],
    //       markPoint: {
    //         data: [
    //           { type: 'max', name: '最大值' },
    //           { type: 'min', name: '最小值' }
    //         ]
    //       },
    //       markLine: {
    //         data: [
    //           { type: 'average', name: '平均值' }
    //         ]
    //       }
    //     },
    //     {
    //       name: '最低气温',
    //       type: 'line',
    //       data: [1, -2, 2, 5, 3, 2, 0],
    //       markPoint: {
    //         data: [
    //           { name: '周最低', value: -2, xAxis: 1, yAxis: -1.5 }
    //         ]
    //       },
    //       markLine: {
    //         data: [
    //           { type: 'average', name: '平均值' }
    //         ]
    //       }
    //     }
    //   ]
    // };

    let that = this;

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
  /**/}

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

  onRender3() {
    //this.datasource = this.panel.datasource;
    let data = [[{
      "coord": [120.14322240845, 30.236064370321],
      "elevation": 21
    }, {
      "coord": [120.14280555506, 30.23633761213],
      "elevation": 5
    }, {
      "coord": [120.14307598649, 30.236125905084],
      "elevation": 30.7
    }, {
      "coord": [120.14301682797, 30.236035316745],
      "elevation": 15.4
    }, {
      "coord": [120.1428734612, 30.236160551632],
      "elevation": 1.6
    }, {
      "coord": [120.14200215328, 30.23595702204],
      "elevation": 8.9
    }]];
    let points = [].concat.apply([], data.map(function (track) {
      return track.map(function (seg) {
        return seg.coord.concat([1]);
      });
    }));



    let dom;
    dom = document.getElementById("container");
    var myChart = echarts.init(dom);
    let option = {
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
        animation: true,
        bmap: {
          //center: [120.13066322374, 30.240018034923],
          center: [103.855096, 36.056805],
          zoom: 6,
          roam: true,
          label: {
            normal: {
              show: true
            }
          },
          pointSize: 5,
          blurSize: 6
        }
      },
      options: [
        {
          title: { text: '2002全国宏观经济指标' },
          series: [
            { data: points }//{data: dataMap.dataGDP['2002']}
          ]
        },
        {
          title: { text: '2003全国宏观经济指标' },
          series: [
            {
              data: [].concat.apply([], data.map(function (track) {
                return track.map(function (seg) {
                  return seg.coord.concat([seg.elevation]);
                });
              }))
            }//{data: dataMap.dataGDP['2003']}
          ]
        },
        {
          title: { text: '2004全国宏观经济指标' },
          series: [
            { data: points }//{data: dataMap.dataGDP['2004']}
          ]
        },
        {
          title: { text: '2005全国宏观经济指标' },
          series: [
            { data: points }//{data: dataMap.dataGDP['2005']}
          ]
        },
        {
          title: { text: '2006全国宏观经济指标' },
          series: [
            { data: points }//{data: dataMap.dataGDP['2006']}
          ]
        },
        {
          title: { text: '2007全国宏观经济指标' },
          series: [
            { data: points }//{data: dataMap.dataGDP['2007']}
          ]
        },
        {

        },
        {

        },
        {

        }
      ]
    };

    myChart.setOption(option, true);

    this.renderingCompleted();
  }

  onRender6() {

    if (!this.myChart) {
      let dom;
      dom = document.getElementById("container");
      this.myChart = echarts.init(dom);
    }
    var option = {
      title: {
        text: 'ECharts 入门示例'
      },
      tooltip: {},
      legend: {
        data: ['销量']
      },
      xAxis: {
        data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"]
      },
      yAxis: {},
      series: [{
        name: '销量',
        type: 'bar',
        data: [5, 20, 36, 10, 10, 20]
      }]
    };
    this.myChart.setOption(option);
    this.renderingCompleted();
  }

  onRender_OK() {
    let that = this;
    this.$http.get('/public/mockJson/lines-bus.json')
      .then(function successCallback(response) {
        console.log(response);

        var busLines = [].concat.apply([], response.data.map(function (busLine, idx) {
          var prevPt;
          var points = [];
          for (var i = 0; i < busLine.length; i += 2) {
            var pt = [busLine[i], busLine[i + 1]];
            if (i > 0) {
              pt = [
                prevPt[0] + pt[0],
                prevPt[1] + pt[1]
              ];
            }
            prevPt = pt;

            points.push([pt[0] / 1e4, pt[1] / 1e4]);
          }
          return {
            coords: points
          };
        }));


        if (!that.myChart) {
          let dom;
          dom = document.getElementById("container");
          that.myChart = echarts.init(dom);
        }

        var option = {
          bmap: {
            center: [116.46, 39.92],
            zoom: 10,
            roam: true
          },
          series: [{
            type: 'lines',
            coordinateSystem: 'bmap',
            polyline: true,
            data: busLines,
            silent: true,
            lineStyle: {
              normal: {
                color: '#c23531',
                opacity: 0.2,
                width: 1
              }
            },
            progressiveThreshold: 500,
            progressive: 200
          }]
        };
        that.myChart.setOption(option);
        that.renderingCompleted();

      }, function errorCallback(response) {
        console.log(response);
      });
  }

  onRenderddd(){
    let that = this;
    this.$http.get('/public/mockJson/hangzhou-tracks.json')
      .then(function successCallback(response) {
        console.log(response);

        var points = [].concat.apply([], response.data.map(function (track) {
          return track.map(function (seg) {
            return seg.coord.concat([1]);
          });
        }));


        if (!that.myChart) {
          let dom;
          dom = document.getElementById("container");
          that.myChart = echarts.init(dom);
          that.myChart.on('timelinechanged', function (params, paramB) {
            //debugger;
            console.log(params);
            console.log(this.getOption().timeline[0].data[params.currentIndex]);
            //this.getOption().series[0].data = heatData;
            //option.options[params.currentIndex].series[0].data=heatData;

            var bmap = this.getModel().getComponent('bmap').getBMap();
            //alert(bmap.getZoom());

            let opt = that.heatmapOpt.options[params.currentIndex];
            if (opt === undefined) {
              opt = {
                title: { text: '2002全国宏观经济指标' },
                series: [
                  {
                    data: [].concat.apply([], response.data.map(function (track) {
                      return track.map(function (seg) {
                        //return seg.coord.concat([1 * params.currentIndex * 10]);
                        return seg.coord.concat([params.currentIndex+1]);
                        //return [120.14322240845, 30.236064370321, 2];
                      });
                    })) }//{data: dataMap.dataGDP['2002']}
                ]
              };
              that.heatmapOpt.options.push(opt);
            }

            //that.heatmapOpt.options[params.currentIndex].series[0].data = points;
            this.setOption({
              options: that.heatmapOpt.options
            });

            /*
            区 2公里 lv.8
            市 5公里 lv.9
            省 50公里 lv.13
            中国 500公里 lv.16 200公里 lv.15
            */

            /*
            this.dispatchAction({
              type: 'timelinePlayChange',
              // 播放状态，true 为自动播放
              playState: false
            });
            setTimeout("myChart.dispatchAction({type: 'timelinePlayChange',playState: true})",1000*5)
            */
          });

        }

        that.heatmapOpt = {
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
        that.myChart.setOption(that.heatmapOpt);
        that.renderingCompleted();

      }, function errorCallback(response) {
        console.log(response);
      });

    if (this.myChart) {
      this.myChart.resize();
    }
  }

  onRender(){
    //this.ecInstance.resize();
    //this.ecOption.ff = !this.ecOption.ff;
  }
}
