///<reference path="../../../headers/common.d.ts" />

import {TeldServiceGatewayDatasource} from './datasource';
import {TeldServiceGatewayQueryCtrl} from './query_ctrl';

class TeldServiceGatewayConfigCtrl {
  static templateUrl = 'partials/config.html';
}

export {
  TeldServiceGatewayDatasource,
  TeldServiceGatewayDatasource as Datasource,
  TeldServiceGatewayQueryCtrl as QueryCtrl,
  TeldServiceGatewayConfigCtrl as ConfigCtrl
};

