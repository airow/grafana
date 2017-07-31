import config from 'app/core/config';
import echarts from 'echarts';
import drak from './drak';
import light from './light';

echarts.registerTheme('teld', config.bootData.user.lightTheme ? light : drak);

echarts.registerTheme('drak', drak);
echarts.registerTheme('light', light);
