///<reference path="../../../headers/common.d.ts" />

import {TeldESSQLDatasource} from './datasource';
import {TeldESSQLQueryCtrl} from './query_ctrl';

class TeldESSQLConfigCtrl {
  static templateUrl = 'partials/config.html';
}

export {
  TeldESSQLDatasource,
  TeldESSQLDatasource as Datasource,
  TeldESSQLQueryCtrl as QueryCtrl,
  TeldESSQLConfigCtrl as ConfigCtrl
};

