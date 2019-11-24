import _ from "lodash";
import moment from "moment";
import wherefilter from "./libs/node-where-filter";

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
  }

  query(options) {
    var target = _.first(options.targets);
    var type = target.type;
    var columns = _.map(target[type].columns, 'name');
    var rows = target[type].rows;

    var where = target.query || "";
    if (false === _.isEmpty(where)) {
      var filterFun = function (item) {
        return item.type === 'teldExpression' && "es" === (item.filter || "es");
      };

      var scopedExpressionVars = this.templateSrv.teldExpressionInDataSource2ScopedVarsFormCache(options, 'Tstatic', options.scopedVars, 'lucene', filterFun);
      where = this.templateSrv.replaceScopedVars(where, Object.assign({}, options.scopedVars, scopedExpressionVars));
      where = this.templateSrv.replace(where, Object.assign({}, options.scopedVars, scopedExpressionVars));
      var exprTree = wherefilter.makeTree(where);
      rows = rows.filter(wherefilter.where(exprTree));
      target.lastQueryMeta = { query: wherefilter.whereSQL(exprTree) };
      console.log(wherefilter.whereSQL(exprTree));
    }
    var data = [{
      "refId": target.refId,
      "type": "table",
      columns: _.map(columns, function (col) { return { "text": col }; }),
      rows: _.map(rows, function (row) {
        return _.transform(columns, function (result, col) { result.push(row[col]); }, []);
      }),
    }];
    if (type === "timeserie") {
      _.pull(columns, 'time_sec');
      data = _.map(columns, function (col) { return { "target": col, "refId": target.refId, datapoints: [] }; });
      _.each(rows, function (row) {
        _.each(data, function (dataItem) {
          var ts = moment(row['time_sec']).valueOf();
          dataItem.datapoints.push([row[dataItem.target], ts]);
        });
      });
    }
    return this.q.when({ data: data });
  }

  testDatasource() {
    return this.q.when({ status: "success", message: "Data source is working", title: "Success" });
  }
}
