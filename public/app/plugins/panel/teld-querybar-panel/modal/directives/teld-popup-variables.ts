///<reference path="../../../../../headers/common.d.ts" />

import kbn from 'app/core/utils/kbn';
import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';

export class PopupVariablesCtrl {
  alertSrv: any;
  panel: any;
  panelCtrl: any;
  dashboard: any;
  targetExport: any;
  links: any[];
  variables: any[];
  getListIntervalHandle: any;
  fields: any[];
  ADMdtp: any;
  OperatorConf: any;

  domain: string;
  slug: string;
  analysis: string;
  variablesGroup: any;
  selectedTab: any;
  /** @ngInject */
  constructor(alertSrv, private $http, private templateSrv, private $interval, private $scope, private $routeParams, private timeSrv) {
    this.alertSrv = alertSrv;
    this.panel = this.$scope.panel;
    this.panelCtrl = this.$scope.panelCtrl;
    this.dashboard = this.$scope.dashboard;
    this.targetExport = this.$scope.targetExport;
    this.variables = _.cloneDeep(this.$scope.variables);

    this.ADMdtp = {
      calType: 'gregorian',
      format: 'YYYY-MM-DD hh:mm',
      multiple: false,
      dtpType: 'date',
      gregorianDic: {
        title: 'Gregorian',
        monthsNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        daysNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        todayBtn: '今天',
      }
    };

    _.each(this.variables, item => {
      if (item.field && item.field.type === 'date') {
        item.field.ADMdtp = _.assign({}, this.ADMdtp, _.pick(item.field, ["format", "dtpType"]));
      }
    });

    // debugger;
    this.variablesGroup = _.groupBy(this.variables, 'scope');
    var keys = _.keys(this.variablesGroup);
    this.groupTabs = _.filter(this.varGroupMapping, (item, index) => {
      return _.includes(keys, "" + item.scope);
    });
    this.selectedTab = _.first(this.groupTabs).name;
  }

  groupTabs: any;
  varGroupMapping = [
    { scope: "g", "name": "过滤" },
    { scope: "dash", "name": "面板过滤" },
    // { "name": "过滤" }
  ];

  addSegment(logical, segment?) {
    var newSegment = { logical, expression: [{}] };
    if (segment) {
      var index = _.findIndex(this.variables, segment);
      this.variables.splice(index + 1, 0, newSegment);
    } else {
      this.variables.push(newSegment);
    }
  }

  addExpression(segment) {
    segment.expression = segment.expression || [];
    segment.expression.push({});
  }

  addExpressionWithLogical(segment) {
    var logical = segment.logical;
    switch (logical) {
      case "OR":
        this.addExpression(segment);
        break;
      default:
        this.addSegment(logical, segment);
        break;
    }
  }

  removeExp(segment, exp) {
    var expression = segment.expression;
    _.remove(expression, exp);
    if (_.size(expression) === 0) {
      _.remove(this.variables, segment);
    }
  }

  submit() {
    this.panelCtrl.fillVariable(this.variables);
    // this.timeSrv.refreshDashboard();
    this.$scope.dismiss();
  }
}

export function popupVariablesDirective() {
  return {
    restrict: 'E',
    templateUrl: '/public/app/plugins/panel/teld-querybar-panel/modal/directives/teld-popup-variables.html',
    controller: PopupVariablesCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
  };
}

coreModule.directive('teldPopupVariables', popupVariablesDirective);
