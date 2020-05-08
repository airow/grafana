import angular from 'angular';
import _ from  'lodash';
import kbn from 'app/core/utils/kbn';
import $ from  'jquery';
import 'jquery.flot';
import 'jquery.flot.time';

angular.module('grafana.directives').directive('piechartLegend', function (popoverSrv, $timeout, variableSrv) {
  return {
    link: function(scope, elem) {
      var $container = $('<section class="graph-legend"></section>');
      var firstRender = true;
      var ctrl = scope.ctrl;
      var panel = ctrl.panel;
      var data;
      var seriesList;
      var i;

      ctrl.events.on('render', function() {
        data = ctrl.series;
        if (data) {
          for(var i in data) {
            data[i].color = ctrl.data[i].color;
          }
          render();
        }
      });

      function getSeriesIndexForElement(el) {
        return el.parents('[data-series-index]').data('series-index');
      }

      function toggleSeries(e) {
        var el = $(e.currentTarget);
        var index = getSeriesIndexForElement(el);
        var seriesInfo = seriesList[index];
        ctrl.toggleSeries(seriesInfo, e);
      }

      function sortLegend(e) {
        var el = $(e.currentTarget);
        var stat = el.data('stat');

        if (stat !== panel.legend.sort) { panel.legend.sortDesc = null; }

        // if already sort ascending, disable sorting
        if (panel.legend.sortDesc === false) {
          panel.legend.sort = null;
          panel.legend.sortDesc = null;
          render();
          return;
        }

        panel.legend.sortDesc = !panel.legend.sortDesc;
        panel.legend.sort = stat;
        render();
      }

      function openColorSelector(e) {
        // if we clicked inside poup container ignore click
        if ($(e.target).parents('.popover').length) {
          return;
        }

        var el = $(e.currentTarget).find('.fa-minus');
        var index = getSeriesIndexForElement(el);
        var series = seriesList[index];

        $timeout(function() {
          popoverSrv.show({
            element: el[0],
            position: 'bottom center',
            template: '<gf-color-picker></gf-color-picker>',
            openOn: 'hover',
            model: {
              autoClose: true,
              series: series,
              toggleAxis: function() {},
              colorSelected: function(color) {
                ctrl.changeSeriesColor(series, color);
              }
            },
          });
        });
      }

      function render() {
        if(panel.legendType === 'On graph') {
          $container.empty();
          return;
        }

        if (firstRender) {
          elem.append($container);
          $container.on('click', '.graph-legend-icon', openColorSelector);
          $container.on('click', 'th', sortLegend);
          firstRender = false;
        }

        seriesList = data;

        $container.empty();

        var showValues = panel.legend.values || panel.legend.percentage;
        var tableLayout = (
            panel.legendType === 'Under graph' ||
            panel.legendType === 'Right side'
            ) && showValues;


        $container.toggleClass('graph-legend-table', tableLayout);

        if (tableLayout) {
          var header = '<tr><th colspan="2" style="text-align:left"></th>';
          if (panel.legend.values) {
            if (panel.legend.label) {
              header += `<th class="pointer">${panel.legend.label}</th>`;
            } else {
              header += '<th class="pointer">values</th>';
            }
          }
          if (panel.legend.percentage) {
            if (panel.legend.percentageLabel) {
              header += `<th class="pointer">${panel.legend.percentageLabel}</th>`;
            } else {
              header += '<th class="pointer">percentage</th>';
            }
          }
          if (panel.legend.totalPercentage) {
            if (panel.legend.totalPercentageLabel) {
              header += `<th class="pointer">${panel.legend.totalPercentageLabel}</th>`;
            } else {
              header += '<th class="pointer">总占比</th>';
            }
          }
          header += '</tr>';
          $container.append($(header));
        }

        if (panel.legend.sort) {
          seriesList = _.sortBy(seriesList, function(series) {
            return series.stats[panel.legend.sort];
          });
          if (panel.legend.sortDesc) {
            seriesList = seriesList.reverse();
          }
        }

        if (panel.legend.percentage) {
          var total = 0;
          for (i = 0; i < seriesList.length; i++) {
            total += seriesList[i].stats[ctrl.panel.valueName];
          }
        }

        for (i = 0; i < seriesList.length; i++) {
          var series = seriesList[i];

          // ignore empty series
          if (panel.legend.hideEmpty && series.allIsNull) {
            continue;
          }
          // ignore series excluded via override
          if (!series.legend) {
            continue;
          }

          var html = '<div class="graph-legend-series';
          html += '" data-series-index="' + i + '">';
          html += '<span class="graph-legend-icon" style="float:none;">';
          html += '<i class="fa fa-minus pointer" style="color:' + series.color + '"></i>';
          html += '</span>';

          html += '<span class="graph-legend-alias" style="float:none;">';

          // if (panel.legend.label) {
          //   //html += `<th class="pointer">${panel.legend.label}</th>`;
          //   html += '<a>' + series.label.replace(panel.legend.label, '') + '</a>';
          // } else {
          //   html += '<a>' + series.label + '</a>';
          // }
          html += '<a>' + series.label.replace(`[:]${panel.legend.label}`, '') + '</a>';

          html += '</span>';

          if (showValues && tableLayout) {
            var value = series.formatValue(series.stats[ctrl.panel.valueName]);
            if (panel.legend.values) {
              html += '<div class="graph-legend-value">' + ctrl.formatValue(value) + '</div>';
            }
            if (value && total) {
              var pv = (value / total) * 100;
              pv = pv > 100 ? 100 : pv;
              var pvalue = (pv).toFixed(2) + '%';
              html += '<div class="graph-legend-value">' + pvalue + '</div>';
            }

            if (panel.legend.totalPercentage) {
              var denVarName = panel.legend.totalDenominator;
              // var denValue = variableSrv.templateSrv.replace(`$${denVarName}`);
              var totalVar = _.find(variableSrv.variables, { name: denVarName });
              if (_.isNil(totalVar)) {
                totalVar = _.find(variableSrv.variables, { name: "SumDL" });
              }
              var denValue = totalVar.query
              denValue = (+denValue);
              if (false === _.isNaN(denValue)) {
                var pvden = (value / denValue) * 100;
                if (pvden === Infinity) {
                  html += '<div class="graph-legend-value"> Infinity </div>';
                } else {
                  pvden = pvden > 100 ? 100 : pvden;
                  series.totalpercent = pvden;
                  ctrl.tooltips = ctrl.tooltips || {};
                  var pvalueden = (pvden).toFixed(2) + '%';
                  ctrl.tooltips[series.label] = pvalueden;
                  html += '<div class="graph-legend-value">' + pvalueden + '</div>';
                }
              } else {
                html += '<div class="graph-legend-value">/</div>';
              }
            }
          }

          html += '</div>';
          $container.append($(html));
        }
      }
    }
  };
});


