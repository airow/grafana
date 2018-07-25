///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import * as FileExport from 'app/core/utils/file_export';
import { MetricsPanelCtrl } from 'app/plugins/sdk';
import { transformDataToTable } from './transformers';
import { tablePanelEditor } from './editor';
import { TableRenderer } from './renderer';
import * as rangeUtil from 'app/core/utils/rangeutil';
System.import('/public/app/plugins/panel/teld-iframe-panel/css/teld-iframe-panel.built-in.css!css');
class TablePanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';

  pageIndex: number;
  dataRaw: any;
  table: any;
  overwriteTimeRange: any;
  originalTitle: string;
  isPlotClick: boolean;
  $compile: any;
  variableSrv: any;
  alertSrv: any;
  teldtemplate: any;
  teldtemplatetext: any;
  teldtemplatetextdemo: any;

  panelDefaults = {
    drill_timePlotclick: false,
    targets: [{}],
    transform: 'timeseries_to_columns',
    teldtemplate: "default",
    teldtemplatetext: `<td><div class="row rank-item"
    style="text-align:left;font-size:13px;color:#a1a1a5;
    font-family: Helvetica,Tahoma,Arial,Microsoft YaHei,SimSun,STXihei,Heiti,sans-serif!important;
    line-height:26px; margin:0;border-bottom:1px dotted #d2d2d2;">
    <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12 sta-name-link"
    style="padding:0px 5px;line-height:36px;font-size:16px;font-family:SimHei;color:#0ea6d7;
    text-decoration:underline;cursor:pointer;"
      value="<%= staId %>"><%= staName %></div>
    <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"
    style="padding:0px 5px;font-size:16px;font-family:SimHei;line-height:36px;color:#666;text-align:right;">
      <span>单桩日均充电量:<%= AvgDcChgPower %>度(快)/<%= AvgAcChgPower %>度(慢)</span>
    </div>
    <div class="col-lg-5 col-md-5 col-sm-6 col-xs-12" style="padding:0px 5px;">
      <span>平均评分:<%= AvgScore %></span>
    </div>
    <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" style="padding:0px 5px;">
      <span>充电单价:<%= MinPrice %>元/度</span>
    </div>
    <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12" style="padding:0px 5px;text-align:right;">
      <span><%= ParkingRate %></span>
    </div>
    <div class="col-lg-5 col-md-5 col-sm-6 col-xs-12" style="padding:0px 5px;">
      <span>站日均电量(度):<%= AvgStaDayPower %></span>
    </div>
    <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" style="padding:0px 5px;">
      <span>终端数(个):<%= OpPileNum %>(总)/<%= DcPileNum %>(快)/<%= AcPileNum %>(慢)</span>
    </div>
    <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12" style="padding:0px 5px;text-align:right;">
      <span>桩均功率(kW):<%= DcPilePower %>(快)/<%= AcPilePower %>(慢)</span>
    </div>
    <div class="col-lg-5 col-md-5 col-sm-6 col-xs-12" style="padding:0px 5px;">
      <span>时间利用率(%):<%= StaTimeRate %>(总)/<%= DCStaTimeRate %>(快)/<%= ACStaTimeRate %>(慢)</span>
    </div>
  </div></td>`,
    teldtemplatetextdemo: `<td>
  <div class="row rank-item"
  style="text-align:left;font-size:13px;color:#a1a1a5;
  font-family: Helvetica,Tahoma,Arial,Microsoft YaHei,SimSun,STXihei,Heiti,sans-serif!important;
  line-height:26px; margin:0;border-bottom:1px dotted #d2d2d2;">
  <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12 sta-name-link"
  style="padding:0px 5px;line-height:36px;font-size:16px;font-family:SimHei;
  color:#0ea6d7;text-decoration:underline;cursor:pointer;"
    value="dc956ed9-af34-4ad8-99f6-35308a0a9152">南京扬子公交西水湾充电站</div>
  <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"
  style="padding:0px 5px;font-size:16px;font-family:SimHei;line-height:36px;color:#666;text-align:right;">
    <span>单桩日均充电量:1176.22度(快)/0度(慢)</span>
  </div>
  <div class="col-lg-5 col-md-5 col-sm-6 col-xs-12" style="padding:0px 5px;">
    <span>平均评分:5</span>
  </div>
  <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" style="padding:0px 5px;">
    <span>充电单价:0.59元/度</span>
  </div>
  <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12" style="padding:0px 5px;text-align:right;">
    <span>停车免费</span>
  </div>
  <div class="col-lg-5 col-md-5 col-sm-6 col-xs-12" style="padding:0px 5px;">
    <span>站日均电量(度):4704.9</span>
  </div>
  <div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" style="padding:0px 5px;">
    <span>终端数(个):4(总)/4(快)/0(慢)</span>
  </div>
  <div class="col-lg-4 col-md-4 col-sm-6 col-xs-12" style="padding:0px 5px;text-align:right;">
    <span>桩均功率(kW):217.5(快)/0(慢)</span>
  </div>
  <div class="col-lg-5 col-md-5 col-sm-6 col-xs-12" style="padding:0px 5px;">
    <span>时间利用率(%):40.42(总)/40.42(快)/0(慢)</span>
  </div>
</div>
  </td>`,
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
    sort: { col: 0, desc: true },
    filterNull: false,
    publishVariables: { variablesConf: [] }
  };

  /** @ngInject */
  constructor($scope, $injector, private annotationsSrv, private $sanitize) {
    super($scope, $injector);
    this.pageIndex = 0;
    this.templateSrv = $injector.get('templateSrv');
    this.variableSrv = $injector.get('variableSrv');
    this.$compile = $injector.get('$compile');
    this.alertSrv = $injector.get('alertSrv');

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

    if (this.panel.publishVariables.enable) {
      this.bindPublishVariables({}, false);
    }
  }

  onInitEditMode() {
    this.addEditorTab('Options', tablePanelEditor, 2);
    this.addEditorTab('Drill', 'public/app/plugins/panel/teld-table/partials/drill.html');
    this.addEditorTab('Variables', 'public/app/plugins/panel/teld-table/partials/variables.html');
  }

  onInitPanelActions(actions) {
    actions.push({ text: 'Export CSV', click: 'ctrl.exportCsv()' });
  }

  issueQueries(datasource) {
    this.pageIndex = 0;

    if (this.panel.transform === 'annotations') {
      this.setTimeQueryStart();
      return this.annotationsSrv.getAnnotations({ dashboard: this.dashboard, panel: this.panel, range: this.range })
        .then(annotations => {
          return { data: annotations };
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

  isFirstRender: any;
  render() {
    if (this.seftRowRefresh) {
      this.seftRowRefresh = false;
      return;
    }
    this.isFirstRender = false;
    this.table = transformDataToTable(this.dataRaw, this.panel);
    if (this.panel.jsonr2c !== true) {
      this.table.sort(this.panel.sort);
    }
    return super.render(this.table);
  }

  removeVariable(variableArray, variable) {
    var index = _.indexOf(variableArray, variable);
    variableArray.splice(index, 1);
  }
  move(variableArray, index, newIndex) {
    _.move(variableArray, index, newIndex);
  }
  selectedIndex: any;
  select(index, obj) {
    var isSelect = this.selectedIndex !== index;

    if (isSelect) {
      this.selectedIndex = index;
    } else {
      if (this.panel.publishVariables.required) {
        this.alertSrv.set("警告", `必选项不支持取消`, "warning", 2000);
        return;
      }
      this.selectedIndex = null;
    }

    this.bindPublishVariables(obj, isSelect);
    this.seftRowRefresh = true;
    this.timeSrv.refreshDashboard();
  }

  bindPublishVariables(obj, isSelect) {
    _.each(this.panel.publishVariables.variablesConf, conf => {
      var name = conf.name || conf.field;
      var varName = `${this.panel.publishVariables.prefixVariables}_${name}`;
      var value = _.get(obj, conf.field, conf.nullValue);
      var val = isSelect ? value : conf.nullValue;
      let variable = this.templateSrv.getVariable('$' + varName, 'teldCustom');

      let query = val === conf.nullValue ? "" : val;
      let current = { value: val, text: query };
      variable = variable || this.variableSrv.addVariable({
        hide: 2,
        type: 'teldCustom',
        name: varName,
        query: query,
        current: current
      });
      variable.query = val;
      variable.current = current;
    });
    this.templateSrv.updateTemplateData();
  }

  seftRowRefresh: any;

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
      //tbodyElem.html(renderer.render(ctrl.pageIndex));

      var compileFn = ctrl.$compile(renderer.render(ctrl.pageIndex, ctrl.selectedIndex));
      //var $dom = compileFn(s);
      var $dom = compileFn(ctrl.$scope);
      // 添加到文档中
      $dom.appendTo(tbodyElem);

      if (ctrl.panel.publishVariables.enable) {
        let $timeout = ctrl.$injector.get('$timeout');
        if (ctrl.panel.publishVariables.load && ctrl.isFirstRender !== true) {
          $timeout(() => {
            ctrl.isFirstRender = true;
            let columnKey = data.columns.map(i => i.text);
            let row = data.rows[0];
            let rowObj = _.zipObject(columnKey, row);
            ctrl.selectedIndex = null;
            ctrl.select(0, rowObj);
          });
        }
      }
    }

    function switchPage(e) {
      var el = $(e.currentTarget);
      ctrl.pageIndex = (parseInt(el.text(), 10) - 1);
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
        var pageLinkElem = $('<li><a class="table-panel-page-link pointer ' + activeClass + '">' + (i + 1) + '</a></li>');
        paginationList.append(pageLinkElem);
      }

      footerElem.append(paginationList);
    }

    function renderPanel() {
      var panelElem = elem.parents('.panel');
      var rootElem = elem.find('.table-panel-scroll');
      var tbodyElem = elem.find('tbody');
      var footerElem = elem.find('.table-panel-footer');

      elem.css({ 'font-size': panel.fontSize });
      panelElem.addClass('table-panel-wrapper');

      appendTableRows(tbodyElem);
      appendPaginationControls(footerElem);

      rootElem.css({ 'max-height': panel.scroll ? getTableHeight() : '' });
    }

    elem.on('click', '.table-panel-page-link', switchPage);

    var unbindDestroy = scope.$on('$destroy', function () {
      elem.off('click', '.table-panel-page-link');
      unbindDestroy();
    });

    ctrl.events.on('render', function (renderData) {
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
