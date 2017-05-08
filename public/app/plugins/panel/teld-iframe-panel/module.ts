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
  constructor($scope, $injector, private templateSrv, private $sce, private $rootScope, private timeSrv) {
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

  sendMessage(){
    this.$scope.$emit('$messageOutgoing', angular.toJson({"response" : "I'm grafana."}));
  };

  onInitEditMode() {
    this.addEditorTab('Options', 'partials/editor.html');
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
