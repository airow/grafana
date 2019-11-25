define([
  "lodash",
  "./query_def",
  "moment"
],
function (_, queryDef, moment) {
  'use strict';

  function ElasticResponse(targets, response) {
    this.targets = targets;
    this.response = response;
  }

  ElasticResponse.prototype.processMetrics = function(esAgg, target, seriesList, props) {
    var metric, y, i, newSeries, bucket, value;

    for (y = 0; y < target.metrics.length; y++) {
      metric = target.metrics[y];
      if (metric.hide) {
        continue;
      }

      switch(metric.type) {
        case 'count': {
          newSeries = { datapoints: [], metric: 'count', props: props};
          for (i = 0; i < esAgg.buckets.length; i++) {
            bucket = esAgg.buckets[i];
            value = bucket.doc_count;
            newSeries.datapoints.push([value, bucket.key]);
          }
          seriesList.push(newSeries);
          break;
        }
        case 'percentiles': {
          if (esAgg.buckets.length === 0) {
            break;
          }

          var firstBucket = esAgg.buckets[0];
          var percentiles = firstBucket[metric.id].values;

          for (var percentileName in percentiles) {
            newSeries = {datapoints: [], metric: 'p' + percentileName, props: props, field: metric.field};

            for (i = 0; i < esAgg.buckets.length; i++) {
              bucket = esAgg.buckets[i];
              var values = bucket[metric.id].values;
              newSeries.datapoints.push([values[percentileName], bucket.key]);
            }
            seriesList.push(newSeries);
          }

          break;
        }
        case 'extended_stats': {
          for (var statName in metric.meta) {
            if (!metric.meta[statName]) {
              continue;
            }

            newSeries = {datapoints: [], metric: statName, props: props, field: metric.field};

            for (i = 0; i < esAgg.buckets.length; i++) {
              bucket = esAgg.buckets[i];
              var stats = bucket[metric.id];

              // add stats that are in nested obj to top level obj
              stats.std_deviation_bounds_upper = stats.std_deviation_bounds.upper;
              stats.std_deviation_bounds_lower = stats.std_deviation_bounds.lower;

              newSeries.datapoints.push([stats[statName], bucket.key]);
            }

            seriesList.push(newSeries);
          }

          break;
        }
        default: {
          newSeries = { datapoints: [], metric: metric.type, field: metric.field, props: props};
          for (i = 0; i < esAgg.buckets.length; i++) {
            bucket = esAgg.buckets[i];

            value = bucket[metric.id];
            if (value !== undefined) {
              if (value.normalized_value) {
                newSeries.datapoints.push([value.normalized_value, bucket.key]);
              } else {
                newSeries.datapoints.push([value.value, bucket.key]);
              }
            }

          }
          seriesList.push(newSeries);
          break;
        }
      }
    }
  };

  ElasticResponse.prototype.processAggregationDocs = function(esAgg, aggDef, target, docs, props) {
    var metric, y, i, bucket, metricName, doc;

    for (i = 0; i < esAgg.buckets.length; i++) {
      bucket = esAgg.buckets[i];
      doc = _.defaults({}, props);
      doc[aggDef.field] = bucket.key;

      for (y = 0; y < target.metrics.length; y++) {
        metric = target.metrics[y];

        switch(metric.type) {
          case "count": {
            metricName = this._getMetricName(metric.type);
            doc[metricName] = bucket.doc_count;
            break;
          }
          case 'extended_stats': {
            for (var statName in metric.meta) {
              if (!metric.meta[statName]) {
                continue;
              }

              var stats = bucket[metric.id];
              // add stats that are in nested obj to top level obj
              stats.std_deviation_bounds_upper = stats.std_deviation_bounds.upper;
              stats.std_deviation_bounds_lower = stats.std_deviation_bounds.lower;

              metricName = this._getMetricName(statName);
              doc[metricName] = stats[statName];
            }
            break;
          }
          default:  {
            metricName = this._getMetricName(metric.type);
            doc[metricName] =bucket[metric.id].value;
            break;
          }
        }
      }

      docs.push(doc);
    }
  };

  // This is quite complex
  // neeed to recurise down the nested buckets to build series
  ElasticResponse.prototype.processBuckets = function(aggs, target, seriesList, docs, props, depth) {
    var bucket, aggDef, esAgg, aggId;
    var maxDepth = target.bucketAggs.length-1;

    for (aggId in aggs) {
      aggDef = _.find(target.bucketAggs, {id: aggId});
      esAgg = aggs[aggId];

      if (!aggDef) {
        continue;
      }

      if (depth === maxDepth) {
        if (aggDef.type === 'date_histogram')  {
          this.processMetrics(esAgg, target, seriesList, props);
        } else {
          this.processAggregationDocs(esAgg, aggDef, target, docs, props);
        }
      } else {
        for (var nameIndex in esAgg.buckets) {
          bucket = esAgg.buckets[nameIndex];
          props = _.clone(props);
          if (bucket.key !== void 0) {
            props[aggDef.field] = bucket.key;
          } else {
            props["filter"] = nameIndex;
          }
          if (bucket.key_as_string) {
            props[aggDef.field] = bucket.key_as_string;
          }
          this.processBuckets(bucket, target, seriesList, docs, props, depth+1);
        }
      }
    }
  };

  ElasticResponse.prototype._getMetricName = function(metric) {
    var metricDef = _.find(queryDef.metricAggTypes, {value: metric});
    if (!metricDef)  {
      metricDef = _.find(queryDef.extendedStats, {value: metric});
    }

    return metricDef ? metricDef.text : metric;
  };

  ElasticResponse.prototype._getSeriesName = function(series, target, metricTypeCount) {
    var metricName = this._getMetricName(series.metric);

    if (target.alias) {
      var regex = /\{\{([\s\S]+?)\}\}/g;

      return target.alias.replace(regex, function(match, g1, g2) {
        var group = g1 || g2;

        if (group.indexOf('term ') === 0) { return series.props[group.substring(5)]; }
        if (series.props[group] !== void 0) { return series.props[group]; }
        if (group === 'metric') { return metricName; }
        if (group === 'field') { return series.field; }

        return match;
      });
    }

    if (series.field && queryDef.isPipelineAgg(series.metric)) {
      var appliedAgg = _.find(target.metrics, { id: series.field });
      if (appliedAgg) {
        metricName += ' ' + queryDef.describeMetric(appliedAgg);
      } else {
        metricName = 'Unset';
      }
    } else if (series.field) {
      metricName += ' ' + series.field;
    }

    var propKeys = _.keys(series.props);
    if (propKeys.length === 0) {
      return metricName;
    }

    var name = '';
    for (var propName in series.props) {
      name += series.props[propName] + ' ';
    }

    if (metricTypeCount === 1) {
      return name.trim();
    }

    return name.trim() + ' ' + metricName;
  };

  ElasticResponse.prototype.nameSeries = function(seriesList, target) {
    var metricTypeCount = _.uniq(_.map(seriesList, 'metric')).length;
    var fieldNameCount = _.uniq(_.map(seriesList, 'field')).length;

    for (var i = 0; i < seriesList.length; i++) {
      var series = seriesList[i];
      series.target = this._getSeriesName(series, target, metricTypeCount, fieldNameCount);
    }
  };

  ElasticResponse.prototype.processHits = function(hits, seriesList) {
    var series = {target: 'docs', type: 'docs', datapoints: [], total: hits.total};
    var propName, hit, doc, i;

    for (i = 0; i < hits.hits.length; i++) {
      hit = hits.hits[i];
      doc = {
        _id: hit._id,
        _type: hit._type,
        _index: hit._index
      };

      if (hit._source) {
        for (propName in hit._source) {
          doc[propName] = hit._source[propName];
        }
      }

      for (propName in hit.fields) {
        doc[propName] = hit.fields[propName];
      }
      series.datapoints.push(doc);
    }

    seriesList.push(series);
  };

  ElasticResponse.prototype.trimDatapoints = function(aggregations, target) {
    var histogram = _.find(target.bucketAggs, { type: 'date_histogram'});

    var shouldDropFirstAndLast = histogram && histogram.settings && histogram.settings.trimEdges;
    if (shouldDropFirstAndLast) {
      var trim = histogram.settings.trimEdges;
      for(var prop in aggregations) {
        var points = aggregations[prop];
        if (points.datapoints.length > trim * 2) {
          points.datapoints = points.datapoints.slice(trim, points.datapoints.length - trim);
        }
      }
    }
  };

  ElasticResponse.prototype.getErrorFromElasticResponse = function(response, err) {
    var result = {};
    result.data = JSON.stringify(err, null, 4);
    if (err.root_cause && err.root_cause.length > 0 && err.root_cause[0].reason) {
      result.message = err.root_cause[0].reason;
    } else {
      result.message = err.reason || 'Unkown elatic error response';
    }

    if (response.$$config) {
      result.config = response.$$config;
    }

    return result;
  };

  ElasticResponse.prototype.getTimeSeries = function() {
    var seriesList = [];
    // debugger;
    function doc2timeseriesHandler(item) {
      {
        var returnValue = _.flatten(_.values(_.pick(item, pick)));
        //("00"+Math.trunc( moment("2019-05-23 05:30:00").format("mm")/3)*3).substring(1)

        if (false === _.isEmpty(doc2timeseries.intervalM)) {

          var arr = /^(\d{1,2})([d|h|m])$/.exec(doc2timeseries.intervalM);
          if (arr === null) {
            return returnValue;
          }

          var intervalSetting = _.zipObject(['intervalM', 'value', 'precision'], arr);

          var fmConf = ({
            m: { mapping: "mm", prefix: "YYYY-MM-DD HH:" },
            h: { mapping: "HH", prefix: "YYYY-MM-DD " },
            d: { mapping: "DD", prefix: "YYYY-MM-" },
            M: { mapping: "MM", prefix: "YYYY-" }
          })[intervalSetting.precision];

          var intervalType = fmConf.mapping;
          var mOriginal = moment(returnValue[1]);
          var interval = Math.trunc(mOriginal.format(intervalType) / intervalSetting.value);
          interval *= intervalSetting.value;

          var mOriginalFormat = fmConf.prefix + _.padStart(interval, 2, 0);
          var newMomentFormat = fmConf.prefix + intervalType;
          var newMoment = moment(mOriginal.format(mOriginalFormat), newMomentFormat);

          returnValue.push(mOriginal.format()); returnValue.push(newMoment.format());
          returnValue[1] = newMoment.valueOf();
        }

        return returnValue;
      }
    }

    function fillDateHistogramMock(aggregations, mock_date_histogram) {
      _.each(aggregations, function (item) {
        _.each(item.buckets, function (bucket) {
          _.each(bucket, function (bucketItem, bucketKey) {
            if (bucketItem.buckets) {
              var newAgg = _.zipObject([bucketKey], [bucketItem]);
              fillDateHistogramMock(newAgg, mock_date_histogram);
              return false;
            }
          });
          var mockBuckets = [_.defaults({ key_as_string: "-28800000", key: -28800000 }, bucket)];
          bucket[mock_date_histogram.id] = { buckets: mockBuckets };
        });
      });
    }

    function onlyCountMetric(seft,response, target, tmpSeriesList, docs) {
      var date_histogram = _.find(target.bucketAggs, { "type": "date_histogram" });
      var rootKey = date_histogram.id;
      var mockCount = _.zipObject([rootKey], [{
        "buckets": [{
          "key_as_string": " - 28800000", "key": -28800000,
          doc_count: response.hits.total
        }]
      }]);
      seft.processBuckets(mockCount, target, tmpSeriesList, docs, {}, 0);
      seft.trimDatapoints(tmpSeriesList, target);
      seft.nameSeries(tmpSeriesList, target);

      for (var y = 0; y < tmpSeriesList.length; y++) {
        tmpSeriesList[y].targetRefId = target.refId;
        tmpSeriesList[y].refId = target.refId;
        tmpSeriesList[y].groupKey = target.refId + '_' + tmpSeriesList[y].metric + '_' + tmpSeriesList[y].field;
        seriesList.push(tmpSeriesList[y]);
      }

      if (seriesList.length === 0 && docs.length > 0) {
        seriesList.push({ target: 'docs', type: 'docs', datapoints: docs });
      }
    }

    for (var i = 0; i < this.response.responses.length; i++) {
      var response = this.response.responses[i];
      if (response.error) {
        throw this.getErrorFromElasticResponse(this.response, response.error);
      }

      var doc2timeseriesConf = this.targets[i].doc2timeseries;
      var doc2timeseries = _.omit(doc2timeseriesConf, 'size');
      var isEmptyDoc2timeseries = _.isEmpty(doc2timeseries);
      if (response.hits && response.hits.hits.length > 0) {
        this.processHits(response.hits, seriesList);
      } else {
        if (!isEmptyDoc2timeseries) { seriesList.push({ datapoints: [] }); }
      }

      if (_.size(seriesList) > 0 && !isEmptyDoc2timeseries) {
        var pick = [doc2timeseries.value, doc2timeseries.timeseries];
        seriesList[i].datapoints = _.map(seriesList[i].datapoints, doc2timeseriesHandler);
        delete seriesList[i].type;
        var overwrite = {
          "metric": "count",
          "field": doc2timeseries.value,
          "props": {},
          "target": this.targets[i].refId,
          "targetRefId": this.targets[i].refId,
          "refId": this.targets[i].refId,
          "groupKey": this.targets[i].refId + "_count_" + doc2timeseries.value
        };
        _.assign(seriesList[i], overwrite);
        continue;
      }

      // debugger;
      var target = this.targets[i];
      var tmpSeriesList = [];
      var docs = [];
      if (response.aggregations) {
        var aggregations = response.aggregations;

        if (target.ignoreGroupByDateHistogram) {
          // let mockTarget = target;
          var mock_date_histogram = null;
          var date_histogram = _.find(target.bucketAggs, { "type": "date_histogram" });
          if (_.isNil(date_histogram)) {
            mock_date_histogram = { "id": "mock_date_histogram", "type": "date_histogram" };
          }

          var countMetric = _.find(target.metrics, { type: 'count' });

          if (countMetric && _.size(target.metrics) !== 1) {
            aggregations = _.defaults({ "key_as_string": " - 28800000", "key": -28800000, doc_count: response.hits.total }, aggregations);
            var rootKey = (mock_date_histogram || date_histogram).id;
            aggregations = _.zipObject([rootKey], [{ "buckets": [aggregations] }]);
          } else {
            if (_.size(target.bucketAggs) === 1 && date_histogram) {
              fillDateHistogramMock({ "root": { "buckets": [aggregations] } }, mock_date_histogram || date_histogram);
            } else {
              fillDateHistogramMock(aggregations, mock_date_histogram || date_histogram);
            }
          }

          if (mock_date_histogram) {
            target.bucketAggs.push(mock_date_histogram);
          }

          this.processBuckets(aggregations, target, tmpSeriesList, docs, {}, 0);
          this.trimDatapoints(tmpSeriesList, target);
          this.nameSeries(tmpSeriesList, target);
          if (mock_date_histogram) {
            _.remove(target.bucketAggs, mock_date_histogram);
          }
        } else {
          this.processBuckets(aggregations, target, tmpSeriesList, docs, {}, 0);
          this.trimDatapoints(tmpSeriesList, target);
          this.nameSeries(tmpSeriesList, target);
        }

        for (var y = 0; y < tmpSeriesList.length; y++) {
          tmpSeriesList[y].targetRefId = target.refId;
          tmpSeriesList[y].refId = target.refId;
          tmpSeriesList[y].groupKey = target.refId + '_' + tmpSeriesList[y].metric + '_' + tmpSeriesList[y].field;
          seriesList.push(tmpSeriesList[y]);
        }

        if (seriesList.length === 0 && docs.length > 0) {
          seriesList.push({ target: 'docs', type: 'docs', datapoints: docs });
        }
      } else {

        var metricsSize = _.size(target.metrics);
        if (metricsSize === 1 && target.metrics[0].type === 'count' && target.ignoreGroupByDateHistogram) {
          onlyCountMetric(this, response, target, tmpSeriesList, docs);
        }
      }
    }

    _.each(seriesList, function (dl) {
      console.log(_.groupBy(dl.datapoints, function (ll) { return ll[1]; }));
    });

    return { data: seriesList };
  };

  return ElasticResponse;
});

