import { MetricsPanelCtrl } from 'app/plugins/sdk';
import moment from 'moment';
import _ from 'lodash';
import './css/microtip.css!';
import './css/teldBIStaInfo.css!';
import './css/jq22.css!';
import { transformDataToTable } from './transformers';

const panelDefaults = {
  staName: "",
  staimgurl: "",
  staScore: "",
  staCode: "",
  staState: "",
  staopType: "",
  stapay: "",
  goodssta: "",
  terminalNum: "",
  address: "",
};

export class teldBIStaInfoCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, $sce) {
    super($scope, $injector);
    _.defaultsDeep(this.panel, panelDefaults);
    this.variableSrv = $injector.get('variableSrv');
    this.sce = $sce;
    this._panel = _.cloneDeep(this.panel)
    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-initialized', this.render.bind(this));
    this.dataTaget = "";
    this.staName = "";
    this.staimgurl = "";
    this.staScore = "";
    this.staScoreWidth = "";
    this.staCode = "";
    this.staState = "";
    this.staopType = "";
    this.stapay = "";
    this.goodssta = "";
    this.terminalNum = "";
    this.address = "";
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/teld-bi-stainfo/editor.html', 2);
  }
  onDataError(err) {
    this.onDataReceived([]);
  }
  onRender() {
    console.log('onRender');
    this.renderingCompleted();
  }

  onDataReceived(dataList) {
    this.filterDataList = {};
    this.filterData = {};
    if (dataList.length > 0 && dataList[0].type === 'table') {
      this.dataType = 'table';
      this.rowObj = [];
      this.dataTaget = "字段：";
      for (var i = 0; i < dataList.length; i++) {
        for (var j = 0; j < dataList[i].rows.length; j++) {
          for (var k = 0; k < dataList[i].rows[j].length; k++) {
            //this._panel['sum' + sumint] = dataList[i].rows[j][k];
            let key = dataList[i].columns[k].text;
            this.dataTaget += key + ";";
            let value = dataList[i].rows[j][k];
            this.rowObj[key] = value;
          }
        }
      }
      this.dataTaget += "例：<%=BindData['Count0']%>";
      this.filterDataList = {
        "BindData": this.rowObj
      }
    } else {
      this.dataType = 'timeseries';
      var strdataTaget = _.map(dataList, 'target');
      if (strdataTaget.length > 0) {
        this.dataTaget = "变量：";
        for (var k = 0; k < strdataTaget.length; k++) {
          this.dataTaget += strdataTaget[k] + k + ";";
        }
        this.dataTaget += "属性：datapoints，Max，Min，Sum，Avg；例：<%=(BindData['Count0'].Max/100000).toFixed(2)%>";
      }
      for (var i = 0; i < dataList.length; i++) {
        var targettitle = dataList[i].target + i;
        var datapointsValue = [];
        for (var j = 0; j < dataList[i].datapoints.length; j++) {
          if (dataList[i].datapoints.length > 0) {
            let value = dataList[i].datapoints[j][0];
            datapointsValue.push(value);
          }
        }
        this.filterData[targettitle] = {
          datapoints: datapointsValue,
          Max: _.max(datapointsValue),
          Min: _.min(datapointsValue),
          Sum: _.sum(datapointsValue),
          Avg: _.mean(datapointsValue)
        };
      }
      this.filterDataList = {
        "BindData": this.filterData
      }
    }
    if (this._panel.teldtemplatetext) {
      let compiled = _.template(this._panel.teldtemplatetext);
      this._panel.cellHtml = compiled(this.filterDataList);
      this._panel.cellHtml = this.sce.trustAsHtml(this._panel.cellHtml);
    }
    this.staName = _.template(this._panel.staName)(this.filterDataList);
    this.staimgurl={ 'background-image': 'url('+_.template(this._panel.staimgurl)(this.filterDataList)+')' }
    this.staScore = _.template(this._panel.staScore)(this.filterDataList);
    this.staScoreWidth = ((+this.staScore / 5) * 100).toFixed(2) + "%";
    this.staScore=this.staScore+"分";
    this.staCode = _.template(this._panel.staCode)(this.filterDataList);
    this.staState = _.template(this._panel.staState)(this.filterDataList);
    this.staopType = _.template(this._panel.staopType)(this.filterDataList);
    this.stapay = _.template(this._panel.stapay)(this.filterDataList);
    this.goodssta = _.template(this._panel.goodssta)(this.filterDataList);
    this.terminalNum = _.template(this._panel.terminalNum)(this.filterDataList);
    this.address = _.template(this._panel.address)(this.filterDataList);
    this.render();
  }

  toThousands(num, separator) {
    var parts;
    num = num + "";
    // 判断是否为数字
    if (!isNaN(parseFloat(num)) && isFinite(num)) {
      parts = num.split('.');
      parts[0] = parts[0].toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + (separator || ','));

      return parts.join('.');
    }
    return NaN;
  }
}

teldBIStaInfoCtrl.templateUrl = 'module.html';
