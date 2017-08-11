import _ from 'lodash';
import echarts from 'echarts';
import lineTheme from './screen/line/all';
import pieTheme from './screen/pie/all';

let echartsTheme = { lineTheme, pieTheme };

let echartsThemeName = {};

_.forEach(echartsTheme, function (value, serieType) {
  echartsThemeName[serieType] = _.keys(value);
  _.forEach(value, function (theme, themeName) {
    echarts.registerTheme(`${serieType}-${themeName}`, theme);
  });
});

export default echartsTheme;
export { echartsThemeName };
