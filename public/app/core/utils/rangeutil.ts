///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import * as dateMath from './datemath';

var spans = {
  's': {display: 'second'},
  'm': {display: 'minute'},
  'h': {display: 'hour'},
  'd': {display: 'day'},
  'w': {display: 'week'},
  'M': {display: 'month'},
  'y': {display: 'year'},
};

var rangeOptions = [
  { from: 'now/d',    to: 'now/d',    en_display: 'Today',               display: '今天',             section: 2 },
  { from: 'now/d',    to: 'now',      en_display: 'Today so far',        display: '今天此刻',         section: 2 },
  { from: 'now/w',    to: 'now/w',    en_display: 'This week',           display: '本周',             section: 2 },
  { from: 'now/w',    to: 'now',      en_display: 'This week so far',    display: '本周此刻',         section: 2 },
  { from: 'now/M',    to: 'now/M',    en_display: 'This month',          display: '本月',             section: 2 },
  { from: 'now/M',    to: 'now',      en_display: 'This month so far',   display: '本月此刻',         section: 2 },
  { from: 'now/y',    to: 'now/y',    en_display: 'This year',           display: '今年',             section: 2 },
  { from: 'now/y',    to: 'now',      en_display: 'This year so far',    display: '今年此刻',         section: 2 },

  { from: 'now-1d/d', to: 'now-1d/d', en_display: 'Yesterday',           display: '昨天',             section: 1 },
  { from: 'now-2d/d', to: 'now-2d/d', en_display: 'Day before yesterday',display: '前天',             section: 1 },
  { from: 'now-7d/d', to: 'now-7d/d', en_display: 'This day last week',  display: '上周今天',         section: 1 },
  { from: 'now-1w/w', to: 'now-1w/w', en_display: 'Previous week',       display: '上周',             section: 1 },
  { from: 'now-1M/M', to: 'now-1M/M', en_display: 'Previous month',      display: '上月',             section: 1 },
  { from: 'now-1y/y', to: 'now-1y/y', en_display: 'Previous year',       display: '去年',             section: 1 },

  { from: 'now-5m',   to: 'now',      en_display: 'Last 5 minutes',      display: '近 5 分钟',          section: 3 },
  { from: 'now-15m',  to: 'now',      en_display: 'Last 15 minutes',     display: '近 15 分钟',         section: 3 },
  { from: 'now-30m',  to: 'now',      en_display: 'Last 30 minutes',     display: '近 30 分钟',         section: 3 },
  { from: 'now-1h',   to: 'now',      en_display: 'Last 1 hour',         display: '近 1 小时',          section: 3 },
  { from: 'now-3h',   to: 'now',      en_display: 'Last 3 hours',        display: '近 3 小时',          section: 3 },
  { from: 'now-6h',   to: 'now',      en_display: 'Last 6 hours',        display: '近 6 小时',          section: 3 },
  { from: 'now-12h',  to: 'now',      en_display: 'Last 12 hours',       display: '近 12 小时',         section: 3 },
  { from: 'now-24h',  to: 'now',      en_display: 'Last 24 hours',       display: '近 24 小时',         section: 3 },

  { from: 'now-2d',   to: 'now',      en_display: 'Last 2 days',         display: '近 2 天',           section: 0 },
  { from: 'now-7d',   to: 'now',      en_display: 'Last 7 days',         display: '近 7 天',           section: 0 },
  { from: 'now-30d',  to: 'now',      en_display: 'Last 30 days',        display: '近 30 天',          section: 0 },
  { from: 'now-60d',  to: 'now',      en_display: 'Last 60 days',        display: '近 60 天',          section: 0 },
  { from: 'now-6M',   to: 'now',      en_display: 'Last 6 months',       display: '近 6 月',           section: 0 },
  { from: 'now-1y',   to: 'now',      en_display: 'Last 1 year',         display: '近 1 年',           section: 0 },
  { from: 'now-2y',   to: 'now',      en_display: 'Last 2 years',        display: '近 2 年',           section: 0 },
  { from: 'now-5y',   to: 'now',      en_display: 'Last 5 years',        display: '近 5 年',           section: 0 },
];

var absoluteFormat = 'MMM D, YYYY HH:mm:ss';

var rangeIndex = {};
_.each(rangeOptions, function (frame) {
  rangeIndex[frame.from + ' to ' + frame.to] = frame;
});

//补全 月份
for (var month = 1; month <= 12; month++) {
  var frame = { from: `now-${month}M`, to: 'now', en_display: `Last ${month} month`, display: `近 ${month} 月` };
  rangeIndex[frame.from + ' to ' + frame.to] = frame;
}

//补全 年份
for (var year = 1; year <= 50; year++) {
  var frame = { from: `now-${year}y`, to: 'now', en_display: `Last ${year} years`, display: `近 ${year} 年` };
  rangeIndex[frame.from + ' to ' + frame.to] = frame;
}

export  function getRelativeTimesList(timepickerSettings, currentDisplay) {
  var groups = _.groupBy(rangeOptions, (option: any) => {
    option.active = option.display === currentDisplay;
    return option.section;
  });

  // _.each(timepickerSettings.time_options, (duration: string) => {
  //   let info = describeTextRange(duration);
  //   if (info.section) {
  //     groups[info.section].push(info);
  //   }
  // });

  return groups;
}

function formatDate(date) {
  return date.format(absoluteFormat);
}

// handles expressions like
// 5m
// 5m to now/d
// now/d to now
// now/d
// if no to <expr> then to now is assumed
export function describeTextRange(expr: any) {
  let isLast = (expr.indexOf('+') !== 0);
  if (expr.indexOf('now') === -1) {
    expr = (isLast ? 'now-' : 'now') + expr;
  }

  let opt = rangeIndex[expr + ' to now'];
  if (opt) {
    return opt;
  }

  if (isLast) {
    opt = {from: expr, to: 'now'};
  } else {
    opt = {from: 'now', to: expr};
  }

  let parts = /^now([-+])(\d+)(\w)/.exec(expr);
  if (parts) {
    let unit = parts[3];
    let amount = parseInt(parts[2]);
    let span = spans[unit];
    if (span) {
      opt.display = isLast ? 'Last ' : 'Next ';
      opt.display += amount + ' ' + span.display;
      opt.section = span.section;
      if (amount > 1) {
        opt.display += 's';
      }
    }
  } else {
    opt.display = opt.from + ' to ' + opt.to;
    opt.invalid = true;
  }

  return opt;
}

export function describeTimeRange(range) {
  var option = rangeIndex[range.from.toString() + ' to ' + range.to.toString()];
  if (option) {
    return option.display;
  }

  if (moment.isMoment(range.from) && moment.isMoment(range.to)) {
    return formatDate(range.from) + ' to ' + formatDate(range.to);
  }

  if (moment.isMoment(range.from)) {
    var toMoment = dateMath.parse(range.to, true);
    return formatDate(range.from) + ' to ' + toMoment.fromNow();
  }

  if (moment.isMoment(range.to)) {
    var from = dateMath.parse(range.from, false);
    return from.fromNow() + ' to ' + formatDate(range.to);
  }

  if (range.to.toString() === 'now') {
    var res = describeTextRange(range.from);
    return res.display;
  }

  return range.from.toString() + ' to ' + range.to.toString();
}

