import _ from 'lodash';
import echarts from 'echarts';

import broken from './chargTrend_12m';
import curves from './chargTrend_24h';

let theme = { broken, curves };

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
