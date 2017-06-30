///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import { PanelCtrl } from 'app/plugins/sdk';
import appEvents from 'app/core/app_events';
import './linkageEventHandler_srv';

export class TeldLinkageIframePanelCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  isloaded = true;
  src: string;
  datasource: string;
  style: any;
  watchEvents: any[];
  // Set and populate defaults
  panelDefaults = {
    iframeWidth: '100%',
    iframeHeight: '100%',
    watchEvents: [],
    src: 'about:bank',
    staticPage: false,
    staticPageSrc: 'about:bank'
  };

  /** @ngInject **/
  constructor($scope, $injector, private templateSrv, private $sce, private $rootScope, private timeSrv,
    private variableSrv, private dashboardSrv, private uiSegmentSrv, private datasourceSrv) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('render', this.onRender.bind(this));

    this.watchEvents = this.panel.watchEvents;
    let that = this;

    if (this.panel.staticPage) {
      this.panelDefaults.src = this.panel.staticPageSrc;
    }

    //注册事件
    this.watchEvents.forEach(element => {
      this.$scope.$on(element.name, this.watchEventHandler.bind(this));
    });
  }

  watchEventHandler(event, eventArgs) {
    //$injector.get(eve)

    let watchEvent = _.find(this.watchEvents, { name: event.name });

    let linkageEventHandlerSrv = this.$injector.get('linkageEventHandlerSrv');

    let config = {};

    watchEvent.methodArgs.forEach(element => {
      config[element.key] = element.value;
    });

    let src = linkageEventHandlerSrv[watchEvent.method](eventArgs, config);
    this.panelDefaults.src = src;
    console.log(eventArgs);
  }

  handleQueryError(err) {
    this.error = err.message || 'Failed to issue metric query';
    return [];
  }

  add() {
    this.currentEvent = { methodArgs: [{}] };
    this.watchEvents.push(this.currentEvent);
  }

  currentEvent: any;

  remove(watchEvent) {
    var index = _.indexOf(this.watchEvents, watchEvent);
    this.watchEvents.splice(index, 1);
    this.panel.Variables = this.watchEvents;
  }

  addMethodArg(watchEvent) {
    watchEvent.methodArgs = watchEvent.methodArgs || [];
    watchEvent.methodArgs.push({});
  }

  removeMethodArg(methodArgs, arg) {
    var index = _.indexOf(methodArgs, arg);
    methodArgs.splice(index, 1);
  }

  refreshDashboard() {
    this.$rootScope.$broadcast('refresh');
  }

  onInitEditMode() {
    //this.addEditorTab('Options', 'partials/editor.html');
    this.addEditorTab('Options', 'public/app/plugins/panel/teld-linkage-iframe-panel/partials/editor.html');
    this.addEditorTab('EventHandler', 'public/app/plugins/panel/teld-linkage-iframe-panel/partials/watchEvents.html');
    this.editorTabIndex = 1;
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    let renderSrc = "about:bank";
    // if (this.panel.staticPage) {
    //   renderSrc = this.panel.staticPageSrc;
    // } else {
    //   renderSrc = this.panelDefaults.src;
    // }

    renderSrc = this.panelDefaults.src;

    this.src = this.$sce.trustAsResourceUrl(renderSrc + "?t=" + (new Date()).valueOf());
    this.style = {
      "border": 'none',
      "width": this.panel.iframeWidth,
      "height": this.panel.iframeHeight
    };
    //this.datasource = this.panel.datasource;
    this.renderingCompleted();
  }
}
