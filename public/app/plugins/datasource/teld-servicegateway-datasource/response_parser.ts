///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';

export default class ResponseParser {
  private queries: any;
  constructor(private $q) { }

  setQueries(queries) {
    this.queries = queries;
    return this;
  }

  processQueryResult(res) {
    var data = [];
    if (!res.data.results) {
      return { data: data };
    }

    for (let key in res.data.results) {
      let queryRes = res.data.results[key];

      let queryEditor = _.find(this.queries, { refId: queryRes.refId });
      switch (queryRes.format) {
        case "series":
          {
            let serie = 'serie';
            let serieGroup = _.groupBy(queryRes.dataset, serie);
            _.each(serieGroup, (series, serieName) => {
              _.each(series, metrics => {
                _.each(metrics, (value, metric) => {
                  if (metric === serie) {
                    return;
                  }
                  let item = {
                    target: serieName,
                    metric: metric,
                    datapoints: [[value, 1]],
                    refId: queryRes.refId
                  };
                  data.push(item);
                });
              });
            });
          }
          break;
        case "time_series":
          {
            let time_sec = queryEditor.time_sec;
            let time_sec_format = queryEditor.time_sec_format;
            let targets = _.keys(queryRes.dataset[0]);
            targets = _.pull(targets, time_sec);

            let series2 = _.map(targets, target => {
              let serie = {
                target: target,
                datapoints: [],
                refId: queryRes.refId
              };
              data.push(serie);
              return serie;
            });

            _.each(queryRes.dataset, set => {
              _.each(series2, metric => {
                let value = set[metric.target];
                let time = set[time_sec];
                let unix = moment(time, time_sec_format).valueOf();
                metric.datapoints.push([value, unix]);
              });
            });
          }
          break;
        case "table":
          var ds = _.isArray(queryRes.dataset) ? queryRes.dataset : [queryRes.dataset];
          let series = {
            type: 'table',
            refId: queryRes.refId,
            columns: _.map(_.keys(ds[0]), function (item) { return { "text": item }; }),
            rows: _.map(ds, function (item) { return _.values(item); })
          };
          data.push(series);
          break;
      }
    }

    return { data: data };
  }

  parseMetricFindQueryResult(refId, results) {
    if (!results || results.data.length === 0 || results.data.results[refId].meta.rowCount === 0) { return []; }

    const columns = results.data.results[refId].tables[0].columns;
    const rows = results.data.results[refId].tables[0].rows;
    const textColIndex = this.findColIndex(columns, '__text');
    const valueColIndex = this.findColIndex(columns, '__value');

    if (columns.length === 2 && textColIndex !== -1 && valueColIndex !== -1) {
      return this.transformToKeyValueList(rows, textColIndex, valueColIndex);
    }

    return this.transformToSimpleList(rows);
  }

  transformToKeyValueList(rows, textColIndex, valueColIndex) {
    const res = [];

    for (let i = 0; i < rows.length; i++) {
      if (!this.containsKey(res, rows[i][textColIndex])) {
        res.push({ text: rows[i][textColIndex], value: rows[i][valueColIndex] });
      }
    }

    return res;
  }

  transformToSimpleList(rows) {
    const res = [];

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const value = rows[i][j];
        if (res.indexOf(value) === -1) {
          res.push(value);
        }
      }
    }

    return _.map(res, value => {
      return { text: value };
    });
  }

  findColIndex(columns, colName) {
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].text === colName) {
        return i;
      }
    }

    return -1;
  }

  containsKey(res, key) {
    for (let i = 0; i < res.length; i++) {
      if (res[i].text === key) {
        return true;
      }
    }
    return false;
  }

  transformAnnotationResponse(options, data) {
    const table = data.data.results[options.annotation.name].tables[0];

    let timeColumnIndex = -1;
    let textColumnIndex = -1;
    let tagsColumnIndex = -1;

    for (let i = 0; i < table.columns.length; i++) {
      if (table.columns[i].text === 'time_sec') {
        timeColumnIndex = i;
      } else if (table.columns[i].text === 'title') {
        return this.$q.reject({ message: 'The title column for annotations is deprecated, now only a column named text is returned' });
      } else if (table.columns[i].text === 'text') {
        textColumnIndex = i;
      } else if (table.columns[i].text === 'tags') {
        tagsColumnIndex = i;
      }
    }

    if (timeColumnIndex === -1) {
      return this.$q.reject({ message: 'Missing mandatory time column (with time_sec column alias) in annotation query.' });
    }

    const list = [];
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      list.push({
        annotation: options.annotation,
        time: Math.floor(row[timeColumnIndex]) * 1000,
        text: row[textColumnIndex],
        tags: row[tagsColumnIndex] ? row[tagsColumnIndex].trim().split(/\s*,\s*/) : []
      });
    }

    return list;
  }
}
