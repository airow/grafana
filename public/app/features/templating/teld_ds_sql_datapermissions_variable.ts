///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import {Variable, assignModelProperties, variableTypes} from './variable';
import {VariableSrv} from './variable_srv';

export class TeldSqlDataPermissionsVariable implements Variable {
  query: string;
  options: any[];
  current: any;

  defaults = {
    type: 'teldSqlDataPermissions',
    name: '',
    hide: 0,
    label: '',
    query: '',
    current: {},
    options: [],
    canSaved: true,
  };
  $http: any;
  /** @ngInject **/
  constructor(private model, private variableSrv, private templateSrv, $http) {
    //this.model.current = {};
    this.$http = $http;
    assignModelProperties(this, model, this.defaults);
    // $http({
    //   method: 'GET',
    //   url: '/datap/' + Date().valueOf()
    // }).then(response => {
    //   // 请求成功执行代码
    //   console.log(response.data);
    //   this.setValue({ text: response.data, value: response.data });
    //   //this.model.current = { text: response.data, value: response.data };
    //   this.templateSrv.updateTemplateData();
    // }, response => {
    //   // 请求失败执行代码
    // });

      //this.templateSrv.updateTemplateData();
  }

  setValue(option) {
    return this.variableSrv.setOptionAsCurrent(this, option);
  }

  getSaveModel() {
    assignModelProperties(this.model, this, this.defaults);
    this.model.current = {};
    return this.model;
    // return this.$http({
    //   method: 'GET',
    //   url: '/datap/' + Date().valueOf()
    // }).then(response => {
    //   // 请求成功执行代码
    //   console.log(response.data);
    //   this.setValue({ text: response.data, value: response.data });
    //   //this.model.current = { text: response.data, value: response.data };
    //   this.templateSrv.updateTemplateData();
    //   return this.model;
    // }, response => {
    //   // 请求失败执行代码
    //   return this.model;
    // });
  }

  updateOptions() {
    // extract options in comma separated string
    this.options = _.map(this.query.split(/[,]+/), function(text) {
      return { text: text.trim(), value: text.trim() };
    });

    return this.variableSrv.validateVariableSelectionState(this);
  }

  dependsOn(variable) {
    return false;
  }

  setValueFromUrl(urlValue) {
    return this.variableSrv.setOptionFromUrl(this, urlValue);
  }

  getValueForUrl() {
    if (this.current.text === 'All') {
      return 'All';
    }
    return this.current.value;
  }
}

variableTypes['teldSqlDataPermissions'] = {
  name: 'TeldSqlDataPermissions',
  ctor: TeldSqlDataPermissionsVariable,
  description: 'SQL数据权限对象' ,
};
