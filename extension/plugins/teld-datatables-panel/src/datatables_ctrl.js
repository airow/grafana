import { MetricsPanelCtrl } from 'app/plugins/sdk';
import moment from 'moment';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import './css/teld-datatables-panel.css!';
import { transformDataToTable } from './transformers';
import { DatatableRenderer } from './renderer';

import { optionsEditorComponent } from './options_editor';
import { datatablesEditorComponent } from './datatables_editor';
import { variablesEditorComponent } from './variables_editor';

const panelDefaults = {
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
  scroll: false,
  fontSize: '100%',
  sort: { col: 0, desc: true },
  filterNull: false,
  columnWidthHints: [],
  sortByColumnsData: [[0, 'desc']],
  sortByColumns: [
    {
      columnData: 0,
      sortMethod: 'desc',
    },
  ],
  datatableTheme: 'basic_theme',
  rowNumbersEnabled: false,
  infoEnabled: true,
  searchEnabled: false,
  showCellBorders: false,
  showRowBorders: true,
  hoverEnabled: true,
  orderColumnEnabled: true,
  compactRowsEnabled: false,
  stripedRowsEnabled: true,
  lengthChangeEnabled: true,
  datatablePagingType: 'numbers',
  pagingTypes: [
    {
      text: 'Page number buttons only',
      value: 'numbers',
    },
    {
      text: "'Previous' and 'Next' buttons only",
      value: 'simple',
    },
    {
      text: "'Previous' and 'Next' buttons, plus page numbers",
      value: 'simple_numbers',
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons",
      value: 'full',
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers",
      value: 'full_numbers',
    },
    {
      text: "'First' and 'Last' buttons, plus page numbers",
      value: 'first_last_numbers',
    },
  ],
  themes: [
    {
      value: 'basic_theme',
      text: 'Basic',
      disabled: false,
    },
    {
      value: 'bootstrap_theme',
      text: 'Bootstrap',
      disabled: true,
    },
    {
      value: 'foundation_theme',
      text: 'Foundation',
      disabled: true,
    },
    {
      value: 'themeroller_theme',
      text: 'ThemeRoller',
      disabled: true,
    },
  ],
  pageLength: 50,
  publishVariables: { variablesConf: [] }
};

export class DatatablesCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, $sce) {

    super($scope, $injector);
    this.variableSrv = $injector.get('variableSrv');
    this.alertSrv = $injector.get('alertSrv');
    this.sce = $sce;

    _.defaults(this.panel, panelDefaults);

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));
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

  onDataError(err) {
    this.dataRaw = [];
    this.render();
  }

  onInitEditMode() {
    this.addEditorTab('Options', optionsEditorComponent);
    this.addEditorTab('DataTables', datatablesEditorComponent);
    this.addEditorTab('Variables', variablesEditorComponent);
  }

  onInitPanelActions(actions) {
    actions.push({ text: 'Export CSV', click: 'ctrl.exportCsv()' });
  }

  render() {
    this.table = transformDataToTable(this.dataRaw, this.panel);
    this.table.sort(this.panel.sort);
    this.panel.emptyData = this.table.rows.length === 0 || this.table.columns.length === 0;
    // if (this.triggerRefresh) {
    //   this.triggerRefresh = false;
    //   return;
    // }
    // this.triggerRefresh = false;
    return super.render(this.table);
  }


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
    this.selectedObj = obj;
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

    function renderPanel1() {
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
    function renderPanel() {
      debugger;
      const renderer = new DatatableRenderer(ctrl, panel, ctrl.table, ctrl.dashboard.isTimezoneUtc(), ctrl.$sanitize);
      // renderer.renderTest();
      renderer.render();
      // _this.dataLoaded = true;
    }

    ctrl.events.on('render', function (renderData) {
      data = renderData || data;
      if (data) {
        renderPanel();
      }
      ctrl.renderingCompleted();
    });
  }
}

DatatablesCtrl.templateUrl = 'partials/template.html';
