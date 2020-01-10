///<reference path="../../../../headers/common.d.ts" />


import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';
import config from 'app/core/config';
import timeCycleConf from 'app/features/panel/timeCycleConf';

import kbn from 'app/core/utils/kbn';

import { MetricsPanelCtrl } from 'app/features/panel/metrics_panel_ctrl';

export class DynamicCondEditorCtrl {
  panel: any;
  panelCtrl: any;
  timeSrv: any;
  /** @ngInject */
  constructor(private $scope, private $q, private templateSrv, private datasourceSrv) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    if (_.isUndefined(this.panel.dynaCondPrefix)) {
      this.panel.dynaCondPrefix = "_dynaCond_";
    }
    $scope.ctrl = this;
  }

  appendFilterConf() {
    var conf = { enable: true, scope: 'g' };
    this.panel.filterConf.push(conf);
  }

  addSelectOpts(filterItem, item) {
    var choices = filterItem.field.choices || (filterItem.field.choices = [], filterItem.field.choices);
    this.addItem(choices, item);
  }

  addItem(itemArray, item) {
    itemArray.push(item);
  }

  removeItem(itemArray, item) {
    var index = _.indexOf(itemArray, item);
    itemArray.splice(index, 1);
    this.refresh();
  }

  move(itemArray, index, newIndex) {
    _.move(itemArray, index, newIndex);
    this.refresh();
  }

  render() {
    this.panelCtrl.render();
  }

  refresh() {
    this.panelCtrl.refresh();
  }

  fieldChange(filterItem){
    switch (filterItem.field.type) {
      case "datasource":
        if (false === _.has(filterItem.field, 'panelCtrl')) {
          _.set(filterItem.field, 'panelCtrl', {
            removeQuery() {
              if (this.panelCtrl.__collapsedQueryCache) {
                delete this.panelCtrl.__collapsedQueryCache[this.target.refId];
              }

              this.panel.targets = _.without(this.panel.targets, this.target);
              this.panelCtrl.refresh();
            },
            setDatasource(datasource) {
              // switching to mixed
              if (datasource.meta.mixed) {
                _.each(this.panel.targets, target => {
                  target.datasource = this.panel.datasource;
                  if (!target.datasource) {
                    target.datasource = config.defaultDatasource;
                  }
                });
              } else if (this.datasource && this.datasource.meta.mixed) {
                _.each(this.panel.targets, target => {
                  delete target.datasource;
                });
              }
              this.panel.targets = [{ datasource: datasource.value }];
              this.panel.datasource = datasource.value;
              this.datasourceName = datasource.name;
              // this.datasource = null;
            }, panel: { targets: [] }
          });
        }
        break;
    }
    // debugger;
  }


}

/** @ngInject */
export function dynamicCondEditorComponent($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-querybar-panel/editor_component/dynamicCond_editor.html',
    controller: DynamicCondEditorCtrl,
  };
}
