import _ from 'lodash';
import echarts from 'echarts';

import broken from './chargTrend_12m';
import curves from './chargTrend_24h';

import broken_white from './chargTrend_12m_white';
import curves_white from './chargTrend_24h_white';

let theme = { broken, curves,broken_white,curves_white };

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
