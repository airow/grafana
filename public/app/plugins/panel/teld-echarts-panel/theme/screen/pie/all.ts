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

import ring1_light from './white/terminalPie2';
import ring2_light from './white/battery2';
import pie1_light from './white/terminalPie1';
import pie2_light from './white/battery1';

import ring1_dark from './black/terminalPie2';
import ring2_dark from './black/battery2';
import pie1_dark from './black/terminalPie1';
import pie2_dark from './black/battery1';

let theme = { ring1, ring2, pie1, pie2};

auto_color(theme, { ring1_yellow, ring2_yellow,pie1_yellow,pie2_yellow,
    ring1_light,ring2_light,pie1_light,pie2_light,
    ring1_dark,ring2_dark,pie1_dark,pie2_dark});

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
