///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import coreModule from '../core_module';

class TeldHelperSrv {

  varMappingConf: any[];
  counter: number;
  /** @ngInject */
  constructor(private $location, private $window, private backendSrv) {

    this.counter = 0;
    this.varMappingConf = [
      { qsKey: 'qs', varPrefix: '' },
      { qsKey: 'var', varPrefix: 'var-' },
      { qsKey: '_$', varPrefix: '_$' }
    ];
  }
  /**
   *
   * @param target
   * @param search
   * search:{qs:{},var:{},_$:{}}
   */
  gotoDashboard(target, search?) {
    var locationUrl = this.$window.location.origin;
    if (_.startsWith(target, "dashboard://")) {
      let uri = _.replace(target, 'dashboard://', '');
      locationUrl += `/dashboard/${uri}`;
      this.$location.path(`dashboard/${uri}`);
    } else {
      this.backendSrv.search({ query: target }).then(hits => {
        var dashboard = _.find(hits, { title: target });
        if (dashboard) {
          this.$location.path(`dashboard/${dashboard.uri}`);
        } else {
          console.log(`Dashboard '${target}' 不存在`);
        }
      });
    }

    let qs = {};

    this.varMappingConf.forEach(element => {
      qs = _.transform(_.get(search, element.qsKey, {}), function (result, value, key) {
        result[`${element.varPrefix}${key}`] = value;
      }, qs);
    });

    this.counter++;
    if (this.counter % 20 === 0) {
      this.counter = 0;
      if (false === _.isEmpty(qs)) {
        locationUrl += '?' + angular.element.param(qs);
      }
      this.$window.location.assign(locationUrl);
    } else {
      this.$location.search(qs);
    }
  }
}

coreModule.service('teldHelperSrv', TeldHelperSrv);


