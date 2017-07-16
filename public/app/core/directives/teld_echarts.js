define([
  'jquery',
  'angular',
  'lodash',
  'echarts',
  'echarts.bmap',
  '../core_module',
],
  function ($, angular, _, echarts, ecBmap, coreModule) {
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
            var chart = scope.instance || (firstInit = true, scope.instance = echarts.init(ecContainer[0], theme));
            if (scope.config && scope.config.dataLoaded === false) {
              chart.showLoading();
            }

            if (scope.config && scope.config.dataLoaded) {
              chart.setOption(scope.option);
              chart.resize();
              chart.hideLoading();
            }

            if (chart) {
              let option = chart.getOption();

              let hasBmap = _.has(option, ['bmap']);
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
              let bmapConf = scope.config.bmap;
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

            // chart.off('click');
            // chart.on('click', function (params) {
            //   // 控制台打印数据的名称
            //   console.log(params.name);
            // });
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
