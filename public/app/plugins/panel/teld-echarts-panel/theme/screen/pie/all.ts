import _ from 'lodash';
import echarts from 'echarts';
import battery1 from './battery1';
import battery2 from './battery2';
import terminalPie1 from './terminalPie1';
import terminalPie2 from './terminalPie2';

let theme = { battery1, battery2, terminalPie1, terminalPie2 };

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
