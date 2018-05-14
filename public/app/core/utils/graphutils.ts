///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';

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
        if (_.isNaN(value) || false === _.isNumber(value)) {
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
