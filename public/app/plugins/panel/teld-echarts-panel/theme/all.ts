import _ from 'lodash';
import echarts from 'echarts';
import lineTheme from './screen/line/all';
import barTheme from './screen/bar/all';
import pieTheme from './screen/pie/all';
import scatterTheme from './screen/line/all';

let echartsTheme = { lineTheme, barTheme, pieTheme, scatterTheme };

let echartsThemeName = {};
let echartsThemeMap = {};

_.forEach(echartsTheme, function (value, serieType) {
  echartsThemeName[serieType] = _.keys(value);
  _.forEach(value, function (theme, themeName) {
    echarts.registerTheme(`${serieType}-${themeName}`, theme);
    echartsThemeMap[`${serieType}-${themeName}`] = theme;
  });
});

export default echartsTheme;
export { echartsThemeName, echartsThemeMap };
