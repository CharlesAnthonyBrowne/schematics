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

  /**
   * Take functions from `Object.prototype` for use with `.call` later. This
   * ensures the original implementations are used in cases where an object has
   * an overwritten `hasOwnProperty` or `toString` property.
   */
  var hasOwnProp = Object.prototype.hasOwnProperty;
  var toString = Object.prototype.toString;

  /**
   * Internal utility methods.
   */
  var _ = (function () {

    var _ = {
      /**
       * Shallow-copies the properties of `source` onto `target`.
       */
      extend: function (target) {
        /*jshint maxcomplexity: 4*/
        for (var i = 1, source; (source = arguments[i]) != null; i++) {
          for (var k in source) {
            if (hasOwnProp.call(source, k)) target[k] = source[k];
          }
        }
        return target;
      }
    };

    /**
     * Create `isType` functions for testing basic JS types.
     */
    ["Boolean", "Number", "String", "Date", "Object", "Array"].forEach(function (k) {
      var className = "[object " + k + "]";
      _["is" + k] = function (value) {
        return toString.call(value) === className;
      };
    });

    return _;
  }());

  var schematics = (function () {

    /**
     * Runs a validation chain where `chain` is an array of step functions that
     * will be run sequentially, each accepting `value` and returning a result
     * object. `valueOnSuccess` determines whether a `value` property will be
     * added to the result object if validation succeeds (defaults to `true`).
     */
    var runner = function (chain, value, valueOnSuccess) {
      return chain.reduce(function (last, step) {
        return last.then(function (result) {
          return result.valid ? step(value) : result;
        });
      }, BPromise.resolve({ valid: true })).then(function (result) {
          if (result.valid && valueOnSuccess !== false) result.value = value;
          return result;
        });
    };

    /**
     * Creates a new validation chain using `ruleDefs` to specify the rules that
     * can be added to the chain, and using `chain` as the already-accumulated
     * validation steps to run in the chain.
     */
    var mkV = function (ruleDefs, chain) {
      ruleDefs = _.extend({}, ruleDefs);
      var v = {
        run: function (value, valueOnSuccess) {
          return runner(chain, value, valueOnSuccess);
        },
        extend: function(newRuleDefs) {
          return mkV(_.extend({}, ruleDefs, newRuleDefs), chain);
        }
      };
      for (var k in ruleDefs) {
        if (hasOwnProp.call(ruleDefs, k)) v[k] = mkRule(ruleDefs, chain, ruleDefs[k]);
      }
      return v;
    };

    /**
     * Creates a function that copies a validation chain and extends it with a
     * new rule.
     */
    var mkRule = function (ruleDefs, chain, ruleDef) {
      return function () {
        return mkV(ruleDefs, chain.concat([ruleDef.apply(undefined, arguments)]));
      };
    };

    /**
     * Create the schematics root object.
     */
    return mkV({}, []);
  }());

  /**
   * Helper for generating validation result objects.
   */
  var handleTest = function (success, msg) {
    return success ? { valid: true } : { valid: false, msg: msg };
  };

  /**
   * Creates a validation handler for a simple predicate function. `test` is
   * the predicate, `defaultMsg` is the message to use by default when the
   * predicate fails. The returned validation handler also accepts an
   * alternative custom error message.
   */
  var predicateTest = function (defaultMsg, test) {
    return function (customMsg) {
      var msg = customMsg || defaultMsg;
      return function (value) {
        return handleTest(test(value), msg);
      };
    };
  };

  /**
   * Rule definition for checking a list-like value is not empty.
   */
  var nonEmpty = predicateTest("Value is empty", function (xs) {
    return xs.length > 0;
  });

  /**
   * Rule definition for checking a date value contains a valid date.
   */
  var validDate = predicateTest("Date is invalid", function (x) {
    return !isNaN(x.getTime());
  });

  /**
   * Rule definition for checking a string matches a regular expression pattern.
   */
  var pattern = function (rx, customMsg) {
    var msg = customMsg || "String did not match specified pattern";
    return function (value) {
      return handleTest(rx.test(value), msg);
    };
  };

  /**
   * Rule definition for checking an object property, where `name` is the
   * property name and `validator` is the sub-validator to run.
   */
  var prop = function (name, validator) {
    return function (value) {
      if (!hasOwnProp.call(value, name)) {
        return handleTest(false, "Object is missing property '" + name + "'");
      }
      var result = { valid: true, why: {} };
      return validator.run(value[name], false)
        .then(function (propResult) {
          if (!propResult.valid) result.valid = false;
          result.why[name] = propResult;
          return result;
        });
    };
  };

  /**
   * Rule definition for checking the items of an array, where `validator` is
   * the sub-validator to run on each item.
   */
  var each = function (validator) {
    return function (values) {
      var result = { valid: true, whys: [] };
      return BPromise.all(values.map(function (x, i) {
          return validator.run(x, false)
            .then(function (xresult) {
              if (!xresult.valid) result.valid = false;
              result.whys[i] = xresult;
              return xresult;
            });
        }))
        .return(result);
    };
  };

  /**
   * Extend the `schematics` object with the basic validators and return.
   */
  return _.extend(schematics, {

    bool: schematics.extend({
      type: predicateTest("Value is not a boolean", _.isBoolean)
    }).type,

    num: schematics.extend({
      type: predicateTest("Value is not a number", _.isNumber)
    }).type,

    str: schematics.extend({
      type: predicateTest("Value is not a string", _.isString),
      pattern: pattern,
      nonEmpty: nonEmpty
    }).type,

    date: schematics.extend({
      type: predicateTest("Value is not a date", _.isDate),
      valid: validDate
    }).type,

    obj: schematics.extend({
      type: predicateTest("Value is not an object", _.isObject),
      prop: prop
    }).type,

    arr: schematics.extend({
      type: predicateTest("Value is not an array", _.isArray),
      nonEmpty: nonEmpty,
      each: each
    }).type
  });

}));
