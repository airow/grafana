///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import {PanelCtrl} from 'app/plugins/sdk';
import appEvents from 'app/core/app_events';

export class TeldIframePanelCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  remarkable: any;
  content: string;
  // Set and populate defaults
  panelDefaults = {
    mode    : "markdown", // 'html', 'markdown', 'text'
    content : "# title",
  };

  /** @ngInject **/
  constructor($scope, $injector, private templateSrv, private $sce, private $rootScope, private timeSrv,
  private variableSrv, private dashboardSrv) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));
    appEvents.on('time-range-changed', this.onTimeRangeChanged.bind(this));

    let messageIncomingHandler = $scope.$root.$on('$messageIncoming', this.messageIncoming.bind(this));
  }

  isloaded = false;

  messageIncoming(event, data) {
    console.group("grafana");
    console.log(angular.fromJson(event));
    console.log(angular.fromJson(data));

    let eventData = angular.fromJson(data);

    console.group("messageIncoming.data");
    console.log(eventData);

    let that = this;

    let messageIncomingHandlerConfin = {
      "syncTimeRange": function (eventData) {
        that.onTimeRangeChanged(that.timeSrv.time);
        that.isloaded = true;
      },
      "kibana.Query": function(eventData){

        let esQueryDSL = eventData.eventArgs.esQueryDSL;

        let tmpSrv = that.templateSrv;

        that.templateSrv.getAdhocFilters("TeldElasticsearch");

        //let variable_teldCustom = that.variableSrv.addVariable({type: 'teldCustom',name : 'teldana.TeldCustom'});

        let teldanaAdhocModel = {type: 'adhoc',name: 'teldana_Adhoc'};
        let indexOf = _.findIndex(that.variableSrv.variables, teldanaAdhocModel);
        let variable_adhoc;
        if (indexOf === -1) {
           teldanaAdhocModel["hide"] = 0;
           variable_adhoc = that.variableSrv.addVariable(teldanaAdhocModel);
        }else{
           variable_adhoc = that.variableSrv.variables[indexOf];
        }

        _(esQueryDSL).forEach(function(value) {
          console.log(value);
        });

        //_.get(esQueryDSL, 'must[0].match["电站名称.keyword"]').query

        if (esQueryDSL.must.length>0) {
          let filters = [
            {key: "电站名称.keyword", operator: "=", value: _.get(esQueryDSL, 'must[0].match["电站名称.keyword"]').query}
          ];
          variable_adhoc.setFilters(filters);
        }
        that.refreshDashboard();
        console.log(eventData);
      },
      "kibana.RowSelected": function(eventData){
        let row = eventData.eventArgs.row;

        let teldCustomModel = {type: 'teldCustom',name : 'statName'};
        let indexOf = _.findIndex(that.variableSrv.variables, teldCustomModel);
        let variable;
        let current = {text: row._source["电站编号"], value: row._source["电站编号"]};
        if (indexOf === -1) {
            teldCustomModel["hide"] = 0;
            teldCustomModel["label"] = teldCustomModel.name;
            teldCustomModel["query"] = current.text;
            teldCustomModel["current"] = current;
            variable = that.variableSrv.addVariable(teldCustomModel);
            //that.variableSrv.setOptionAsCurrent(variable,  current);

            // that.variableSrv.updateOptions(variable);
            that.variableSrv.templateSrv.updateTemplateData();

            that.dashboardSrv.getCurrent().updateSubmenuVisibility();
            //that.variableSrv.init(that.variableSrv.dashboard);
        }else{
            variable = that.variableSrv.variables[indexOf];
            variable.query = current.text;
            that.variableSrv.setOptionAsCurrent(variable,  current);
        }

        that.refreshDashboard();
        console.log(eventData);
      }
    };

    let messageIncomingHandler = messageIncomingHandlerConfin[eventData.eventType] || function (eventData) {
      console.log(eventData);
      console.log(`无${eventData.eventType}对应消息的处理方法`);
    };

    messageIncomingHandler(eventData);

    console.groupEnd();

    console.groupEnd();
  }

  onTimeRangeChanged(time){
    let postMessage = {
      "eventType" : "timeRangeChanged",
      "eventArgs" : time
    };
    console.log(postMessage);
    this.$scope.$emit('$messageOutgoing', angular.toJson(postMessage));
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  sendMessage(){
    this.$scope.$emit('$messageOutgoing', angular.toJson({"response" : "I'm grafana."}));
  };

  onInitEditMode() {
    //this.addEditorTab('Options', 'partials/editor.html');
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-iframe-panel/partials/editor.html');
    this.editorTabIndex = 1;

    if (this.panel.mode === 'text') {
      this.panel.mode = 'markdown';
    }
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    if (this.panel.mode === 'markdown') {
      this.renderMarkdown(this.panel.content);
    } else if (this.panel.mode === 'html') {
      this.updateContent(this.panel.content);
    }
    this.renderingCompleted();
  }

  renderText(content) {
    content = content
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br/>');
    this.updateContent(content);
  }

  renderMarkdown(content) {
    if (!this.remarkable) {
      return System.import('remarkable').then(Remarkable => {
        this.remarkable = new Remarkable();
        this.$scope.$apply(() => {
          this.updateContent(this.remarkable.render(content));
        });
      });
    }

    this.updateContent(this.remarkable.render(content));
  }

  updateContent(html) {
    try {
      this.content = this.$sce.trustAsHtml(this.templateSrv.replace(html, this.panel.scopedVars));
    } catch (e) {
      console.log('Text panel error: ', e);
      this.content = this.$sce.trustAsHtml(html);
    }
  }
}

export {TeldIframePanelCtrl as PanelCtrl}
