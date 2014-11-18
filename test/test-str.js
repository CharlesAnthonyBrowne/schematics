"use strict";

var s = require("../index");
var common = require("./common");
var valid = common.valid;
var invalid = common.invalid;
var customFailure = common.customFailure;
var stateRetention = common.stateRetention;

module.exports = {

  "accept strings": valid(s.str(), ""),

  "reject non-string values": {
    "array"    : invalid(s.bool(), []),
    "boolean"  : invalid(s.str(), true),
    "date"     : invalid(s.str(), new Date()),
    "null"     : invalid(s.str(), null),
    "number"   : invalid(s.str(), 1),
    "object"   : invalid(s.str(), {}),
    "undefined": invalid(s.str(), undefined)
  },

  "use custom failure message": customFailure(s.str, null),
  "don't retain state": stateRetention(s.str(), null, ""),

  "nonEmpty rule": {
    "non-empty": valid(s.str().nonEmpty(), "test"),
    "empty": invalid(s.str().nonEmpty(), ""),
    "use custom failure message": customFailure(s.str().nonEmpty, ""),
    "don't retain state": stateRetention(s.str().nonEmpty(), "", "test"),
  }
};
