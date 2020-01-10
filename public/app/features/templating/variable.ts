///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import {assignModelProperties} from 'app/core/core';

export interface Variable {
  setValue(option);
  updateOptions();
  dependsOn(variable);
  setValueFromUrl(urlValue);
  getValueForUrl();
  getSaveModel();
}

export var variableTypes = {};
export {
  assignModelProperties
};

export const SEARCH_FILTER_VARIABLE = '__searchFilter';

export const containsSearchFilter = (query: string): boolean =>
  query && typeof query === 'string' ? query.indexOf(SEARCH_FILTER_VARIABLE) !== -1 : false;

export const getSearchFilterScopedVar = (args: {
  query: string;
  wildcardChar: string;
  options: { searchFilter?: string };
}) => {
  const { query, wildcardChar } = args;
  if (!containsSearchFilter(query)) {
    return {};
  }

  let { options } = args;

  options = options || { searchFilter: '' };
  const value = options.searchFilter ? `${options.searchFilter}${wildcardChar}` : `${wildcardChar}`;

  return {
    __searchFilter: {
      value,
      text: '',
    },
  };
};

export function containsVariable(...args: any[]) {
  var variableName = args[args.length-1];
  var str = args[0] || '';

  for (var i = 1; i < args.length-1; i++) {
    str += ' ' + args[i] || '';
  }

  variableName = kbn.regexEscape(variableName);
  var findVarRegex = new RegExp('\\$(' + variableName + ')(?:\\W|$)|\\[\\[(' + variableName + ')\\]\\]', 'g');
  var match = findVarRegex.exec(str);
  return match !== null;
}





