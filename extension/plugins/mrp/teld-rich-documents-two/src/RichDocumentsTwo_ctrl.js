import { MetricsPanelCtrl } from 'app/plugins/sdk';
import moment from 'moment';
import _ from 'lodash';
import './css/microtip.css!';
import './css/rich-documents.css!';
import './css/jq22.css!';
import { transformDataToTable } from './transformers';

const panelDefaults = {
  mode: 'time',
  RichDocumentsType: '24 hour',
  offsetFromUtc: null,
  offsetFromUtcMinutes: null,
  bgColor: "#51C0E2",
  countdownSettings: {
    endCountdownTime: moment().seconds(0).milliseconds(0).add(1, 'day').toDate(),
    endText: '00:00:00'
  },
  dateSettings: {
    showDate: false,
    dateFormat: 'YYYY-MM-DD',
    fontSize: '20px',
    fontWeight: 'normal'
  },
  timeSettings: {
    customFormat: 'HH:mm:ss',
    fontSize: '60px',
    fontWeight: 'normal'
  },
  ModuleId: "",
  MainImg: "",
  MainColors: "#51C0E2",
  PointColor: "#FFFFFF",
  Topupimg: "",
  Bottomimg: "",
  BottomColors: "#51C0E2",
  SelectModuleId: "",
  IsShow: 1,
  Question: "",
  QuestionName: "",
  title1: "title1",
  title2: "title2",
  title11: "title11",
  title22: "title22",
  percent1: "单位1",
  percent2: "单位2",
  percent11: "单位11",
  percent22: "单位22",
  expression1: "",//表达式
  expression2: "",
  expression11: "",//表达式
  expression22: "",
  sumFontColor1: "#FFF",//字体颜色
  sumFontColor2: "#FFF",
  sumFontColor11: "#FFF",//字体颜色
  sumFontColor22: "#FFF",
  titleFontColor1: "#FFF",
  titleFontColor2: "#FFF",
  titleFontColor11: "#FFF",
  titleFontColor22: "#FFF",
  thousandSeparator1: false,
  thousandSeparator2: false,
  thousandSeparator11: false,
  thousandSeparator22: false,
  isthousand1: false,
  isthousand2: false,
  isthousand11: false,
  isthousand22: false,
  Isround1: false,
  Isround2: false,
  Isround11: false,
  Isround22: false,
  decimals1: 2,
  decimals2: 2,
  decimals11: 2,
  decimals22: 2,
  IsDataSource: true,
  tip: {
    enable: false,
    context: '',
    style: {
      top: '-24px',
      right: '10px'
    }
  },
  sort: { col: 0, desc: true }
};

export class RichDocumentsTwoCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, $sce) {
    super($scope, $injector);
    _.defaultsDeep(this.panel, panelDefaults);
    this.variableSrv = $injector.get('variableSrv');
    this.sce = $sce;
    if (!(this.panel.countdownSettings.endCountdownTime instanceof Date)) {
      this.panel.countdownSettings.endCountdownTime = moment(this.panel.countdownSettings.endCountdownTime).toDate();
    }
    this.panel.cellHtml = "";
    this._panel = _.cloneDeep(this.panel)
    if (this._panel.IsDataSource) {
      this.events.on('render', this.onRender.bind(this));
      this.events.on('data-received', this.onDataReceived.bind(this));
      this.events.on('data-error', this.onDataError.bind(this));
      this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    }
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-initialized', this.render.bind(this));
    this.querybarVariable = {};
    var watch1 = $scope.$watch('ctrl._panel.sum1', function (newValue, oldValue, scope) {
      if (scope.ctrl._panel.sum1_v != "0") {
        scope.ctrl._panel.sum1_v = "0";
      }
    });
    var watch2 = $scope.$watch('ctrl._panel.sum2', function (newValue, oldValue, scope) {
      if (scope.ctrl._panel.sum2_v != "0") {
        scope.ctrl._panel.sum2_v = "0";
      }
    });
    this.filterDataList = {};
    this.filterData = [];
    this.dataTaget = "";
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/teld-rich-documents-two/editor.html', 2);
  }
  onDataError(err) {
    this.onDataReceived([]);
  }
  onRender() {
    console.log('onRender');
    this.renderingCompleted();
  }
  setDashboardVariables(Name, value, text) {
    let variablePath = `${Name}`;
    let variable = this.templateSrv.getVariable('$' + Name, 'teldCustom');
    if (_.isNil(variable)) {
      variable = this.addDsQueryVariable(Name, value, text);
    }
    variable.current = { text: text, value: value };
    this.templateSrv.updateTemplateData();
  }
  //向dashboard添加变量
  addDsQueryVariable(Name, value, text) {
    let variable = this.variableSrv.addVariable({
      hide: 2,
      type: 'teldCustom',
      name: `${Name}`,
      query: '',
      current: { value: value, text: text }
    });
    return variable;
  }



  onDataReceived(dataList) {
    const data = {};
    let sumint = 1;
    this._panel.sum1_v = "";
    this._panel.sum2_v = "";
    this.dataTaget = "";
    this.rowObj = [];
    if (dataList.length > 0 && dataList[0].type === 'table') {
      this.dataType = 'table';
      for (var i = 0; i < dataList.length; i++) {
        for (var j = 0; j < dataList[i].rows.length; j++) {
          for (var k = 0; k < dataList[i].rows[j].length; k++) {
            this._panel['sum' + sumint] = dataList[i].rows[j][k];
            this._panel['sum' + sumint + '_v'] = '0';
            let key = dataList[i].columns[k].text;
            let value = dataList[i].rows[j][k];
            this.rowObj[key] = value;
            sumint++;
          }
        }
      }
      this.filterDataList = {
        "BindData": this.rowObj
      }

      if (this._panel.sum1_v == "") {
        this._panel.sum1 = 0;
        this._panel.sum1_v = '0';
      }
      if (this._panel.sum2_v == "") {
        this._panel.sum2 = 0;
        this._panel.sum2_v = '0';
      }
    } else {
      this.dataType = 'timeseries';
      var strdataTaget = _.map(dataList, 'target');
      if (strdataTaget.length > 0) {
        this.dataTaget = "变量：";
        for (var k = 0; k < strdataTaget.length; k++) {
          this.dataTaget += strdataTaget[k] + k + ";";
        }
        this.dataTaget += "属性：datapoints，Max，Min，Sum，Avg；例：${(BindData['Count0'].Max/100000).toFixed(2)}";
      }
      for (var i = 0; i < dataList.length; i++) {
        var targettitle = dataList[i].target + i;
        var datapointsValue = [];
        if (dataList[i].datapoints.length > 0) {
          for (var j = 0; j < dataList[i].datapoints.length; j++) {
            this._panel['sum' + sumint] = dataList[i].datapoints[j][0];
            datapointsValue.push(this._panel['sum' + sumint]);
            this._panel['sum' + sumint + '_v'] = '0'
            sumint++;
          }
        } else {
          this._panel['sum' + sumint] = 0;
          datapointsValue.push(this._panel['sum' + sumint]);
          this._panel['sum' + sumint + '_v'] = '0'
          sumint++;
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
      if (this._panel.sum1_v == "") {
        this._panel.sum1 = 0;
        this._panel.sum1_v = '0';
      }
      if (this._panel.sum2_v == "") {
        this._panel.sum2 = 0;
        this._panel.sum2_v = '0';
      }
    }
    if (this._panel.expression1) {
      this._panel.sum1 = _.template(this._panel.expression1)(this.filterDataList);
    }
    if (this._panel.expression11) {
      this._panel.sum11 = _.template(this._panel.expression11)(this.filterDataList);
    }
    if (this._panel.expression2) {
      this._panel.sum2 = _.template(this._panel.expression2)(this.filterDataList);
    }
    if (this._panel.expression22) {
      this._panel.sum22 = _.template(this._panel.expression22)(this.filterDataList);
    }
    if (this._panel.isthousand1) {
      if (this._panel.percent1.indexOf("万") > -1) {
        this._panel.percent1 = this._panel.percent1.replace("万", "")
      }
      if (this._panel.sum1 >= 10000) {
        this._panel.sum1 = this._panel.sum1 / 10000;
        this._panel.percent1 = "万" + this._panel.percent1;
      }
    }
    if (this._panel.isthousand11) {
      if (this._panel.percent11.indexOf("万") < -1) {
        this._panel.percent11 = this._panel.percent11.replace("万", "")
      }
      if (this._panel.sum11 >= 10000) {
        this._panel.sum11 = this._panel.sum11 / 10000;
        this._panel.percent11 = "万" + this._panel.percent11;
      }
    }
    if (this._panel.isthousand2) {
      if (this._panel.percent2.indexOf("万") < -1) {
        this._panel.percent2 = this._panel.percent2.replace("万", "")
      }
      if (this._panel.sum2 >= 10000) {
        this._panel.sum2 = this._panel.sum2 / 10000;
        this._panel.percent2 = "万" + this._panel.percent2;
      }
    }
    if (this._panel.isthousand22) {
      if (this._panel.percent22.indexOf("万") < -1) {
        this._panel.percent22 = this._panel.percent22.replace("万", "")
      }
      if (this._panel.sum22 >= 10000) {
        this._panel.sum22 = this._panel.sum22 / 10000;
        this._panel.percent22 = "万" + this._panel.percent22;
      }
    }
    if (this._panel.Isround1) {
      this._panel.sum1 = (Math.round((+this._panel.sum1) * 100) / 100).toFixed(this._panel.decimals1);
    } else {
      if (this._panel.decimals1 !== "string") {
        this._panel.sum1 = (+this._panel.sum1).toFixed(this._panel.decimals1);
      }
    }
    if (this._panel.Isround11) {
      this._panel.sum11 = (Math.round((+this._panel.sum11) * 100) / 100).toFixed(this._panel.decimals11);
    } else {
      if (this._panel.decimals11 !== "string") {
        this._panel.sum11 = (+this._panel.sum11).toFixed(this._panel.decimals11);
      }
    }
    if (this._panel.Isround2) {
      this._panel.sum2 = (Math.round((+this._panel.sum2) * 100) / 100).toFixed(this._panel.decimals2);
    } else {
      if (this._panel.decimals2 !== "string") {
        this._panel.sum2 = (+this._panel.sum2).toFixed(this._panel.decimals2);
      }
    }
    if (this._panel.Isround22) {
      this._panel.sum22 = (Math.round((+this._panel.sum22) * 100) / 100).toFixed(this._panel.decimals22);
    } else {
      if (this._panel.decimals22 !== "string") {
        this._panel.sum22 = (+this._panel.sum22).toFixed(this._panel.decimals22);
      }
    }
    if (this._panel.sum1 == "NaN") {
      this._panel.sum1 = 0;
    }
    if (this._panel.sum2 == "NaN") {
      this._panel.sum2 = 0;
    }
    if (this._panel.thousandSeparator1) {
      this._panel.sum1 = this.toThousands(this._panel.sum1);
    }
    if (this._panel.thousandSeparator2) {
      this._panel.sum2 = this.toThousands(this._panel.sum2);
    }

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

RichDocumentsTwoCtrl.templateUrl = 'module.html';
