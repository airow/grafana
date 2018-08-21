///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import {Variable, assignModelProperties, variableTypes} from './variable';
import {VariableSrv} from './variable_srv';

export class TeldExpressionVariable implements Variable {
  query: string;
  options: any[];
  current: any;

  defaults = {
    type: 'teldExpression',
    name: '',
    hide: 2,
    label: '',
    query: '',
    current: {},
    options: [],
    canSaved: true,
    filter: ""
  };

  /** @ngInject **/
  constructor(private model, private variableSrv) {
    assignModelProperties(this, model, this.defaults);
  }

  getSaveModel() {
    assignModelProperties(this.model, this, this.defaults);
    return this.model;
  }

  setValue(option) {
    this.variableSrv.setOptionAsCurrent(this, option);
  }

  updateOptions() {
    this.options = [{text: this.query.trim(), value: this.query.trim()}];
    this.setValue(this.options[0]);
    return Promise.resolve();
  }

  dependsOn(variable) {
    return false;
  }

  setValueFromUrl(urlValue) {
    return this.variableSrv.setOptionFromUrl(this, urlValue);
  }

  getValueForUrl() {
    return this.current.value;
  }

}

variableTypes['teldExpression'] = {
  name: 'TeldExpression',
  ctor: TeldExpressionVariable,
  description: '用于定义公共查询条件，适用于ES数据源' ,
};
