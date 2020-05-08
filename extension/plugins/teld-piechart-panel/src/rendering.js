import _ from 'lodash';
import $ from 'jquery';
import 'jquery.flot';
import 'jquery.flot.pie';

export default function link(scope, elem, attrs, ctrl) {
  var data, panel;
  elem = elem.find('.piechart-panel');
  var $tooltip = $('<div id="tooltip">');

  ctrl.events.on('render', function() {
    render(false);
    if(panel.legendType === 'Right side') {
      setTimeout(function() { render(true); }, 50);
    }
  });

  function setElementHeight() {
    try {
      var height = ctrl.height || panel.height || ctrl.row.height;
      if (_.isString(height)) {
        height = parseInt(height.replace('px', ''), 10);
      }

      height -= 5; // padding
      height -= panel.title ? 24 : 9; // subtract panel title bar

      var offset = 0;
      if (ctrl.fullscreen && ctrl.panel.allowViewModeFilter) {
        var querybarHeight = $(".teld-querybar-panel").height() || 0;
        var teldFilterHeight = $("panel-plugin-teld-filter-panel .panel-container").height() || 0;
        offset = (querybarHeight + teldFilterHeight);
      }
      height -= offset;
      elem.css('height', height + 'px');

      return true;
    } catch(e) { // IE throws errors sometimes
      return false;
    }
  }

  function formatter(label, slice) {
    return "<div style='font-size:" + ctrl.panel.fontSize + ";text-align:center;padding:2px;color:" + slice.color + ";'>" + label + "<br/>" + Math.round(slice.percent) + "%</div>";
  }

  function addPieChart() {
    var width = elem.width();
    var height = elem.height();

    var size = Math.min(width, height);

    var plotCanvas = $('<div></div>');
    var plotCss = {
      top: '10px',
      margin: 'auto',
      position: 'relative',
      height: (size - 20) + 'px'
    };

    plotCanvas.css(plotCss);

    var $panelContainer = elem.parents('.panel-container');
    var backgroundColor = $panelContainer.css('background-color');

    var options = {
      legend: {
        show: false
      },
      series: {
        pie: {
          show: true,
          stroke: {
            color: backgroundColor,
            width: parseFloat(ctrl.panel.strokeWidth).toFixed(1)
          },
          label: {
            show: ctrl.panel.legend.show && ctrl.panel.legendType === 'On graph',
            formatter: formatter
          },
          highlight: {
            opacity: 0.0
          },
		  combine: {
		    threshold: ctrl.panel.combine.threshold,
			label: ctrl.panel.combine.label
		  }
        }
      },
      grid: {
        hoverable: true,
        clickable: false
      }
    };

    if (panel.pieType === 'donut') {
      options.series.pie.innerRadius = 0.5;
    }

    elem.html(plotCanvas);

    try {
      $.plot(plotCanvas, ctrl.data, options);
    } catch (error) {
      if (error.message === "Invalid dimensions for plot, width = 0, height = 0") {
        return;
      }
    }

    plotCanvas.bind("plothover", function (event, pos, item) {
      if (!item) {
        $tooltip.detach();
        return;
      }

      var body;
      var percent = parseFloat(item.series.percent).toFixed(2);
      var formatted = ctrl.formatValue(item.series.data[0][1]);
      let label = item.series.label.replace(`[:]${panel.legend.label}`, '')

      body = '<div class="graph-tooltip-small"><div class="graph-tooltip-time">';
      body += '<div class="graph-tooltip-value">' + label + ': ' + formatted;
      if (ctrl.panel.legend.totalPercentage) {
        var totalpercent = ctrl.tooltips[label];
        if (false === _.isNil(totalpercent)) {
          if (ctrl.panel.legend.percentage) {
            body +=`(${ctrl.panel.legend.percentageLabel || 'percentage'}:${percent}%, ${ctrl.panel.legend.totalPercentageLabel || '总占比'}:${totalpercent})`;
          } else {
            body += " (" + totalpercent + ")";
          }
        }
      } else {
        body += " (" + percent + "%)";
      }

      body += '</div>';
      body += "</div></div>";

      $tooltip.html(body).place_tt(pos.pageX + 20, pos.pageY);
    });
  }

  function render(incrementRenderCounter) {
    if (!ctrl.data) { return; }

    data = ctrl.data;
    panel = ctrl.panel;

    if (setElementHeight()) {
      addPieChart();
    }
    if (incrementRenderCounter) {
      ctrl.renderingCompleted();
    }
  }
}

