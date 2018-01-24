///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import * as FileExport from 'app/core/utils/file_export';
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import {transformDataToTable} from './transformers';
import {tablePanelEditor} from './editor';
import {TableRenderer} from './renderer';
import * as rangeUtil from 'app/core/utils/rangeutil';

class TablePanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';

  pageIndex: number;
  dataRaw: any;
  table: any;
  overwriteTimeRange: any;
  originalTitle: string;
  isPlotClick: boolean;

  panelDefaults = {
    drill_timePlotclick: false,
    targets: [{}],
    transform: 'timeseries_to_columns',
    jsonr2c: false,
    nowrap: false,
    pageSize: null,
    showHeader: true,
    styles: [
      {
        type: 'date',
        pattern: 'Time',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        dateUTCOffset: '',
      },
      {
        unit: 'short',
        type: 'number',
        decimals: 2,
        colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
        colorMode: null,
        pattern: '/.*/',
        thresholds: [],
      }
    ],
    columns: [],
    scroll: true,
    fontSize: '100%',
    sort: {col: 0, desc: true},
    filterNull: false,
  };

  /** @ngInject */
  constructor($scope, $injector, private annotationsSrv, private $sanitize) {
    super($scope, $injector);
    this.pageIndex = 0;
    this.templateSrv = $injector.get('templateSrv');

    if (this.panel.styles === void 0) {
      this.panel.styles = this.panel.columns;
      this.panel.columns = this.panel.fields;
      delete this.panel.columns;
      delete this.panel.fields;
    }

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));
    this.originalTitle = this.panel.title;
    //graph 钻取处理函数
    if (this.panel.drill_timePlotclick) {

      if (this.panel.subscribePlotClick && this.panel.subscribePlotClick !== "") {
        _.split(this.panel.subscribePlotClick, ',').forEach(subscribeEvent => {
          this.$scope.$on(`${subscribeEvent}_Plotclick`, (event, eventArgs) => {
            if (eventArgs.clickPoint) {
              this.overwriteTimeRange = eventArgs.timeRange;
            } else {
              this.overwriteTimeRange = undefined;
            }
            this.onMetricsPanelRefresh();
          });
        });
      }
    }
  }

  onInitEditMode() {
    this.addEditorTab('Options', tablePanelEditor, 2);
    this.addEditorTab('Drill', 'public/app/plugins/panel/table/partials/drill.html');
  }

  onInitPanelActions(actions) {
    actions.push({text: 'Export CSV', click: 'ctrl.exportCsv()'});
  }

  issueQueries(datasource) {
    this.pageIndex = 0;

    if (this.panel.transform === 'annotations') {
      this.setTimeQueryStart();
      return this.annotationsSrv.getAnnotations({dashboard: this.dashboard, panel: this.panel, range: this.range})
      .then(annotations => {
        return {data: annotations};
      });
    }
    let originalRange;
    this.isPlotClick = false;
    if (false === _.isEmpty(this.overwriteTimeRange)) {
      originalRange = _.clone(this.range);
      this.range.from = this.overwriteTimeRange.from;
      this.range.to = this.overwriteTimeRange.to;
      this.overwriteTimeRange = undefined;
    }
    return super.issueQueries(datasource).then(data => {
      if (originalRange) {
        this.isPlotClick = true;
        this.rangeStringPanel = this.range.from.format('YYYY-MM-DD HH:mm:ss');
        this.range = originalRange;
      }
      return data;
    });
  }

  onDataError(err) {
    this.dataRaw = [];
    this.render();
  }

  onDataReceived(dataList) {
    this.dataRaw = dataList;
    this.pageIndex = 0;

    // automatically correct transform mode based on data
    if (this.dataRaw && this.dataRaw.length) {
      if (this.dataRaw[0].type === 'table') {
        this.panel.transform = 'table';
      } else {
        if (this.dataRaw[0].type === 'docs') {
          this.panel.transform = 'json';
        } else {
          if (this.panel.transform === 'table' || this.panel.transform === 'json') {
            this.panel.transform = 'timeseries_to_rows';
          }
        }
      }
    }

    this.render();
  }

  render() {
    this.table = transformDataToTable(this.dataRaw, this.panel);
    if (this.panel.jsonr2c !== true) {
      this.table.sort(this.panel.sort);
    }
    return super.render(this.table);
  }

  toggleColumnSort(col, colIndex) {
    // remove sort flag from current column
    if (this.table.columns[this.panel.sort.col]) {
      this.table.columns[this.panel.sort.col].sort = false;
    }

    if (this.panel.sort.col === colIndex) {
      if (this.panel.sort.desc) {
        this.panel.sort.desc = false;
      } else {
        this.panel.sort.col = null;
      }
    } else {
      this.panel.sort.col = colIndex;
      this.panel.sort.desc = true;
    }
    this.render();
  }

  exportCsv() {
    var renderer = new TableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize, this.templateSrv);
    FileExport.exportTableDataToCsv(renderer.render_values());
  }

  link(scope, elem, attrs, ctrl) {
    var data;
    var panel = ctrl.panel;
    var pageCount = 0;
    var formaters = [];

    function getTableHeight() {
      var panelHeight = ctrl.height;

      if (pageCount > 1) {
        panelHeight -= 26;
      }

      return (panelHeight - 31) + 'px';
    }

    function appendTableRows(tbodyElem) {
      var renderer = new TableRenderer(panel, data, ctrl.dashboard.isTimezoneUtc(), ctrl.$sanitize, ctrl.templateSrv);
      tbodyElem.empty();
      tbodyElem.html(renderer.render(ctrl.pageIndex));
    }

    function switchPage(e) {
      var el = $(e.currentTarget);
      ctrl.pageIndex = (parseInt(el.text(), 10)-1);
      renderPanel();
    }

    function appendPaginationControls(footerElem) {
      footerElem.empty();

      var pageSize = panel.pageSize || 100;
      pageCount = Math.ceil(data.rows.length / pageSize);
      if (pageCount === 1) {
        return;
      }

      var startPage = Math.max(ctrl.pageIndex - 3, 0);
      var endPage = Math.min(pageCount, startPage + 9);

      var paginationList = $('<ul></ul>');

      for (var i = startPage; i < endPage; i++) {
        var activeClass = i === ctrl.pageIndex ? 'active' : '';
        var pageLinkElem = $('<li><a class="table-panel-page-link pointer ' + activeClass + '">' + (i+1) + '</a></li>');
        paginationList.append(pageLinkElem);
      }

      footerElem.append(paginationList);
    }

    function renderPanel() {
      var panelElem = elem.parents('.panel');
      var rootElem = elem.find('.table-panel-scroll');
      var tbodyElem = elem.find('tbody');
      var footerElem = elem.find('.table-panel-footer');

      elem.css({'font-size': panel.fontSize});
      panelElem.addClass('table-panel-wrapper');

      appendTableRows(tbodyElem);
      appendPaginationControls(footerElem);

      rootElem.css({'max-height': panel.scroll ? getTableHeight() : '' });
    }

    elem.on('click', '.table-panel-page-link', switchPage);

    var unbindDestroy = scope.$on('$destroy', function() {
      elem.off('click', '.table-panel-page-link');
      unbindDestroy();
    });

    ctrl.events.on('render', function(renderData) {
      data = renderData || data;
      if (data) {
        renderPanel();
      }
      ctrl.renderingCompleted();
    });
  }
}

export {
  TablePanelCtrl,
  TablePanelCtrl as PanelCtrl
};
