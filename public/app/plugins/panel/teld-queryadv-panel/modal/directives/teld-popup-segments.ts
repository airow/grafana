///<reference path="../../../../../headers/common.d.ts" />

import kbn from 'app/core/utils/kbn';
import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';

export class PopupSegmentsCtrl {
  alertSrv: any;
  panel: any;
  panelCtrl: any;
  dashboard: any;
  targetExport: any;
  links: any[];
  segments: any[];
  getListIntervalHandle: any;
  fields: any[];
  ADMdtp: any;
  OperatorConf: any;

  domain: string;
  slug: string;
  analysis: string;
  /** @ngInject */
  constructor(alertSrv, private $http, private templateSrv, private $interval, private $scope, private $routeParams, private timeSrv) {
    this.alertSrv = alertSrv;
    this.panel = this.$scope.panel;
    this.panelCtrl = this.$scope.panelCtrl;
    this.dashboard = this.$scope.dashboard;
    this.targetExport = this.$scope.targetExport;
    this.segments = _.cloneDeep(this.$scope.segments);
    this.links = [];

    // this.fields = ['a', 'b', 'c'];
    this.fields = this.panel.fieldsConf;

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

    this.OperatorConf = {
      "string": [
        { key: "=", display: "等于" },
        { key: "like", display: "包含" },
      ],
      "date": [
        { key: "=", display: "=" },
        { key: ">", display: ">" },
        { key: ">=", display: ">=" },
        { key: "<", display: "<" },
        { key: "<=", display: "<=" },
      ],
      "number": [
        { key: "=", display: "=" },
        { key: ">", display: ">" },
        { key: ">=", display: ">=" },
        { key: "<", display: "<" },
        { key: "<=", display: "<=" },
      ]
    };

    // this.OperatorConf = this.panelCtrl.OperatorConf;

    _.values(this.panelCtrl.OperatorConf);
  }

  getOperatorByType(exp) {
    if (exp.field) {
      var operatorList = this.OperatorConf[exp.field.type] || [];
      if (_.size(exp.field.operatorList) > 0) {
        operatorList = _.filter(operatorList, item => { return _.includes(exp.field.operatorList, item.key); });
      }
      return operatorList;
    } else {
      return [];
    }
  }

  genADMdtp(field, pickFields) {
    return _.assign(this.ADMdtp, _.pick(field, pickFields));
  }

  addSegment(logical, segment?) {
    var newSegment = { logical, expression: [{}] };
    if (segment) {
      var index = _.findIndex(this.segments, segment);
      this.segments.splice(index + 1, 0, newSegment);
    } else {
      this.segments.push(newSegment);
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
      _.remove(this.segments, segment);
    }
  }

  submit() {
    this.panelCtrl.fillVariable(this.segments);
    this.timeSrv.refreshDashboard();
    this.$scope.dismiss();
  }
}

export function popupSegmentsDirective() {
  return {
    restrict: 'E',
    templateUrl: '/public/app/plugins/panel/teld-queryadv-panel/modal/directives/teld-popup-segments.html',
    controller: PopupSegmentsCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
  };
}

coreModule.directive('teldPopupSegments', popupSegmentsDirective);
