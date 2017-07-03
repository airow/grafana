import config from 'app/core/config';
import _ from 'lodash';
import $ from 'jquery';

import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';

export class HeatmapEventHandlerSrv {


  /** @ngInject */
  constructor(private $injector, private $rootScope, private $modal) {
  }

  heatmap(eventArgs, config, context) {

    let sgConf = {
      sgUrl: function () {
        let variable = context.templateSrv.getVariable("$code", 'custom');
        let returnValue = '/public/mockJson/hangzhou-tracks.json';
        if (variable && variable.current && variable.current.value) {
          returnValue = `/public/mockJson/tracks-${variable.current.value}.json`;
        }
        return returnValue;
      },

    };

    context.sgConfig = _.defaults(sgConf, context.sgConfig);

    return context.sgConfig;
  }
}

coreModule.service('heatmapEventHandlerSrv', HeatmapEventHandlerSrv);
