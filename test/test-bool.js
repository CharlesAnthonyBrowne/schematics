"use strict";

var s = require("../index");
var common = require("./fixtures/common");
var valid = common.valid;
var invalid = common.invalid;
var customFailure = common.customFailure;
var stateRetention = common.stateRetention;

module.exports = {

  "accept boolean values": valid(s.bool(), true),

  "reject non-boolean values": {
    "date"     : invalid(s.bool(), new Date()),
    "null"     : invalid(s.bool(), null),
    "number"   : invalid(s.bool(), 1),
    "object"   : invalid(s.bool(), {}),
    "string"   : invalid(s.bool(), ""),
    "undefined": invalid(s.bool(), undefined)
  },

  "use custom failure message": customFailure(s.bool, null),
  "don't retain state": stateRetention(s.bool(), null, true)
};
