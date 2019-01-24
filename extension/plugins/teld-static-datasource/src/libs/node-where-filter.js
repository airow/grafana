//var dot = require('./node-dot-path');
class PathArray extends Array { }

const makePathArray = function (path) {
  if (path instanceof PathArray) {
    return path;
  } else if (path instanceof Array) {
    const pathArray = new PathArray();
    for (var index = 0; index < path.length; index++) {
      pathArray[pathArray.length] = makePathArray(path[index]);
    }
    return pathArray;
  } else if (typeof path === 'string') {
    const pathArray = new PathArray();
    path = path.split('.');
    for (var index = 0, name = ''; index < path.length; index++) {
      const segment = path[index];
      if (segment[segment.length - 1] === '\\') {
        name += segment.slice(0, -1) + '.';
      } else {
        name += segment;
        pathArray[pathArray.length] = name;
        name = '';
      }
    }
    return pathArray;
  } else {
    return null;
  }
};

var dot = {
  PathArray: PathArray,
  makePathArray: makePathArray,

  set: function (node, path, value) {
    const pathArray = makePathArray(path);
    if (pathArray) {
      const end = pathArray.length - 1;
      for (var index = 0; index < end; index++) {
        const name = pathArray[index];
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
  get: function (node, path, exec) {
    const pathArray = makePathArray(path);
    if (pathArray) {
      var index = 0;
      if (exec === true) {
        for (; index < pathArray.length && node; index++) {
          const name = pathArray[index];
          if (typeof node[name] === 'function') {
            node = node[name]();
          } else {
            node = node[name];
          }
        }
      } else {
        for (; index < pathArray.length && node; index++) {
          const name = pathArray[index];
          node = node[name];
        }
      }
      if (index === pathArray.length) {
        return node;
      }
    }
  },
  has: function (node, path) {
    const pathArray = makePathArray(path);
    if (pathArray) {
      const end = pathArray.length - 1;
      for (var index = 0; index < end; index++) {
        const name = pathArray[index];
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
  delete: function (node, path) {
    const pathArray = makePathArray(path);
    if (pathArray) {
      const end = pathArray.length - 1;
      for (var index = 0; index < end; index++) {
        const name = pathArray[index];
        if (node[name] && node[name] instanceof Object) {
          node = node[name];
        } else {
          return;
        }
      }
      delete node[pathArray[end]];
    }
  },

  arrayToObject: function (array) {
    const node = {};
    for (var index = 0; index < array.length; index++) {
      const data = array[index];
      const eq = data.search(/[^\\]=/);
      if (eq === -1) {
        module.exports.set(node, data, true);
      } else {
        module.exports.set(node, data.slice(0, eq + 1).replace(/\\=/g, '='), data.slice(eq + 2));
      }
    }
    return node;
  },
};


const TokenizerTree = {};
[
  ['||'],
  ['&&'],
  ['~', '!~', '=', '!=', '<', '>', '<=', '>='],
].forEach((operators, priority) => {
  operators.forEach((operator) => {
    const pathArray = operator.split('');
    dot.set(TokenizerTree, pathArray.concat(['type']), 'operator');
    dot.set(TokenizerTree, pathArray.concat(['value']), operator);
    dot.set(TokenizerTree, pathArray.concat(['priority']), priority);
  });
});
['"'].forEach((operator) => {
  const pathArray = operator.split('');
  const TokenizerSubTree = {};
  dot.set(TokenizerSubTree, pathArray.concat(['type']), 'match-right');
  dot.set(TokenizerSubTree, pathArray.concat(['value']), operator);
  dot.set(TokenizerTree, pathArray.concat(['type']), 'match-left');
  dot.set(TokenizerTree, pathArray.concat(['value']), operator);
  dot.set(TokenizerTree, pathArray.concat(['end']), TokenizerSubTree);
});
[' ', '\t', '\n', '\r', '(', ')'].forEach((operator) => {
  const pathArray = operator.split('');
  dot.set(TokenizerTree, pathArray.concat(['type']), 'delimit');
  dot.set(TokenizerTree, pathArray.concat(['value']), operator);
});
const tokenizer = function (content) {
  var node = null;
  var start = 0;
  var words = [];
  var match = null;
  var priority = 0;
  content = content + ' ';
  for (var index = 0; index < content.length; index++) {
    const char = content[index];
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
            operator: '',
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
                operator: node.value,
              });
              match = null;
              break;
            case 'operator':
              words.push({
                type: node.type,
                operator: node.value,
                priority: priority + node.priority,
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

const nodeToExpr = function (node) {
  switch (node.type) {
    case 'expr':
      return [node.operator, nodeToExpr(node.left), nodeToExpr(node.right)];
    case 'literal':
      if (node.operator === '"') {
        return node.value.replace(/(\\[bfnrt\\'"]|\\u[0-f]{4})/ig, (escape) => JSON.parse('"' + escape + '"'));
      } else if (Number.parseFloat(node.value).toString() == node.value) {
        return Number.parseFloat(node.value);
      } else {
        return node.value;
      }
    default:
      throw new SyntaxError();
  }
};
const exprCompile = function (expr) {
  switch (expr[0]) {
    case '&&': case '||':
      return [expr[0], exprCompile(expr[1]), exprCompile(expr[2])];
    case '~': case '!~':
      if (expr[2] === "%") { expr[2] = "(.*?)"; }
      return [expr[0], dot.makePathArray(expr[1]), new RegExp(expr[2])];
    case '=': case '!=': case '<': case '>': case '<=': case '>=':
      return [expr[0], dot.makePathArray(expr[1]), expr[2]];
    case true:
      return expr;
  }
};
const exprExecute = function (expr, data, exec) {
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
const escape = function (value) {
  if (typeof value === 'number') {
    return value;
  } else {
    return '"' + value.replace(/"/g, '\\"') + '"';
  }
};
const exprToSQL = function (expr) {
  var expr2 = expr[2];
  switch (expr[0]) {
    case '&&':
      return '( ' + exprToSQL(expr[1]) + ' ) AND ( ' + exprToSQL(expr[2]) + ' )';
    case '||':
      return '( ' + exprToSQL(expr[1]) + ' ) OR ( ' + exprToSQL(expr[2]) + ' )';
    case '~':
      expr2 = expr[2];
      if (expr2 === "%" || expr2 === "(.*?)") { expr2 = ""; }
      return '`' + expr[1] + '` LIKE ' + escape('%' + expr2 + '%');
    case '!~':
      expr2 = expr[2];
      if (expr2 === "%" || expr2 === "(.*?)") { expr2 = ""; }
      return '`' + expr[1] + '` NOT LIKE ' + escape('%' + expr2 + '%');
    case '=': case '!=': case '<': case '>': case '<=': case '>=':
      return '`' + expr[1] + '` ' + expr[0] + ' ' + escape(expr[2]);
    case true:
      return '1 = 1';
  }
};

export default {
  makeTree: function (where, aliases) {
    typeof where !== 'string' && (where = '');
    var nodes = tokenizer(where);
    var priority = [];
    nodes.forEach((node, index) => {
      node.previous = nodes[index - 1] || null;
      node.next = nodes[index + 1] || null;
      node.type === 'operator' && priority.push(node);
    });
    priority.sort((mon, sun) => sun.priority - mon.priority);
    aliases = aliases || {};
    var node = priority.map((node) => {
      switch (node.operator) {
        case '&&': case '||':
          if (node.previous && node.previous.type === 'expr' &&
            node.next && node.next.type === 'expr') {
            const expr = {
              type: 'expr',
              operator: node.operator,
              left: node.previous,
              right: node.next,
              previous: node.previous.previous,
              next: node.next.next,
            };
            expr.previous && (expr.previous.next = expr);
            expr.next && (expr.next.previous = expr);
            return expr;
          }
          break;
        case '~': case '!~': case '=': case '!=': case '<': case '>': case '<=': case '>=':
          if (node.previous && node.previous.type === 'literal' &&
            node.next && node.next.type === 'literal') {
            const expr = {
              type: 'expr',
              operator: node.operator,
              left: node.previous,
              right: node.next,
              previous: node.previous.previous,
              next: node.next.next,
            };
            expr.left.value = aliases[expr.left.value] || expr.left.value;
            expr.previous && (expr.previous.next = expr);
            expr.next && (expr.next.previous = expr);
            return expr;
          }
          break;
      }
      throw new SyntaxError();
    }).pop();
    return node ? nodeToExpr(node) : [true];
  },
  where: function (where, exec) {
    where = exprCompile(where);
    return (data) => exprExecute(where, data, exec);
  },
  whereSQL: function (where) {
    return exprToSQL(where);
  },
};
