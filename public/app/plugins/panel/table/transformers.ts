///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import flatten from '../../../core/utils/flatten';
import TimeSeries from '../../../core/time_series2';
import TableModel from '../../../core/table_model';
import angular from "angular";
import kbn from 'app/core/utils/kbn';

var transformers = {};

transformers['timeseries_to_rows'] = {
  description: 'Time series to rows',
  getColumns: function() {
    return [];
  },
  transform: function(data, panel, model) {
    model.columns = [
      {text: 'Time', type: 'date'},
      {text: 'Metric'},
      {text: 'Value'},
    ];

    for (var i = 0; i < data.length; i++) {
      var series = data[i];
      for (var y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];
        model.rows.push([dp[1], series.target, dp[0]]);
      }
    }
  },
};

transformers['timeseries_to_columns'] = {
  description: 'Time series to columns',
  getColumns: function() {
    return [];
  },
  transform: function(data, panel, model) {
    model.columns.push({text: 'Time', type: 'date'});

    // group by time
    var points = {};

    for (var i = 0; i < data.length; i++) {
      var series = data[i];
      model.columns.push({text: series.target});

      for (var y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];
        var timeKey = dp[1].toString();

        if (!points[timeKey]) {
          points[timeKey] = {time: dp[1]};
          points[timeKey][i] = dp[0];
        } else {
          points[timeKey][i] = dp[0];
        }
      }
    }

    for (var time in points) {
      var point = points[time];
      var values = [point.time];

      for (var i = 0; i < data.length; i++) {
        var value = point[i];
        values.push(value);
      }

      model.rows.push(values);
    }
  }
};

transformers['druid_groupby_to_rows'] = {
  description: 'druid groupby to rows',
  getColumns: function(data) {
    return [];
  },
  addColumn: function (columnsObj, columns, value) {
    columnsObj[value] || columns.push(columnsObj[value] = { text: value });
  },
  transform: function(data, panel, model) {

    let target = panel.targets[0];
    let groupBy = target.groupBy;
    if (groupBy && !Array.isArray(groupBy)) {
      groupBy = groupBy.split(",");
    }

    let columnsObj = {};
    let columns = [];

    let aggregators = target.aggregators || [];
    aggregators.forEach(aggregator => {
      switch (aggregator.type) {
        default:
          this.addColumn(columnsObj, columns, aggregator.name);
          break;
      }
    });

    let tempData = [];
    for (var dataIndex = 0; dataIndex < data.length; dataIndex += columns.length) {
      var series = data[dataIndex];
      for (var y = 0; y < series.datapoints.length; y++) {

        for (var index = 0; index < columns.length; index++) {
          var item = data[dataIndex + index];
          var t = { target: item.target, datapoints: [item.datapoints[y]] };
          tempData.push(t);
        }
      }
    }
    let rows = groupby(tempData, columns);

    model.rows = rows;
    model.columns = _.concat([
      { text: 'Time', type: 'date' }
    ],
      groupBy.map(text => { return { text }; }),
      columns);
  },
};

function groupby(data, columns) {
  var rowIndex = 0, rows = [];

  for (var dataIndex = 0; dataIndex < data.length; dataIndex += columns.length) {
    var row = rows[rowIndex++] = [];
    for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      var i = dataIndex + columnIndex;
      var series = data[i];

      for (var y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];

        if (columnIndex === 0) {
          row.push(dp[1]);
          _.dropRight(series.target.split(":")).forEach(item => {
            item.split("-").forEach(groupField => { row.push(groupField); });
          });
        }
        row.push(dp[0]);
      }
    }
  }

  return rows;
}

transformers['druid_arithmetic_to_rows'] = {
  description: 'druid arithmetic to rows',
  getColumns: function(data) {
    return [];
  },
  addColumn: function (columnsObj, columns, value) {
    columnsObj[value] || columns.push(columnsObj[value] = { text: value });
  },
  transform: function(data, panel, model) {

    let target = panel.targets[0];
    let groupBy = target.groupBy;
    if (groupBy && !Array.isArray(groupBy)) {
      groupBy = groupBy.split(",");
    }
    let columnsObj = {};
    let columns = [];

    let aggregators = target.aggregators || [];
    aggregators.forEach(aggregator => {
      switch (aggregator.type) {
        default:
          this.addColumn(columnsObj, columns, aggregator.name);
          break;
      }
    });

    let postAggregators = target.postAggregators || [];
    postAggregators.forEach(postAggregator => {
      switch (postAggregator.type) {
        case "arithmetic":
          this.addColumn(columnsObj, columns, postAggregator.fields[0].fieldName);
          this.addColumn(columnsObj, columns, postAggregator.fields[1].fieldName);
          this.addColumn(columnsObj, columns, postAggregator.name);
          break;
      }
    });

    let rows = groupby(data, columns);
    // var rowIndex = 0;
    // if (columns.length > 0) {
    //   for (var dataIndex = 0; dataIndex < data.length; dataIndex += columns.length) {
    //     var row = rows[rowIndex++] = [];
    //     for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    //       var i = dataIndex + columnIndex;
    //       var series = data[i];

    //       for (var y = 0; y < series.datapoints.length; y++) {
    //         var dp = series.datapoints[y];

    //         if (columnIndex === 0) {
    //           row.push(dp[1]);
    //           _.dropRight(series.target.split(":")).forEach(item => {
    //             item.split("-").forEach(groupField => { row.push(groupField); });
    //           });
    //         }

    //         row.push(dp[0]);
    //         //rows[series.target] = [dp[1], series.target, dp[0]];
    //       }
    //     }
    //   }
    // } else {
    //   data.forEach(series => {
    //     var row = rows[rowIndex++] = [];
    //     for (var y = 0; y < series.datapoints.length; y++) {
    //       var dp = series.datapoints[y];

    //       row.push(dp[1]);
    //       _.dropRight(series.target.split(":")).forEach(item => {
    //         item.split("-").forEach(groupField => { row.push(groupField); });
    //       });
    //       row.push(dp[0]);
    //       //rows[series.target] = [dp[1], series.target, dp[0]];
    //     }
    //   });
    // }
    model.rows = rows;
    model.columns = _.concat([
      { text: 'Time', type: 'date' }
    ],
      groupBy.map(text => { return { text }; }),
      columns);
  },
};

transformers['druid_select_to_columns'] = {
  description: 'druid select to columns',
  getColumns: function(data) {
    if (!data || data.length === 0) {
      return [];
    }
    let columns = data.map(item => { return { text: item.target }; });
    return columns;
  },
  transform: function(originalData, panel, model) {
    model.columns.push({text: 'Time', type: 'date'});

    let columns = [];
    if (false === _.isEmpty(panel.targets)) {
      let target = panel.targets[0];
      //columns = columns.concat(target.selectDimensions, target.selectMetrics);
      columns = _.concat(target.selectDimensions, target.selectMetrics);
    }

    if (false === _.isEmpty(panel.columns)) {
      columns = panel.columns.map(item => item.text);
    }

    var points = {};


    var data = originalData;

    if (columns.length > 0) {
      data = [];

      columns.forEach(column => {
        let findIndex = _.findIndex(originalData, item => item.target === column);
        if (findIndex >= 0) {
          data.push(originalData[findIndex]);
        }
      });
    }

    for (var i = 0; i < data.length; i++) {
      var series = data[i];
      model.columns.push({text: series.target});

      for (var y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];
        var key = y + '@' + dp[1].toString();

        if (!points[key]) {
          points[key] = {key: dp[1]};
          points[key][i] = dp[0];
        } else {
          points[key][i] = dp[0];
        }
      }
    }

    for (var key in points) {
      var point = points[key];
      var values = [point.key];

      for (var i = 0; i < data.length; i++) {
        var value = point[i];
        values.push(value);
      }

      model.rows.push(values);
    }
  }
};

transformers['timeseries_aggregations'] = {
  description: 'Time series aggregations',
  getColumns: function() {
    return [
      {text: 'Avg', value: 'avg'},
      {text: 'Min', value: 'min'},
      {text: 'Max', value: 'max'},
      {text: 'Total', value: 'total'},
      {text: 'Current', value: 'current'},
      {text: 'Count', value: 'count'},
    ];
  },
  transform: function(data, panel, model) {
    var i, y;
    model.columns.push({text: 'Metric'});

    if (panel.columns.length === 0) {
      panel.columns.push({text: 'Avg', value: 'avg'});
    }

    for (i = 0; i < panel.columns.length; i++) {
      model.columns.push({text: panel.columns[i].text});
    }

    for (i = 0; i < data.length; i++) {
      var series = new TimeSeries({
        datapoints: data[i].datapoints,
        alias: data[i].target,
      });

      series.getFlotPairs('connected');
      var cells = [series.alias];

      for (y = 0; y < panel.columns.length; y++) {
        cells.push(series.stats[panel.columns[y].value]);
      }

      model.rows.push(cells);
    }
  }
};

transformers['annotations'] = {
  description: 'Annotations',
  getColumns: function() {
    return [];
  },
  transform: function(data, panel, model) {
    model.columns.push({text: 'Time', type: 'date'});
    model.columns.push({text: 'Title'});
    model.columns.push({text: 'Text'});
    model.columns.push({text: 'Tags'});

    if (!data || !data.annotations || data.annotations.length === 0) {
      return;
    }

    for (var i = 0; i < data.annotations.length; i++) {
      var evt = data.annotations[i];
      model.rows.push([evt.min, evt.title, evt.text, evt.tags]);
    }
  }
};

transformers['table'] = {
  description: 'Table',
  getColumns: function(data) {
    if (!data || data.length === 0) {
      return [];
    }
  },
  transform: function(data, panel, model) {
    if (!data || data.length === 0) {
      return;
    }

    if (data[0].type !== 'table') {
      throw {message: 'Query result is not in table format, try using another transform.'};
    }

    model.columns = data[0].columns;
    model.rows = data[0].rows;
  }
};

transformers['json'] = {
  description: 'JSON Data',
  getColumns: function(data) {
    if (!data || data.length === 0) {
      return [];
    }

    var names: any = {};
    for (var i = 0; i < data.length; i++) {
      var series = data[i];
      if (series.type !== 'docs') {
        continue;
      }

      // only look at 100 docs
      var maxDocs = Math.min(series.datapoints.length, 100);
      for (var y = 0; y < maxDocs; y++) {
        var doc = series.datapoints[y];
        var flattened = flatten(doc, null);
        for (var propName in flattened) {
          names[propName] = true;
        }
      }
    }

    return _.map(names, function(value, key) {
      return {text: key, value: key};
    });
  },
  transform: function(data, panel, model) {
    var i, y, z;
    for (i = 0; i < panel.columns.length; i++) {
      model.columns.push({text: panel.columns[i].text});
    }

    if (model.columns.length === 0) {
      model.columns.push({text: 'JSON'});
    }

    for (i = 0; i < data.length; i++) {
      var series = data[i];

      for (y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];
        var values = [];

        if (_.isObject(dp) && panel.columns.length > 0) {
          var flattened = flatten(dp, null);
          for (z = 0; z < panel.columns.length; z++) {
            values.push(flattened[panel.columns[z].value]);
          }
        } else {
          values.push(JSON.stringify(dp));
        }

        model.rows.push(values);
      }
    }
  }
};


function setColumnAlias(panel, model) {
  let aliasStyles = panel.styles.filter(style => {
    return false === _.isEmpty(style.alias);
  });

  aliasStyles.forEach(style => {
    model.columns.forEach(column => {
      var regex = kbn.stringToJsRegex(style.pattern);
      if (column.text.match(regex)) {
        if (style.alias) {
          column.alias = style.alias;
        }
      }
    });
  });
};

function transformDataToTable(data, panel) {
  var model = new TableModel(),
    copyData = angular.copy(data);

  if (!data || data.length === 0) {
    return model;
  }

  var transformer = transformers[panel.transform];
  if (!transformer) {
    throw {message: 'Transformer ' + panel.transformer + ' not found'};
  }

  if (panel.filterNull) {
    for (var i = 0; i < copyData.length; i++) {
      copyData[i].datapoints = copyData[i].datapoints.filter((dp) => dp[0] != null);
    }
  }

  transformer.transform(copyData, panel, model);

  setColumnAlias(panel, model);

  return model;
}

export {transformers, transformDataToTable}
