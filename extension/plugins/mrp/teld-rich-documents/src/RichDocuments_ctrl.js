import { MetricsPanelCtrl } from 'app/plugins/sdk';
import moment from 'moment';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import './css/microtip.css!';
import './css/rich-documents.css!';
import './css/jq22.css!';
import { transformDataToTable } from './transformers';

const panelDefaults = {
  mode: 'time',
  RichDocumentsType: '24 hour',
  offsetFromUtc: null,
  offsetFromUtcMinutes: null,
  bgColor: "#FFFFFF",
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
  MainColors: "#3574FD",
  PointColor: "#FFFFFF",
  Topupimg: "",
  Bottomimg: "",
  BottomColors: "#e7f3fe",
  SelectModuleId: "",
  IsShow: 1,
  Question: "",
  QuestionName: "",
  IsShowUrl: false,
  ShowUrl: "",
  ShowUrlBtnName: "",
  ShowUrlBtnNameColor: "#000",
  ShowUrlBtnNameSize: "14px",
  title1: "title1",
  title2: "title2",
  title3: "title3",
  title4: "title4",
  title5: "title5",
  title6: "title6",
  percent1: "单位1",
  percent2: "单位2",
  percent3: "单位3",
  percent4: "单位4",
  percent5: "单位5",
  percent6: "单位6",
  expression1: "",//表达式
  expression2: "",
  expression3: "",
  expression4: "",
  expression5: "",
  expression6: "",
  href1:"",//超链接
  href2:"",
  href3:"",
  href4:"",
  href5:"",
  href6:"",
  sumFontColor1: "#333333",//字体颜色
  sumFontColor2: "#666",
  sumFontColor3: "#666",
  sumFontColor4: "#666",
  sumFontColor5: "#666",
  sumFontColor6: "#666",
  titleFontColor1: "#999999",
  titleFontColor2: "#999999",
  titleFontColor3: "#999999",
  titleFontColor4: "#999999",
  titleFontColor5: "#999999",
  titleFontColor6: "#999999",
  isthousand1: false,
  isthousand2: false,
  isthousand3: false,
  isthousand4: false,
  isthousand5: false,
  isthousand6: false,
  Isround1: false,
  Isround2: false,
  Isround3: false,
  Isround4: false,
  Isround5: false,
  Isround6: false,
  decimals1: 2,
  decimals2: 2,
  decimals3: 2,
  decimals4: 2,
  decimals5: 2,
  decimals6: 2,
  thousandSeparator1: false,
  thousandSeparator2: false,
  thousandSeparator3: false,
  thousandSeparator4: false,
  thousandSeparator5: false,
  thousandSeparator6: false,
  // isvariable1: false,//是否变量
  // isvariable2: false,
  // isvariable3: false,
  // isvariable4: false,
  // isvariable5: false,
  // variableTitle1: "",//变量名称
  // variableTitle2: "",
  // variableTitle3: "",
  // variableTitle4: "",
  // variableTitle5: "",
  IsDataSource: true,
  tip: {
    enable: false,
    context: '',
    style: {
      top: '-24px',
      right: '10px'
    }
  },
  sort: { col: 0, desc: true },
  teldtemplate: "default",
  teldtemplatetext: `<div class="row rank-item"
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
</div>`,
  teldtemplatetextdemo: `
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
</div>`
};

export class RichDocumentsCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, $sce) {
    super($scope, $injector);
    _.defaultsDeep(this.panel, panelDefaults);
    this.variableSrv = $injector.get('variableSrv');

    this.templateSettings = {
      imports: {
        helper: {
          '_': _,
          'kbn': kbn,
          'm': moment,
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
      }
    };

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
      this.events.on('hrefClick',this.hrefClick.bind(this));
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
    var watch3 = $scope.$watch('ctrl._panel.sum3', function (newValue, oldValue, scope) {
      if (scope.ctrl._panel.sum3_v != "0") {
        scope.ctrl._panel.sum3_v = "0";
      }
    });
    var watch4 = $scope.$watch('ctrl._panel.sum4', function (newValue, oldValue, scope) {
      if (scope.ctrl._panel.sum4_v != "0") {
        scope.ctrl._panel.sum4_v = "0";
      }
    });
    var watch5 = $scope.$watch('ctrl._panel.sum5', function (newValue, oldValue, scope) {
      if (scope.ctrl._panel.sum5_v != "0") {
        scope.ctrl._panel.sum5_v = "0";
      }
    });
    var watch6 = $scope.$watch('ctrl._panel.sum6', function (newValue, oldValue, scope) {
      if (scope.ctrl._panel.sum6_v != "0") {
        scope.ctrl._panel.sum6_v = "0";
      }
    });
    this.filterDataList = {};
    this.filterData = [];
    this.dataTaget = "";
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/teld-rich-documents/editor.html', 2);
  }
  onDataError(err) {
    this.onDataReceived([]);
  }
  hrefClick(type){
    var _url="";
    switch(type){
          case 1:
          _url=this._panel.href1;
          break;
          case 2:
          _url=this._panel.href2;
          break;
          case 3:
          _url=this._panel.href3;
          break;
          case 4:
          _url=this._panel.href4;
          break;
          case 5:
          _url=this._panel.href5;
          break;
          case 6:
          _url=this._panel.href6;
          break;
    }
    if(_url !=""){
      window.open(_url);
    }
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

  getLodashTemplateBindVars(cacheSuffix, scopedVars, format, varFilter) {
    debugger;
    if (this.templateSrv.getLodashTemplateBindVars) {
      return this.templateSrv.getLodashTemplateBindVars(cacheSuffix, scopedVars, format, varFilter);
    }
    cacheSuffix = cacheSuffix || "LodashTemplateBindVars";
    scopedVars = scopedVars || {};
    format = format || "lucene";
    varFilter = varFilter || function (item) {
      return item.type === 'teldExpression' && "es" === (item.filter || "es");
    };
    var expressionScopedVars = this.templateSrv.teldExpression2ScopedVarsFormCache(cacheSuffix, scopedVars, format, varFilter);
    // _.defaults(expressionScopedVars || {}, this.variables);
    var returnValue = _.transform(this.templateSrv.variables, (result, variable) => { result[variable.name] = variable.current.value; }, {});
    returnValue = _.transform(expressionScopedVars, (result, variable, name) => { result[name] = variable.value; }, returnValue);
    return returnValue;
  }

  onDataReceived(dataList) {
    this.filterData=[];
    var bindVars = this.getLodashTemplateBindVars();
    if (this.panel.teldtemplate == "default") {
      const data = {};
      let sumint = 1;
      this._panel.sum1_v = "";
      this._panel.sum2_v = "";
      this._panel.sum3_v = "";
      this._panel.sum4_v = "";
      this._panel.sum5_v = "";
      this._panel.sum6_v = "";
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
          "vars": bindVars,
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
        if (this._panel.sum3_v == "") {
          this._panel.sum3 = 0;
          this._panel.sum3_v = '0';
        }
        if (this._panel.sum4_v == "") {
          this._panel.sum4 = 0;
          this._panel.sum4_v = '0';
        }
        if (this._panel.sum5_v == "") {
          this._panel.sum5 = 0;
          this._panel.sum5_v = '0';
        }
        if (this._panel.sum6_v == "") {
          this._panel.sum6 = 0;
          this._panel.sum6_v = '0';
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
          "vars": bindVars,
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
        if (this._panel.sum3_v == "") {
          this._panel.sum3 = 0;
          this._panel.sum3_v = '0';
        }
        if (this._panel.sum4_v == "") {
          this._panel.sum4 = 0;
          this._panel.sum4_v = '0';
        }
        if (this._panel.sum5_v == "") {
          this._panel.sum5 = 0;
          this._panel.sum5_v = '0';
        }
        if (this._panel.sum6_v == "") {
          this._panel.sum6 = 0;
          this._panel.sum6_v = '0';
        }
      }
      if (this._panel.expression1) {
        this._panel.sum1 = _.template(this._panel.expression1)(this.filterDataList);
      }
      if (this._panel.expression2) {
        this._panel.sum2 = _.template(this._panel.expression2)(this.filterDataList);
      }
      if (this._panel.expression3) {
        this._panel.sum3 = _.template(this._panel.expression3)(this.filterDataList);
      }
      if (this._panel.expression4) {
        this._panel.sum4 = _.template(this._panel.expression4)(this.filterDataList);
      }
      if (this._panel.expression5) {
        this._panel.sum5 = _.template(this._panel.expression5)(this.filterDataList);
      }
      if (this._panel.expression6) {
        this._panel.sum6 = _.template(this._panel.expression6)(this.filterDataList);
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
      if (this._panel.isthousand2) {
        if (this._panel.percent2.indexOf("万") > -1) {
          this._panel.percent2 = this._panel.percent2.replace("万", "")
        }
        if (this._panel.sum2 >= 10000) {
          this._panel.sum2 = this._panel.sum2 / 10000;
          this._panel.percent2 = "万" + this._panel.percent2;
        }
      }
      if (this._panel.isthousand3) {
        if (this._panel.percent3.indexOf("万") > -1) {
          this._panel.percent3 = this._panel.percent3.replace("万", "")
        }
        if (this._panel.sum3 >= 10000) {
          this._panel.sum3 = this._panel.sum3 / 10000;
          this._panel.percent3 = "万" + this._panel.percent3;
        }
      }
      if (this._panel.isthousand4) {
        if (this._panel.percent4.indexOf("万") > -1) {
          this._panel.percent4 = this._panel.percent4.replace("万", "")
        }
        if (this._panel.sum4 >= 10000) {
          this._panel.sum4 = this._panel.sum4 / 10000;
          this._panel.percent4 = "万" + this._panel.percent4;
        }
      }
      if (this._panel.isthousand5) {
        if (this._panel.percent5.indexOf("万") > -1) {
          this._panel.percent5 = this._panel.percent5.replace("万", "")
        }
        if (this._panel.sum5 >= 10000) {
          this._panel.sum5 = this._panel.sum5 / 10000;
          this._panel.percent5 = "万" + this._panel.percent5;
        }
      }
      if (this._panel.isthousand6) {
        if (this._panel.percent6.indexOf("万") > -1) {
          this._panel.percent6 = this._panel.percent6.replace("万", "")
        }
        if (this._panel.sum6 >= 10000) {
          this._panel.sum6 = this._panel.sum6 / 10000;
          this._panel.percent6 = "万" + this._panel.percent6;
        }
      }
      if (this._panel.Isround1) {
        this._panel.sum1 = (Math.round((+this._panel.sum1) * 100) / 100).toFixed(this._panel.decimals1);
      } else {
        if (this._panel.decimals1 !== "string") {
          this._panel.sum1 = (+this._panel.sum1).toFixed(this._panel.decimals1);
        }
      }
      if (this._panel.Isround2) {
        this._panel.sum2 = (Math.round((+this._panel.sum2) * 100) / 100).toFixed(this._panel.decimals2);
      } else {
        if (this._panel.decimals2 !== "string") {
          this._panel.sum2 = (+this._panel.sum2).toFixed(this._panel.decimals2);
        }
      }
      if (this._panel.Isround3) {
        this._panel.sum3 = (Math.round((+this._panel.sum3) * 100) / 100).toFixed(this._panel.decimals3);
      } else {
        if (this._panel.decimals3 !== "string") {
          this._panel.sum3 = (+this._panel.sum3).toFixed(this._panel.decimals3);
        }
      }
      if (this._panel.Isround4) {
        this._panel.sum4 = (Math.round((+this._panel.sum4) * 100) / 100).toFixed(this._panel.decimals4);
      } else {
        if (this._panel.decimals4 !== "string") {
          this._panel.sum4 = (+this._panel.sum4).toFixed(this._panel.decimals4);
        }
      }
      if (this._panel.Isround5) {
        this._panel.sum5 = (Math.round((+this._panel.sum5) * 100) / 100).toFixed(this._panel.decimals5);
      } else {
        if (this._panel.decimals5 !== "string") {
          this._panel.sum5 = (+this._panel.sum5).toFixed(this._panel.decimals5);
        }
      }
      if (this._panel.Isround6) {
        this._panel.sum6 = (Math.round((+this._panel.sum6) * 100) / 100).toFixed(this._panel.decimals6);
      } else {
        if (this._panel.decimals6 !== "string") {
          this._panel.sum6 = (+this._panel.sum6).toFixed(this._panel.decimals6);
        }
      }
      var filterFun = function (item) {
        return item.type === 'teldExpression' && "es" === (item.filter || "es");
      };
      debugger;
       //标题中替换变量的值
       var templateSrv_value = this.templateSrv.teldExpression2ScopedVarsFormCache('ABCD', {}, 'lucene', filterFun);
      //超链接中的变量替换成参数值
      this._panel.href1=this.templateSrv.replace(this.toTrim(this.panel.href1),templateSrv_value);
      this._panel.href2=this.templateSrv.replace(this.toTrim(this.panel.href2),templateSrv_value);
      this._panel.href3=this.templateSrv.replace(this.toTrim(this.panel.href3),templateSrv_value);
      this._panel.href4=this.templateSrv.replace(this.toTrim(this.panel.href4),templateSrv_value);
      this._panel.href5=this.templateSrv.replace(this.toTrim(this.panel.href5),templateSrv_value);
      this._panel.href6=this.templateSrv.replace(this.toTrim(this.panel.href6),templateSrv_value);
      if (this._panel.sum1 == "NaN") {
        this._panel.sum1 = 0;
      }
      if (this._panel.sum2 == "NaN") {
        this._panel.sum2 = 0;
      }
      if (this._panel.sum3 == "NaN") {
        this._panel.sum3 = 0;
      }
      if (this._panel.sum4 == "NaN") {
        this._panel.sum4 = 0;
      }
      if (this._panel.sum5 == "NaN") {
        this._panel.sum5 = 0;
      }
      if (this._panel.sum6 == "NaN") {
        this._panel.sum6 = 0;
      }
      if (this._panel.thousandSeparator1) {
        this._panel.sum1 = this.toThousands(this._panel.sum1);
      }
      if (this._panel.thousandSeparator2) {
        this._panel.sum2 = this.toThousands(this._panel.sum2);
      }
      if (this._panel.thousandSeparator3) {
        this._panel.sum3 = this.toThousands(this._panel.sum3);
      }
      if (this._panel.thousandSeparator4) {
        this._panel.sum4 = this.toThousands(this._panel.sum4);
      }
      if (this._panel.thousandSeparator5) {
        this._panel.sum5 = this.toThousands(this._panel.sum5);
      }
      if (this._panel.thousandSeparator6) {
        this._panel.sum6 = this.toThousands(this._panel.sum6);
      }
    } else if (this._panel.teldtemplate == "teldboard") {
      if (dataList.length > 0 && dataList[0].type === 'table') {
        this.dataType = 'table';
        this.rowObj = [];
        for (var i = 0; i < dataList.length; i++) {
          for (var j = 0; j < dataList[i].rows.length; j++) {
            for (var k = 0; k < dataList[i].rows[j].length; k++) {
              //this._panel['sum' + sumint] = dataList[i].rows[j][k];
              let key = dataList[i].columns[k].text;
              let value = dataList[i].rows[j][k];
              this.rowObj[key] = value;
            }
          }
        }
        this.filterDataList = {
          "vars": bindVars,
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
          "vars": bindVars,
          "BindData": this.filterData
        }
      }
      let compiled = _.template(this._panel.teldtemplatetext, this.templateSettings);
      this._panel.cellHtml = compiled(this.filterDataList);
      this._panel.cellHtml = this.templateSrv.replace(this._panel.cellHtml);
      this._panel.cellHtml = this.sce.trustAsHtml(this._panel.cellHtml);
    }
    this.render();
  }
  toTrim(text){
    return text.replace(/(^\s*)|(\s*$)/g, "");
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

RichDocumentsCtrl.templateUrl = 'module.html';
