///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import { transformGeoMap } from './BaiduMap_cityCenter';

export class FromCitiesEditorCtrl {
  panel: any;
  panelCtrl: any;
  cityCoord: any;
  listCityName: any;

  /** @ngInject **/
  constructor(private $scope, private $q) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;

    this.cityCoord = transformGeoMap();

    this.listCityName = _.map(this.cityCoord, item => {
      return item.n;
    });
  }

  render() {
    this.panelCtrl.render();
  }

  addCity() {
    let newCity = {
      code: '',
      name: '',
      geoCoord: {},
      enable: true
    };
    this.panel.fromCityConf.cities.push(newCity);
  }

  removeCity(city) {
    _.remove(this.panel.fromCityConf.cities, city);
  }
}

/** @ngInject **/
export function fromCitiesEditorComponent() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/teld-chargingbill-panel/partials/fromcities_editor.html',
    controller: FromCitiesEditorCtrl,
  };
}
