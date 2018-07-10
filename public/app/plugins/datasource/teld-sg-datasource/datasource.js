define([
  'angular',
  'lodash',
  'app/core/utils/rangeutil',
  'app/core/utils/datemath',
  'moment',
  'app/core/utils/kbn',
  './sg_response',
],
  function (angular, _, rangeUtil, dateMath, moment, kbn, SGResponse) {
    'use strict';

    /** @ngInject */
    function SGDatasource(instanceSettings, $q, backendSrv, templateSrv/*, timeSrv*/) {
      this.basicAuth = instanceSettings.basicAuth;
      this.withCredentials = instanceSettings.withCredentials;
      this.url = instanceSettings.url;
      this.name = instanceSettings.name;
      this.index = instanceSettings.index;
      this.url = "/teldsg";

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

      this._post = function (url, data) {
        return this._request('POST', url, data).then(function (results) {
          results.data.$$config = results.config;
          return results.data;
        });
      };

      this._invokeSG = function (url, options) {
        var data = options.targets;
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
        return { status: "success", message: "Data source is working", title: "Success" };
      };

      this.query = function (options) {
        console.log(options);
        var sentTargets = [];

        return this._invokeSG('_msearch', options).then(function (res) {
          return new SGResponse(sentTargets, res).getDataList();
        });
      };
    }

    return {
      SGDatasource: SGDatasource
    };
  });

