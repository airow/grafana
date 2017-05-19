///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import { PanelCtrl } from 'app/plugins/sdk';
import appEvents from 'app/core/app_events';

export class TeldIframePanelCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  remarkable: any;
  content: string;

  src: string;
  datasource: string;
  style: any;
  dsSegment: any;
  metricSources: any[];
  variables: any[];
  // Set and populate defaults
  panelDefaults = {
    mode: "markdown", // 'html', 'markdown', 'text'
    content: "# title",

    iframeWidth: '100%',
    iframeHeight: '100%',
    src: '',
    datasource: 'default',
    variables: []
  };

  /** @ngInject **/
  constructor($scope, $injector, private templateSrv, private $sce, private $rootScope, private timeSrv,
    private variableSrv, private dashboardSrv, private uiSegmentSrv, private datasourceSrv) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));

    /*grafana与kibana时间同步
    appEvents.on('time-range-changed', this.onTimeRangeChanged.bind(this));
    */

    /*控制grafana时间空间是否显示*/
    this.$rootScope.showTimepicker = !(this.panel.syncRowTimeRange = this.panel.syncRowTimeRange || false);

    this.datasource = this.panel.datasource || this.panelDefaults.datasource;
    this.metricSources = datasourceSrv.getMetricSources();
    this.dsSegment = uiSegmentSrv.newSegment({ value: this.datasource, selectMode: true });

    this.variables = this.panel.variables || this.panelDefaults.variables;

    this.currentVariable = {};
    this.variableSegment = uiSegmentSrv.newSegment({ value: 'default', selectMode: true });

    //接收PostMessage发送过来的消息，通过Angular-Post-Message组件
    let messageIncomingHandler = $scope.$root.$on('$messageIncoming', this.messageIncoming.bind(this));
    $scope.$on('$destroy', function () {
      messageIncomingHandler();
      messageIncomingHandler = null;
    });
  }

  isloaded = false;

  messageIncoming(event, data) {
    console.group("grafana");

    let eventData = angular.fromJson(data);

    let that = this;

    let messageIncomingHandlerConfin = {
      "syncTimeRange": function (eventData) {
        that.onTimeRangeChanged(that.timeSrv.time);
        that.isloaded = true;
      },
      "kibana.Query": function (eventData) {

        let esQueryDSL = eventData.eventArgs.esQueryDSL;

        let tmpSrv = that.templateSrv;

        that.templateSrv.getAdhocFilters("TeldElasticsearch");

        //let variable_teldCustom = that.variableSrv.addVariable({type: 'teldCustom',name : 'teldana.TeldCustom'});

        let teldanaAdhocModel = { type: 'teldAdhoc', name: 'teldana_Adhoc' };
        let indexOf = _.findIndex(that.variableSrv.variables, teldanaAdhocModel);
        let variable;
        if (indexOf === -1) {
          variable = that.variableSrv.addVariable(teldanaAdhocModel);
          variable.hide = 2;
        } else {
          variable = that.variableSrv.variables[indexOf];
        }
        variable.datasource = that.datasource;

        //_.get(esQueryDSL, 'must[0].match["电站名称.keyword"]').query
        let filters = [];
        // if (esQueryDSL.must.length > 0) {
        //   filters.push(
        //     { key: "电站名称.keyword", operator: "=", value: _.get(esQueryDSL, 'must[0].match["电站名称.keyword"]').query }
        //   );

        // }

        variable.esQueryDSL = esQueryDSL;

        variable.setFilters(filters);

        that.variableSrv.templateSrv.updateTemplateData();
        that.dashboardSrv.getCurrent().updateSubmenuVisibility();

        that.refreshDashboard();
        console.log(eventData);
      },
      "kibana.RowSelected": function (eventData) {
        let row = eventData.eventArgs.row;
        let timeRange = eventData.eventArgs.timeRange;

        //根据配置同步时间范围
        if (that.panel.syncRowTimeRange) {

          var startTime = row._source[that.panel.startDateField] || timeRange.min;
          var endTime = row._source[that.panel.endDateField] || timeRange.max;

          that.$scope.$apply(function () {
              that.timeSrv.setTime({
                from: moment.utc(startTime),
                to: moment.utc(endTime),
              });
            });
        }

        let def = that.variables;

        function setT(config) {
          let teldCustomModel = { type: 'teldCustom', name: config.name };
          let indexOf = _.findIndex(that.variableSrv.variables, teldCustomModel);
          let variable;
          let current = { text: config.value, value: config.value };
          if (indexOf === -1) {
            variable = that.variableSrv.addVariable({ type: 'teldCustom' });
            variable.hide = 2;
            variable.name = variable.label = teldCustomModel.name;
          } else {
            variable = that.variableSrv.variables[indexOf];
            if (variable.current.value === current.value) {
              current.text = current.value = '';
            }
          }
          that.variableSrv.setOptionAsCurrent(variable, current);
        }


        def.forEach(element => {
          if (row._source[element.field]) {
            let value = _.defaults({ value: row._source[element.field] }, element);
            setT(value);
          }
        });

        that.variableSrv.templateSrv.updateTemplateData();
        that.dashboardSrv.getCurrent().updateSubmenuVisibility();

        /* 在此处执行刷新会产生重复查询的情况，故注释掉
        //that.refreshDashboard();
        */
        console.log(eventData);
      }
    };

    let messageIncomingHandler = messageIncomingHandlerConfin[eventData.eventType] || function (eventData) {
      console.log(eventData);
      console.log(`无${eventData.eventType}对应消息的处理方法`);
    };

    messageIncomingHandler(eventData);

    console.groupEnd();
  }

  onTimeRangeChanged(time) {
    let postMessage = {
      "eventType": "timeRangeChanged",
      "eventArgs": time
    };
    console.log(postMessage);
    this.$scope.$emit('$messageOutgoing', angular.toJson(postMessage));
  }

  getOptions() {
    return Promise.resolve(this.metricSources.map(value => {
      return this.uiSegmentSrv.newSegment(value.name);
    }));
  }

  getFieldsInternal() {
    // if ($scope.agg.type === 'cardinality') {
    //   return $scope.getFields();
    // }
    //return this.getFields({ $fieldType: 'number' });
    return this.getFields();
  }

  getFields() {
    var that = this;
    var jsonStr = angular.toJson({ find: 'fields' });
    var dsName = this.datasource;

    return this.datasourceSrv.get(dsName).then(function (ds) {
      return ds.metricFindQuery(jsonStr);
    })
    .then(this.uiSegmentSrv.transformToSegments(false))
    .catch(this.handleQueryError.bind(this));
  }

  handleQueryError(err) {
    this.error = err.message || 'Failed to issue metric query';
    return [];
  }

  newVariable() {
    this.currentVariable = {};
    this.variables.push(this.currentVariable);
  }

  currentVariable: any;
  variableSegment: any;

  removeVariable(variable) {
    var index = _.indexOf(this.variables, variable);
    this.variables.splice(index, 1);
    this.panel.Variables = this.variables;
  }

  getOptionsWithMapping() {
    return Promise.resolve(this.metricSources.map(value => {
      return this.uiSegmentSrv.newSegment(value.name);
    }));
  }

  datasourceChanged() {
    this.panel.datasource = this.panelDefaults.datasource = this.datasource = this.dsSegment.value;
    this.renderingCompleted();
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  sendMessage() {
    this.$scope.$emit('$messageOutgoing', angular.toJson({ "response": "I'm grafana." }));
  };

  onInitEditMode() {
    //this.addEditorTab('Options', 'partials/editor.html');
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-iframe-panel/partials/editor.html');
    this.addEditorTab('Variables', 'public/app/plugins/panel/teld-iframe-panel/partials/variables.html');
    this.editorTabIndex = 1;
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    this.src = this.$sce.trustAsResourceUrl(this.panel.src);
    this.style = {
      "border": 'none',
      "width": this.panel.iframeWidth,
      "height": this.panel.iframeHeight
    };
    //this.datasource = this.panel.datasource;
    this.renderingCompleted();
  }
}

export { TeldIframePanelCtrl as PanelCtrl }
