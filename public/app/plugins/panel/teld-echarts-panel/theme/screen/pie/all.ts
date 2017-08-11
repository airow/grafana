import _ from 'lodash';
import echarts from 'echarts';
import ring1 from './terminalPie2';
import ring2 from './battery2';
import pie1 from './terminalPie1';
import pie2 from './battery1';

let theme = { ring1, ring2, pie1, pie2 };

// _.forEach(theme, function (value, key) {
//   echarts.registerTheme(key, value);
// });

export default theme;
