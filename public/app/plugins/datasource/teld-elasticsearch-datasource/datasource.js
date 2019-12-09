define([
  'angular',
  'lodash',
  'app/core/utils/rangeutil',
  'app/core/utils/datemath',
  'moment',
  'app/core/utils/kbn',
  'app/core/config',
  './query_builder',
  './index_pattern',
  './elastic_response',
  './query_ctrl',
],
  function (angular, _, rangeUtil, dateMath, moment, kbn, config, ElasticQueryBuilder, IndexPattern, ElasticResponse) {
    'use strict';

    /** @ngInject */
    function ElasticDatasource(instanceSettings, $q, backendSrv, templateSrv, timeSrv, variableSrv) {
      this.basicAuth = instanceSettings.basicAuth;
      this.withCredentials = instanceSettings.withCredentials;
      this.url = instanceSettings.url;
      this.name = instanceSettings.name;
      this.index = instanceSettings.index;
      this.timeField = instanceSettings.jsonData.timeField;
      this.esVersion = instanceSettings.jsonData.esVersion;
      this.indexPattern = new IndexPattern(instanceSettings.index, instanceSettings.jsonData.interval);
      this.interval = instanceSettings.jsonData.timeInterval;
      this.queryBuilder = new ElasticQueryBuilder({
        timeField: this.timeField,
        esVersion: this.esVersion,
      });

      this._request = function (method, url, data) {
        var options = {
          url: this.url + "/" + url,
          method: method,
          data: data
        };

        if (this.basicAuth || this.withCredentials) {
          options.withCredentials = true;
        }
        if (this.basicAuth) {
          options.headers = {
            "Authorization": this.basicAuth
          };
        }

        return backendSrv.datasourceRequest(options);
      };

      this._get = function (url) {
        var range = timeSrv.timeRange();
        var index_list = this.indexPattern.getIndexList(range.from.valueOf(), range.to.valueOf());
        if (_.isArray(index_list) && index_list.length) {
          return this._request('GET', index_list[0] + url).then(function (results) {
            results.data.$$config = results.config;
            return results.data;
          });
        } else {
          return this._request('GET', this.indexPattern.getIndexForToday() + url).then(function (results) {
            results.data.$$config = results.config;
            return results.data;
          });
        }
      };

      this._post = function (url, data) {
        return this._request('POST', url, data).then(function (results) {
          results.data.$$config = results.config;
          return results.data;
        });
      };

      this.annotationQuery = function (options) {
        var annotation = options.annotation;
        var timeField = annotation.timeField || '@timestamp';
        var queryString = annotation.query || '*';
        var tagsField = annotation.tagsField || 'tags';
        var titleField = annotation.titleField || 'desc';
        var textField = annotation.textField || null;

        var range = {};
        range[timeField] = {
          from: options.range.from.valueOf(),
          to: options.range.to.valueOf(),
          format: "epoch_millis",
        };

        // if (target.rangePrecision) {
        //   range[timeField].from = options.range.from.startOf(target.rangePrecision).valueOf();
        //   range[timeField].to = options.range.to.endOf(target.rangePrecision).valueOf();
        // }

        var queryInterpolated = templateSrv.replace(queryString, {}, 'lucene');
        var query = {
          "bool": {
            "filter": [
              { "range": range },
              {
                "query_string": {
                  "query": queryInterpolated
                }
              }
            ]
          }
        };

        var data = {
          "query": query,
          "size": 10000
        };

        // fields field not supported on ES 5.x
        if (this.esVersion < 5) {
          data["fields"] = [timeField, "_source"];
        }

        var header = { search_type: "query_then_fetch", "ignore_unavailable": true };

        // old elastic annotations had index specified on them
        if (annotation.index) {
          header.index = annotation.index;
        } else {
          header.index = this.indexPattern.getIndexList(options.range.from, options.range.to);
        }

        var payload = angular.toJson(header) + '\n' + angular.toJson(data) + '\n';

        return this._post('_msearch', payload).then(function (res) {
          var list = [];
          var hits = res.responses[0].hits.hits;

          var getFieldFromSource = function (source, fieldName) {
            if (!fieldName) { return; }

            var fieldNames = fieldName.split('.');
            var fieldValue = source;

            for (var i = 0; i < fieldNames.length; i++) {
              fieldValue = fieldValue[fieldNames[i]];
              if (!fieldValue) {
                console.log('could not find field in annotation: ', fieldName);
                return '';
              }
            }

            if (_.isArray(fieldValue)) {
              fieldValue = fieldValue.join(', ');
            }
            return fieldValue;
          };

          for (var i = 0; i < hits.length; i++) {
            var source = hits[i]._source;
            var time = source[timeField];
            if (typeof hits[i].fields !== 'undefined') {
              var fields = hits[i].fields;
              if (_.isString(fields[timeField]) || _.isNumber(fields[timeField])) {
                time = fields[timeField];
              }
            }

            var event = {
              annotation: annotation,
              time: moment.utc(time).valueOf(),
              title: getFieldFromSource(source, titleField),
              tags: getFieldFromSource(source, tagsField),
              text: getFieldFromSource(source, textField)
            };

            list.push(event);
          }
          return list;
        });
      };

      this.testDatasource = function () {
        timeSrv.setTime({ from: 'now-1m', to: 'now' });
        return this._get('/_stats').then(function () {
          return { status: "success", message: "Data source is working", title: "Success" };
        }, function (err) {
          if (err.data && err.data.error) {
            return { status: "error", message: angular.toJson(err.data.error), title: "Error" };
          } else {
            return { status: "error", message: err.status, title: "Error" };
          }
        });
      };

      this.getQueryHeader = function (searchType, timeFrom, timeTo) {
        var header = { search_type: searchType, "ignore_unavailable": true };
        header.index = this.indexPattern.getIndexList(timeFrom, timeTo);
        return angular.toJson(header);
      };

      this.query = function (options) {
        //console.log(options);
        var vSrc = variableSrv;
        vSrc;
        var payload = "";
        var target;
        var sentTargets = [];

        // add global adhoc filters to timeFilter
        var adhocFilters = templateSrv.getAdhocFilters(this.name);

        /**
         * 2017-06-29放弃
        var teldanaIndex = _.findIndex(variableSrv.variables, { type: 'teldAdhoc', name: 'teldana_Adhoc' });
        var esQueryDSL;
        if (teldanaIndex >= 0) {
          esQueryDSL = variableSrv.variables[teldanaIndex].esQueryDSL;
        }
        */

        var filterFun = function (item) {
          return item.type === 'teldExpression' && "es" === (item.filter || "es");
        };

        var scopedExpressionVars = templateSrv.teldExpression2ScopedVarsFormCache('elasticsearch', options.scopedVars, 'lucene', filterFun);
        //console.log(scopedExpressionVars);

        for (var i = 0; i < options.targets.length; i++) {
          target = options.targets[i];
          if (target.hide) { continue; }

          //var queryString = templateSrv.replace(target.query || '*', options.scopedVars, 'lucene');
          var queryString = target.query || '*';
          queryString = templateSrv.replaceScopedVars(queryString, Object.assign({}, options.scopedVars, scopedExpressionVars));
          queryString = templateSrv.replaceWithEmpty(queryString, options.scopedVars, 'lucene');

          // var whileCount = 0;
          // var exp = /.*:"(\@.*)"\s?(and|or)?/;
          // var m = queryString.match(exp);
          // while (m && whileCount < 100) {
          //   var varName = m[1];
          //   queryString = queryString.replace(new RegExp('.*:"\\' + varName + '"'), "");

          //   m = queryString.match(exp);
          //   whileCount++;
          // }

          //queryString = 'stacityName:"@pcityname" AND IfFastCharging:"快充" AND IfFastChargin2g:"快2充" AND stacityName:"@pcityname"';
          var newArray = [];
          var reg = /.*:"(\@.*)"\s?/;
          var regAndOr = /(AND|OR)/;
          var regO = /(AND|OR|\(|\))/;
          var d = queryString.split(regO);
          for (var ii = 0; ii < d.length; ii++) {
            if (reg.test(d[ii])) {
              if (ii + 1 < d.length) {
                if (regO.test(d[ii + 1])) {
                  ii++;
                }
              }
            } else {
              if (regAndOr.test(d[ii])) {
                newArray.push(" " + d[ii] + " ");
              } else {
                newArray.push(_.trim(d[ii]));
              }
            }
          }

          if (newArray.length > 0) {
            var l = newArray[newArray.length - 1];
            //var t = regO.test(l);
            if (l.match(regO)) {
              newArray.length--;
            }
          }

          queryString = newArray.length === 0 ? "*" : newArray.join('');

          //"所属城市:\"$citycode\" AND 所属3城市:\"$cit3ycode\"".replace(/.*:"\$citycode"/,"").replace(/(and|or)/i,'')

          var queryObj = this.queryBuilder.build(target, adhocFilters, queryString);
          //queryObj.query.bool = esQueryDSL;

          /**
           *
          if (esQueryDSL) {
            for (var key in esQueryDSL) {
              queryObj.query.bool[key] = esQueryDSL[key];
            }
          }
          */

          var esQuery = angular.toJson(queryObj);

          var searchType = (queryObj.size === 0 && this.esVersion < 5) ? 'count' : 'query_then_fetch';
          var header = this.getQueryHeader(searchType, options.range.from, options.range.to);

          /*附加数据权限*/
          header = attachDataPermission(target, header);

          // debugger;
          // 附件SG类过滤条件
          header = this.attachFilter(target, header, options, scopedExpressionVars);

          payload += header + '\n';

          payload += esQuery + '\n';
          sentTargets.push(target);
        }

        if (sentTargets.length === 0) {
          return $q.when([]);
        }

        var fromUnix = options.range.from.valueOf();
        var toUnix = options.range.to.valueOf();
        if (target.rangePrecision) {
          fromUnix = options.range.from.startOf(target.rangePrecision).valueOf();
          toUnix = options.range.to.endOf(target.rangePrecision).valueOf();
        }

        payload = payload.replace(/\$timeFrom/g, fromUnix);
        payload = payload.replace(/\$timeTo/g, toUnix);
        payload = templateSrv.replace(payload, options.scopedVars);

        // if (target.timeRange && target.timeRange.enable) {
        //   if (target.timeRange.timeFrom) {
        //     var timeFromInterpolated = target.timeRange.timeFrom;
        //     var timeFromInfo = rangeUtil.describeTextRange(timeFromInterpolated);
        //     if (true !== timeFromInfo.invalid) {
        //       override.from = dateMath.parse(timeFromInfo.from);
        //       override.to = dateMath.parse(timeFromInfo.to);
        //     }
        //   }

        //   if (target.timeRange.timeShift) {
        //     var timeShiftInterpolated = target.timeRange.timeShift;
        //     var timeShiftInfo = rangeUtil.describeTextRange(timeShiftInterpolated);
        //     if (true !== timeShiftInfo.invalid) {
        //       var timeShift = '-' + timeShiftInterpolated;
        //       override.from = dateMath.parseDateMath(timeShift, override.from, false);
        //       override.to = dateMath.parseDateMath(timeShift, override.to, true);
        //     }
        //   }
        // }

        return this._post('_msearch', payload).then(function (res) {
          return new ElasticResponse(sentTargets, res).getTimeSeries();
        });
      };

      this.getFields = function (query) {
        return this._get('/_mapping').then(function (result) {

          var typeMap = {
            'float': 'number',
            'double': 'number',
            'integer': 'number',
            'long': 'number',
            'date': 'date',
            'string': 'string',
            'text': 'string',
            'scaled_float': 'number',
            'nested': 'nested'
          };

          function shouldAddField(obj, key, query) {
            if (key[0] === '_') {
              return false;
            }

            if (!query.type) {
              return true;
            }

            // equal query type filter, or via typemap translation
            return query.type === obj.type || query.type === typeMap[obj.type];
          }

          // Store subfield names: [system, process, cpu, total] -> system.process.cpu.total
          var fieldNameParts = [];
          var fields = {};

          function getFieldsRecursively(obj) {
            for (var key in obj) {
              var subObj = obj[key];

              // Check mapping field for nested fields
              if (subObj.hasOwnProperty('properties')) {
                fieldNameParts.push(key);
                getFieldsRecursively(subObj.properties);
              } else {
                var fieldName = fieldNameParts.concat(key).join('.');

                // Hide meta-fields and check field type
                if (shouldAddField(subObj, key, query)) {
                  fields[fieldName] = {
                    text: fieldName,
                    type: subObj.type
                  };
                }
              }
            }
            fieldNameParts.pop();
          }

          for (var indexName in result) {
            var index = result[indexName];
            if (index && index.mappings) {
              var mappings = index.mappings;
              for (var typeName in mappings) {
                var properties = mappings[typeName].properties;
                getFieldsRecursively(properties);
              }
            }
          }

          // transform to array
          return _.map(fields, function (value) {
            return value;
          });
        });
      };

      this.getTerms = function (queryDef) {
        var range = timeSrv.timeRange();
        var searchType = this.esVersion >= 5 ? 'query_then_fetch' : 'count';
        var header = this.getQueryHeader(searchType, range.from, range.to);
        var esQuery = angular.toJson(this.queryBuilder.getTermsQuery(queryDef));

        esQuery = esQuery.replace(/\$timeFrom/g, range.from.valueOf());
        esQuery = esQuery.replace(/\$timeTo/g, range.to.valueOf());
        esQuery = header + '\n' + esQuery + '\n';

        return this._post('_msearch?search_type=' + searchType, esQuery).then(function (res) {
          if (!res.responses[0].aggregations) {
            return [];
          }

          var buckets = res.responses[0].aggregations["1"].buckets;
          return _.map(buckets, function (bucket) {
            return { text: bucket.key, value: bucket.key };
          });
        });
      };

      this.metricFindQuery = function (query) {
        query = angular.fromJson(query);
        query.query = templateSrv.replace(query.query || '*', {}, 'lucene');

        if (!query) {
          return $q.when([]);
        }

        if (query.find === 'fields') {
          return this.getFields(query);
        }
        if (query.find === 'terms') {
          return this.getTerms(query);
        }
      };

      this.getTagKeys = function () {
        return this.getFields({});
      };

      this.getTagValues = function (options) {
        return this.getTerms({ field: options.key, query: '*' });
      };

      function attachDataPermission(target, header) {
        if (_.size(target.dataPermission) > 0) {
          var headerJson = angular.fromJson(header);
          headerJson.dataPermission = target.dataPermission.map(function (item) { return _.omit(item, ['$$hashKey']); });
          header = angular.toJson(headerJson);
        }
        return header;
      }

      function replaceScopedVars(value, options, scopedExpressionVars) {
        value = templateSrv.replaceScopedVars(value, Object.assign({}, options.scopedVars, scopedExpressionVars));
        value = templateSrv.replaceWithEmpty(value, options.scopedVars, 'lucene');
        return value;
      }

      this.imports = {
        '_': _,
        'moment': moment,
        'contextSrv': this.contextSrv,
        'config': config,
        'urlHelper': {
          sghost: function (host) {
            host = host || 'sgi';
            var protocol = window.location.protocol;
            var hostname = window.location.hostname;
            var domain = document.domain || hostname;
            var ares = domain.split(':')[0].split('.');
            if (_.size(ares) > 2) {
              ares.shift();
            }
            ares.unshift("");
            domain = ares.join('.');
            // if (!/^\.teld\.(cn|net)+$/i.test(domain)) { domain += ':7777'; }//准生产加端口号
            if (!/^\.(teld\.(cn|net)+|hfcdgs.com)$/i.test(domain)) { domain += ':7777'; }//准生产加端口号
            return protocol + "//" + host + domain;
          }
        }
      };

      this.getQueries = function (templateSrv, target, options, item, scopedExpressionVars) {
        var protocol = window.location.protocol;
        var hostname = window.location.hostname;
        var port = window.location.port;
        var domain = hostname.split('.');
        if (_.size(domain) >= 2) {
          var TLDs = domain.pop();
          var host = domain.pop();
          domain = [host, TLDs];
        }
        var templateSettings = { imports: this.imports, variable: 'bindData' };
        var bindData = {
          time: options.range,
          user: config.bootData.user,
          url: { protocol: protocol, hostname: hostname, port: port, domain: domain.join(".") }
        };

        var fromUnix = options.range.from.valueOf();
        var toUnix = options.range.to.valueOf();
        if (target.rangePrecision) {
          fromUnix = options.range.from.startOf(target.rangePrecision).valueOf();
          toUnix = options.range.to.endOf(target.rangePrecision).valueOf();
        }
        var scopedVars = _.defaults({
          to: { text: toUnix, value: toUnix },
          from: { text: fromUnix, value: fromUnix }
        }, options.scopedVars);

        var parameters = _.cloneDeep(item.parameters);

        parameters = _.transform(parameters, function (r, param) {
          // param.originalVal = param.value;
          if (param.type === 'object') {
            param.value = _.transform(param.value, function (result, eachitem) {
              var originalVal = eachitem.v;
              var v = eachitem.v || '';
              v = templateSrv.replaceScopedVars(v, Object.assign({}, options.scopedVars, scopedExpressionVars));
              v = templateSrv.replace(v, scopedVars, {});
              var compiled = _.template(v, templateSettings);
              v = compiled(bindData);
              if (originalVal === v && _.includes(v, '$')) {
                if (true !== eachitem.enableDefValue) {
                  return;
                }
                v = eachitem.defValue || "";
              }
              result[eachitem.k] = v;
            }, {});
            if (_.size(param.value) === 0) {
              return;
            }
          } else {
            param.value = templateSrv.replaceScopedVars(param.value, Object.assign({}, options.scopedVars, scopedExpressionVars));
            param.value = templateSrv.replace(param.value, scopedVars, {});
            var compiled = _.template(param.value, templateSettings);
            param.value = compiled(bindData);
            if (param.originalVal === param.value && _.includes(param.value, '$')) {
              if (true !== param.enableDefValue) {
                return;
              }
              param.value = param.defValue || "";
            }
          }
          r.push(param);
        }, []);

        var url = templateSrv.replace(item.url, scopedVars, {});
        url = _.template(url, templateSettings)(bindData);

        item.url = url;
        item.parameters = parameters;
        return item;
      };

      this.attachFilter = function (target, header, options, scopedExpressionVars) {
        // debugger;
        if (target.enableAttachFilter && _.size(target.attachFilter) > 0) {
          var headerJson = angular.fromJson(header);
          headerJson.attachFilter = target.attachFilter.map(function (item) { return _.omit(item, ['$$hashKey']); });
          headerJson.attachFilter = _.cloneDeep(headerJson.attachFilter);
          var that = this;
          _.each(headerJson.attachFilter, function (filter) {
            _.each(filter.bool, function (bool) {
              var boolArray = bool.boolArray || [];
              _.each(boolArray, function (boolItem) {
                switch (boolItem.type) {
                  case "query_string":
                    // boolItem._ = _.pick(boolItem, ['value']);
                    boolItem.query = replaceScopedVars(boolItem.query, options, scopedExpressionVars);
                    _.each(_.difference(_.keys(boolItem), ['type', 'query']), function (item) {
                      delete boolItem[item];
                    });
                    break;
                  case "SG":
                  case "terms":
                    boolItem = that.getQueries(templateSrv, target, options, boolItem, scopedExpressionVars);
                    break;
                }
              });
            });
          });

          header = angular.toJson(headerJson);
        }
        return header;
      };
    }

    return {
      ElasticDatasource: ElasticDatasource
    };
  });

