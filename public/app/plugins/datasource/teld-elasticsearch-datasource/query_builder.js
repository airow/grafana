define([
  './query_def',
  'lodash'
],
function (queryDef, _) {
  'use strict';

  function ElasticQueryBuilder(options) {
    this.timeField = options.timeField;
    this.esVersion = options.esVersion;
  }

  ElasticQueryBuilder.prototype.getRangeFilter = function() {
    var filter = {};
    filter[this.timeField] = {
      gte: "$timeFrom",
      lte: "$timeTo",
      format: "epoch_millis",
    };

    return filter;
  };

  ElasticQueryBuilder.prototype.buildTermsAgg = function(aggDef, queryNode, target) {
    var metricRef, metric, y;
    queryNode.terms = { "field": aggDef.field };

    if (!aggDef.settings) {
      return queryNode;
    }

    queryNode.terms.size = parseInt(aggDef.settings.size, 10) === 0 ? 500 : parseInt(aggDef.settings.size, 10);
    if (aggDef.settings.shard_size !== "0") {
      var shard_size = aggDef.settings.shard_size;
      shard_size = shard_size || queryNode.terms.size * 10;
      queryNode.terms.shard_size = parseInt(shard_size, 10) === 0 ? shard_size : parseInt(shard_size, 10);
    }
    if (aggDef.settings.orderBy !== void 0) {
      queryNode.terms.order = {};
      queryNode.terms.order[aggDef.settings.orderBy] = aggDef.settings.order;

      // if metric ref, look it up and add it to this agg level
      metricRef = parseInt(aggDef.settings.orderBy, 10);
      if (!isNaN(metricRef)) {
        for (y = 0; y < target.metrics.length; y++) {
          metric = target.metrics[y];
          if (metric.id === aggDef.settings.orderBy) {
            queryNode.aggs = {};
            queryNode.aggs[metric.id] = {};
            queryNode.aggs[metric.id][metric.type] = {field: metric.field};
            break;
          }
        }
      }
    }

    if (aggDef.settings.min_doc_count !== void 0) {
      queryNode.terms.min_doc_count = parseInt(aggDef.settings.min_doc_count, 10);
    }

    if (aggDef.settings.missing) {
      queryNode.terms.missing = aggDef.settings.missing;
    }

    if (aggDef.settings.script) {
      queryNode.terms.script = { "lang": "painless", "source": aggDef.settings.script };
    }

    return queryNode;
  };

  ElasticQueryBuilder.prototype.buildTermsScriptAgg = function(aggDef, queryNode, target) {
    var metricRef, metric, y;
    queryNode.terms = { "script": { "lang": "painless", "source": aggDef.script } };

    if (!aggDef.settings) {
      return queryNode;
    }

    queryNode.terms.size = parseInt(aggDef.settings.size, 10) === 0 ? 500 : parseInt(aggDef.settings.size, 10);
    if (aggDef.settings.shard_size !== "0") {
      var shard_size = aggDef.settings.shard_size;
      shard_size = shard_size || queryNode.terms.size * 10;
      queryNode.terms.shard_size = parseInt(shard_size, 10) === 0 ? shard_size : parseInt(shard_size, 10);
    }
    if (aggDef.settings.orderBy !== void 0) {
      queryNode.terms.order = {};
      queryNode.terms.order[aggDef.settings.orderBy] = aggDef.settings.order;

      // if metric ref, look it up and add it to this agg level
      metricRef = parseInt(aggDef.settings.orderBy, 10);
      if (!isNaN(metricRef)) {
        for (y = 0; y < target.metrics.length; y++) {
          metric = target.metrics[y];
          if (metric.id === aggDef.settings.orderBy) {
            queryNode.aggs = {};
            queryNode.aggs[metric.id] = {};
            queryNode.aggs[metric.id][metric.type] = {field: metric.field};
            break;
          }
        }
      }
    }

    if (aggDef.settings.min_doc_count !== void 0) {
      queryNode.terms.min_doc_count = parseInt(aggDef.settings.min_doc_count, 10);
    }

    if (aggDef.settings.missing) {
      queryNode.terms.missing = aggDef.settings.missing;
    }

    return queryNode;
  };

  ElasticQueryBuilder.prototype.getDateHistogramAgg = function(aggDef) {
    var esAgg = {};
    var settings = aggDef.settings || {};
    esAgg.interval = settings.interval;
    esAgg.field = this.timeField;
    esAgg.min_doc_count = settings.min_doc_count || 0;
    esAgg.extended_bounds = {min: "$timeFrom", max: "$timeTo"};
    esAgg.format = "epoch_millis";

    if (esAgg.interval === 'auto') {
      esAgg.interval = "$__interval";
    }

    if (settings.missing) {
      esAgg.missing = settings.missing;
    }

    return esAgg;
  };

  ElasticQueryBuilder.prototype.getDateHistogramAggTime_zoneShanghai = function(aggDef) {
    var esAgg = {};
    var settings = aggDef.settings || {};
    esAgg.interval = settings.interval;
    esAgg.field = this.timeField;
    esAgg.min_doc_count = settings.min_doc_count || 0;
    //esAgg.extended_bounds = {min: "$timeFrom", max: "$timeTo"};
    esAgg.time_zone = "Asia/Shanghai";
    esAgg.format = "epoch_millis";

    if (esAgg.interval === 'auto') {
      esAgg.interval = "$__interval";
    }

    if (settings.missing) {
      esAgg.missing = settings.missing;
    }

    return esAgg;
  };

  ElasticQueryBuilder.prototype.getFiltersAgg = function(aggDef) {
    var filterObj = {};
    for (var i = 0; i < aggDef.settings.filters.length; i++) {
      var query = aggDef.settings.filters[i].query;

      filterObj[query] = {
        query_string: {
          query: query,
          analyze_wildcard: true
        }
      };
    }

    return filterObj;
  };

  ElasticQueryBuilder.prototype.documentQuery = function(query) {
    query.size = 500;
    query.sort = {};
    query.sort[this.timeField] = {order: 'desc', unmapped_type: 'boolean'};

    // fields field not supported on ES 5.x
    if (this.esVersion < 5) {
      query.fields = ["*", "_source"];
    }

    query.script_fields = {},
    query.fielddata_fields = [this.timeField];
    return query;
  };

  ElasticQueryBuilder.prototype.documentQuerySort = function (query, target) {
    this.documentQuery(query);
    this.attachScript_fields(query, target);
    return query;
  };

  ElasticQueryBuilder.prototype.attachScript_fields = function (query, target) {

    var scriptFieldsConf = _.filter(target.scriptFieldsConf, function (field) {
      return field.hide !== true && false === _.isEmpty(field.script.script.source);
    });

    if (_.size(scriptFieldsConf) === 0 && _.size(target.sourceFieldsConf) === 0) {
      return query;
    }

    var scriptSort = _.filter(scriptFieldsConf, 'sort');
    scriptSort = _.map(scriptSort, function (item) {
      return { "_script": item.script };
    });
    if (_.size(scriptSort) > 0) {
      query.sort = scriptSort;
    }

    _.transform(scriptFieldsConf, function (result, item) {
      result[item.name] = { script: item.script.script };
    }, query.script_fields);

    if (_.size(target.sourceFieldsConf) === 0) {
      query["_source"] = "*";
    } else {
      query.size = 10000;
      var doc2timeseriesSize = _.get(target, 'doc2timeseries.size', '0');
      doc2timeseriesSize = +doc2timeseriesSize;
      if (doc2timeseriesSize > 0) {
        query.size = doc2timeseriesSize;
      }

      query["_source"] = target.sourceFieldsConf;
      query.sort[this.timeField] = { order: 'asc', unmapped_type: 'boolean' };
    }

    return query;
  };

  ElasticQueryBuilder.prototype.addAdhocFilters = function(query, adhocFilters) {
    if (!adhocFilters) {
      return;
    }

    var i, filter, condition;
    for (i = 0; i < adhocFilters.length; i++) {
      filter = adhocFilters[i];
      condition = {};
      condition[filter.key] = filter.value;
      switch(filter.operator){
        case "=":
          query.query.bool.filter.push({"term": condition});
          break;
        case "!=":
          query.query.bool.filter.push({"bool": {"must_not": {"term": condition}}});
          break;
        case "<":
          condition[filter.key] = {"lt": filter.value};
          query.query.bool.filter.push({"range": condition});
          break;
        case ">":
          condition[filter.key] = {"gt": filter.value};
          query.query.bool.filter.push({"range": condition});
          break;
        case "=~":
          query.query.bool.filter.push({"regexp": condition});
          break;
        case "!~":
          query.query.bool.filter.push({"bool": {"must_not": {"regexp": condition}}});
          break;
      }
    }
  };

  ElasticQueryBuilder.prototype.build = function(target, adhocFilters, queryString) {
    // make sure query has defaults;
    target.metrics = target.metrics || [{ type: 'count', id: '1' }];
    target.dsType = 'elasticsearch';
    target.bucketAggs = target.bucketAggs || [{type: 'date_histogram', id: '2', settings: {interval: 'auto'}}];
    target.timeField =  this.timeField;

    var i, nestedAggs, metric;
    var query = {
      "size": 0,
      "query": {
        "bool": {
          "filter": [
            {"range": this.getRangeFilter()},
            {
              "query_string": {
                "analyze_wildcard": true,
                "query": queryString,
              }
            }
          ]
        }
      }
    };

    if (target.ignoreTimeRange) {
      _.remove(query.query.bool.filter, function (filter) {
        return _.has(filter, 'range');
      });
    }

    this.addAdhocFilters(query, adhocFilters);

    // handle document query
    if (target.bucketAggs.length === 0) {
      metric = target.metrics[0];
      if (metric && metric.type !== 'raw_document') {
        throw {message: 'Invalid query'};
      }
      if (_.size(target.scriptFieldsConf) > 0 || _.size(target.sourceFieldsConf) > 0) {
        return this.documentQuerySort(query, target);
      }
      return this.documentQuery(query, target);
    }

    nestedAggs = query;

    for (i = 0; i < target.bucketAggs.length; i++) {
      var aggDef = target.bucketAggs[i];
      var esAgg = {};

      switch(aggDef.type) {
        case 'date_histogram': {
          esAgg["date_histogram"] = this.getDateHistogramAggTime_zoneShanghai(aggDef);
          break;
        }
        case 'filters': {
          esAgg["filters"] = {filters: this.getFiltersAgg(aggDef)};
          break;
        }
        case 'terms': {
          this.buildTermsAgg(aggDef, esAgg, target);
          break;
        }
        case 'terms_script': {
          this.buildTermsScriptAgg(aggDef, esAgg, target);
          break;
        }
        case 'geohash_grid': {
          esAgg['geohash_grid'] = {field: aggDef.field, precision: aggDef.settings.precision};
          break;
        }
      }

      nestedAggs.aggs = nestedAggs.aggs || {};
      nestedAggs.aggs[aggDef.id] = esAgg;
      nestedAggs = esAgg;
    }

    nestedAggs.aggs = {};

    for (i = 0; i < target.metrics.length; i++) {
      metric = target.metrics[i];
      if (metric.type === 'count') {
        continue;
      }

      var aggField = {};
      var metricAgg = null;

      if (queryDef.isPipelineAgg(metric.type)) {
        if (metric.pipelineAgg && /^\d*$/.test(metric.pipelineAgg)) {
          metricAgg = { buckets_path: metric.pipelineAgg };
        } else {
          continue;
        }
      } else {
        metricAgg = {field: metric.field};
      }

      for (var prop in metric.settings) {
        if (metric.settings.hasOwnProperty(prop) && metric.settings[prop] !== null) {
          metricAgg[prop] = metric.settings[prop];
        }
      }

      aggField[metric.type] = metricAgg;
      nestedAggs.aggs[metric.id] = aggField;
    }

    return query;
  };

  ElasticQueryBuilder.prototype.getTermsQuery = function(queryDef) {
    var query = {
      "size": 0,
      "query": {
        "bool": {
          "filter": [{"range": this.getRangeFilter()}]
        }
      }
    };

    if (queryDef.query) {
      query.query.bool.filter.push({
        "query_string": {
          "analyze_wildcard": true,
          "query": queryDef.query,
        }
      });
    }
    var size = 500;
    if(queryDef.size){
      size = queryDef.size;
    }
    query.aggs =  {
      "1": {
        "terms": {
          "field": queryDef.field,
          "size": size,
          "order": {
            "_term": "asc"
          }
        },
      }
    };
    return query;
  };

  return ElasticQueryBuilder;
});
