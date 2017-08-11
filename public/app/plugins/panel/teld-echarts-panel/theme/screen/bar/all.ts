import _ from 'lodash';
import echarts from 'echarts';
import dark from './bar_dark';
import light from './bar_light';

let theme = { dark, light };

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
