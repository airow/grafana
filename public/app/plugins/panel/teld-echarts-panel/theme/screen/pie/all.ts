import _ from 'lodash';
import echarts from 'echarts';
import ring1 from './terminalPie2';
import ring2 from './battery2';
import pie1 from './terminalPie1';
import pie2 from './battery1';

import auto_color from '../../auto_color';
import ring1_yellow from './yellow/terminalPie2';
import ring2_yellow from './yellow/battery2';
import pie1_yellow from './yellow/terminalPie1';
import pie2_yellow from './yellow/battery1';

let theme = { ring1, ring2, pie1, pie2 };

auto_color(theme, { ring1_yellow, ring2_yellow, pie1_yellow, pie2_yellow });

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
