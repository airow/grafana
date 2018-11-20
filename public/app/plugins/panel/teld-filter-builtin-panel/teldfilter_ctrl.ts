///<reference path="../../../headers/common.d.ts" />
import { PanelCtrl, loadPluginCssPath } from 'app/plugins/sdk';
import moment from 'moment';
import _ from 'lodash';
import timeCycleConf from 'app/features/panel/timeCycleConf';

loadPluginCssPath({
  cssPath: '/public/app/plugins/panel/teld-filter-builtin-panel/css/teld-filter.built-in.css'
});
export class TeldfilterCtrl extends PanelCtrl {
  static templateUrl = `module.html`;
  panelDefaults = {
    ButtonOkColor: '#4ea9f1',
    ButtonCancelColor: '',
    ButtonResetColor: '',
    QueryOptions: false,
    myDefaultDateFormat: 'yyyy-MM-dd',
    FilterTitle: "",
    IsLocalStorage: true,
    versions: "",
    QueryList: [{
      QueryTitle: "",
      QueryClickName: "",
      QueryAttributeName: "",
      QueryClickVal: "",
      Querytype: "button",
      MultiClick: false,
      aloneReleaseAttribute: true,
      isViewShow: true,
      IsLocalStorage: false,
      QueryOptions: [{
        OptionName: "",
        ClickValue: "",
        TimeClickValue: "",
        QueryAttributeName: "",
        CheckoutTimeAttribute: "",
        Checkoutwhere: '',
        isClick: false,
        opened: false
      }]
    }],
    // VariableList: [{
    //   VariableName: '',
    //   VariableValue: ''
    // }]
  };
  _panle: any;
  KwHuTuCaoDropDown: any;
  variableSrv: any;
  timeSrv: any;
  alertSrv: any;
  datemoment: any;
  _panleQueryList: any[];
  opend: any;
  dateOptions: any;
  myDateformats: any;
  myDefaultDateFormat: any;
  querybarDsVariable: any;
  tomorrow: any;
  afterTomorrow: any;
  btnFilterKHRed: any;
  constructor($scope, $injector) {
    super($scope, $injector);
    _.defaultsDeep(this.panel, this.panelDefaults);
    this._panle = _.cloneDeep(this.panel);
    this.KwHuTuCaoDropDown = false;
    // var script = document.createElement("script");
    // script.type = "text/javascript";
    // script.src = "./src/angular-locale_zh-cn.js";
    // document.body.appendChild(script);

    //start 年、月、日等切换按钮 初始化
    this.panel.cycleConf = this.panel.cycleConf || [];
    var filterCycle = _.filter(_.clone(timeCycleConf), item => { return item.disable !== true; });
    _.defaults(this.panel.cycleConf, filterCycle);
    //end 年、月、日等切换按钮

    this.variableSrv = $injector.get('variableSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.alertSrv = $injector.get('alertSrv');
    this.btnFilterKHRed = false;
    this.datemoment = {
      moment: moment
    };
    for (var i = 0; i < this._panle.QueryList.length; i++) {
      if (this._panle.QueryList[i].Querytype === "date") {
        for (var j = 0; j < this._panle.QueryList[i].QueryOptions.length; j++) {
          if (this._panle.QueryList[i].QueryOptions[j].TimeClickValue) {
            this._panle.QueryList[i].QueryOptions[j].ClickValue = new Date(
              _.template(this._panle.QueryList[i].QueryOptions[j].TimeClickValue, { 'imports': { m: this.datemoment } })()
            );
          }
        }
      }
    }
    //m.moment is not a function
    // for (var i = 0; i < this.panel.VariableList.length; i++) {
    //   if (this.panel.VariableList[i].VariableName) {
    //     var variable = this.variableSrv.addVariable({
    //       hide: 2,
    //       type: 'teldCustom',
    //       name: `${this.panel.VariableList[i].VariableName}`,
    //       query: '',
    //       current: { value: this.panel.VariableList[i].VariableValue, text: "表达式" }
    //     });
    //   }
    // }
    // this.variableSrv.templateSrv.updateTemplateData();

    var QueryListCookie = localStorage.getItem(this._panle.FilterTitle);
    var QueryListCookieversions = localStorage.getItem(this._panle.FilterTitle + "versions");
    this._panleQueryList = [];
    if (QueryListCookie) {
      var QueryListlocal = JSON.parse(QueryListCookie);
      if (QueryListCookieversions === this._panle.versions) {
        var _that = this;
        _.forEach(QueryListlocal, (item) => {
          if (item.IsLocalStorage) {
            if (item.MultiClick) {
              item.QueryClickVal = "";
            }
            delete (item["$$hashvalue"]);
            var selectdata = { "QueryAttributeName": item.QueryAttributeName };
            var findeindex = _.findIndex(_that._panle.QueryList, selectdata);
            if (findeindex > -1) {
              _.fill(_that._panle.QueryList, item, findeindex, findeindex + 1);
            }
          }
        });
      } else {
        localStorage.removeItem(this._panle.FilterTitle);
        localStorage.removeItem(this._panle.FilterTitle + "versions");
      }
    }
    this.opend = 1;
    // this.events.on('render', this.onRender.bind(this));
    // this.events.on('data-received', this.onDataReceived.bind(this));
    // this.events.on('data-error', this.onDataError.bind(this));
    // this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    // $scope.onAppEvent('dashboard-saved', function() {
    //   console.log('111111');
    // }.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.setDashboardVariables();
    // this.events.on('panel-initialized', this.render.bind(this));
    this.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };
    // 日期格式数组
    this.myDateformats = ['yyyy-MM-dd', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    // 将日期格式数组第0项设为默认日期格式
    this.myDefaultDateFormat = this.myDateformats[0];
    this.tomorrow = new Date();
    this.tomorrow.setDate(this.tomorrow.getDate() + 1);
    this.afterTomorrow = new Date();
    this.afterTomorrow.setDate(this.tomorrow.getDate() + 2);
    let that = this;
    setTimeout(() => {
      if (document.getElementsByClassName("teldfilterbuiltinpanelIsLocalStorage").length > 0) {
        this.btnFilterKHRed = true;
      } else {
        this.btnFilterKHRed = false;
      }
    }, 500);
  }

  //获取配置的年、月、日等按钮
  getTimeButton() {
    return _.filter(this.panel.cycleConf, 'enable');
  }

  currentCycle: any;
  eh_emitCycle(cycle) {
    if (this.currentCycle === cycle) {
      this.currentCycle = undefined;
      this.$scope.$root.appEvent("emit-clearCycle");
    } else {
      this.currentCycle = cycle;
      this.$scope.$root.appEvent("emit-cycle", { cycle: cycle.key });
    }
    this.setDashboardVariables();
    this.timeSrv.refreshDashboard();
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-filter-builtin-panel/editor/editor.html', 2);
  }
  disabled(date, mode) {
    return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
  };
  onDataError(err) {
    this.onDataReceived([]);
  }
  onRender() {
    console.log('onRender');
    this.renderingCompleted();
  }
  divOperationFilter() {
    var that = this;
    if (that.KwHuTuCaoDropDown) {
      that.KwHuTuCaoDropDown = false;
    } else {
      that.KwHuTuCaoDropDown = true;
      this._panleQueryList = _.cloneDeep(this._panle.QueryList);
    }
    if (!that.KwHuTuCaoDropDown) {
      if (that._panle.IsLocalStorage) {
        var JSONQueryList = JSON.stringify(this._panle.QueryList);
        JSONQueryList = _.replace(JSONQueryList, /hashKey/g, 'hashvalue');
        localStorage.setItem(this._panle.FilterTitle, JSONQueryList);
        localStorage.setItem(this._panle.FilterTitle + "versions", this._panle.versions);
      } else {
        localStorage.removeItem(this._panle.FilterTitle);
        localStorage.removeItem(this._panle.FilterTitle + "versions");
      }
      this.timeSrv.refreshDashboard();
    }
  }
  move(variableArray, index, newIndex) {
    _.move(variableArray, index, newIndex);
  }
  open(QueryOptions, $event) {
    QueryOptions.opened = true;
  };
  removeVariable(variableArray, variable) {
    var index = _.indexOf(variableArray, variable);
    variableArray.splice(index, 1);
  }
  selectVariable(variableArray, Name, Value) {
    variableArray.QueryClickName = Name;
    variableArray.QueryClickVal = Value;
  }
  selectVariableMulti(variableArray, QueryOptions) {
    if (variableArray.isClick) {
      variableArray.isClick = false;
      QueryOptions.QueryClickName = QueryOptions.QueryClickName.replace("," + variableArray.OptionName, "");
    } else {
      variableArray.isClick = true;
      QueryOptions.QueryClickName += "," + variableArray.OptionName;
    }
  }
  initDashboardVariables() {
    _.each(this._panle.QueryList, bindVariable => {
      let variable = this.addDsQueryVariable(bindVariable);
    });

    this.variableSrv.templateSrv.updateTemplateData();
  }
  setDashboardVariables() {
    var reusts = false;
    for (var i = 0; i < this._panle.QueryList.length; i++) {
      if (this._panle.QueryList[i].Querytype === "date") {
        for (var j = 0; j < this._panle.QueryList[i].QueryOptions.length; j++) {
          if (this._panle.QueryList[i].QueryOptions[j].CheckoutTimeAttribute) {
            reusts = this.returnCheckoutTime(
              this._panle.QueryList[i].QueryOptions[j].CheckoutTimeAttribute,
              this._panle.QueryList[i].QueryOptions[j].ClickValue,
              this._panle.QueryList[i].QueryOptions[j].Checkoutwhere
            );
            if (reusts) {
              this.alertSrv.set("警告", "开始时间不能大于结束时间", "warning", 2000);
            }
          }
        }
      }
    }
    if (!reusts) {
      _.each(this._panle.QueryList, bindVariable => {
        let value = "";
        let variable;
        if (!bindVariable.MultiClick) {
          if (bindVariable.Querytype === 'date') {
            _.each(bindVariable.QueryOptions, Variables => {
              if (Variables.ClickValue) {
                if (typeof (Variables.ClickValue) === "string") {
                  Variables.ClickValue = new Date(Variables.ClickValue);
                }
                value = this.formatDate(Variables.ClickValue);

                let text = value;
                //let variablePaths = `${bindVariable.QueryAttributeName}`;
                variable = this.variableSrv.templateSrv.getVariable('$' + Variables.QueryAttributeName, 'teldCustom');
                // this.variableSrv.templateSrv.removeVariable('$' + bindVariable.QueryAttributeName);
                // let variable = _.get(this.querybarVariable, variablePath);

                if (_.isNil(variable)) {
                  variable = this.variableSrv.addVariable({
                    hide: 2,
                    type: 'teldCustom',
                    name: `${Variables.QueryAttributeName}`,
                    query: '',
                    current: { value: value, text: text }
                  });
                }
                variable.current = { text: text, value: value };
              } else {
                this.variableSrv.templateSrv.removeVariable('$' + Variables.QueryAttributeName, 'teldCustom');
              }
            });
          } else {
            value = bindVariable.QueryClickVal;

            let text = bindVariable.QueryClickName;

            //let variablePath = `${bindVariable.QueryAttributeName}`;
            variable = this.variableSrv.templateSrv.getVariable('$' + bindVariable.QueryAttributeName, 'teldCustom');
            // this.variableSrv.templateSrv.removeVariable('$' + bindVariable.QueryAttributeName);
            // let variable = _.get(this.querybarVariable, variablePath);

            if (_.isNil(variable)) {
              variable = this.addDsQueryVariable(bindVariable);
            }
            variable.current = { text: text, value: value };
          }
        } else {
          var VariablesList = "";
          bindVariable.QueryClickVal = "";
          _.each(bindVariable.QueryOptions, (Variables, index) => {
            if (Variables.isClick) {
              value = Variables.ClickValue;
              let text = Variables.OptionName;

              VariablesList += value + " OR ";

              bindVariable.QueryClickVal = VariablesList;
              if (bindVariable.aloneReleaseAttribute) {
                //let variablePaths = `${bindVariable.QueryAttributeName}`;
                variable = this.variableSrv.templateSrv.getVariable('$' + Variables.QueryAttributeName, 'teldCustom');
                // this.variableSrv.templateSrv.removeVariable('$' + bindVariable.QueryAttributeName);
                // let variable = _.get(this.querybarVariable, variablePath);

                if (_.isNil(variable)) {
                  variable = this.variableSrv.addVariable({
                    hide: 2,
                    type: 'teldCustom',
                    name: `${Variables.QueryAttributeName}`,
                    query: '',
                    current: { value: value, text: text }
                  });
                }
                variable.current = { text: text, value: value };
              }
            } else {
              this.variableSrv.templateSrv.removeVariable('$' + Variables.QueryAttributeName, 'teldCustom');
              if (!VariablesList) {
                this.variableSrv.templateSrv.removeVariable('$' + bindVariable.QueryAttributeName, 'teldCustom');
              };
            }
            if (index === bindVariable.QueryOptions.length - 1) {
              if (VariablesList) {
                VariablesList = VariablesList.substring(0, VariablesList.length - 4);
                variable = this.variableSrv.templateSrv.getVariable('$' + bindVariable.QueryAttributeName, 'teldCustom');
                if (_.isNil(variable)) {
                  variable = this.variableSrv.addVariable({
                    hide: 2,
                    type: 'teldCustom',
                    name: `${bindVariable.QueryAttributeName}`,
                    query: '',
                    current: { value: VariablesList, text: bindVariable.QueryTitle }
                  });
                }
                variable.current = { text: bindVariable.QueryTitle, value: VariablesList };
              }
            }
          });
        }
      });
      this.variableSrv.templateSrv.updateTemplateData();
      if (document.getElementsByClassName("teldfilterbuiltinpanelIsLocalStorage").length > 0) {
        this.btnFilterKHRed = true;
      } else {
        this.btnFilterKHRed = false;
      }
    }
  }
  //向dashboard添加变量
  addDsQueryVariable(dsQueryVariable) {
    let variable = this.variableSrv.addVariable({
      hide: 2,
      type: 'teldCustom',
      name: `${dsQueryVariable.QueryAttributeName}`,
      query: '',
      current: { value: dsQueryVariable.QueryClickVal, text: dsQueryVariable.QueryClickName }
    });
    _.set(this.querybarDsVariable, variable.name, variable);
    return variable;
  }
  Filterreset() {
    this._panle.QueryList = _.cloneDeep(this.panel.QueryList);
    for (var i = 0; i < this._panle.QueryList.length; i++) {
      if (this._panle.QueryList[i].Querytype === "date") {
        for (var j = 0; j < this._panle.QueryList[i].QueryOptions.length; j++) {
          if (this._panle.QueryList[i].QueryOptions[j].TimeClickValue) {
            this._panle.QueryList[i].QueryOptions[j].ClickValue = new Date(
              _.template(this._panle.QueryList[i].QueryOptions[j].TimeClickValue, { 'imports': { m: this.datemoment } })()
            );
          }
        }
      }
    }
    if (document.getElementsByClassName("teldfilterbuiltinpanelIsLocalStorage").length > 0) {
      this.btnFilterKHRed = true;
    } else {
      this.btnFilterKHRed = false;
    }
  }
  returnCheckoutTime(Attribute, value, Checkoutwhere) {
    for (var i = 0; i < this._panle.QueryList.length; i++) {
      if (this._panle.QueryList[i].Querytype === "date") {
        for (var j = 0; j < this._panle.QueryList[i].QueryOptions.length; j++) {
          if (this._panle.QueryList[i].QueryOptions[j].QueryAttributeName === Attribute) {
            if (Checkoutwhere === '大于等于') {
              return value <= this._panle.QueryList[i].QueryOptions[j].ClickValue;
            } else if (Checkoutwhere === '小于等于') {
              return value >= this._panle.QueryList[i].QueryOptions[j].ClickValue;
            } else if (Checkoutwhere === '小于') {
              return value > this._panle.QueryList[i].QueryOptions[j].ClickValue;
            } else if (Checkoutwhere === '大于') {
              return value < this._panle.QueryList[i].QueryOptions[j].ClickValue;
            } else {
              return false;
            }
          }
        }
      }
    }
  }
  FilterC() {
    var that = this;
    if (that.KwHuTuCaoDropDown) {
      that.KwHuTuCaoDropDown = false;
      this._panle.QueryList = this._panleQueryList;
    }
    if (document.getElementsByClassName("teldfilterbuiltinpanelIsLocalStorage").length > 0) {
      this.btnFilterKHRed = true;
    } else {
      this.btnFilterKHRed = false;
    }
  }
  formatDate(now) {
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    // var hour = now.getHours();
    // var minute = now.getMinutes();
    // var second = now.getSeconds();
    return year + "-" + (month > 9 ? month : "0" + month) + "-" + (date > 9 ? date : "0" + date);//+" "+hour+":"+minute+":"+second;
  }
  onDataReceived(dataList) {
    // const data = {};
    // if (dataList.length > 0 && dataList[0].type === 'table') {
    //   this.dataType = 'table';
    //   for (var i = 0; i < dataList.length; i++) {
    //     for (var j = 0; j < dataList[i].rows.length; j++) {
    //       for (var k = 0; k < dataList[i].rows[j].length; k++) {
    //         this._panle['sum' + sumint] = dataList[i].rows[j][k];
    //         this._panle['sum' + sumint + '_v'] = '0'
    //         sumint++;
    //       }
    //     }
    //   }

    // } else {
    //   this.dataType = 'timeseries';
    //   for (var i = 0; i < dataList.length; i++) {
    //     for (var j = 0; j < dataList[i].datapoints.length; j++) {
    //       this._panle['sum' + sumint] = dataList[i].datapoints[j][0];
    //       this._panle['sum' + sumint + '_v'] = '0'
    //       sumint++;
    //     }
    //   }

    // }
    // //this.data = data;
    // this.render();
  }
  getDayClass(date, mode) {
    var events =
      [
        {
          date: this.tomorrow,
          status: ''
        },
        {
          date: this.afterTomorrow,
          status: ''
        }
      ];
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

      for (var i = 0; i < events.length; i++) {
        var currentDay = new Date(events[i].date).setHours(0, 0, 0, 0);
        if (dayToCheck === currentDay) {
          return events[i].status;
        }
      }
    }
    return '';
  };
}

//teldfilterCtrl.templateUrl = 'module.html';
