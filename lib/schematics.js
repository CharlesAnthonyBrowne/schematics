(function (root, factory) {
  /*jshint strict: false*/
  /*global define*/
  if (typeof define === "function" && define.amd) {
    // AMD, register as an anonymous module.
    define(["bluebird"], factory);
  } else if (typeof exports === "object") {
    // Does not work with strict CommonJS, but only CommonJS-like
    // environments that support module.exports, like Node.
    module.exports = factory(require("bluebird"));
  } else {
    // Browser globals (root is window)
    root.schematics = factory(root.bluebird);
  }
}(this, function (BPromise) {

  "use strict";

  var hasOwnProp = Object.prototype.hasOwnProperty;
  var toString = Object.prototype.toString;

  var typeTests = {};
  ["Boolean", "Number", "String", "Date", "Object", "Array"].forEach(function (k) {
    var className = "[object " + k + "]";
    typeTests["is" + k] = function (value) {
      return toString.call(value) === className;
    };
  });

  var assign = function (target, source) {
    for (var k in source) {
      if (hasOwnProp.call(source, k)) {
        target[k] = source[k];
      }
    }
    return target;
  };

  var handleTest = function (success, msg) {
    return success ? { valid: true } : { valid: false, msg: msg };
  };

  var simpleTest = function (test, defaultMsg) {
    return function (customMsg) {
      var msg = customMsg || defaultMsg;
      return function (x) {
        return handleTest(test(x), msg);
      };
    };
  };

  var nonEmpty = simpleTest(function (xs) {
    return xs.length > 0;
  }, "Value is empty");

  var runner = function (rules, x, keepResult) {
    return rules.reduce(function (chain, rule) {
      return chain.then(function (result) {
        return result.valid ? rule(x) : result;
      });
    }, BPromise.resolve({ valid: true })).then(function (result) {
        if (result.valid && keepResult !== false) result.value = x;
        return result;
      });
  };

  var mkRule = function (schema, rules, k) {
    return function () {
      return mk(schema, rules.concat([schema[k].apply(schema, arguments)]));
    };
  };

  var mk = function (schema, rules) {
    var tests = assign({}, schema);
    var v = {
      run: function (x, keepResult) {
        return runner(rules, x, keepResult);
      },
      extend: function(name, fn) {
        var tests = {};
        tests[name] = fn;
        return mk(assign(tests, schema), rules);
      }
    };
    for (var k in schema) {
      if (hasOwnProp.call(schema, k)) v[k] = mkRule(tests, rules, k);
    }
    return v;
  };

  var mkVVV = function (test, defaultMsg, tests) {
    var v = function (customMsg) {
      var msg = customMsg || defaultMsg;
      return mk(tests, [function (x) {
        return handleTest(test(x), msg);
      }]);
    };
    return v;
  };

  return {

    bool: mkVVV(typeTests.isBoolean, "Value is not a boolean"),

    num: mkVVV(typeTests.isNumber, "Value is not a number"),

    str: mkVVV(typeTests.isString, "Value is not a string", {
      nonEmpty: nonEmpty
    }),

    date: mkVVV(typeTests.isDate, "Value is not a date", {
      valid: simpleTest(function (x) {
        return !isNaN(x.getTime());
      }, "Date is invalid")
    }),

    obj: mkVVV(typeTests.isObject, "Value is not an object", {
      prop: function (name, xv) {
        return function (x) {
          if (!hasOwnProp.call(x, name)) {
            return handleTest(false, "Object is missing property '" + name + "'");
          }
          var result = { valid: true, why: {} };
          return xv.run(x[name], false)
            .then(function (propResult) {
              if (!propResult.valid) result.valid = false;
              result.why[name] = propResult;
              return result;
            });
        };
      }
    }),

    arr: mkVVV(typeTests.isArray, "Value is not an array", {
      nonEmpty: nonEmpty,
      each: function (xv) {
        return function (xs) {
          var result = { valid: true, whys: [] };
          return BPromise.all(xs.map(function (x, i) {
              return xv.run(x, false)
                .then(function (xresult) {
                  if (!xresult.valid) result.valid = false;
                  result.whys[i] = xresult;
                  return xresult;
                });
            }))
            .return(result);
        };
      }
    })
  };
}));
