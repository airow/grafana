import _ from 'lodash';
import echarts from 'echarts';
import dark from './bar_dark';
import bar from './bar_light';
import light from './bar_light';
import bar_light from './bar_white';
import bar_dark from './bar_black';

import auto_color from '../../auto_color';
import bar_yellow from './bar_light_yellow';
import light_yellow from './bar_light_yellow';

let theme = { default: bar, dark, light };

auto_color(theme, {
  default_yellow: bar_yellow, default_light: bar_light, default_dark: bar_dark,
  light_yellow
});

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
