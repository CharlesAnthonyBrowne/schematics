"use strict";

exports.valid = function (schema, value) {
  return function (test) {
    test.expect(1);
    schema.run(value)
      .then(function (result) {
        test.ok(result.valid);
        test.done();
      });
  };
};

exports.invalid = function (schema, value) {
  return function (test) {
    test.expect(1);
    schema.run(value)
      .then(function (result) {
        test.equal(result.valid, false);
        test.done();
      });
  };
};

exports.customFailure = function (schema, badValue) {
  return function (test) {
    test.expect(1);
    schema("test message").run(badValue)
      .then(function (result) {
        test.deepEqual(result, { valid: false, msg: "test message" });
        test.done();
      });
  };
};

exports.stateRetention = function (schema, badValue, goodValue) {
  return function (test) {
    test.expect(3);
    schema.run(badValue)
      .then(function (result) {
        test.equal(result.valid, false);
        schema.run(goodValue)
          .then(function (result) {
            test.ok(result.valid);
            schema.run(badValue)
              .then(function (result) {
                test.equal(result.valid, false);
                test.done();
              });
          });
      });
  };
};
