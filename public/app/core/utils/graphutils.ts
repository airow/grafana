///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';

export function calcSeriesBar(calcSeriesConf, data, hideMetrics, dashVariables) {
  if (_.size(data) === 0) {
    return data;
  }

  var dataList = _.cloneDeep(data);

  calcSeriesConf = calcSeriesConf || [];
  calcSeriesConf = _.filter(calcSeriesConf, 'enable');
  var master = _.maxBy(dataList, function (o) { return o.datapoints.length; });
  var expression = [];

  // _.map(dashVariables,variable=>{return  });

  var variables = _.transform(dashVariables, (result, n) => {
    var value = _.toNumber(n.current.value);
    if (_.isNumber(value)) {
      result[n.name] = value;
    }
  }, {});

  var templateSettings = {
    'variable': ['series'],
    imports: {
      vars: variables,
      '_': _
    }
  };

  var dataSource = _.transform(dataList, (result, n) => {
    var values = n.datapoints.map(item => { return item[0]; });
    var times = n.datapoints.map(item => { return item[1]; });
    result[n.target] = _.zipObject(['values', 'time'], [values, times]);
    result[n.target].datapoints = n.datapoints;
  }, {});

  //dataSource.target = _.groupBy(dataList, 'refId');
  dataSource.target = _.groupBy(dataList, o => {
    o.groupKey = o.groupKey || `${o.metric}_${o.field}`;
    return o.groupKey;
  });
  var group = _.union(_.map(dataList, 'target'));
  _.each(calcSeriesConf, (item) => {

    var compiled = _.template("${" + item.expression + "}", templateSettings);

    _.each(group, g => {
      var contextData = _.transform(dataSource.target, (r, v, k) => {
        var n = _.find(v, { target: g });
        if (_.isUndefined(n)) {
          r[k] = _.first([0]);
          return;
        }
        var values = n.datapoints.map(item => { return item[0]; });
        //var times = n.datapoints.map(item => { return item[1]; });
        // r[k] = _.zipObject(['values', 'time'], [values, times]);
        // r[k].datapoints = n.datapoints;
        r[k] = _.first(values);
      }, {});

      //var contextData = { target: contextData1 };

      var expressionData = _.defaultsDeep({ target: g, sort: item.sort, calcSerie: true, datapoints: [] }, item);
      expression.push(expressionData);

      var value = 0;
      try {
        value = compiled(contextData);
        value = _.toNumber(value);
        if (_.isNaN(value) || value === Infinity || false === _.isNumber(value)) {
          value = 0;
        }
      } catch (error) {
        console.error(error);
        value = 0;
      }
      expressionData.datapoints.push([_.toNumber(value), 1]);
      expressionData.refId = item.target;
      expressionData.groupKey = item.target;
    });
  });

  if (_.size(hideMetrics) > 0) {
    var remove = _.map(hideMetrics, 'target');
    _.remove(dataList, item => {
      return _.includes(remove, item.groupKey || item.target);
    });
  }

  //var returnValue = _.concat(dataList, expression);
  var returnValue = _.concat(dataList, expression);
  return returnValue;
}

function calcSeriesGropuBarItem(calcSeriesConf, data, hideMetrics, dashVariables) {
  if (_.size(data) === 0) {
    return data;
  }

  var dataList = _.cloneDeep(data);

  calcSeriesConf = calcSeriesConf || [];
  calcSeriesConf = _.filter(calcSeriesConf, 'enable');
  var master = _.maxBy(dataList, function (o) { return o.datapoints.length; });
  var expression = [];

  // _.map(dashVariables,variable=>{return  });

  var variables = _.transform(dashVariables, (result, n) => {
    var value = _.toNumber(n.current.value);
    if (_.isNumber(value)) {
      result[n.name] = value;
    }
  }, {});

  var templateSettings = {
    'variable': ['series'],
    imports: {
      vars: variables,
      '_': _
    }
  };

  var dataSource = _.transform(dataList, (result, n) => {
    var values = n.datapoints.map(item => { return item[0]; });
    result[n.target] = _.sum(values);
  }, {});

  _.each(calcSeriesConf, (item) => {
    var compiled = _.template("${" + item.expression + "}", templateSettings);
    var expressionData = _.defaultsDeep({ target: item.target, sort: item.sort, calcSerie: true, datapoints: [] }, item);
    expression.push(expressionData);

    var value = 0;
    try {
      value = compiled(dataSource);
      value = _.toNumber(value);
      if (_.isNaN(value) || value === Infinity || false === _.isNumber(value)) {
        value = 0;
      }
    } catch (error) {
      console.error(error);
      value = 0;
    }
    expressionData.datapoints.push([_.toNumber(value), 1]);
    expressionData.refId = item.target;
    expressionData.groupKey = item.target;
  });

  if (_.size(hideMetrics) > 0) {
    var remove = _.map(hideMetrics, 'target');
    _.remove(dataList, item => {
      return _.includes(remove, item.groupKey || item.target);
    });
  }


  _.each(expression, item => {
    dataList.splice(item.sort || _.size(dataList), 0, item);
  });

  //var returnValue = _.concat(dataList, expression);
  var returnValue = dataList;
  //var returnValue = _.concat(expression, dataList);
  return returnValue;
}

export function calcSeriesGropuBar(calcSeriesConf, data, hideMetrics, dashVariables) {
  if (_.size(data) === 0 || _.size(calcSeriesConf) === 0) {
    return data;
  }

  var groupBy = _.groupBy(data, 'target');
  var returnValue = [];
  _.each(groupBy, (groupItem, key) => {
    _.each(groupItem, item => {
      item._target = item.target;
      item._metric = item.metric;

      item.target = item._metric;
      item.metric = item._target;
    });
    var calcItem = calcSeriesGropuBarItem(calcSeriesConf, groupItem, hideMetrics, dashVariables);
    _.each(calcItem, item => {
      if (item.calcSerie) {
        item.metric = item.target;
        item.target = key;
      } else {
        item.target = item._target;
        item.metric = item._metric;
      }
    });
    returnValue = _.concat(returnValue, calcItem);
  });
  return returnValue;
}

export function calcSeries(calcSeriesConf, data, hideMetrics, dashVariables) {
  if (_.size(data) === 0) {
    return data;
  }

  var dataList = _.cloneDeep(data);

  calcSeriesConf = calcSeriesConf || [];
  calcSeriesConf = _.filter(calcSeriesConf, 'enable');
  var master = _.maxBy(dataList, function (o) { return o.datapoints.length; });
  var expression = [];

  // _.map(dashVariables,variable=>{return  });

  var variables = _.transform(dashVariables, (result, n) => {
    var value = _.toNumber(n.current.value);
    if (_.isNumber(value)) {
      result[n.name] = value;
    }
  }, {});

  var templateSettings = {
    'variable': ['series'],
    imports: {
      vars: variables,
      '_': _
      // //'kbn': kbn,
      // 'valueFormats': (function (kbn) {
      //   let bindContext = {
      //     // kbn,
      //     // valueFormats: kbn.valueFormats,
      //     // kbnMap: _.mapKeys(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), (value) => { return value.text; }),
      //     valueFormats: _.transform(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), function (result, unitFormatConf, index) {
      //       result[unitFormatConf.text] = kbn.valueFormats[unitFormatConf.value];
      //     }, {})
      //   };

      //   return function (unitFormatName, size, decimals) {
      //     return this.valueFormats[unitFormatName](size, decimals);
      //   }.bind(bindContext);
      // })(kbn)
    }
  };

  var dataSource = _.transform(dataList, (result, n) => {
    var values = n.datapoints.map(item => { return item[0]; });
    var times = n.datapoints.map(item => { return item[1]; });
    result[n.target] = _.zipObject(['values', 'time'], [values, times]);
    result[n.target].datapoints = n.datapoints;
  }, {});

  _.each(calcSeriesConf, (item) => {

    var expressionData = _.defaultsDeep({ calcSerie: true, datapoints: [] }, item);
    expression.push(expressionData);

    var compiled = _.template("${" + item.expression + "}", templateSettings);

    for (let index = 0; index < master.datapoints.length; index++) {

      var timeSeries = master.datapoints[index][1];

      var contextData = _.transform(dataSource, (result, item, key) => {
        result[key] = item.values[index];
      }, {});

      var value = 0;
      try {
        value = compiled(contextData);
        value = _.toNumber(value);
        if (_.isNaN(value) || value === Infinity || false === _.isNumber(value)) {
          value = 0;
        }
      } catch (error) {
        console.error(error);
        value = 0;
      }
      expressionData.datapoints.push([_.toNumber(value), timeSeries]);
    }
  });

  if (_.size(hideMetrics) > 0) {
    var remove = _.map(hideMetrics, 'target');
    _.remove(dataList, item => {
      return _.includes(remove, item.target);
    });
  }

  var returnValue = _.concat(dataList, expression);
  return returnValue;
}

export function dashVars(dashVariables) {
  return _.map(_.filter(dashVariables, item => {
    var value = _.toNumber(item.current.value);
    return _.isNumber(value) && _.isNaN(value) === false;
  }), 'name');
}
