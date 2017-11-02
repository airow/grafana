import _ from 'lodash';
import echarts from 'echarts';

import broken from './chargTrend_12m';
import curves from './chargTrend_24h';

import broken_white from './chargTrend_12m_white';
import curves_white from './chargTrend_24h_white';

import broken_black from './chargTrend_12m_black';
import curves_black from './chargTrend_24h_black';

let theme = { broken, curves,broken_white,curves_white,broken_black,curves_black };

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
