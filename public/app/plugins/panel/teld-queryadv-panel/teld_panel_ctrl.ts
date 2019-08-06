///<reference path="../../../headers/common.d.ts" />

import { PanelCtrl } from 'app/plugins/sdk';
// import { metricsEditorComponent } from './editor_component/metrics_editor';
// import { optionsEditorComponent } from './editor_component/options_editor';
import $ from 'jquery';
import _ from 'lodash';
import async from 'async';
import numeral from 'numeral';
import angular from 'angular';
import kbn from 'app/core/utils/kbn';
import * as dateMath from 'app/core/utils/datemath';
import moment from 'moment';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
// import './directives/all';
import { loadPluginCss } from 'app/plugins/sdk';
import * as rangeUtil from 'app/core/utils/rangeutil';
import './modal/index';
import { variableTypes } from '../../../features/templating/variable';
import { fieldsConfEditorComponent } from './editor_component/fieldsConf_editor';

System.import('/public/app/plugins/panel/teld-queryadv-panel/css/css.built-in.css!css');

// loadPluginCss({
//   dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.3.0.8.built-in.css',
//   light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.3.0.8.built-in.css'
// });

// loadPluginCss({
//   dark: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css',
//   light: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.built-in.css'
// });

export class TeldPanelCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  // Set and populate defaults
  panelDefaults = {
    height: 10,
    fieldsConf: [],
    variableList: [],
    isCollapse: false,
    saveVariableLocalStoragePrefix: _.uniqueId('def')
  };

  $window: any;
  $q: any;
  datasourceSrv: any;
  timeSrv: any;
  variableSrv: any;
  alertSrv: any;
  uiSegmentSrv: any;
  segments: any;
  fields: any[];
  filterVariables: any;

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.$window = $injector.get("$window");
    this.$q = $injector.get('$q');
    this.datasourceSrv = $injector.get('datasourceSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.variableSrv = $injector.get('variableSrv');
    this.alertSrv = $injector.get('alertSrv');
    this.uiSegmentSrv = $injector.get('uiSegmentSrv');
    this.filterVariables = {};

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));


    // this.panel.fieldsConf.push({
    //   name: "asdf", type: "date",
    //   operatorList: [
    //     { key: "=", display: "等于" },
    //     { key: ">", display: ">" },
    //     { key: ">=", display: ">=" },
    //     { key: "<", display: "<" },
    //     { key: "<=", display: "<=" }],
    //   ds: [{ bindVariable: 'var1', field: "asdf-field", format: "" }]
    // });
    // this.panel.fieldsConf.push({ name: "number", type: "number", ds: [{ bindVariable: 'var2', field: "number-field", format: "" }] });

    // this.panel.variableList = [
    //   // { variableName: "var1", fields: [{ name: "asdf", dsName: 'ds1' }] },
    //   // { variableName: "var2", fields: [{ name: "number", dsName: 'ds1' }] }

    //   { variableName: "var1", dsType: "ES" },
    //   { variableName: "var2", dsType: "SQL" }
    // ];

    this.segments = [
      // { logical: "AND", expression: [{ field: { name: "AND1", type: "number" }, operator: "asdf", value: "value" }] },
      // { logical: "AND", expression: [{ field: { name: "AND2", type: "date" }, operator: "asdf", value: "" }] },
      // { logical: "OR", expression: [{ field: { name: "OR", type: "number" }, operator: "asdf", value: "value" }] },
      // {
      //   logical: "OR",
      //   expression: [
      //     { field: { name: "OR2", type: "number" }, operator: "asdf", value: "value" },
      //     { field: { name: "OR3", type: "number" }, operator: "asdf", value: "value" }
      //   ]
      // },
      // {
      //   logical: "OR",
      //   expression: [
      //     { field: { name: "AND", type: "number" }, operator: "asdf", value: "value" },
      //     { field: { name: "AND", type: "number" }, operator: "asdf", value: "value" }
      //   ]
      // },
      // { logical: "AND", not: true, expression: [{ field: { name: "AND", type: "number" }, value: "value", operator: "asdf" }] }
    ];

    this.segments = [{
      "logical": "AND",
      "expression": [{
        "$$hashKey": "object:128",
        "field": {
          "name": "asdf",
          "type": "date",
          "ds": [{
            "bindVariable": "var1",
            "field": "asdf-field",
            "format": ""
          }
          ],
          "$$hashKey": "object:150"
        },
        "operator": {
          "display": "=",
          "operator": "${field}:[${value} TO ${value}]",
          "$$hashKey": "object:162"
        },
        "value": "2019-07-02 00:00"
      }
      ],
      "$$hashKey": "object:126"
    }, {
      "logical": "OR",
      "expression": [{
        "$$hashKey": "object:296",
        "field": {
          "name": "asdf",
          "type": "date",
          "ds": [{
            "bindVariable": "var1",
            "field": "asdf-field",
            "format": ""
          }
          ],
          "$$hashKey": "object:150"
        },
        "operator": {
          "display": "=",
          "operator": "${field}:[${value} TO ${value}]",
          "$$hashKey": "object:162"
        },
        "value": "2019-07-03 00:00"
      }
      ],
      "$$hashKey": "object:294"
    }
    ];

    this.segments = [];

    this.fillVariable(this.segments);
  }

  fillVariable(newSegments) {
    //debugger;
    this.segments = newSegments;
    var variableList = this.panel.variableList;

    _.each(variableList, varItem => {

      var filterSegments = _.transform(newSegments, (resultSegments, segment) => {
        var filterExpression = _.transform(segment.expression, (resultExp, exp) => {
          var ds = _.find(exp.field.ds, { bindVariable: varItem.variableName });
          if (ds) {
            var newExp = _.pick(exp, ['field', 'operator', 'value']);
            newExp.ds = ds;
            resultExp.push(newExp);
          }
        }, []);

        if (_.size(filterExpression) > 0) {
          resultSegments.push({ logical: segment.logical, not: segment.not, expression: filterExpression });
        }
      }, []);
      //debugger;

      var query = [];
      _.each(filterSegments, eachSegment => {
        query.push("AND");
        var expression = [];
        _.each(eachSegment.expression, e => {
          //field: { name: "AND1", type: "number" }, operator: "asdf", value: "value" }
          // expression.push(` ${e.field.name} ${e.operator.display} ${e.value} `);
          console.log(varItem);
          var s = this.genString(varItem, e);
          expression.push(s);
        });

        var expressionString = _.join(expression, " " + eachSegment.logical + " ");

        if (eachSegment.logical === "OR" && _.size(expression) > 1) {
          expressionString = ` ( ${expressionString} )`;
        }
        query.push((eachSegment.not ? " NOT " : "") + expressionString);
      });
      // query.shift();
      query = _.remove(query);
      query = _.dropWhile(query, item => { return _.includes(["AND", "OR"], item); });
      query = _.dropRightWhile(query, item => { return _.includes(["AND", "OR"], item); });
      query = _.join(query, " ");

      var variableName = `${this.panel.prefix ? this.panel.prefix + "_" : ""}${varItem.variableName}`;
      console.log(this.filterVariables);
      var variable = _.get(this.filterVariables, variableName);
      variable = variable || this.addVariable(variableName);
      if (_.isEmpty(varItem.joint)) {
        variable.query = query;
      } else {
        variable.query = ` ${varItem.joint}  ${query ? "AND " + query : query}`;
      }
      variable.current = { value: query, text: query };
    });
    this.variableSrv.templateSrv.updateTemplateData();
  }

  OperatorConf = {
    "ES": {
      "string": [
        { key: "=", display: "等于", operator: "${field}:/${value}/" },
        { key: "like", display: "包含", operator: "${field}:[${value} TO ${value}]" },
      ],
      "date": [
        { key: "=", display: "等于", operator: '${field}:["${value}" TO "${value}"]' },
        { key: ">", display: "大于", operator: '${field}:{"${value}" TO *]' },
        { key: ">=", display: "大于等于", operator: '${field}:["${value}" TO *]' },
        { key: "<", display: "小于", operator: '${field}:[* TO "${value}"}' },
        { key: "<=", display: "小于等于", operator: '${field}:[* TO "${value}"}' },
      ],
      "number": [
        { key: "=", operator: "${field}:${value}" },
        { key: ">", operator: "${field}:>${value}" },
        { key: ">=", operator: "{field}:>=${value}" },
        { key: "<", operator: "${field}:<${value}" },
        { key: "<=", operator: "${field}:<=${value}" },
      ]
    },
    "SQL": {
      "string": [
        { key: "=", display: "等于", operator: "${field} ='${value}'" },
        { key: "like", display: "包含", operator: "${field} LIKE '%${value}%'" },
        { key: "like_L", display: "左包含", operator: "${field} LIKE '${value}%'" },
        { key: "like_R", display: "右包含", operator: "${field} LIKE '%${value}'" },
      ],
      "date": [
        { display: "=", operator: "${field} ='${value}'" },
        { display: ">", operator: "${field} >'${value}'" },
        { display: ">=", operator: "${field} >='${value}'" },
        { display: "<", operator: "${field} < '${value}'" },
        { display: "<=", operator: "${field} < '${value}'" },
      ],
      "number": [
        { display: "=", operator: "${field} = ${value}" },
        { display: ">", operator: "${field} > ${value}" },
        { display: ">=", operator: "{field} >= ${value}" },
        { display: "<", operator: "${field} < ${value}" },
        { display: "<=", operator: "${field} <= ${value}" },
      ]
    }
  };

  genString(varItem, e) {
    //debugger;
    var OperatorConf = this.OperatorConf;

    var bindValue = e.value;
    if (e.field.type === 'date') {
      var ds = e.field.ds[0];
      if (false === _.isEmpty(ds.format)) {
        bindValue = moment(bindValue, e.field.format).format(ds.format);
      }
    }

    var o = OperatorConf[varItem.dsType];
    var dataType = o[e.field.type];
    var oop = _.find(dataType, _.pick(e.operator, ['key']));
    var operatortemplate = oop ? oop.operator : "${field} ${operator} ${value}";
    var returnValue = _.template(operatortemplate)({ field: e.ds.field, operator: e.operator.key, value: bindValue });
    return returnValue;
  }

  addVariable(variableName) {
    let variable = this.variableSrv.addVariable({
      hide: 2,
      type: 'teldExpression',
      name: `${variableName}`,
      query: '',
      current: { value: "", text: "" },
      canSaved: false
    });
    _.set(this.filterVariables, variable.name, variable);
    return variable;
  }

  remove(x, item) {
    _.remove(x.expression, item);
    if (_.size(x.expression) === 0) {
      _.remove(this.segments, x);
    }
    this.fillVariable(this.segments);
    this.timeSrv.refreshDashboard();
  }

  modifySegments(bindData) {

    // var links = parsing(linksConf, bindData, templateSrv, timeSrv);
    // if (_.size(links) === 1 && panel.jumpStraight) {
    //   var link = links[0];
    //   var goHref = $("<a>").attr('href', link.href).attr('target', link.target);
    //   goHref[0].click();
    //   goHref.remove();
    //   return;
    // }

    ////debugger;
    var popupModalScope = this.$scope.$new();
    popupModalScope.$on("$destroy", function () {
      popupModalScope.dismiss();
    });
    popupModalScope.panel = this.panel;
    popupModalScope.panelCtrl = this;
    popupModalScope.segments = this.segments;

    var scrollY = window.scrollY;
    this.$scope.$root.appEvent('show-modal', {
      modalClass: "teld-popup-segments",
      templateHtml: '<teld-popup-segments></teld-popup-segments>',
      scope: popupModalScope
    });

    popupModalScope.$on('modal-shown', function (ve) {
      window.scrollTo(0, scrollY);
      $(".teld-popup-segments").css('top', scrollY + $(window).height() / 4);
    });
  }

  onInitEditMode() {
    this.addEditorTab('Fields', fieldsConfEditorComponent);
  }

  onDataError() {
    this.render();
  }

  onRender() {
    console.log('onRender');
    this.renderingCompleted();
  }

  imports = {
    '_': _,
    'kbn': kbn,
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
  };

  alert(s) {
    window.alert(s);
  }

}
