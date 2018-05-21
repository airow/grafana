///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import ResponseParser from './response_parser';

export class MssqlDatasource {
  id: any;
  name: any;
  responseParser: ResponseParser;

  /** @ngInject **/
  constructor(instanceSettings, private backendSrv, private $q, private templateSrv) {
    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    this.responseParser = new ResponseParser(this.$q);
  }

  interpolateVariable(value) {
    if (typeof value === 'string') {

      let regExp = new RegExp("<orderby='(.+?)'/>");
      let matches = regExp.exec(value);
      if (matches) {
        return matches[1];
      }

      let matchesIn = new RegExp("<in=(.+?) />").exec(value);
      if (matchesIn) {
        return ` IN ${matchesIn[1]}`;
      }

      let matchesLike = new RegExp("<like />").exec(value);
      if (matchesLike) {
        return ' LIKE \'%\'';
      }

      return '\'' + value + '\'';
    }

    if (typeof value === 'number') {
      return value;
    }

    var quotedValues = _.map(value, function(val) {
      if (typeof value === 'number') {
        return value;
      }

      return '\'' + val + '\'';
    });
    return  quotedValues.join(',');
  }

  query(options) {

    var scopedExpressionVars = this.templateSrv.teldExpression2ScopedVars(options.scopedVars, this.interpolateVariable);
    console.log(scopedExpressionVars);
    //debugger;
    var queries = _.filter(options.targets, item => {
      return item.hide !== true;
    }).map(item => {
      var rawSql = item.rawSql;
      rawSql = this.templateSrv.replaceScopedVars(rawSql, scopedExpressionVars);
      rawSql = this.templateSrv.replace(rawSql, options.scopedVars, this.interpolateVariable);
      return {
        refId: item.refId,
        intervalMs: options.intervalMs,
        maxDataPoints: options.maxDataPoints,
        datasourceId: this.id,
        rawSql: rawSql,
        format: item.format,
      };
    });

    if (queries.length === 0) {
      return this.$q.when({data: []});
    }

    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: {
        from: options.range.from.valueOf().toString(),
        to: options.range.to.valueOf().toString(),
        queries: queries,
      }
    }).then(this.responseParser.processQueryResult);
  }

  annotationQuery(options) {
    if (!options.annotation.rawQuery) {
      return this.$q.reject({message: 'Query missing in annotation definition'});
    }

    const query = {
      refId: options.annotation.name,
      datasourceId: this.id,
      rawSql: this.templateSrv.replace(options.annotation.rawQuery, options.scopedVars, this.interpolateVariable),
      format: 'table',
    };

    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: {
        from: options.range.from.valueOf().toString(),
        to: options.range.to.valueOf().toString(),
        queries: [query],
      }
    }).then(data => this.responseParser.transformAnnotationResponse(options, data));
  }

  metricFindQuery(query, optionalOptions) {
    let refId = 'tempvar';
    if (optionalOptions && optionalOptions.variable && optionalOptions.variable.name) {
      refId = optionalOptions.variable.name;
    }

    const interpolatedQuery = {
      refId: refId,
      datasourceId: this.id,
      rawSql: this.templateSrv.replace(query, {}, this.interpolateVariable),
      format: 'table',
    };

    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: {
        queries: [interpolatedQuery],
      }
    })
    .then(data => this.responseParser.parseMetricFindQueryResult(refId, data));
  }

  testDatasource() {
    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: {
        from: '5m',
        to: 'now',
        queries: [{
          refId: 'A',
          intervalMs: 1,
          maxDataPoints: 1,
          datasourceId: this.id,
          rawSql: "SELECT 1",
          format: 'table',
        }],
      }
    }).then(res => {
      return { status: "success", message: "Database Connection OK"};
    }).catch(err => {
      console.log(err);
      if (err.data && err.data.message) {
        return { status: "error", message: err.data.message };
      } else {
        return { status: "error", message: err.status };
      }
    });
  }
}

