define([
  // 'jquery',
  'lodash'
],
  function (_) {
    'use strict';

    var dynamicCond = {
      _: _,
      InterfaceLogic: {

        CarModelVS: {
          _: "Grafana车型对比功能 产品特性 649337",
          trend: function (option, dashboard, _) {
            /** 趋势图 */
            // debugger;
            if (dashboard.ShadowContainerRow && _.isEmpty(option) === false) {
              option.yAxis = _.isArray(option.yAxis) ? option.yAxis : [option.yAxis];
              var yAxisIndexMap = _.transform(option.yAxis, function (result, value, index) {
                result[value.key] = index;
              }, {});

              console.log(yAxisIndexMap);

              var panels = dashboard.ShadowContainerRow.panels;
              _.each(panels, function (panel, index) {

                var serie = option.series[index];
                var legend = option.legend.data[index];

                legend.name = serie.name = panel.dynamCondTitle;

                var dynamCondAttachYAxis = _.get(panel, 'dynamCondRT.AttachYAxis', false);
                if (dynamCondAttachYAxis) {
                  if (false === _.has(yAxisIndexMap, dynamCondAttachYAxis)) {
                    var lastYAxis = _.last(option.yAxis);
                    lastYAxis = _.cloneDeep(lastYAxis);
                    lastYAxis.position = 'right';
                    lastYAxis.offset = (lastYAxis.offset || 0) + (50 * (lastYAxis.offset ? 1 : 0));
                    option.yAxis.push(lastYAxis);
                    yAxisIndexMap[dynamCondAttachYAxis] = _.size(option.yAxis) - 1;
                  }
                  serie.yAxisIndex = yAxisIndexMap[dynamCondAttachYAxis] || 0;
                }
              });
            }

            return option;

          },
          distribution: function (option, dashboard, originaldataList, _) {
            /** 分布图 */
            if (dashboard.ShadowContainerRow && _.isEmpty(option) === false) {
              option.yAxis = _.isArray(option.yAxis) ? option.yAxis : [option.yAxis];
              var yAxisIndexMap = _.transform(option.yAxis, function (result, value, index) {
                result[value.key] = index;
              }, {});
              // debugger;

              var seriesData = [];
              var legendData = [];

              var refIdArray = _.groupBy(originaldataList, 'refId');
              refIdArray = _.map(refIdArray, function (item, key) { return _.split(key, '_')[2]; });

              var panels = dashboard.ShadowContainerRow.panels;
              var index = 0;
              _.each(panels, function (panel, panelIndex) {
                var serie = {
                  type: 'line', data: _.map(option.xAxis.data, function () {
                    return {
                      value: 0,
                      itemStyle: { normal: { color: option.color[panelIndex] } }
                    };
                  })
                };
                var legend = {};
                var isInclude = _.includes(refIdArray, panel.dynamCondTitle);
                if (isInclude) {
                  serie = option.series[index];
                  legend = option.legend.data[index];

                  var dynamCondAttachYAxis = _.get(panel, 'dynamCondRT.AttachYAxis', false);
                  if (dynamCondAttachYAxis) {
                    if (false === _.has(yAxisIndexMap, dynamCondAttachYAxis)) {
                      var lastYAxis = _.last(option.yAxis);
                      lastYAxis = _.cloneDeep(lastYAxis);
                      lastYAxis.position = 'right';
                      lastYAxis.offset = (lastYAxis.offset || 0) + (50 * (lastYAxis.offset ? 1 : 0));
                      option.yAxis.push(lastYAxis);
                      yAxisIndexMap[dynamCondAttachYAxis] = _.size(option.yAxis) - 1;
                    }
                    serie.yAxisIndex = yAxisIndexMap[dynamCondAttachYAxis] || 0;
                  }

                  serie.type = 'line';
                  _.each(serie.data, function (itemDate) { _.set(itemDate, 'itemStyle.normal.color', option.color[panelIndex]); });
                  //_.set(serie,'data[].textStyle.color',option.color[panelIndex]);
                  index++;
                }
                legend.name = serie.name = panel.dynamCondTitle;
                _.set(serie, 'itemStyle.normal.color', option.color[panelIndex]);
                _.set(legend, 'textStyle.color', option.color[panelIndex]);
                //if (isInclude )
                {
                  seriesData.push(serie);
                  legendData.push(legend);
                }
              });

              option.series = seriesData;
              option.legend.data = legendData;
            }
            return option;
          }
        },

        Terms2FieldsBarStack: {
          _: "ES2个字段Group分组堆叠图",
          exec: function ddd(originalOpt, originaldataList, group1WithAxis, group2, reverse) {
            var legendConf = _.uniq(_.map(originaldataList, "props." + group2));
            var data = _.transform(_.groupBy(originaldataList, 'props.' + group1WithAxis), function (result, value, key) {
              var vc = (result[key] || (result[key] = _.zipObject(legendConf, new Array(legendConf.length).fill(0))), result[key]);
              _.each(value, function (valItem) {
                vc[valItem.props[group2]] = valItem.datapoints[0][0];
              });
            }, {});

            originalOpt.series = [];
            _.each(legendConf, function (val) {
              var serie = {
                "label": {
                  "normal": {
                    "position": ["50%", "35%"],
                    "color": '#fff',
                    "show": true
                  }
                },
                "type": "bar",
                "stack": "stack",
                "name": val,
                data: _.map(data, function (dataItem) {
                  return {
                    value: dataItem[val] === 0 ? null : dataItem[val]
                  };
                })
              };
              if (reverse) {
                serie.data = _.reverse(serie.data);
              }
              originalOpt.series.push(serie);
            });

            originalOpt.yAxis.data = _.keys(data);
            if (reverse) {
              originalOpt.yAxis.data = _.reverse(originalOpt.yAxis.data);
            }
            originalOpt.legend.data = _.map(originalOpt.series, 'name');

            originalOpt.series.push({
              "label": {
                "normal": {
                  "position": ['100%', '100%'],
                  "show": true
                }
              },
              barWidth: '5',
              //itemStyle:{normal:{color:'transparent'}},
              barGap: '-100%',
              "type": "bar",
              "name": '总数',
              data: _.map(originalOpt.yAxis.data, function (item) {
                return {
                  value: _.sum(_.values(data[item]))
                };
              })
            });

            originalOpt.legend.data.push('总数');

            // originalOpt.yAxis.data = _.reverse(originalOpt.yAxis.data);

            return originalOpt;
          }
        }
      }
    };

    return dynamicCond;
  });
