import config from 'app/core/config';
import _ from 'lodash';
import $ from 'jquery';

import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';

export class LinkageEventHandlerSrv {


  /** @ngInject */
  constructor(private $injector, private $rootScope, private $modal) {
  }

  Rheatmap(content, config) {
    let timestamp =  (new Date()).valueOf();

    let variableContent = {};
    let RMapC = config.RMapC || 'http://139.219.195.60:8888/RMapC?cityID=$citycode&cityName=$cityname';
    let src = config.src || "http://139.219.195.60:8000/H$citycode.html";

    content.rowVariables.forEach(variable => {
      variableContent[variable.name] = variable.current.value;
      RMapC = RMapC.replace("$" + variable.name, variable.current.value);
      src = src.replace("$" + variable.name, variable.current.value);
    });
    //return src + '?t=' + timestamp;
    return src;
  }

  RMapC(content, config) {
    return this.Rheatmap(content, config);
  }
}

coreModule.service('linkageEventHandlerSrv', LinkageEventHandlerSrv);
