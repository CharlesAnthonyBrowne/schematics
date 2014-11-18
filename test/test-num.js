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
  "don't retain state": stateRetention(s.num(), null, 1)
};
