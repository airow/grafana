import _ from 'lodash';
import echarts from 'echarts';

import auto_color from '../../auto_color';

import broken from './chargTrend_12m';
import curves from './chargTrend_24h';

/*
import broken_light from './chargTrend_12m_white';
import broken_dark from './chargTrend_12m_black';
import curves_light from './chargTrend_24h_white';
import curves_dark from './chargTrend_24h_black';
*/
import broken_light from './broken_light';
import broken_dark from './broken_dark';

import curves_light from './curves_light';
import curves_dark from './curves_dark';

let theme = { default: broken, broken, curves };
auto_color(theme, {
  default_light: broken_light, default_dark: broken_dark,
  broken_light, broken_dark,
  curves_light, curves_dark
});

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
