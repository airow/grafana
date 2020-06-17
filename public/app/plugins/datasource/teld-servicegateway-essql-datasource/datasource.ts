///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import { TeldServiceGatewayDatasource } from 'app/plugins/datasource/teld-servicegateway-datasource/datasource';

export class TeldESSQLDatasource extends TeldServiceGatewayDatasource {
  id: any;
  name: any;
  // responseParser: ResponseParser;

  /** @ngInject **/
  constructor(instanceSettings, backendSrv, $q, templateSrv, contextSrv, alertSrv) {
    super(instanceSettings, backendSrv, $q, templateSrv, contextSrv, alertSrv);
  }

  // getQueries(options, deviceInfo) {
  //   return super.getQueries(options, deviceInfo);
  // }

  // iosDev(resolve, reject) {
  //   super.iosDev(resolve, reject);
  // }


  // iosDevTimeout(resolve, reject) {
  //   super.iosDevTimeout(resolve, reject);
  // }

  query(options) {
    // debugger;
    let target = _.first(options.targets);
    let dataType = _.find(target.parameters, { key: "DataType" });
    dataType.value = target.format === 'time_series' ? "time" : "list";
    let esSql = _.find(target.parameters, { key: "ESSql" });
    esSql.enableDefValue = true;
    esSql.defValue = esSql.value;
    return super.query(options);
  }

  setScopedExpression(scopedExpressionVars, options) {
    // debugger;
    super.setScopedExpression(scopedExpressionVars, options);
    var filterSqlFun = function (item) {
      return item.type === 'teldExpression' && "sql" === (item.filter || "es");
    };
    console.log(this.name);
    var scopedExpressionSqlVars = this.templateSrv.teldExpressionInDataSource2ScopedVarsFormCache(options, 'mssql',
      options.scopedVars, 'lucene', filterSqlFun);
    _.defaults(scopedExpressionVars, scopedExpressionSqlVars);
    return scopedExpressionVars;
  }

  // getQuery(options, deviceInfo) {
  //   return super.getQuery(options, deviceInfo);
  // }

  // metricFindQuery(query, optionalOptions) {
  //   return super.metricFindQuery(query, optionalOptions);
  // }

  // testDatasource() {
  //   // debugger;
  //   return super.testDatasource();
  // }
}
