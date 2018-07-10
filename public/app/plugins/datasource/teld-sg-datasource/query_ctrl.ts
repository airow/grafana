///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';

export class SGQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  rawQueryOld: string;
  permissionOptions: any;
  getPermissionOptionsPromise: any;

  /** @ngInject **/
  constructor($scope, $injector, private $rootScope, private $timeout, private uiSegmentSrv, private $http) {
    super($scope, $injector);

    this.target.parameters = this.target.parameters || [];
    this.queryUpdated();
  }

  queryUpdated() {
    // var newJson = angular.toJson(this.datasource.queryBuilder.build(this.target), true);
    // if (newJson !== this.rawQueryOld) {
    //   this.rawQueryOld = newJson;
    //   this.refresh();
    // }
    this.refresh();
    this.$rootScope.appEvent('sg-query-updated');
  }

  paramToString(param) {
    let returnValue = `${param.key}=${angular.toJson(param.value)}`;
    return returnValue;
  }

  removeItem(itemArray, item) {
    var index = _.indexOf(itemArray, itemArray);
    itemArray.splice(index, 1);
  }

  moveItem(itemArray, index, newIndex) {
    _.move(itemArray, index, newIndex);
  }

  getCollapsedText() {
    var text = '';
    return text;
  }

  handleQueryError(err) {
    this.error = err.message || 'Failed to issue metric query';
    return [];
  }
}
