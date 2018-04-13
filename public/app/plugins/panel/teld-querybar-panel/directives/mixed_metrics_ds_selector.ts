///<reference path="../../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

var module = angular.module('grafana.directives');

var template = `
<div class="gf-form-group">
  <div class="gf-form-inline">
    <div class="gf-form">
      <label class="gf-form-label">
        <i class="icon-gf icon-gf-datasources"></i>
      </label>
      <label class="gf-form-label">
        Panel data source
      </label>

      <metric-segment segment="ctrl.dsSegment"
                      get-options="ctrl.getOptions()"
                      on-change="ctrl.datasourceChanged()"></metric-segment>
    </div>

    <div class="gf-form gf-form--offset-1">
      <label class="gf-form-label">
        页签
      </label>
      <input type="text" class="gf-form-input" ng-model="ctrl.dsSegment.name" placeholder="Tab name">
    </div>

    <div class="gf-form gf-form--offset-1">
      <button class="btn btn-inverse gf-form-btn" ng-click="ctrl.addDataQuery()">
        <i class="fa fa-plus"></i>&nbsp;
        Add query
      </button>
    </div>
  </div>
</div>
`;


export class MixedMetricsDsSelectorCtrl {
  dsSegment: any;
  dsName: string;
  panelCtrl: any;
  datasources: any[];

  /** @ngInject */
  constructor(private uiSegmentSrv, datasourceSrv) {
    this.datasources = datasourceSrv.getMetricSources();

    //_.remove(this.datasources, { name: '-- Mixed --' });
    _.remove(this.datasources, 'meta.builtIn');

    //this.dsSegment = uiSegmentSrv.newSegment({value: '-- Grafana --', selectMode: true});
    this.dsSegment = uiSegmentSrv.newSegment({value: 'default', selectMode: true});
  }

  getOptions() {
    return Promise.resolve(this.datasources.map(value => {
      return this.uiSegmentSrv.newSegment(value.name);
    }));
  }

  addDataQuery() {
    var target: any = {isNew: true};

    target.datasource = this.dsSegment.value;
    target.refId = this.dsSegment.name;
    target.isQuerybar = true;
    this.panelCtrl.panel.targets.push(target);
    this.dsSegment.name = null;
  }

  datasourceChanged() {
    this.dsSegment.name = null;
  }
}

module.directive('mixedMetricsDsSelector', function() {
  return {
    restrict: 'E',
    template: template,
    controller: MixedMetricsDsSelectorCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    transclude: true,
    scope: {
      panelCtrl: "="
    }
  };
});
