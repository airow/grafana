"use strict";

System.register(["lodash", "moment", "./libs/node-where-filter"], function (_export, _context) {
  "use strict";

  var _, moment, wherefilter, _createClass, GenericDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_libsNodeWhereFilter) {
      wherefilter = _libsNodeWhereFilter.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export("GenericDatasource", GenericDatasource = function () {
        function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, GenericDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
        }

        _createClass(GenericDatasource, [{
          key: "query",
          value: function query(options) {
            var target = _.first(options.targets);
            var type = target.type;
            var columns = _.map(target[type].columns, 'name');
            var rows = target[type].rows;

            var where = target.query || "";
            if (false === _.isEmpty(where)) {
              var filterFun = function filterFun(item) {
                return item.type === 'teldExpression' && "es" === (item.filter || "es");
              };

              var scopedExpressionVars = this.templateSrv.teldExpression2ScopedVarsFormCache('Tstatic', options.scopedVars, 'lucene', filterFun);
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
              columns: _.map(columns, function (col) {
                return { "text": col };
              }),
              rows: _.map(rows, function (row) {
                return _.transform(columns, function (result, col) {
                  result.push(row[col]);
                }, []);
              })
            }];
            if (type === "timeserie") {
              _.pull(columns, 'time_sec');
              data = _.map(columns, function (col) {
                return { "target": col, "refId": target.refId, datapoints: [] };
              });
              _.each(rows, function (row) {
                _.each(data, function (dataItem) {
                  var ts = moment(row['time_sec']).valueOf();
                  dataItem.datapoints.push([row[dataItem.target], ts]);
                });
              });
            }
            return this.q.when({ data: data });
          }
        }, {
          key: "testDatasource",
          value: function testDatasource() {
            return this.q.when({ status: "success", message: "Data source is working", title: "Success" });
          }
        }]);

        return GenericDatasource;
      }());

      _export("GenericDatasource", GenericDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
