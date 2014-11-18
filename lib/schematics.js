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

  var isBoolean = function (value) {
    return value === true || value === false ||
      toString.call(value) === "[object Boolean]";
  };

  var isNumber = function (value) {
    return typeof value === "number" ||
      toString.call(value) === "[object Number]";
  };

  var isString = function (value) {
    return typeof value === "string" ||
      toString.call(value) === "[object String]";
  };

  var isDate = function (value) {
    return toString.call(value) === "[object Date]";
  };

  var isObject = function (value) {
    var type = typeof value;
    return value && (type === "object" || type === "function");
  };

  var isArray = Array.isArray || function (value) {
    return toString.call(value) === "[object Array]";
  };

  var handleFail = function (result) {
    return function (msg) {
      result.msg = msg;
      result.valid = false;
    };
  };

  var nonEmpty = function (v, rules) {
    return function (customMsg) {
      var msg = customMsg || "is empty";
      rules.push(function (result, xs, fail) {
        if (!result.valid) return;
        if (xs.length === 0) fail(msg);
      });
      return v;
    };
  };

  var simpleTest = function (test, defaultMsg) {
    return function (v, rules) {
      return function (customMsg) {
        var msg = customMsg || defaultMsg;
        rules.push(function (result, x, fail) {
          if (!result.valid) return;
          if (!test(x)) fail(msg);
        });
        return v;
      };
    };
  };

  var runner = function (rules, makeResultSchema) {
    return function (x, keepResult) {
      var result = makeResultSchema ? makeResultSchema() : {};
      result.valid = true;
      var pending = rules.map(function (rule) {
        return rule(result, x, handleFail(result));
      });
      return BPromise.all(pending).then(function () {
        if (result.valid && keepResult !== false) result.value = x;
        return result;
      });
    };
  };

  var mkV = function (test, namedTests) {
    var create = function (customMsg) {
      var v = {};
      var rules = [];
      for (var k in tests) {
        if (hasOwnProp.call(tests, k)) {
          v[k] = tests[k](v, rules);
        }
      }
      v.run = runner(rules);
      return test(v, rules)(customMsg);
    };
    var tests = create.tests = {};
    for (var k in namedTests) {
      if (hasOwnProp.call(namedTests, k)) {
        tests[k] = namedTests[k];
      }
    }
    return create;
  };

  var create = function () {

    var v = {};

    v.bool = mkV(simpleTest(isBoolean, "Value is not a boolean"));

    v.num = mkV(simpleTest(isNumber, "Value is not a number"));

    v.str = mkV(simpleTest(isString, "Value is not a string"), {
      nonEmpty: nonEmpty
    });

    v.date = mkV(function (v, rules) {
      return function (customMsg) {
        var msg = customMsg || "Value is not a date";
        rules.push(function (result, x, fail) {
          if (!result.valid) return;
          if (!isDate(x)) return fail(msg);
        });
        return v;
      };
    }, {
      valid: function (v, rules) {
        return function (customMsg) {
          var msg = customMsg || "Value is an invalid date";
          rules.push(function (result, x, fail) {
            if (!result.valid) return;
            if (isNaN(x.getTime())) fail(msg);
          });
          return v;
        };
      }
    });

    v.obj = function (customMsg) {

      var v = {};
      var rules = [];

      v.prop = function (name, xv) {
        rules.push(function (result, x, fail) {
          if (!result.valid) return;
          if (!hasOwnProp.call(x, name)) {
            return fail("Object is missing property '" + name + "'");
          }
          return xv.run(x[name], false)
            .then(function (propResult) {
              result.why[name] = propResult;
              if (!propResult.valid) result.valid = false;
            });
        });
        return v;
      };

      v.run = runner(rules, function () {
        return { why: {} };
      });

      return simpleTest(isObject, "Value is not an object")(v, rules)(customMsg);

    };

    v.arr = function (customMsg) {

      var v = {};
      var rules = [];

      v.nonEmpty = nonEmpty(v, rules);

      v.each = function (xv) {
        rules.push(function (result, xs) {
          if (!result.valid) return;
          return BPromise.all(xs.map(function (x, i) {
              return xv.run(x, false)
                .then(function (xresult) {
                  if (!xresult.valid) result.valid = false;
                  result.whys[i] = xresult;
                  return xresult;
                });
            }));
        });
        return v;
      };

      v.run = runner(rules, function () {
        return { whys: [] };
      });

      return simpleTest(isArray, "Value is not an array")(v, rules)(customMsg);

    };

    return v;

  };

  var schematics = create();
  schematics.create = create;
  return schematics;

}));
