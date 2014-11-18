"use strict";

var _ = require("lodash");

var checkTreeConsistency = function (test, node) {
  /*jshint maxcomplexity: 4*/
  if (!node.valid) {
    throw new Error("`valid: false` did not propagate correctly");
  }
  _.each(node.why || node.whys || [], function (value) {
    checkTreeConsistency(test, value);
  });
};

exports.valid = function (schema, value) {
  return function (test) {
    schema.run(value)
      .then(function (result) {
        test.ok(result.valid);
        checkTreeConsistency(test, result);
        test.done();
      });
  };
};

exports.invalid = function (schema, value) {
  return function (test) {
    schema.run(value)
      .then(function (result) {
        test.equal(result.valid, false);
        test.done();
      });
  };
};

exports.customFailure = function (schema, badValue) {
  return function (test) {
    schema("test message").run(badValue)
      .then(function (result) {
        test.equal(result.valid, false);
        test.equal(result.msg, "test message");
        test.done();
      });
  };
};

exports.stateRetention = function (schema, badValue, goodValue) {
  return function (test) {
    schema.run(badValue)
      .then(function (result) {
        test.equal(result.valid, false);
        schema.run(goodValue)
          .then(function (result) {
            test.ok(result.valid);
            checkTreeConsistency(test, result, true);
            schema.run(badValue)
              .then(function (result) {
                test.equal(result.valid, false);
                test.done();
              });
          });
      });
  };
};
