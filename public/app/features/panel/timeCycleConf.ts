var timeCycleConf = [
  { key: 'year', name: '年', startOf: 'year', defaultFormat: 'YYYY', interval: '1y' },
  { key: 'quarter', name: '季', startOf: 'quarter', defaultFormat: 'YYYY[Q]Q', interval: '1q' },
  { key: 'month', name: '月', startOf: 'month', defaultFormat: 'YYYY-MM', interval: '1M' },
  { disable: true, key: 'week', name: '周', startOf: 'week', defaultFormat: 'YYYY wo (MM-DD)', interval: '1w' },
  { key: 'isoWeek', name: '周', startOf: 'isoWeek', defaultFormat: 'YYYY Wo (MM-DD) ', interval: '1w' },
  { key: 'day', name: '日', startOf: 'day', defaultFormat: 'YYYY-MM-DD', interval: '1d' },
  { disable: false, key: 'hour', name: '小时', startOf: 'hour', defaultFormat: 'YYYY-MM-DD hh', interval: '1h' },
  { disable: true, key: 'minute', name: '分钟', startOf: 'minute', defaultFormat: 'YYYY-MM-DD hh:mm', interval: '1m' },
  { disable: true, key: 'second', name: '秒', startOf: 'second', defaultFormat: 'YYYY-MM-DD hh:mm:ss', interval: '1s' },
];

export default timeCycleConf;

