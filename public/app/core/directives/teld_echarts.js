define([
  'jquery',
  'angular',
  'lodash',
  'echarts',
  'echarts.bmap',
  '../core_module',
  'app/core/app_events'
],
  function ($, angular, _, echarts, ecBmap, coreModule, appEvents) {
    'use strict';

    coreModule.default.directive('teldEcharts', function () {
      return {
        link: function (scope, element) {
          function refreshChart() {

            var firstInit = false;
            var theme = (scope.config && scope.config.theme)
              ? scope.config.theme : 'default';

            var ecContainer = element.find(".ecContainer");
            if (ecContainer.length === 0) {
              ecContainer = $('<div class="ecContainer" style="height:100%;">');
              element.append(ecContainer);
            }
            if (scope.instance) {
              console.log('scope.instance.clear()');
              scope.instance.clear();
            }
            var chart = scope.instance || (firstInit = true, scope.instance = echarts.init(ecContainer[0], theme));
            // if (scope.instance) {
            //   console.log('scope.instance.clear()');
            //   scope.instance.clear();
            //   scope.instance.dispose();
            // }
            // var chart = scope.instance = echarts.init(ecContainer[0], theme);
            ecContainer = null;
            if (scope.config && scope.config.dataLoaded === false) {
              chart.showLoading();
            }

            if (scope.config && scope.config.dataLoaded) {
              chart.setOption(scope.option, true);
              chart.resize();
              chart.hideLoading();
            }

            if (chart) {
              var option = chart.getOption();

              var hasBmap = _.has(option, ['bmap']);
              if (hasBmap) {
                scope.bmap = chart.getModel().getComponent('bmap').getBMap();
              }
            }

            if (scope.config && scope.config.event) {
              if (angular.isArray(scope.config.event)) {
                angular.forEach(scope.config.event, function (value) {
                  for (var e in value) {
                    chart.off(e);
                    chart.on(e, value[e]);
                  }
                });
              }
            }

            if (scope.config && scope.config.bmap) {
              var bmapConf = scope.config.bmap;
              if (bmapConf.event) {
                if (angular.isArray(bmapConf.event)) {
                  angular.forEach(bmapConf.event, function (value) {
                    for (var e in value) {
                      scope.bmap.removeEventListener(e, value[e]);
                      scope.bmap.addEventListener(e, value[e]);
                    }
                  });
                }
              } else {
                alert('bmap 组件加载失败');
              }
            }
            chart.off('click');
            chart.on('click', function (params) {
              var option = this.getOption();

              var keys = _.map(option.series, 'name');
              var seriesData = _.map(option.series, 'data');
              var values = _.transform(seriesData, function (result, itemValue) {
                result.push(itemValue[params.dataIndex].value || itemValue[params.dataIndex]);
              }, []);

              var clickData = {
                name: params.name,
                clickSerie: params.seriesName,
                current: _.pick(params, params.$vars),
                series: _.zipObject(keys, values)
              };

              appEvents.default.emit('emit-echartsclick', { ecInstance: scope.instance, clickData: clickData });
              console.log(params);
            });
          }

          //自定义参数 - config
          // event 定义事件
          // theme 主题名称
          // dataLoaded 数据是否加载
          scope.$watch(
            function () { return scope.config; },
            function (value) { if (value) { refreshChart(); } },
            true
          );

          //图表原生option
          scope.$watch(
            function () { return scope.option; },
            function (value) { if (value) { refreshChart(); } },
            true
          );

          scope.$on("$destroy", function () {
            console.log('teld echarts... destroy');
            if (scope.bmap) {
              scope.bmap = null;
            }
            if (scope.instance) {
              scope.instance.clear();
              console.log('teld echarts... clear');
              scope.instance.dispose();
              console.log('teld echarts... dispose');
              scope.option = null;
              scope.config = null;
              scope.instance = null;
              scope.bmap = null;
              delete scope.option;
              delete scope.config;
              delete scope.instance;
              delete scope.bmap;
            }
            element.off();
            element.remove();
          });
        },
        scope: {
          option: '=ecOption',
          config: '=ecConfig',
          instance: '=?ecInstance',
          bmap: '=?ecBmap'
        },
        restrict: 'EA'
      };
    });

  });
