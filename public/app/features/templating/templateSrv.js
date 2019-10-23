define([
  'angular',
  'lodash',
  'moment',
  'app/core/utils/kbn',
],
  function (angular, _, moment, kbn) {
    'use strict';

    var module = angular.module('grafana.services');

    module.service('templateSrv', function () {
      var self = this;

      this._regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
      this._index = {};
      this._texts = {};
      this._grafanaVariables = {};
      this._adhocVariables = {};

      // default built ins
      this._builtIns = {};
      this._builtIns['__interval'] = { text: '1s', value: '1s' };
      this._builtIns['__interval_ms'] = { text: '100', value: '100' };

      this.init = function (variables) {
        this.variables = variables;
        this.updateTemplateData();
      };

      this.updateTemplateData = function () {
        this._index = {};
        this._filters = {};
        this._adhocVariables = {};

        for (var i = 0; i < this.variables.length; i++) {
          var variable = this.variables[i];

          // add adhoc filters to it's own index
          if (variable.type === 'adhoc' || variable.type === 'teldAdhoc') {
            this._adhocVariables[variable.datasource] = variable;
            continue;
          }

          if (!variable.current || !variable.current.isNone && !variable.current.value) {
            continue;
          }

          this._index[variable.name] = variable;
        }

      };

      this.variableInitialized = function (variable) {
        this._index[variable.name] = variable;
      };

      this.getAdhocFilters = function (datasourceName) {
        var variable = this._adhocVariables[datasourceName];
        if (variable) {
          return variable.filters || [];
        }
        return [];
      };

      function luceneEscape(value) {
        return value.replace(/([\!\*\+\-\=<>\s\&\|\(\)\[\]\{\}\^\~\?\:\\/"])/g, "\\$1");
      }

      this.luceneFormat = function (value) {
        if (typeof value === 'string') {
          return luceneEscape(value);
        }
        var quotedValues = _.map(value, function (val) {
          return '\"' + luceneEscape(val) + '\"';
        });
        return '(' + quotedValues.join(' OR ') + ')';
      };

      this.formatValue = function (value, format, variable) {
        // for some scopedVars there is no variable
        variable = variable || {};

        if (typeof format === 'function') {
          return format(value, variable, this.formatValue);
        }

        switch (format) {
          case "regex": {
            if (typeof value === 'string') {
              return kbn.regexEscape(value);
            }

            var escapedValues = _.map(value, kbn.regexEscape);
            return '(' + escapedValues.join('|') + ')';
          }
          case "lucene": {
            return this.luceneFormat(value, format, variable);
          }
          case "pipe": {
            if (typeof value === 'string') {
              return value;
            }
            return value.join('|');
          }
          case "distributed": {
            if (typeof value === 'string') {
              return value;
            }
            return this.distributeVariable(value, variable.name);
          }
          default: {
            if (_.isArray(value)) {
              return '{' + value.join(',') + '}';
            }
            return value;
          }
        }
      };

      this.setGrafanaVariable = function (name, value) {
        this._grafanaVariables[name] = value;
      };

      this.getVariableName = function (expression) {
        this._regex.lastIndex = 0;
        var match = this._regex.exec(expression);
        if (!match) {
          return null;
        }
        return match[1] || match[2];
      };

      this.variableExists = function (expression) {
        var name = this.getVariableName(expression);
        return name && (self._index[name] !== void 0);
      };

      this.variableDefined = function (expression, variableType) {
        var name = this.getVariableName(expression);

        var teldCustomModel = { type: variableType, name: name };
        var indexOf = _.findIndex(this.variables, teldCustomModel);

        return indexOf >= 0;
      };

      this.removeVariable = function (expression, variableType) {
        var name = this.getVariableName(expression);

        var teldCustomModel = { type: variableType, name: name };
        var indexOf = _.findIndex(this.variables, teldCustomModel);

        if (indexOf !== -1) {
          this.variables.splice(indexOf, 1);
        }
      };

      this.getVariable = function (expression, variableType) {
        var name = this.getVariableName(expression);

        var teldCustomModel = { type: variableType, name: name };
        var indexOf = _.findIndex(this.variables, teldCustomModel);

        return indexOf === -1 ? null : this.variables[indexOf];
      };

      this.highlightVariablesAsHtml = function (str) {
        if (!str || !_.isString(str)) { return str; }

        str = _.escape(str);
        this._regex.lastIndex = 0;
        return str.replace(this._regex, function (match, g1, g2) {
          if (self._index[g1 || g2] || self._builtIns[g1 || g2]) {
            return '<span class="template-variable">' + match + '</span>';
          }
          return match;
        });
      };

      this.getAllValue = function (variable) {
        if (variable.allValue) {
          return variable.allValue;
        }
        var values = [];
        for (var i = 1; i < variable.options.length; i++) {
          values.push(variable.options[i].value);
        }
        return values;
      };

      this.replace = function (target, scopedVars, format) {
        if (!target) { return target; }

        var variable, systemValue, value;
        this._regex.lastIndex = 0;

        return target.replace(this._regex, function (match, g1, g2) {
          variable = self._index[g1 || g2];

          if (scopedVars) {
            value = scopedVars[g1 || g2];
            if (value) {
              return self.formatValue(value.value, format, variable);
            }
          }

          if (!variable) {
            return match;
          }

          systemValue = self._grafanaVariables[variable.current.value];
          if (systemValue) {
            return self.formatValue(systemValue, format, variable);
          }

          value = variable.current.value;
          if (self.isAllValue(value)) {
            value = self.getAllValue(variable);
            // skip formating of custom all values
            if (variable.allValue) {
              return value;
            }
          }

          var res = self.formatValue(value, format, variable);
          return res;
        });
      };

      this.replaceScopedVars = function (target, scopedVars, format) {
        if (!target) { return target; }

        var variable, value;
        this._regex.lastIndex = 0;

        return target.replace(this._regex, function (match, g1, g2) {
          if (scopedVars) {
            value = scopedVars[g1 || g2];
            if (value) {
              return self.formatValue(value.value, format, variable);
            }
          }

          return match;
        });
      };

      this.replaceWithEmpty = function (target, scopedVars, format) {
        if (!target) { return target; }

        var variable, systemValue, value;
        this._regex.lastIndex = 0;

        return target.replace(this._regex, function (match, g1, g2) {
          variable = self._index[g1 || g2];

          if (scopedVars) {
            value = scopedVars[g1 || g2];
            if (value) {
              return self.formatValue(value.value, format, variable);
            }
          }

          if (!variable) {
            var returnValue = match;
            variable = self.getVariable(match, "custom");

            if (variable && variable.current.value === "") {
              returnValue = match.replace("$", "@");
            }

            return returnValue;
          }

          systemValue = self._grafanaVariables[variable.current.value];
          if (systemValue) {
            return self.formatValue(systemValue, format, variable);
          }

          value = variable.current.value;
          if (self.isAllValue(value)) {
            value = self.getAllValue(variable);
            // skip formating of custom all values
            if (variable.allValue) {
              return value;
            }
          }

          var res = self.formatValue(value, format, variable);
          return res;
        });
      };

      this.teldExpression2ScopedVarsFormCache = function (cacheSuffix, scopedVars, format, varFilter) {
        var cacheKey = 'teldExpression2ScopedVars.' + cacheSuffix;
        var cache = _.get(window, cacheKey);
        var isExpiration = cache && cache.__timestamp && moment().diff(cache.__timestamp, 'seconds') > 3;
        /**isExpiration = true;
         * /*在querybar弹出选择条件功能修改为不进行缓存，带来的问题是严重影响性能。
         * 2019-10-15重新启用缓存方式，另想办法处理弹出过滤过表达式缓存的方案*/
        if (_.isNil(cache) || isExpiration) {
          cache = this.teldExpression2ScopedVars(scopedVars, format, varFilter);
          cache.__timestamp = moment();
          _.set(window, cacheKey, cache);
        }
        return cache;
      };

      this.teldExpression2ScopedVars = function (scopedVars, format, varFilter) {
        varFilter = varFilter || {};
        if (_.isPlainObject(varFilter)) {
          varFilter = _.assign({ type: 'teldExpression' }, varFilter);
        }
        var teldExpressionVariables = _.filter(this.variables, varFilter);
        var that = this;
        var timeRange = _.transform(scopedVars, function (r, value, key) {
          r[key] = value.value;
        }, {});
        var templateOptions = {
          //interpolate: /{{([\s\S]+?)}}/g,
          imports: {
            m: {
              _regex: this._regex,
              _: _,
              has: function (variable, expression) {
                //debugger;
                var regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
                var f = regex.test(variable);
                // console.log(variable);
                // console.log(f);
                if (f) {
                  return '';
                }

                var data = {};
                variable = variable.replace(/[\.-]/g, '_');
                data[variable] = variable;

                var boolString;
                if ((/^\w{8}_\w{4}_\w{4}_\w{4}_\w{12}$/g).test(variable)) {
                  boolString = _.template('${data["' + variable + '"]}', { variable: "data" })(data);
                } else {
                  boolString = _.template('${' + variable + '}')(data);
                }
                //var boolString = _.template('${' + variable + '}')();
                if ((/^false$/i).test(boolString)) {
                  return '';
                }

                // if (boolString === variable) {
                //   return '';
                // }
                return expression;
              },
              moment: moment,
              timeRange: timeRange,
              srv: this,
              escapeRegExp: function (value) {
                value = this._.escapeRegExp(value);
                return value;
              },
              hasVariable: function (variable, expression) {
                variable = _.trim(variable, "'" + '"');
                var variableExists = this.srv.variableExists(variable);
                if (false === variableExists) {
                  return '';
                }
                return expression;
              },
              hasVariableFiled: function (variable, expression, filed) {
                var params = { name: filed, filed: filed };
                return this.hasVariableFormat(variable, expression, params);
              },
              hasVariableFormat: function (variable, expression, params) {
                //expression = _.template(expression, { interpolate: /\[@([\s\S]+?)\]/g })(params);
                expression = _.template(expression, { interpolate: /{:([\s\S]+?)}/g })(params);
                // _.each(params, function (value, name) {
                //   var regExp = new RegExp("{:" + name + "}", 'ig');
                //   expression = expression.replace(regExp, value);
                // });
                return this.hasVariable(variable, expression);
              }
            }
          }
        };

        var scopedExpressionVars = _.transform(teldExpressionVariables, function (result, item) {

          var value = that.replace(item.query, scopedVars, format);

          //value = "AND 电站类型.keyword:/$type.*/ [$type => AND 电站类型.keyword:/$type.*/] [$type =>  AND 电站类型.keyword:/$type.*/ ]";

          value = value.replace(/\]\s+\[/g, ']\r\n[');
          value = value.replace(/\[\s*(.[^\s]*)\s*=>\s*(.*)\]/gm, "${m.has(\"$1\", \" $2 \")}");
          // value = value.replace(/\[\s*(.[^\s]*)\s*=>\s*(.*)\]/gm, "${m.has(\"$1\", \' $2 \')}");

          // console.group("expression 解析" + item.name);
          // console.log('    ' + item.query);
          // console.log(' => ' + value);
          //debugger;
          value = _.template(value, templateOptions)();
          value = value.replace(/\r\n/g, ' ');
          // console.log(' => ' + value);
          // console.groupEnd();

          //result[item.name] = { text: item.name, value: value };
          result[item.name] = { text: value, value: value };
        }, {});

        return scopedExpressionVars;
      };

      this.isAllValue = function (value) {
        return value === '$__all' || Array.isArray(value) && value[0] === '$__all';
      };

      this.replaceWithText = function (target, scopedVars) {
        if (!target) { return target; }

        var variable;
        this._regex.lastIndex = 0;

        return target.replace(this._regex, function (match, g1, g2) {
          if (scopedVars) {
            var option = scopedVars[g1 || g2];
            if (option) { return option.text; }
          }

          variable = self._index[g1 || g2];
          if (!variable) { return match; }

          return self._grafanaVariables[variable.current.value] || variable.current.text;
        });
      };

      this.fillVariableValuesForUrl = function (params, scopedVars) {
        _.each(this.variables, function (variable) {
          if (scopedVars && scopedVars[variable.name] !== void 0) {
            params['var-' + variable.name] = scopedVars[variable.name].value;
          } else {
            params['var-' + variable.name] = variable.getValueForUrl();
          }
        });
      };

      this.distributeVariable = function (value, variable) {
        value = _.map(value, function (val, index) {
          if (index !== 0) {
            return variable + "=" + val;
          } else {
            return val;
          }
        });
        return value.join(',');
      };

    });

  });
