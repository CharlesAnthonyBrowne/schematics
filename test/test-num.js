"use strict";

var s = require("../index");
var common = require("./common");
var valid = common.valid;
var invalid = common.invalid;
var customFailure = common.customFailure;
var stateRetention = common.stateRetention;

module.exports = {

  "accept numeric values": valid(s.num(), 1),

  "reject non-numeric values": {
    "array"    : invalid(s.bool(), []),
    "boolean"  : invalid(s.num(), true),
    "date"     : invalid(s.num(), new Date()),
    "null"     : invalid(s.num(), null),
    "object"   : invalid(s.num(), {}),
    "string"   : invalid(s.num(), ""),
    "undefined": invalid(s.num(), undefined)
  },

  "use custom failure message": customFailure(s.num, null),
  "don't retain state": stateRetention(s.num(), null, 1),

  "minimum rule": {
    "valid": valid(s.num().min(0), 0),
    "invalid": invalid(s.num().min(0), -1),
    "use custom failure message": customFailure(function (msg) {
      return s.num().min(0, msg);
    }, -1)
  },

  "maximum rule": {
    "valid": valid(s.num().max(10), 10),
    "invalid": invalid(s.num().max(0), 11),
    "use custom failure message": customFailure(function (msg) {
      return s.num().max(10, msg);
    }, 11)
  },

  "isReal rule": {
    "number": valid(s.num().isReal(), 10),
    "NaN": invalid(s.num().isReal(), NaN),
    "Infinity": invalid(s.num().isReal(), Infinity),
    "-Infinity": invalid(s.num().isReal(), -Infinity),
    "use custom failure message": customFailure(function (msg) {
      return s.num().isReal(msg);
    }, NaN)
  }
};
