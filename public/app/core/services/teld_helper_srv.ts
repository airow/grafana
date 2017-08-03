///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';
import coreModule from '../core_module';

class TeldHelperSrv {

  /** @ngInject */
  constructor(private $location, private backendSrv) { }

  gotoDashboard(target) {
    if (_.startsWith(target, "dashboard://")) {
      let uri = _.replace(target, 'dashboard://', '');
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
  }
}

coreModule.service('teldHelperSrv', TeldHelperSrv);


