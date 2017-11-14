import _ from 'lodash';
import echarts from 'echarts';

import auto_color from '../../auto_color';

import broken from './chargTrend_12m';
import curves from './chargTrend_24h';

import broken_light from './chargTrend_12m_white';
import curves_light from './chargTrend_24h_white';

import broken_dark from './chargTrend_12m_black';
import curves_dark from './chargTrend_24h_black';

let theme = { broken, curves};
auto_color(theme, { broken_light,curves_light,broken_dark,curves_dark});

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
