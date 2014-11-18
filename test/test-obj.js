"use strict";

var s = require("../index");
var common = require("./common");
var valid = common.valid;
var invalid = common.invalid;
var customFailure = common.customFailure;
var stateRetention = common.stateRetention;

module.exports = {

  "accept object values": valid(s.obj(), {}),

  "reject non-object values": {
    "boolean"  : invalid(s.obj(), false),
    "null"     : invalid(s.obj(), null),
    "number"   : invalid(s.obj(), 1),
    "string"   : invalid(s.obj(), ""),
    "undefined": invalid(s.obj(), undefined)
  },

  "use custom failure message": customFailure(s.obj, null),
  "don't retain state": stateRetention(s.obj(), null, {}),

  "prop rule": {

    "single property":
      valid(s.obj()
        .prop("x", s.num()), { x: 1 }),

    "multiple properties":
      valid(s.obj()
        .prop("x", s.num())
        .prop("y", s.num())
        .prop("z", s.num()), { x: 1, y: 2, z: 3 }),

    "missing property":
      invalid(s.obj()
        .prop("x", s.num()), {}),

    "any invalid":
      invalid(s.obj()
        .prop("x", s.num()), { x: true }),

    "don't retain state":
      stateRetention(s.obj().prop("x", s.num()), {}, { x: 1 })
  }
};
