import config from 'app/core/config';
import _ from 'lodash';
import echarts from 'echarts';
import lineTheme from './screen/line/all';
import barTheme from './screen/bar/all';
import pieTheme from './screen/pie/all';

export default function (theme, autotheme) {

  let themeName = config.bootData.user.themeName;
  let autoName = _.replace(themeName, "screen_", "");

  if (autoName !== themeName) {
    _.forEach(theme, function (value, key) {
      let autoConfig = autotheme[`${key}_${autoName}`];
      if (autoConfig) {
        theme[key] = autoConfig;
      }
    });
  }
}
