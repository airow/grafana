///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import config from 'app/core/config';
import kbn from 'app/core/utils/kbn';

export class TableRenderer {
  formaters: any[];
  colorState: any;
  rowObj: any;

  constructor(private panel, private table, private isUtc, private sanitize, private templateSrv?) {
    this.formaters = [];
    this.colorState = {};
  }

  getColorForValue(value, style) {
    if (!style.thresholds) { return null; }
    var thresholds = style.thresholds;
    if (this.templateSrv) {
      var thresholds = _.map(style.thresholds, item => {
        return this.templateSrv.replace(item, this.panel.scopedVars);
      });
    }
    for (var i = thresholds.length; i > 0; i--) {
      if (value >= thresholds[i - 1]) {
        return style.colors[i];
      }
    }

    // for (var i = style.thresholds.length; i > 0; i--) {
    //   if (value >= style.thresholds[i - 1]) {
    //     return style.colors[i];
    //   }
    // }
    return _.first(style.colors);
  }

  defaultCellFormater(v, style) {
    if (v === null || v === void 0 || v === undefined) {
      return '';
    }

    if (_.isArray(v)) {
      v = v.join(', ');
    }

    if (style && style.sanitize) {
      return this.sanitize(v);
    } else {
      return _.escape(v);
    }
  }

  createColumnFormater(style, column) {
    if (!style) {
      return this.defaultCellFormater;
    }

    if (style.type === 'hidden') {
      return v => {
        return undefined;
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
        return date.format(style.dateFormat);
      };
    }

    if (style.type === 'number') {
      let valueFormater = kbn.valueFormats[column.unit || style.unit];

      return v =>  {
        if (v === null || v === void 0) {
          return '-';
        }

        if (_.isNaN(+v) && _.isString(v)) {
          return this.defaultCellFormater(v, style);
        }

        if (style.colorMode) {
          this.colorState[style.colorMode] = this.getColorForValue(v, style);
        }

        return valueFormater(v, style.decimals, null);
      };
    }

    if (style.type === 'link') {
      let valueFormater = kbn.valueFormats[column.unit || style.unit];
      let url = style.urlTemplate || "https://user.teld.cn";
      let target = style.target || column.text;//"_black";
      let text = (style.text || "联查") + '&nbsp;';
      let iconColor = style.color || "#33B5E5";
      let templateString =
        `<span>
          <a href="${url}" target='${target}'>${text}
            <i style='color:${iconColor}' class='fa fa-external-link' aria-hidden='true'></i>
          </a>
        </span>`;

      if (this['isRenderValues'] ) {
        text = text.replace('&nbsp;', '');
        templateString = `${text}`;
      }

      return v =>  {
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

        let compiled = _.template(templateString);
        let returnValue = compiled(bindData);
        return returnValue;
        //return "<span><a href='https://www.baidu.com' target='_black'>asdfasdf</a></span>";
      };
    }

    return (value) => {
      return this.defaultCellFormater(value, style);
    };
  }

  formatColumnValue(colIndex, value) {
    //value = 1515366300000;
    if (this.formaters[colIndex]) {
      return this.formaters[colIndex](value);
    }

    for (let i = 0; i < this.panel.styles.length; i++) {
      let style = this.panel.styles[i];
      let column = this.table.columns[colIndex];
      var regex = kbn.stringToJsRegex(style.pattern);
      if (column.text.match(regex)) {
        this.formaters[colIndex] = this.createColumnFormater(style, column);
        return this.formaters[colIndex](value);
      }
    }

    this.formaters[colIndex] = this.defaultCellFormater;
    return this.formaters[colIndex](value);
  }

  renderCell(columnIndex, value, addWidthHack = false) {
    value = this.formatColumnValue(columnIndex, value);
    var style = '';
    if (this.colorState.cell) {
      style = ' style="background-color:' + this.colorState.cell + ';color: white"';
      this.colorState.cell = null;
    } else if (this.colorState.value) {
      style = ' style="color:' + this.colorState.value + '"';
      this.colorState.value = null;
    }

    // because of the fixed table headers css only solution
    // there is an issue if header cell is wider the cell
    // this hack adds header content to cell (not visible)
    var widthHack = '';
    if (addWidthHack) {
      widthHack = '<div class="table-panel-width-hack">' + this.table.columns[columnIndex].text + '</div>';
    }

    if (value === undefined) {
      style = ' style="display:none;"';
      this.table.columns[columnIndex].hidden = true;
    } else {
      this.table.columns[columnIndex].hidden = false;
    }

    return '<td' + style + '>' + value + widthHack + '</td>';
  }

  render(page) {
    let pageSize = this.panel.pageSize || 100;
    let startPos = page * pageSize;
    let endPos = Math.min(startPos + pageSize, this.table.rows.length);
    var html = "";

    let columnKey = this.table.columns.map(i => i.text);

    for (var y = startPos; y < endPos; y++) {
      let row = this.table.rows[y];
      this.rowObj = _.zipObject(columnKey, row);
      let cellHtml = '';
      let rowStyle = '';
      for (var i = 0; i < this.table.columns.length; i++) {
        cellHtml += this.renderCell(i, row[i], y === startPos);
      }

      if (this.colorState.row) {
        rowStyle = ' style="background-color:' + this.colorState.row + ';color: white"';
        this.colorState.row = null;
      }

      html += '<tr ' + rowStyle + '>' + cellHtml + '</tr>';
    }

    return html;
  }

  render_values() {
    let rows = [];
    let columnKey = this.table.columns.map(i =>  i.text);
    for (var y = 0; y < this.table.rows.length; y++) {
      let row = this.table.rows[y];
      this.rowObj = _.zipObject(columnKey, row);
      this['isRenderValues'] = true;
      let new_row = [];
      for (var i = 0; i < this.table.columns.length; i++) {
        if (this.table.columns[i].hidden) { continue; }
        let columnValue = this.formatColumnValue(i, row[i]);
        new_row.push(columnValue);
      }
      rows.push(new_row);
    }
    let columns = this.table.columns.filter(i => i.hidden !== true);
    columns = _.clone(columns).map(i => { i.text = i.alias || i.text; return i; });
    return {
      columns: columns,
      rows: rows,
    };
  }
}
