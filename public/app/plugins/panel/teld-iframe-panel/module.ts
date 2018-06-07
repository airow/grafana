///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import { PanelCtrl , loadPluginCssPath } from 'app/plugins/sdk';
import { kibanaEditor } from './editor/kibana';
import { WebsocketEditor } from './editor/websocket';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';

// loadPluginCssPath({
//   cssPath: '/public/app/plugins/panel/teld-iframe-panel/css/teld-iframe-panel.built-in.css',
//   //cssPath: '/public/app/plugins/panel/teld-querybar-panel/css/swiper.3.0.8.built-in.css'
// });

System.import('/public/app/plugins/panel/teld-iframe-panel/css/teld-iframe-panel.built-in.css!css');
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
  variableTypeDataSource: any[];
  isloaded: boolean;
  changePanelStrategyOptions: any;
  search: any;
  currentScene: any;
  $interval: any;

  // Set and populate defaults
  panelDefaults = {
    mode: "markdown", // 'html', 'markdown', 'text'
    content: "# title",

    iframeWidth: '100%',
    iframeHeight: '100%',
    src: '',
    datasource: 'default',
    variables: [],
    isIframe: false,
    kibanaConf: {},
    websocketConf: {
      enable: false,
      scene: [{ buttons: [{}], cmds: [{}] }],
      clocks: { style: { top: '50px', right: '50px', color: '#FFF' } },
      teldlogo: { style: { top: '0px', left: '0px' } }
    },
    containerStyle: {
      'margin-top': '30px',
      'margin-bottom': '20px',
    }
  };

  /** @ngInject **/
  constructor($scope, $injector, private templateSrv, private $sce, private $rootScope, private timeSrv,
    private variableSrv, private dashboardSrv, private uiSegmentSrv, private datasourceSrv, private $location,
    private wsAcrossScreen, $interval) {
    super($scope, $injector);

    this.$interval = $interval;

    this.search = this.$location.search();

    this.variableTypeDataSource = ["custom", "teldCustom"];

    _.defaults(this.panel, this.panelDefaults);

    if (this.panel.isIframe) {
      this.isloaded = true;
    }

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    if (this.panel.websocketConf.enable) {
      this.onRender();
      this.currentScene = _.first(this.panel.websocketConf.scene);
      this.gotoScene(this.currentScene);
    } else {
      this.events.on('render', this.onRender.bind(this));
    }
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));

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
      if ($scope.ctrl.timehandler) {
        $scope.ctrl.$interval.cancel($scope.ctrl.timehandler);
      }
    });

    this.changePanelStrategyOptions = {
      'V1': 'v1',
      'V2': 'v2',
      // 'Data field': 'field',
    };


    if (this.panel.websocketConf.clocks && this.panel.websocketConf.clocks.enable) {
      this.timehandler = this.$interval((function () {
        let m = moment().locale('zh-cn');
        this.clocks = { m, time: m.format('HH:mm:ss'), date: m.format('LL dddd') };
        //this.time = moment().locale('zh-cn').format('HH:mm:ss');
      }).bind(this), 1000);
    }

    // let timeHandle = this.$interval(function () {
    //   console.log(moment().locale('zh-cn').format('HH:mm:ss'));
    //   //this.time = moment().locale('zh-cn').format('HH:mm:ss');
    // }, 1000);

  }
  timehandler: any;
  onInitPanelActions(actions) {
    //actions.push({ text: '最小化', click: 'ctrl.min()' });
    actions.push(this.action_panelstate);
  }

  gotoScene(scene, cmd?) {
    cmd = cmd || _.first(scene.cmds).name;
    this.wsAcrossScreen.sendToAll({ type: cmd, params: {} }, (function (sendContext) {
      //var changeSrc = scene.src;
      var changeSrc = this.formatSrc(scene.src);
      this.src = this.$sce.trustAsResourceUrl(changeSrc);
      console.log('change iframe src to', changeSrc);
    }).bind(this));
  }

  changeScene(nextSceneName) {
    if (nextSceneName === this.currentScene.name) {
      return;
    }
    var findScene = _.find(this.panel.websocketConf.scene, { name: nextSceneName });
    if (_.isNil(findScene)) {
      console.log('asdfasdf');
    } else {
      this.currentScene = findScene;
      this.gotoScene(this.currentScene);
    }
  }

  goto(i){
    // for (var item in UserList) {
    //   if (item != loginname) {
    //     _sk.send(item + "|" + jsondata);
    //   }
    //   console.log(item);
    // }

    var u = { "m1": 'http://localhost/rightbottom-m1.jpg', "m2": 'http://www.qq.com' };

    // ["shfh_shfh2"].forEach(element => {
    //   this.wsAcrossScreen.sendTo(element, { type: i, params: {} });
    //   this.src = u[i];
    // });

    //this.wsAcrossScreen.sendTo('shfh_shfh2', { type: i, params: {} });
    this.wsAcrossScreen.sendToAll({ type: i, params: {} }, (function (sendContext) {
      var changeSrc = u[i];
      this.src = this.$sce.trustAsResourceUrl(changeSrc);
      console.log('change iframe src to', changeSrc);
    }).bind(this));
    //alert(i);
  }

  messageIncoming(event, data) {
    console.group("grafana");

    let eventData = angular.fromJson(data);

    let that = this;

    let messageIncomingHandlerConfin = {
      "kibanaLoaded": function(eventData){
        that.grafanaLink2Kibana();
        that.isloaded = true;
        if (that.panel.panelState && that.panel.panelStateMin && that.changePanelState) {
          that.changePanelState(null);
        }
      },
      "syncTimeRange": function (eventData) {
        that.onTimeRangeChanged(that.timeSrv.time);
        that.isloaded = true;
      },
      "kibana.Query": function (eventData) {

        let esQueryDSL = eventData.eventArgs.esQueryDSL;

        let tmpSrv = that.templateSrv;

        /**
         * 2017-06-29弃用
         *
        that.templateSrv.getAdhocFilters("TeldElasticsearch");

        let teldanaAdhocModel = { type: 'teldAdhoc', name: 'teldana_Adhoc' };
        let indexOf = _.findIndex(that.variableSrv.variables, teldanaAdhocModel);
        let variable;
        if (indexOf === -1) {
          variable = that.variableSrv.addVariable({ type: teldanaAdhocModel.type, canSaved: false });
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
        delete variable.esQueryDSL;//2017-06-29弃用

        variable.setFilters(filters);

        that.variableSrv.templateSrv.updateTemplateData();
        that.dashboardSrv.getCurrent().updateSubmenuVisibility();

        that.refreshDashboard();
        console.log(eventData);
        */
      },
      "kibana.RowSelected": function (eventData) {
        let row = eventData.eventArgs.row;
        let isSelected = eventData.eventArgs.isSelected;

        let def = that.variables;

        let rowVariables = [];

        that.panel.rowEvents = [{ eventName: "RMapC" }, { eventName: "heatmap" }];

        function setT(config) {
          /* 为了通用使用统一使用custom类型的系统自带变量
          let variableType = config.variableType || 'teldCustom';
          if (!!config.variableType) {
            config.variableType = variableType;
          }
          */
          let variableType = 'custom';
          let teldCustomModel = { type: variableType, name: config.name };
          let indexOf = _.findIndex(that.variableSrv.variables, teldCustomModel);
          let variable;
          let current = { text: config.value, value: config.value };

          if (indexOf === -1) {
            variable = that.variableSrv.addVariable({ type: variableType, canSaved: false });
            variable.hide = 2;
            variable.name = variable.label = teldCustomModel.name;
          } else {
            variable = that.variableSrv.variables[indexOf];
          }
          variable.current === current;

          that.variableSrv.setOptionAsCurrent(variable, current);
          rowVariables.push(variable);
        }

        if (isSelected) {
          def.forEach(element => {
            if (typeof (row._source[element.field]) !== "undefined") {
              let value = _.defaults({ value: row._source[element.field] }, element);
              setT(value);
            }
          });
        }else{
          def.forEach(element => {
            that.variableSrv.templateSrv.removeVariable(`$${element.name}`, 'custom');
          });
        }
        that.variableSrv.templateSrv.updateTemplateData();
        that.dashboardSrv.getCurrent().updateSubmenuVisibility();

        that.panel.rowEvents.forEach(element => {
          //that.publishAppEvent(element.eventName, { eventName: element.eventName, rowVariables });
          that.$scope.$root.$broadcast(element.eventName, { eventName: element.eventName, rowVariables, isSelected });
        });


        /* 如果设置的时间会自动触发取数，否则手动执行触发*/
        //根据配置同步时间范围
        let timeRange = eventData.eventArgs.timeRange;
        if (that.panel.syncRowTimeRange) {
          var startTime = row._source[that.panel.startDateField] || timeRange.min;
          var endTime = row._source[that.panel.endDateField] || timeRange.max;

          that.$scope.$apply(function () {
            that.timeSrv.setTime({
              from: moment.utc(startTime),
              to: moment.utc(endTime),
            });
          });
        } else {
          that.refreshDashboard();
        }
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

  grafanaLink2Kibana(){

    let dash = this.dashboardSrv.getCurrent();

    let href = angular.element("link[href$='/public/css/grafana.light.min.css']").attr('href');

    let dashStyle = 'dark';
    if (href) {
      dashStyle = 'light';
    }

    let initKibabaRowSelectIndex = -1;
    if (this.panel.kibanaSelected) {
      initKibabaRowSelectIndex = 0;
    }

    this.sendPostMessage("grafanaLink",
      {
        "dashTheme": dashStyle,
        "topNavMenu": this.panel.kibanaTopNavMenu,
        "initRowSelectIndex": initKibabaRowSelectIndex,
        "kibanaConf": this.panel.kibanaConf
      }
    );
  }

  sendPostMessage(eventType, eventArgs) {
    let postMessage = {
      "eventType": eventType,
      "eventArgs": eventArgs
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
    this.addEditorTab('KibanaConf', kibanaEditor);
    this.addEditorTab('Variables', 'public/app/plugins/panel/teld-iframe-panel/partials/variables.html');
    this.addEditorTab('Websocket', WebsocketEditor);
    this.editorTabIndex = 1;
  }

  onRefresh() {
    // if (this.isloaded) {
    //   return;
    // }
    this.render();
  }

  dblclick() {
    if (this.panel.dblfullscreen) {
      if (this.isfullscreen()) {
        this.exitFullscreen();
      } else {
        this.viewPanel();
      }
    }
  }

  isfullscreen() {
    let viewState = this.$rootScope.g_DashboardViewState;
    let editMode = viewState.edit === null || viewState.edit === false;
    return viewState.fullscreen && editMode;
  }

  formatSrc(src) {
    let returnValue = src;
    let compiled = _.template(src);

    let bindSource = {
      name: config.bootData.user.name,
      login: config.bootData.user.login,
      wslogin: this.search.teld_user || config.bootData.user.login,
      isTeldUser: Boolean(this.search.teld_user) ? "Y" : "N",
      orgId: config.bootData.user.orgId,
      wshostformat: this.wsAcrossScreen.Conf.wsServerUrl,
      wshost: (this.wsAcrossScreen.Conf.wsServerUrl || "").replace('?user=${login}', ''),
      timestamp: (new Date()).valueOf()
    };
    returnValue = compiled(bindSource);

    return returnValue;
  }

  onRender() {

    // let src = this.panel.src;

    // let compiled = _.template(src);

    // let bindSource = {
    //   name: config.bootData.user.name,
    //   login: config.bootData.user.login,
    //   wslogin: this.search.teld_user || config.bootData.user.login,
    //   isTeldUser: Boolean(this.search.teld_user) ? "Y" : "N",
    //   orgId: config.bootData.user.orgId,
    //   timestamp: (new Date()).valueOf()
    // };
    // src = compiled(bindSource);

    let src = this.formatSrc(this.panel.src);

    this.src = this.$sce.trustAsResourceUrl(src);
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
