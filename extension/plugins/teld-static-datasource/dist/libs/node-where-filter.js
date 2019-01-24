'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var PathArray, makePathArray, dot, TokenizerTree, tokenizer, nodeToExpr, exprCompile, exprExecute, escape, exprToSQL;

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
    setters: [],
    execute: function () {
      PathArray = function (_Array) {
        _inherits(PathArray, _Array);

        function PathArray() {
          _classCallCheck(this, PathArray);

          return _possibleConstructorReturn(this, (PathArray.__proto__ || Object.getPrototypeOf(PathArray)).apply(this, arguments));
        }

        return PathArray;
      }(Array);

      makePathArray = function makePathArray(path) {
        if (path instanceof PathArray) {
          return path;
        } else if (path instanceof Array) {
          var pathArray = new PathArray();
          for (var index = 0; index < path.length; index++) {
            pathArray[pathArray.length] = makePathArray(path[index]);
          }
          return pathArray;
        } else if (typeof path === 'string') {
          var _pathArray = new PathArray();
          path = path.split('.');
          for (var index = 0, name = ''; index < path.length; index++) {
            var segment = path[index];
            if (segment[segment.length - 1] === '\\') {
              name += segment.slice(0, -1) + '.';
            } else {
              name += segment;
              _pathArray[_pathArray.length] = name;
              name = '';
            }
          }
          return _pathArray;
        } else {
          return null;
        }
      };

      dot = {
        PathArray: PathArray,
        makePathArray: makePathArray,

        set: function set(node, path, value) {
          var pathArray = makePathArray(path);
          if (pathArray) {
            var end = pathArray.length - 1;
            for (var index = 0; index < end; index++) {
              var name = pathArray[index];
              if (node[name] && node[name] instanceof Object) {
                node = node[name];
              } else {
                node = node[name] = {};
              }
            }
            node[pathArray[end]] = value;
            return true;
          } else {
            return false;
          }
        },
        get: function get(node, path, exec) {
          var pathArray = makePathArray(path);
          if (pathArray) {
            var index = 0;
            if (exec === true) {
              for (; index < pathArray.length && node; index++) {
                var name = pathArray[index];
                if (typeof node[name] === 'function') {
                  node = node[name]();
                } else {
                  node = node[name];
                }
              }
            } else {
              for (; index < pathArray.length && node; index++) {
                var _name = pathArray[index];
                node = node[_name];
              }
            }
            if (index === pathArray.length) {
              return node;
            }
          }
        },
        has: function has(node, path) {
          var pathArray = makePathArray(path);
          if (pathArray) {
            var end = pathArray.length - 1;
            for (var index = 0; index < end; index++) {
              var name = pathArray[index];
              if (node[name] && node[name] instanceof Object) {
                node = node[name];
              } else {
                return false;
              }
            }
            return pathArray[end] in node;
          } else {
            return false;
          }
        },
        delete: function _delete(node, path) {
          var pathArray = makePathArray(path);
          if (pathArray) {
            var end = pathArray.length - 1;
            for (var index = 0; index < end; index++) {
              var name = pathArray[index];
              if (node[name] && node[name] instanceof Object) {
                node = node[name];
              } else {
                return;
              }
            }
            delete node[pathArray[end]];
          }
        },

        arrayToObject: function arrayToObject(array) {
          var node = {};
          for (var index = 0; index < array.length; index++) {
            var data = array[index];
            var eq = data.search(/[^\\]=/);
            if (eq === -1) {
              module.exports.set(node, data, true);
            } else {
              module.exports.set(node, data.slice(0, eq + 1).replace(/\\=/g, '='), data.slice(eq + 2));
            }
          }
          return node;
        }
      };
      TokenizerTree = {};

      [['||'], ['&&'], ['~', '!~', '=', '!=', '<', '>', '<=', '>=']].forEach(function (operators, priority) {
        operators.forEach(function (operator) {
          var pathArray = operator.split('');
          dot.set(TokenizerTree, pathArray.concat(['type']), 'operator');
          dot.set(TokenizerTree, pathArray.concat(['value']), operator);
          dot.set(TokenizerTree, pathArray.concat(['priority']), priority);
        });
      });
      ['"'].forEach(function (operator) {
        var pathArray = operator.split('');
        var TokenizerSubTree = {};
        dot.set(TokenizerSubTree, pathArray.concat(['type']), 'match-right');
        dot.set(TokenizerSubTree, pathArray.concat(['value']), operator);
        dot.set(TokenizerTree, pathArray.concat(['type']), 'match-left');
        dot.set(TokenizerTree, pathArray.concat(['value']), operator);
        dot.set(TokenizerTree, pathArray.concat(['end']), TokenizerSubTree);
      });
      [' ', '\t', '\n', '\r', '(', ')'].forEach(function (operator) {
        var pathArray = operator.split('');
        dot.set(TokenizerTree, pathArray.concat(['type']), 'delimit');
        dot.set(TokenizerTree, pathArray.concat(['value']), operator);
      });

      tokenizer = function tokenizer(content) {
        var node = null;
        var start = 0;
        var words = [];
        var match = null;
        var priority = 0;
        content = content + ' ';
        for (var index = 0; index < content.length; index++) {
          var char = content[index];
          if (node === null) {
            if (match) {
              if (match[char] && content[index - 1] !== '\\') {
                node = match[char];
              }
            } else if (TokenizerTree[char]) {
              if (start !== index) {
                words.push({
                  type: 'literal',
                  value: content.slice(start, index),
                  operator: ''
                });
              }
              node = TokenizerTree[char];
              start = index;
            }
          } else {
            if (node[char]) {
              node = node[char];
            } else {
              if (node.type) {
                switch (node.type) {
                  case 'delimit':
                    if (node.value === '(') {
                      priority += 100;
                    } else if (node.value === ')') {
                      priority -= 100;
                    }
                    break;
                  case 'match-left':
                    match = node.end;
                    break;
                  case 'match-right':
                    words.push({
                      type: 'literal',
                      value: content.slice(start, index - node.value.length),
                      operator: node.value
                    });
                    match = null;
                    break;
                  case 'operator':
                    words.push({
                      type: node.type,
                      operator: node.value,
                      priority: priority + node.priority
                    });
                    break;
                }
                start = index--;
              } else {
                index--;
              }
              node = null;
            }
          }
        }
        return words;
      };

      nodeToExpr = function nodeToExpr(node) {
        switch (node.type) {
          case 'expr':
            return [node.operator, nodeToExpr(node.left), nodeToExpr(node.right)];
          case 'literal':
            if (node.operator === '"') {
              return node.value.replace(/(\\[bfnrt\\'"]|\\u[0-f]{4})/ig, function (escape) {
                return JSON.parse('"' + escape + '"');
              });
            } else if (Number.parseFloat(node.value).toString() == node.value) {
              return Number.parseFloat(node.value);
            } else {
              return node.value;
            }
          default:
            throw new SyntaxError();
        }
      };

      exprCompile = function exprCompile(expr) {
        switch (expr[0]) {
          case '&&':case '||':
            return [expr[0], exprCompile(expr[1]), exprCompile(expr[2])];
          case '~':case '!~':
            if (expr[2] === "%") {
              expr[2] = "(.*?)";
            }
            return [expr[0], dot.makePathArray(expr[1]), new RegExp(expr[2])];
          case '=':case '!=':case '<':case '>':case '<=':case '>=':
            return [expr[0], dot.makePathArray(expr[1]), expr[2]];
          case true:
            return expr;
        }
      };

      exprExecute = function exprExecute(expr, data, exec) {
        switch (expr[0]) {
          case '&&':
            return exprExecute(expr[1], data, exec) && exprExecute(expr[2], data, exec);
          case '||':
            return exprExecute(expr[1], data, exec) || exprExecute(expr[2], data, exec);
          case '~':
            return expr[2].test(dot.get(data, expr[1], exec));
          case '!~':
            return expr[2].test(dot.get(data, expr[1], exec)) === false;
          case '=':
            return dot.get(data, expr[1], exec) == expr[2];
          case '!=':
            return dot.get(data, expr[1], exec) != expr[2];
          case '<':
            return dot.get(data, expr[1], exec) < expr[2];
          case '>':
            return dot.get(data, expr[1], exec) > expr[2];
          case '<=':
            return dot.get(data, expr[1], exec) <= expr[2];
          case '>=':
            return dot.get(data, expr[1], exec) >= expr[2];
          case true:
            return true;
        }
      };

      escape = function escape(value) {
        if (typeof value === 'number') {
          return value;
        } else {
          return '"' + value.replace(/"/g, '\\"') + '"';
        }
      };

      exprToSQL = function exprToSQL(expr) {
        var expr2 = expr[2];
        switch (expr[0]) {
          case '&&':
            return '( ' + exprToSQL(expr[1]) + ' ) AND ( ' + exprToSQL(expr[2]) + ' )';
          case '||':
            return '( ' + exprToSQL(expr[1]) + ' ) OR ( ' + exprToSQL(expr[2]) + ' )';
          case '~':
            expr2 = expr[2];
            if (expr2 === "%" || expr2 === "(.*?)") {
              expr2 = "";
            }
            return '`' + expr[1] + '` LIKE ' + escape('%' + expr2 + '%');
          case '!~':
            expr2 = expr[2];
            if (expr2 === "%" || expr2 === "(.*?)") {
              expr2 = "";
            }
            return '`' + expr[1] + '` NOT LIKE ' + escape('%' + expr2 + '%');
          case '=':case '!=':case '<':case '>':case '<=':case '>=':
            return '`' + expr[1] + '` ' + expr[0] + ' ' + escape(expr[2]);
          case true:
            return '1 = 1';
        }
      };

      _export('default', {
        makeTree: function makeTree(where, aliases) {
          typeof where !== 'string' && (where = '');
          var nodes = tokenizer(where);
          var priority = [];
          nodes.forEach(function (node, index) {
            node.previous = nodes[index - 1] || null;
            node.next = nodes[index + 1] || null;
            node.type === 'operator' && priority.push(node);
          });
          priority.sort(function (mon, sun) {
            return sun.priority - mon.priority;
          });
          aliases = aliases || {};
          var node = priority.map(function (node) {
            switch (node.operator) {
              case '&&':case '||':
                if (node.previous && node.previous.type === 'expr' && node.next && node.next.type === 'expr') {
                  var expr = {
                    type: 'expr',
                    operator: node.operator,
                    left: node.previous,
                    right: node.next,
                    previous: node.previous.previous,
                    next: node.next.next
                  };
                  expr.previous && (expr.previous.next = expr);
                  expr.next && (expr.next.previous = expr);
                  return expr;
                }
                break;
              case '~':case '!~':case '=':case '!=':case '<':case '>':case '<=':case '>=':
                if (node.previous && node.previous.type === 'literal' && node.next && node.next.type === 'literal') {
                  var _expr = {
                    type: 'expr',
                    operator: node.operator,
                    left: node.previous,
                    right: node.next,
                    previous: node.previous.previous,
                    next: node.next.next
                  };
                  _expr.left.value = aliases[_expr.left.value] || _expr.left.value;
                  _expr.previous && (_expr.previous.next = _expr);
                  _expr.next && (_expr.next.previous = _expr);
                  return _expr;
                }
                break;
            }
            throw new SyntaxError();
          }).pop();
          return node ? nodeToExpr(node) : [true];
        },
        where: function where(_where, exec) {
          _where = exprCompile(_where);
          return function (data) {
            return exprExecute(_where, data, exec);
          };
        },
        whereSQL: function whereSQL(where) {
          return exprToSQL(where);
        }
      });
    }
  };
});
//# sourceMappingURL=node-where-filter.js.map
