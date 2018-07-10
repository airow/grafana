import {SGDatasource} from './datasource';
import {SGQueryCtrl} from './query_ctrl';
import {SGConfigCtrl} from './config_ctrl';

class SGQueryOptionsCtrl {
  static templateUrl = 'partials/query.options.html';
}

export {
  SGDatasource as Datasource,
  SGQueryCtrl as QueryCtrl,
  SGConfigCtrl as ConfigCtrl,
  //SGQueryOptionsCtrl as QueryOptionsCtrl,
};
