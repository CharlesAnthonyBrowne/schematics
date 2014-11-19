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

  var handleTest = function (success, msg) {
    return success ? { valid: true } : { valid: false, msg: msg };
  };

  var simpleTest = function (test, defaultMsg) {
    return function (v, rules) {
      return function (customMsg) {
        var msg = customMsg || defaultMsg;
        rules.push(function (x) {
          return handleTest(test(x), msg);
        });
        return v;
      };
    };
  };

  var nonEmpty = simpleTest(function (xs) {
    return xs.length > 0;
  }, "is empty");

  var runner = function (rules) {
    return function (x, keepResult) {
      return rules.reduce(function (chain, rule) {
        return chain.then(function (result) {
          return result.valid ? rule(x) : result;
        });
      }, BPromise.resolve({ valid: true })).then(function (result) {
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

    v.bool = mkV(simpleTest(typeTests.isBoolean, "Value is not a boolean"));

    v.num = mkV(simpleTest(typeTests.isNumber, "Value is not a number"));

    v.str = mkV(simpleTest(typeTests.isString, "Value is not a string"), {
      nonEmpty: nonEmpty
    });

    v.date = mkV(function (v, rules) {
      return function (customMsg) {
        var msg = customMsg || "Value is not a date";
        rules.push(function (x) {
          return handleTest(typeTests.isDate(x), msg);
        });
        return v;
      };
    }, {
      valid: function (v, rules) {
        return function (customMsg) {
          var msg = customMsg || "Value is an invalid date";
          rules.push(function (x) {
            return handleTest(!isNaN(x.getTime()), msg);
          });
          return v;
        };
      }
    });

    v.obj = mkV(simpleTest(typeTests.isObject, "Value is not an object"), {
      prop: function (v, rules) {
        return function (name, xv) {
          rules.push(function (x) {
            if (!hasOwnProp.call(x, name)) {
              return handleTest(false,
                "Object is missing property '" + name + "'");
            }
            var result = { valid: true, why: {} };
            return xv.run(x[name], false)
              .then(function (propResult) {
                if (!propResult.valid) result.valid = false;
                result.why[name] = propResult;
                return result;
              });
          });
          return v;
        };
      }
    });

    v.arr = mkV(simpleTest(typeTests.isArray, "Value is not an array"), {
      nonEmpty: nonEmpty,
      each: function (v, rules) {
        return function (xv) {
          rules.push(function (xs) {
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
          });
          return v;
        };
      }
    });

    return v;

  };

  var schematics = create();
  schematics.create = create;
  return schematics;

}));
