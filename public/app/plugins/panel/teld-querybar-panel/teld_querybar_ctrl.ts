///<reference path="../../../headers/common.d.ts" />

import { PanelCtrl } from 'app/plugins/sdk';
import { metricsEditorComponent } from './editor_component/metrics_editor';
import { optionsEditorComponent } from './editor_component/options_editor';
import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import appEvents from 'app/core/app_events';
import config from 'app/core/config';
import './directives/all';

export class TeldQuerybarCtrl extends PanelCtrl {
  static templateUrl = `partials/module.html`;

  isQuerybar: true;
  currentTab: string;
  datasource: string;
  metricSources: any[];

  // Set and populate defaults
  panelDefaults = {
    datasource: 'default',
    targets: []
  };

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);

    _.defaults(this.panel, this.panelDefaults);

    this.currentTab = _.get(_.head(this.panel.targets), 'refId', '');

    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Metrics', metricsEditorComponent);
    this.addEditorTab('Options', optionsEditorComponent);
    //this.editorTabIndex = 1;
  }

  onDataError() {
    this.render();
  }

  onDataReceived(dataList) {
    this.render();
  }

  onRefresh() {
    this.render();
  }

  onRender() {
    this.renderingCompleted();
  }
}
