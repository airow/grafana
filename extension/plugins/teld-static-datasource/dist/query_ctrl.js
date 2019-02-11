'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!', 'lodash'], function (_export, _context) {
  "use strict";

  var QueryCtrl, _, _createClass, GenericDatasourceQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }, function (_cssQueryEditorCss) {}, function (_lodash) {
      _ = _lodash.default;
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

      _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl = function (_QueryCtrl) {
        _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

        function GenericDatasourceQueryCtrl($scope, $injector) {
          _classCallCheck(this, GenericDatasourceQueryCtrl);

          var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

          _this.scope = $scope;
          //this.target.target = this.target.target || 'select metric';
          _this.target.type = _this.target.type || (_this.panel.type === "teld-querybar-panel" ? 'table' : 'timeserie');

          _this.target.table = _this.target.table || { columns: [], rows: [] };
          _this.target.timeserie = _this.target.timeserie || { columns: [], rows: [] };
          return _this;
        }

        _createClass(GenericDatasourceQueryCtrl, [{
          key: 'getTarget',
          value: function getTarget() {
            return this.target[this.target.type];
          }
        }, {
          key: 'addColumns',
          value: function addColumns(type) {
            var target = this.getTarget();
            var columns = target.columns;
            if (this.target.type === 'timeserie') {
              var tsCol = { name: "time_sec" };
              if (undefined === _.find(columns, tsCol)) {
                columns.unshift(tsCol);
              }
            }
            columns.push({ name: "", type: type });
            if (_.size(target.rows) === 0) {
              target.rows.push({});
            }
          }
        }, {
          key: 'move',
          value: function move(variableArray, index, newIndex) {
            _.move(variableArray, index, newIndex);
          }
        }, {
          key: 'remove',
          value: function remove(variableArray, variable) {
            var index = _.indexOf(variableArray, variable);
            variableArray.splice(index, 1);
          }
        }, {
          key: 'addRow',
          value: function addRow() {}
        }, {
          key: 'getOptions',
          value: function getOptions(query) {
            return this.datasource.metricFindQuery(query || '');
          }
        }, {
          key: 'toggleEditorMode',
          value: function toggleEditorMode() {
            this.target.rawQuery = !this.target.rawQuery;
          }
        }, {
          key: 'onChangeInternal',
          value: function onChangeInternal() {
            this.panelCtrl.refresh(); // Asks the panel to refresh data.
          }
        }]);

        return GenericDatasourceQueryCtrl;
      }(QueryCtrl));

      _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl);

      GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map
