"use strict";

var s = require("../index");
var common = require("./common");
var valid = common.valid;
var invalid = common.invalid;
var customFailure = common.customFailure;
var stateRetention = common.stateRetention;

module.exports = {

  "accept array values": valid(s.arr(), []),

  "reject non-array values": {
    "boolean"  : invalid(s.arr(), false),
    "date"     : invalid(s.arr(), new Date()),
    "null"     : invalid(s.arr(), null),
    "number"   : invalid(s.arr(), 1),
    "object"   : invalid(s.arr(), {}),
    "string"   : invalid(s.arr(), ""),
    "undefined": invalid(s.arr(), undefined)
  },

  "use custom failure message": customFailure(s.arr, null),
  "don't retain state": stateRetention(s.arr(), null, []),

  "nonEmpty rule": {
    "non-empty": valid(s.arr().nonEmpty(), [true]),
    "empty": invalid(s.arr().nonEmpty(), []),
    "use custom failure message": customFailure(s.arr().nonEmpty, []),
    "don't retain state": stateRetention(s.arr().nonEmpty(), [], [true]),
  },

  "each rule": {
    "empty": valid(s.arr().each(s.bool()), []),
    "all valid": valid(s.arr().each(s.bool()), [true, false, true]),
    "any invalid": invalid(s.arr().each(s.bool()), [true, "test"]),
    "don't retain state": stateRetention(s.arr().each(s.bool()), ["test"], [true])
  }
};
