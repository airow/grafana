///<reference path="../../../headers/common.d.ts" />
import _ from 'lodash';

var advanced_search = {
  "等于": { keyword: "term", "link": "value", operatorKey: "string_equal" },
  // "包含": { keyword: "wildcard", "value": "value", operatorKey: "string_contain" },

  "=": { operatorKey: 'number_equal', display: "=", keyword: "term", link: "value" },
  ">": { operatorKey: 'number_gt', display: ">", keyword: "range", link: "gt" },
  ">=": { operatorKey: 'number_gte', display: ">=", keyword: "range", link: "gte" },
  "<": { operatorKey: 'number_lt', display: "<", keyword: "range", link: "lt" },
  "<=": { operatorKey: 'number_lte', display: "<=", keyword: "range", link: "lte" },

  "date >": { operatorKey: 'date_gt', display: ">", keyword: "range", link: "gt", strategy: 'date', ext: { "format": "epoch_millis" } },
  "date >=": { operatorKey: 'date_gte', display: ">=", keyword: "range", link: "gte", strategy: 'date', ext: { "format": "epoch_millis" } },
  "date <": { operatorKey: 'date_lt', display: "<", keyword: "range", link: "lt", strategy: 'date', ext: { "format": "epoch_millis" } },
  "date <=": { operatorKey: 'date_lte', display: "<=", keyword: "range", link: "lte", strategy: 'date', ext: { "format": "epoch_millis" } },
};

export function getAdvancedSearchKeys() {
  return _.keys(advanced_search);
}

export { advanced_search }
