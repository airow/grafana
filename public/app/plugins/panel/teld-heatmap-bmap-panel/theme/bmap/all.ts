import config from 'app/core/config';

import drak from './drak';
import light from './light';

var bmapStyle = {
  default: config.bootData.user.lightTheme ? light : drak,
  drak, light
};

export default bmapStyle;
