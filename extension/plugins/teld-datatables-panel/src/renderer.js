import $ from 'jquery';
import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import moment from 'moment';
import _ from 'lodash';

$.fn.dataTable.ext.order['teld-dom-text'] = function (settings, col) {
  return this.api().column(col, { order: 'index' }).nodes().map(function (td, i) {
    var rawVal = $('div', td).data('rawval');
    console.log(rawVal);
    return (parseInt(rawVal) || rawVal || 0);
  });
}

jQuery.extend(jQuery.fn.dataTableExt.oSort, {
  "teld-warpRowColumn-pre": function (a) {
    // debugger;
    var x = (a == "-") ? 0 : a.replace(/,/, ".");
    return +$(a).data('rawval') || a;
  },

  "teld-warpRowColumn-asc": function (a, b) {
    debugger;
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
  },

  "teld-warpRowColumn-desc": function (a, b) {
    debugger;
    return ((a < b) ? 1 : ((a > b) ? -1 : 0));
  }
});

export class DatatableRenderer {

  loadPlugins() {
    const plugins = [
      { id: 'datatables.net', src: '/public/plugins/teld-datatables-panel/libs/datatables.min.js' },
      { id: 'datatables.net.css', src: '/public/plugins/teld-datatables-panel/libs/datatables.min.css' },
    ];
    plugins.filter(p => {
      $(`#${p.id}`).length === 0
    }).map(p => this.loadAsset(p.id, p.src));
  }

  loadAsset(id, src) {
    src.endsWith(".js") ?
      this.createScript(id, src) :
      this.createLink(id, src);
  }

  createLink(id, src) {
    $('head').append(`<link rel="stylesheet" id="${id}" href="${src}">`);
  }

  createScript(id, src) {
    $('head').append(`<script type="text/javascript" id="${id}" src="${src}"></script>`);
  }

  constructor(panelCtrl, panel, table, isUtc, sanitize) {
    this.formatters = [];
    this.colorState = {};
    this.panel = panel;
    this.table = table;
    this.isUtc = isUtc;
    this.sanitize = sanitize;
    this.panelCtrl = panelCtrl;

    this.GRID_CELL_HEIGHT = 30;
    this.TITLE_LINE_HEIGHT = 28;

    this.templateOptions = {
      imports: {
        _: _,
        m: moment,
        helper: {
          mapEach: function (prefix, suffix) {
            return function (item) {
              return `${prefix || ""}${item}${suffix || ""}`;
            };
          },
          _StandardModel: function (item) {
            return "(term:(StandardModel:(value:'" + item + "'),conf:(operatorKey:string_equal)))";
          }
        },
        kbn: kbn,
        'valueFormats': (function (kbn) {
          let bindContext = {
            // kbn,
            // valueFormats: kbn.valueFormats,
            // kbnMap: _.mapKeys(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), (value) => { return value.text; }),
            valueFormats: _.transform(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), function (result, unitFormatConf, index) {
              result[unitFormatConf.text] = kbn.valueFormats[unitFormatConf.value];
            }, {})
          };

          return function (unitFormatName, size, decimals) {
            return this.valueFormats[unitFormatName](size, decimals);
          }.bind(bindContext);
        })(kbn)
      }
    };

    // this.loadPlugins();
  }

  /**
   * Given a value, return the color corresponding to the threshold set
   * @param  {[Float]} value [Value to be evaluated]
   * @param  {[Array]} style [Settings containing colors and thresholds]
   * @return {[String]}       [color]
   */
  getColorForValue(value, style) {
    if (!style.thresholds) {
      return null;
    }
    for (let i = style.thresholds.length; i > 0; i--) {
      if (value >= style.thresholds[i - 1]) {
        return style.colors[i];
      }
    }
    return _.first(style.colors);
  }

  // to determine the overall row color, the index of the threshold is needed
  getColorIndexForValue(value, style) {
    if (!style.thresholds) {
      return null;
    }
    for (let i = style.thresholds.length; i > 0; i--) {
      if (value >= style.thresholds[i - 1]) {
        return i;
      }
    }
    return 0;
  }

  /**
   * [defaultCellFormatter description]
   * @param  {[type]} v     [description]
   * @param  {[type]} style [description]
   * @return {[type]}       [description]
   */
  defaultCellFormatter(v, style, column) {
    // taken from @grafana/data
    function stringToJsRegex(str) {
      if (str[0] !== '/') {
        return new RegExp('^' + str + '$');
      }
      const match = str.match(new RegExp('^/(.*?)/(g?i?m?y?)$'));
      if (!match) {
        throw new Error(`'${str}' is not a valid regular expression.`);
      }
      return new RegExp(match[1], match[2]);
    }

    if (v === null || v === void 0 || v === undefined || column === null) {
      return '';
    }
    if (_.isArray(v)) {
      v = v.join(', ');
    }
    v = String(v);

    if (typeof style === 'undefined') {
      style = {};
    }
    let cellTemplate = style.url;
    //const cellTemplateVariables = {};

    if (typeof style.splitPattern === 'undefined' || style.splitPattern === '') {
      style.splitPattern = '/ /';
    }

    const regex = stringToJsRegex(String(style.splitPattern));
    const values = v.split(regex);
    if (typeof cellTemplate !== 'undefined') {
      // Replace $__cell with this cell's content.
      cellTemplate = cellTemplate.replace(/\$__cell\b/, v);
      values.map((val, i) => (cellTemplate = cellTemplate.replace(`$__pattern_${i}`, val)));
    }

    if (style && style.sanitize) {
      return this.sanitize(v);
    } else if (style && style.link && cellTemplate && column.text === style.column) {
      return '<a onclick="event.stopPropagation();" href="' + cellTemplate.replace(/\{\}|\$__cell/g, v) + '" target="_blank">' + v + '</a>';
    } else if (style && style.link) {
      return '<a onclick="event.stopPropagation();" href="' + v + '" target="_blank">' + v + '</a>';
    } else {
      return _.escape(v);
    }
  }

  warpRowColumn(rawVal, style, val) {
    if (this.skipWarpRowColumn === true) { return val; }
    style = style || {};
    var textAlign = style.textAlign || "";
    var divStyle = style.divStyle || (style.type === 'number' ? "text-align:right;" : "");
    var dataVal = style.type === 'number' ? `data-val="${val}"` : "";
    var dataRawVal = rawVal ? `data-rawVal="${rawVal}"` : "";
    dataRawVal = "";
    return `<div ${dataRawVal} ${dataVal} data-type="${style.type}" style="${divStyle}${textAlign}">${val}</div>`;
  }

  warpHeader(rawVal, style, val) {
    style = style || {};
    return this.warpRowColumn(rawVal, style.thStyle, val);
  }

  /**
   * [createColumnFormatter description]
   * @param  {[type]} style  [description]
   * @param  {[type]} column [description]
   * @return {[type]}        [description]
   */
  createColumnFormatter(style, column) {

    if (!style) {
      return this.defaultCellFormatter;
    }

    if (style.type === 'hidden') {
      return v => {
        return "_hidden_";
      };
    }

    if (style.type === 'date') {
      return v => {
        if (v === undefined || v === null) {
          return '-';
        }
        //_.isNaN(+"2017-12-58")==true,_.isNaN(+"20171258")==false
        //将时间戳字符串转为数值型
        if (_.isNaN(+v) === false) {
          v = +v;
        }
        if (_.isArray(v)) { v = v[0]; }
        var date = moment(v);
        if (this.isUtc) {
          date = date.utc();
        }
        if (style.dateUTCOffset) {
          date = date.add(style.dateUTCOffset, 'h');//UTC和local格式都支持增加
          // date = date.utcOffset(style.dateUTCOffset);//加上丢掉的8个时区数，必须是UTC格式的才管用
        }
        return this.warpRowColumn(v, style, date.format(style.dateFormat));
      };
    }

    if (style.type === 'number') {
      let valueFormater = kbn.valueFormats[column.unit || style.unit];

      return v => {
        if (v === null || v === void 0) {
          return this.warpRowColumn(v, style, '-');
        }

        if (_.isNaN(+v) && _.isString(v)) {
          return this.warpRowColumn(v, style, this.defaultCellFormatter(v, style));
        }

        if (style.colorMode) {
          this.colorState[style.colorMode] = this.getColorForValue(v, style);
        }
        return this.warpRowColumn(v, style, valueFormater(v, style.decimals, null));
      };
    }

    if (style.type === 'link' || style.type === 'calc') {
      let valueFormater = kbn.valueFormats[column.unit || style.unit];
      let url = style.urlTemplate || "https://user.teld.cn";
      let faStyle = style.faStyle || "";
      let spanStyle = style.spanStyle || "";
      let spanWrapStyle = style.wrap ? "display: inline-block;word-wrap: break-word;white-space: pre-wrap;" : "";
      let target = style.target || column.text;//"_black";
      let text = (style.text || "联查");
      let iconColor = style.color || "#33B5E5";
      //点击a标签，取消事件冒泡，防止与表格行选择冲突
      if (_.get(this.panel, 'publishVariables.enable', false) && text.indexOf('<a ') > -1 && $(text).is('a[href]')) {
        text = text.replace(/<a/g, "<a onclick='event.stopPropagation();'");
      }
      let templateString =
        `<span style='${spanWrapStyle}${spanStyle}'>${text}<a style='margin-left: 5px;' onclick='event.stopPropagation();' href="${url}" target='${target}'><i style='color:${iconColor}; ${faStyle}' class='fa fa-external-link' aria-hidden='true'></i></a></span>`;

      if (this['isRenderValues'] || style.type === 'calc') {
        text = text.replace('&nbsp;', '');
        templateString = `${text}`;
      }

      return v => {
        let bindData = _.assign({
          timestamp: (new Date()).valueOf(),
          currentUser: config.bootData.user
        }, this.rowObj);

        if (style.calcDateRange) {
          let time = this.rowObj[style.timeField];
          let m = moment(time);

          if (moment.isMoment(m)) {
            let start = moment(time).subtract(5, 'm');
            let end = moment(time).add(5, 'm');

            if (style.timeRangeField) {
              let timeRange = this.rowObj[style.timeRangeField];
              if (_.isNumber(timeRange) && timeRange > 0) {
                let timeRangeFieldUnit = style.timeRangeFieldUnit || 'm';

                start = moment(time).subtract(timeRange, timeRangeFieldUnit);
                end = moment(time).add(5, timeRangeFieldUnit);
              }
            }

            bindData[`${style.timeField}Start`] = start.toISOString();
            bindData[`${style.timeField}End`] = end.toISOString();

            if (style.enableFormat) {
              bindData[`${style.timeField}Start`] = start.format(style.dateFormat);
              bindData[`${style.timeField}End`] = end.format(style.dateFormat);
            }
          }
        }
        let compiled = _.template(templateString, this.templateOptions);
        bindData.rowObj = this.rowObj;
        bindData.vars = _.transform(this.panelCtrl.templateSrv.variables, (result, variable) => { result[variable.name] = variable.current.value; }, {});
        let returnValue = compiled(bindData);
        let rawVal = this.rowObj[style.sortBy] || this.rowObj[style.pattern] || v;
        return this.warpRowColumn(rawVal, style, returnValue);
      };
    }

    return (value) => {
      return this.warpRowColumn(value, style, this.defaultCellFormatter(value, style));
    };
  }

  /**
   * [formatColumnValue description]
   * @param  {[type]} colIndex [description]
   * @param  {[type]} rowIndex [description]
   * @param  {[type]} value    [description]
   * @return {[type]}          [description]
   */
  formatColumnValue(colIndex, rowIndex, value, isCSV) {
    // taken from @grafana/data
    function stringToJsRegex(str) {
      if (str[0] !== '/') {
        return new RegExp('^' + str + '$');
      }
      const match = str.match(new RegExp('^/(.*?)/(g?i?m?y?)$'));
      if (!match) {
        throw new Error(`'${str}' is not a valid regular expression.`);
      }
      return new RegExp(match[1], match[2]);
    }

    if (!this.formatters[colIndex]) {
      var newStyle = this.panel.styles;
      for (let i = 0; i < newStyle.length; i++) {
        const style = newStyle[i];
        const column = this.table.columns[colIndex];
        const regex = stringToJsRegex(style.pattern);
        if (column.match !== true && column.text.match(regex)) {
          column.match = true;
          this.formatters[colIndex] = this.createColumnFormatter(style, column);
          if (isCSV) {
            //导出CSV时，对link\cale字段原样输出
            if (style.type == 'link' || style.type == 'calc') {
              this.formatters[colIndex] = this.defaultCellFormatter;
            }
          }
        }
      }
    }

    if (!this.formatters[colIndex]) {
      this.formatters[colIndex] = this.defaultCellFormatter;
    }

    if (false === _.isUndefined(isCSV)) {
      const columns = _.map(this.table.columns, 'text');
      this.rowObj = _.zipObject(columns, this.table.rows[rowIndex]);
    }

    let v = this.formatters[colIndex](value);

    if (/\$__cell_\d+/.exec(v)) {
      for (let i = this.table.columns.length - 1; i >= 0; i--) {
        v = v.replace(`$__cell_${i}`, this.table.rows[rowIndex][i]);
      }
    }

    return v;
  }

  /**
   * [generateFormattedData description]
   * @param  {[type]} rowData [description]
   * @return {[type]}         [description]
   */
  generateFormattedData(rowData) {
    const formattedRowData = [];

    let columnKey = this.table.columns.map(i => i.text);

    for (let y = 0; y < rowData.length; y++) {
      const row = this.table.rows[y];
      const cellData = [];
      for (let i = 0; i < this.table.columns.length; i++) {
        this.rowObj = _.zipObject(columnKey, row);
        const value = this.formatColumnValue(i, y, row[i]);
        // if (value === undefined || value === null) {
        //   this.table.columns[i].hidden = true;
        // }
        if ( value === "_hidden_") {
          this.table.columns[i].hidden = true;
        }
        cellData.push(value);
      }
      if (this.panel.rowNumbersEnabled) {
        cellData.unshift('_rn_');
      }
      formattedRowData.push(cellData);
    }
    return formattedRowData;
  }

  getStyleForColumn(columnNumber) {
    // taken from @grafana/data
    function stringToJsRegex(str) {
      if (str[0] !== '/') {
        return new RegExp('^' + str + '$');
      }
      const match = str.match(new RegExp('^/(.*?)/(g?i?m?y?)$'));
      if (!match) {
        throw new Error(`'${str}' is not a valid regular expression.`);
      }
      return new RegExp(match[1], match[2]);
    }

    let colStyle = null;
    for (let i = 0; i < this.panel.styles.length; i++) {
      const style = this.panel.styles[i];
      const column = this.table.columns[columnNumber];
      if (column === undefined) {
        break;
      }
      const regex = stringToJsRegex(style.pattern);
      if (column.text.match(regex)) {
        colStyle = style;
        break;
      }
    }
    return colStyle;
  }

  getCellColors(colorState, columnNumber, cellData) {
    // return null;
    if (cellData === null || cellData === undefined || cellData.split === undefined) {
      return null;
    }
    // const items = cellData.split(/([^0-9.,]+)/);
    const type = $(cellData).data('type');
    if (type !== 'number') { return null; }

    // only color cell if the content is a number?
    let bgColor = null;
    let bgColorIndex = null;
    let color = null;
    let colorIndex = null;
    let colStyle = this.getStyleForColumn(columnNumber);
    let value = $(cellData).data('val');

    if (colStyle !== null && colStyle.colorMode != null) {
      // check color for either cell or row
      if (colorState.cell || colorState.row || colorState.rowcolumn) {
        // bgColor = _this.colorState.cell;
        bgColor = this.getColorForValue(value, colStyle);
        bgColorIndex = this.getColorIndexForValue(value, colStyle);
        color = 'white';
      }
      // just the value color is set
      if (colorState.value) {
        //color = _this.colorState.value;
        color = this.getColorForValue(value, colStyle);
        colorIndex = this.getColorIndexForValue(value, colStyle);
      }
    }
    return {
      bgColor: bgColor,
      bgColorIndex: bgColorIndex,
      color: color,
      colorIndex: colorIndex,
    };
  }

  getCellColors_bak(colorState, columnNumber, cellData) {
    // return null;
    if (cellData === null || cellData === undefined || cellData.split === undefined) {
      return null;
    }
    const items = cellData.split(/([^0-9.,]+)/);
    // only color cell if the content is a number?
    let bgColor = null;
    let bgColorIndex = null;
    let color = null;
    let colorIndex = null;
    let colStyle = null;
    let value = $(cellData).data('val');
    // check if the content has a numeric value after the split
    if (!isNaN(items[0])) {
      // run value through threshold function
      value = parseFloat(items[0].replace(',', '.'));
      colStyle = this.getStyleForColumn(columnNumber);
    }
    if (colStyle !== null && colStyle.colorMode != null) {
      // check color for either cell or row
      if (colorState.cell || colorState.row || colorState.rowcolumn) {
        // bgColor = _this.colorState.cell;
        bgColor = this.getColorForValue(value, colStyle);
        bgColorIndex = this.getColorIndexForValue(value, colStyle);
        color = 'white';
      }
      // just the value color is set
      if (colorState.value) {
        //color = _this.colorState.value;
        color = this.getColorForValue(value, colStyle);
        colorIndex = this.getColorIndexForValue(value, colStyle);
      }
    }
    return {
      bgColor: bgColor,
      bgColorIndex: bgColorIndex,
      color: color,
      colorIndex: colorIndex,
    };
  }

  getColumnAlias(column, bindVars) {    // default to the columnName
    let columnAlias = column.alias || column.text;
    if (column.aliasExpression) {
      let compiled = _.template(columnAlias, this.templateOptions);
      let bindData = { vars: bindVars };
      columnAlias = compiled(bindData);
    }
    return columnAlias;
  }

  getColumnWidthHint(columnName) {
    // default to the columnName
    let columnWidth = '';
    if (this.panel.columnWidthHints !== undefined) {
      for (let i = 0; i < this.panel.columnWidthHints.length; i++) {
        if (this.panel.columnWidthHints[i].name === columnName) {
          columnWidth = this.panel.columnWidthHints[i].width;
          break;
        }
      }
    }
    return columnWidth;
  }

  /**
   * Construct table using Datatables.net API
   *  multiple types supported
   * timeseries_to_rows (column 0 = timestamp)
   * timeseries_to_columns
   * timeseries_aggregations - column 0 is the metric name (series name, not a timestamp)
   * annotations - specific headers for this
   * table
   * json (raw)
   * columns[x].type === "date" then set columndefs to parse the date, otherwise leave it as default
   * convert table.columns[N].text to columns formatted to datatables.net format
   * @return {[Boolean]} True if loaded without errors
   */
  render() {

    const tableHolderId = '#datatable-panel-table-' + this.panel.id;

    // if (this.panel.emptyData) {
    //   return;
    // }
    const columns = [];
    const columnDefs = [];
    const _this = this;
    let rowNumberOffset = 0;
    if (this.panel.rowNumbersEnabled) {
      rowNumberOffset = 1;
      columns.push({
        title: '序号',
        type: 'number',
        searchable: false,
        orderable: false,
        className: "dataTables_text-align_center",
        width: '35px'
      });
      columnDefs.push({
        searchable: false,
        orderable: false,
        targets: 0,
        width: '35px',
      });
    }
    // pass the formatted rows into the datatable
    const formattedData = this.generateFormattedData(this.table.rows);
    var bindVars = this.panelCtrl.templateSrv.getLodashTemplateBindVars();
    for (let i = 0; i < this.table.columns.length; i++) {
      // const columnAlias = this.getColumnAlias(this.table.columns[i].text);
      // const columnWidthHint = this.getColumnWidthHint(this.table.columns[i].text);

      const column = this.table.columns[i];
      // const columnAlias = column.alias || column.text;
      let columnAlias = this.getColumnAlias(column, bindVars);
      // debugger;
      let warpColumnAlias = this.warpHeader(column.text, column.style, columnAlias);

      const columnWidthHint = this.getColumnWidthHint(column.text);

      // NOTE: the width below is a "hint" and will be overridden as needed, this lets most tables show timestamps
      // with full width
      /* jshint loopfunc: true */
      columns.push({
        // "orderDataType": "teld-dom-text",
        columnAlias: columnAlias,
        title: warpColumnAlias,
        type: this.table.columns[i].type,
        visible: this.table.columns[i].hidden !== true,
        width: this.table.columns[i].width || columnWidthHint,
      });
      columnDefs.push({
        // "type": "teld-warpRowColumn",
        targets: i + rowNumberOffset,
        createdCell: (td, cellData, rowData, row, col) => {
          // hidden columns have null data
          if (cellData === null) {
            return;
          }
          // set the fontsize for the cell
          $(td).css('font-size', _this.panel.fontSize);
          // undefined types should have numerical data, any others are already formatted
          let actualColumn = col;
          if (_this.panel.rowNumbersEnabled) {
            actualColumn -= 1;
          }
          // FIXME: I hidden this line due to all columns are with undefined type, so they are not colorized
          // if (_this.table.columns[actualColumn].type === undefined) return;
          // for coloring rows, get the "worst" threshold
          let rowColor = null;
          let color = null;
          let rowColorIndex = null;
          let rowColorData = null;
          if (_this.colorState.row) {
            // run all of the rowData through threshold check, get the "highest" index
            // and use that for the entire row
            if (rowData === null) {
              return;
            }
            rowColorIndex = -1;
            rowColorData = null;
            rowColor = _this.colorState.row;
            // this should be configurable...
            color = 'white';
            for (let columnNumber = 0; columnNumber < _this.table.columns.length; columnNumber++) {
              // only columns of type undefined are checked
              if (_this.table.columns[columnNumber].type === undefined) {
                rowColorData = _this.getCellColors(_this.colorState, columnNumber, rowData[columnNumber + rowNumberOffset]);
                if (!rowColorData) {
                  continue;
                }
                if (rowColorData.bgColorIndex !== null) {
                  if (rowColorData.bgColorIndex > rowColorIndex) {
                    rowColorIndex = rowColorData.bgColorIndex;
                    rowColor = rowColorData.bgColor;
                  }
                }
              }
            }
            // style the entire row (the parent of the td is the tr)
            // this will color the rowNumber and Timestamp also
            $(td.parentNode)
              .children()
              .css('color', color);
            $(td.parentNode)
              .children()
              .css('background-color', rowColor);
          }

          if (_this.colorState.rowcolumn) {
            // run all of the rowData through threshold check, get the "highest" index
            // and use that for the entire row
            if (rowData === null) {
              return;
            }
            rowColorIndex = -1;
            rowColorData = null;
            rowColor = _this.colorState.rowcolumn;
            // this should be configurable...
            color = 'white';
            for (let columnNumber = 0; columnNumber < _this.table.columns.length; columnNumber++) {
              // only columns of type undefined are checked
              if (_this.table.columns[columnNumber].type === undefined) {
                rowColorData = _this.getCellColors(_this.colorState, columnNumber, rowData[columnNumber + rowNumberOffset]);
                if (!rowColorData) {
                  continue;
                }
                if (rowColorData.bgColorIndex !== null) {
                  if (rowColorData.bgColorIndex > rowColorIndex) {
                    rowColorIndex = rowColorData.bgColorIndex;
                    rowColor = rowColorData.bgColor;
                  }
                }
              }
            }
            // style the rowNumber and Timestamp column
            // the cell colors will be determined in the next phase
            if (_this.table.columns[0].type !== undefined) {
              const children = $(td.parentNode).children();
              let aChild = children[0];
              $(aChild).css('color', color);
              $(aChild).css('background-color', rowColor);
              // the 0 column contains the row number, if they are enabled
              // then the above just filled in the color for the row number,
              // now take care of the timestamp
              if (_this.panel.rowNumbersEnabled) {
                aChild = children[1];
                $(aChild).css('color', color);
                $(aChild).css('background-color', rowColor);
              }
            }
          }

          // Process cell coloring
          // Two scenarios:
          //    1) Cell coloring is enabled, the above row color is skipped
          //    2) RowColumn is enabled, the above row color is process, but we also
          //    set the cell colors individually
          const colorData = _this.getCellColors(_this.colorState, actualColumn, cellData);
          if (!colorData) {
            return;
          }
          if (_this.colorState.cell || _this.colorState.rowcolumn) {
            if (colorData.color !== undefined) {
              $(td).css('color', colorData.color);
            }
            if (colorData.bgColor !== undefined) {
              $(td).css('background-color', colorData.bgColor);
            }
          } else if (_this.colorState.value) {
            if (colorData.color !== undefined) {
              $(td).css('color', colorData.color);
            }
          }
        },
      });
    }

    if (this.panel.rowNumbersEnabled) {
      // shift the data to the right
    }
    let panelHeight = this.panel.panelHeight || this.panelCtrl.height;

    let language = {
      "processing": "处理中...",
      "lengthMenu": "显示 _MENU_ 项结果",
      "zeroRecords": "没有匹配结果",
      "info": "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
      "infoEmpty": "显示第 0 至 0 项结果，共 0 项",
      "infoFiltered": "(由 _MAX_ 项结果过滤)",
      "infoPostFix": "",
      "search": "搜索:",
      "url": "",
      "emptyTable": "表中数据为空",
      "loadingRecords": "载入中...",
      "infoThousands": ",",
      "paginate": {
        "first": "首页",
        "previous": "上页",
        "next": "下页",
        "last": "末页"
      },
      "aria": {
        "sortAscending": ": 以升序排列此列",
        "sortDescending": ": 以降序排列此列"
      },
      select: {
        rows: {
          _: "选择 %d 行"
        }
      }
    };

    const tableOptions = {
      processing: true,
      destroy: true,
      // retrieve: true,
      language: language,
      pageLength: this.panel.pageLength || 50,
      lengthMenu: [[5, 10, 25, 50, 75, 100], [5, 10, 25, 50, 75, 100]],
      searching: this.panel.searchEnabled,
      info: this.panel.infoEnabled,
      lengthChange: true,
      scrollCollapse: true,
      scrollX: true,
      scrollY: panelHeight,
      info: this.panel.hideInfo !== true,
      paging: this.panel.notPaging !== true,
      dom: 'Bfrtip',
      "ordering": this.panel.orderColumnEnabled === true,
      // buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
      data: formattedData,
      columns: columns,
      columnDefs: columnDefs,
      pagingType: "numbers",
      "autoWidth": false,
      // TODO: move search options to editor
      search: {
        regex: true,
        smart: false,
      },
      order: _.transform(this.panel.sortByColumns, (result, value, key) => {
        let index = _.findIndex(columns, { columnAlias: value.name });
        if (index > -1) {
          result.push([index, value.sortMethod]);
        }
      }, []),
      fixedColumns: {
        leftColumns: _.get(this.panel, 'fixedColumns.leftColumns', 0)
        // rightColumns: 1
      }
    };
    if (_.size(columns) == 0) {
      delete tableOptions.fixedColumns;
    }
debugger;
    if (this.panel.responsiveModal) {
      tableOptions.responsive = {
        details: {
          display: $.fn.dataTable.Responsive.display.modal({
            header: function (row) {
              var data = row.data();
              // return 'Details for ' + data[0] + ' ' + data[1];
              return '详情';
            }
          }),
          // renderer: $.fn.dataTable.Responsive.renderer.tableAll()
          renderer: function (api, rowIdx, columns) {
            var data = $.map(columns, function (col) {
              if (col.data === '_rn_' || col.data === '_hidden_') { return; }
              return '<tr data-dt-row="' + col.rowIndex + '" data-dt-column="' + col.columnIndex + '">' +
                '<td style="padding: 5px; background-color: #f1f1f1;font-size: 1rem;border: 1px solid silver;">' + col.title + '</td> ' +
                '<td style="padding: 5px; font-size: 1rem;border: 1px solid silver;">' + col.data + '</td>' +
                '</tr>';
            }).join('');

            return $('<table class="dtr-details" width="100%"/>').append(data);
          }
        }
      }
    }

    if (this.panel.publishVariables.enable) {
      tableOptions.select = { items: 'row', toggleable: !this.panel.publishVariables.required };
    }

    const $datatable = $(tableHolderId);

    {

      function dtInstance_selectHandler() {
        let { indexes, dtInstance, panelCtrl, table } = this;
        // alert(dtInstance);
        let index = _.first(indexes);
        console.log('deselect dtInstance.debounce');
        panelCtrl.triggerRefresh = true;
        panelCtrl.select(index, _.zipObject(_.map(table.columns, 'text'), table.rows[index]));
        dtInstance.draw(false);
        delete dtInstance.debounce;
      }

      if (this.panel.destroyModel && $.fn.dataTable.isDataTable(tableHolderId)) {
        // alert(1);
        $(tableHolderId).DataTable().destroy();
        $(tableHolderId).empty();
      }

      const dtInstance = $datatable.DataTable(tableOptions);
      dtInstance.off('deselect').off('select')///** 与固定行头冲突 */.off('draw')
        .on('deselect', (e, dt, type, indexes) => {
          console.log('===deselect===');
          let bindCotext = _.pick(this, ['panelCtrl', 'table']);
          bindCotext = _.defaults({ indexes, dtInstance }, bindCotext);
          dtInstance.debounce = _.debounce(dtInstance_selectHandler.bind(bindCotext), 150);
          dtInstance.debounce();
        })
        .on('select', (e, dt, type, indexes) => {
          console.log('===select===');
          if (dtInstance.debounce) {
            console.log('select dtInstance.debounce.cancel');
            dtInstance.debounce.cancel();
          }
          let bindCotext = _.pick(this, ['panelCtrl', 'table']);
          bindCotext = _.defaults({ indexes, dtInstance }, bindCotext);
          dtInstance_selectHandler.call(bindCotext);
        });

      dtInstance.off('preInit.dt').on('preInit.dt', function (e, settings) {
        var api = new $.fn.dataTable.Api(settings);
        $('<i style="margin-left: 10px;" class="fa fa-close" aria-hidden="true"></i>').click(function () {
          api.search("").draw();
        }).appendTo($(e.target).closest('.datatables-wrapper').find('.dataTables_filter label'));
        console.log('New DataTable created:');
      });

      // // hide columns that are marked hidden
      for (let i = 0; i < this.table.columns.length; i++) {
        if (this.table.columns[i].hidden) {
          // dtInstance.column(i + rowNumberOffset).visible(false);
        }
      }



      // enable compact mode
      if (this.panel.compactRowsEnabled) {
        $datatable.addClass('compact');
      }
      // enable striped mode
      if (this.panel.stripedRowsEnabled) {
        $datatable.addClass('stripe');
      }
      if (this.panel.hoverEnabled) {
        $datatable.addClass('hover');
      }
      if (this.panel.orderColumnEnabled) {
        $datatable.addClass('order-column');
      } else {
        $datatable.removeClass('order-column');
      }
      // these two are mutually exclusive
      if (this.panel.showCellBorders) {
        $datatable.addClass('cell-border');
      } else {
        if (this.panel.showRowBorders) {
          $datatable.addClass('row-border');
        }
      }
      // function to display row numbers
      if (this.panel.rowNumbersEnabled) {
        dtInstance
          .on('draw.dt order.dt search.dt', () => {
            dtInstance
              .column(0, { search: 'applied', order: 'applied' })
              .nodes()
              .each((cell, i) => {
                cell.style.textAlign = 'center';
                // cell.style.paddingRight = '18px';
                // cell.style.paddingLeft = '18px';
                cell.innerHTML = i + 1;
              });
          })
          .draw();
      }
    }
  }

  render_values() {
    const rows = [];

    for (let y = 0; y < this.table.rows.length; y++) {
      const row = this.table.rows[y];
      const newRow = [];
      for (let i = 0; i < this.table.columns.length; i++) {
        newRow.push(this.formatColumnValue(i, y, row[i]));
      }
      rows.push(newRow);
    }
    return {
      columns: this.table.columns,
      rows: rows,
    };
  }

  render_values_visible(isCSV) {
    this.skipWarpRowColumn = true;
    let columns = [];
    var bindVars = this.panelCtrl.templateSrv.getLodashTemplateBindVars();
    for (let i = 0; i < this.table.columns.length; i++) {
      // const columnAlias = this.getColumnAlias(this.table.columns[i].text);
      // const columnWidthHint = this.getColumnWidthHint(this.table.columns[i].text);

      const column = this.table.columns[i];
      // const columnAlias = column.alias || column.text;
      const columnAlias = this.getColumnAlias(column, bindVars);
      this.table.columns[i].match = false;
      columns.push({
        title: columnAlias,
        visible: this.table.columns[i].hidden !== true,
        notExportField: this.table.columns[i].notExportField != true,
        isExport: this.table.columns[i].hidden !== true && this.table.columns[i].notExportField != true
      });
    }

    const rows = [];

    for (let y = 0; y < this.table.rows.length; y++) {
      const row = this.table.rows[y];
      const newRow = [];
      for (let i = 0; i < this.table.columns.length; i++) {
        if (columns[i].isExport) {
          newRow.push(this.formatColumnValue(i, y, row[i], isCSV));
        }
      }
      rows.push(newRow);
    }
    delete this.skipWarpRowColumn;
    return {
      columns: _.map(_.filter(columns, 'isExport'), item => { return { text: item.title } }),
      rows: rows,
    };
  }
}
