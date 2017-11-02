import _ from 'lodash';
import echarts from 'echarts';
import dark from './bar_dark';
import light from './bar_light';
import white from './bar_white';
import black from './bar_black';

import auto_color from '../../auto_color';
import light_yellow from './bar_light_yellow';

let theme = { dark, light,white,black };

auto_color(theme, { light_yellow });

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
