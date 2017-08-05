import _ from 'lodash';
import echarts from 'echarts';
import chargTrend_12m from './chargTrend_12m';
import chargTrend_24h from './chargTrend_24h';

let theme = { chargTrend_12m, chargTrend_24h };

_.forEach(theme, function (value, key) {
  echarts.registerTheme(key, value);
});

export default theme;
