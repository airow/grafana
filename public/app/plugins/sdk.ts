import {PanelCtrl} from 'app/features/panel/panel_ctrl';
import {MetricsPanelCtrl} from 'app/features/panel/metrics_panel_ctrl';
import {QueryCtrl} from 'app/features/panel/query_ctrl';
import {alertTab} from 'app/features/alerting/alert_tab_ctrl';

import config from 'app/core/config';
import _ from 'lodash';

export function loadPluginCss(options) {
  if (config.bootData.user.lightTheme) {
    System.import(options.light + '!css');
  } else {
    System.import(options.dark + '!css');
  }
}

export function loadPluginCssPath(options) {
  if (options.cssPath) {
    let css = _.template(options.cssPath, config.bootData.user);
    System.import(css + '!css');
  } else {
    loadPluginCss(options);
  }
}

export {
  PanelCtrl,
  MetricsPanelCtrl,
  QueryCtrl,
  alertTab,
}
