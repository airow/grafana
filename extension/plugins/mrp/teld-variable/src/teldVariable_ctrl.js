import { MetricsPanelCtrl } from 'app/plugins/sdk';
import moment from 'moment';
import _ from 'lodash';
import './css/microtip.css!';
import './css/teld-variable.css!';
import './css/jq22.css!';

const panelDefaults = {
  firstLoad: true,
  tableColumn: "",
  variableValue: "",
  variableName: "",
  quotationMark: "",
  linkValue: "",
  IsReleaseSQL: false,
  variableValueSql: "",
  variableNameSql: "",
  quotationMarkSql: "",
  linkValueSql: ""
};

export class teldVariableCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, $sce) {
    super($scope, $injector);
    _.defaultsDeep(this.panel, panelDefaults);
    this.variableSrv = $injector.get('variableSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.sce = $sce;
    this._panel = _.cloneDeep(this.panel)
    if (this._panel.firstLoad) {
      this.events.on('render', this.onRender.bind(this));
      this.events.on('data-received', this.onDataReceived.bind(this));
      this.events.on('data-error', this.onDataError.bind(this));
      this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    }
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-initialized', this.render.bind(this));
    this.querybarVariable = {};
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/teld-variable/editor.html', 2);
  }
  onDataError(err) {
    this.onDataReceived([]);
  }
  onRender() {
    console.log('onRender');
    this.renderingCompleted();
  }
  setDashboardVariables(Name, value, text, filter) {
    let variablePath = `${Name}`;
    let variable = this.templateSrv.getVariable('$' + Name, 'teldExpression');
    if (_.isNil(variable)) {
      variable = this.addDsQueryVariable(Name, value, text, filter);
    } else {
      //variable.current = { text: text, value: value };
      variable.query = value;
    }
    this.templateSrv.updateTemplateData();
  }
  //向dashboard添加变量
  addDsQueryVariable(Name, value, text, filter) {
    let variable = this.variableSrv.addVariable({
      hide: 2,
      type: 'teldExpression',
      name: `${Name}`,
      query: value,
      canSaved: false,
      filter: filter,
      current: { value: value, text: text }
    });
    return variable;
  }
  onDataReceived(dataList) {
    if (this._panel.firstLoad) {
      this._panel.firstLoad = false;
      if (dataList.length > 0 && dataList[0].type === 'table') {
        this.dataType = 'table';
        this.rowObj = [];
        for (var i = 0; i < dataList.length; i++) {
          for (var j = 0; j < dataList[i].rows.length; j++) {
            for (var k = 0; k < dataList[i].rows[j].length; k++) {
              let values = dataList[i].rows[j][k];
              let valuearray = [];
              if (_.isArray(values)) {
                valuearray = values;
              } else {
                valuearray.push(values);
              }
              for (var l = 0; l < valuearray.length; l++) {
                let value = valuearray[l];
                if (typeof (value) === "object") {
                  value = value[this._panel.tableColumn];
                }
                this._panel.variableValue += (this._panel.quotationMark + value + this._panel.quotationMark + " " + this._panel.linkValue + " ");
                if (this._panel.IsReleaseSQL) {
                  this._panel.variableValueSql += (this._panel.quotationMarkSql + value + this._panel.quotationMarkSql + " " + this._panel.linkValueSql + " ");
                }
              }
            }
          }
        }
      } else {
        this.dataType = 'timeseries';
      }
      if (this._panel.variableValue) {
        this._panel.variableValue = _.trimEnd(this._panel.variableValue, " " + this._panel.linkValue + " ");
      } else {
        this._panel.variableValue = (this._panel.quotationMark + "00000000-0000-0000-0000-000000000000" + this._panel.quotationMark);
      }
      this.setDashboardVariables(this._panel.variableName, this._panel.variableValue, this._panel.variableName);
      if (this._panel.IsReleaseSQL) {
        if (this._panel.variableValueSql) {
          this._panel.variableValueSql = _.trimEnd(this._panel.variableValueSql, " " + this._panel.linkValueSql + " ");
        } else {
          this._panel.variableValueSql = (this._panel.quotationMark + "00000000-0000-0000-0000-000000000000" + this._panel.quotationMark);
        }
        this.setDashboardVariables(this._panel.variableNameSql, this._panel.variableValueSql, this._panel.variableNameSql, "sql");
      }
      this.timeSrv.refreshDashboard();
      this.render();
    }
  }
}

teldVariableCtrl.templateUrl = 'module.html';
