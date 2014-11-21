# schematics

Declarative data structure validation for Javascript.

## Download/install

- Download [schematics.js](lib/schematics.js)
- Install via NPM: `npm install schematics`
- Install via Bower: `bower install schematics`

## Overview

Validating data in JavaScript is often a tedious process involving lots of conditional checks and resulting in functions that can be hard to read and that have high cyclomatic complexity.

`schematics` aims to alleviate this by providing an interface that allows you to describe your data structure declaratively and then check your data against it afterwards.

Each validation step can return a promise, so checks with a database or similar async processes can be integrated. Currently [Bluebird](https://github.com/petkaantonov/bluebird) is used for promises.

A brief example:

```js
var s = require("schematics");

// declare a schema for objects with numeric x and y properties
// don't allow NaN, Infinity, etc. values for the numbers
var pointSchema = s.obj()
    .prop("x", s.num().isReal())
    .prop("y", s.num().isReal());

// `run` returns a promise, as the validation steps may also be promisified
pointSchema.run({ x: 10, y: 20 })
    .then(function (result) {
        if (result.valid) {
            console.log("That certainly looks like a point!")
        } else {
            console.log("Something went horribly wrong.");
        }
    });
```

When validation fails the error value is returned "structurally" so the exact place the error occurred is known. This is useful when validating JSON values that have been `POST`ed to an endpoint.

For example, the following invalid point value:

```js
pointSchema.run({ x: 10, y: Infinity })
    .then(function (result) {
        console.log(result);
    })
```

Will print:

```js
{
  valid: false,
  why: {
    x: {
        valid: true
    },
    y: {
      valid: false,
      msg: "Number is not a real"
    }
  }
}
```

### Terminology

The functions belonging to the `schematics` object like `obj`, `num`, `bool` create a _schema_.

We add _rules_ to a schema using functions like `nonEmpty`, `isReal`, `pattern`.

A rule returns a _step_ when the schema is run. A step is a function that accepts the value to test, and returns a validation result object of the form `{ valid: bool, ... }`.

## API

### Schemas

#### `schematics.bool()`

Creates a schema for `Boolean` types.

#### `schematics.num()`

Creates a schema for `Number` types.

A `num` schema can be extended with the following rules:

- `.min(n)` specifies the minimum allowed value for the number, with optional custom message for failures.
- `.max(n)` specified the maximum allowed value for the number, with optional custom message for failures.
- `.isReal()` ensures the number is finite and not `NaN`, with optional custom message for failures.

#### `schematics.str()`

Creates a schema for `String` types.

A `str` schema can be extended with the following rules:

- `.nonEmpty()` specified that the string must not be empty.
- `.pattern(rx)` specifies a regular expression pattern the string must meet.

#### `schematics.date()`

Creates a schema for `Date` types.

A `date` schema can be extended with the following rules:

- `.valid()` specifies that a date value must not be `Invalid Date`.

#### `schematics.obj()`

Creates a schema for `Object` types.

A `obj` schema can be extended with the following rules:

- `.prop(name, schema)` specifies that the object must have the named property, and that the property matches the specified schema.

#### `schematics.arr()`

Creates a schema for `Array` types.

A `arr` schema can be extended with the following rules:

- `.nonEmpty()` specified that the array must not be empty.
- `.each(schema)` specifies that each object in the array must match the specified schema.

### Extending

Schemas can be extended with new rules by using the `.extend(stepDefs)` function. `stepDefs` is an object containing step function definitions, with keys as the names of the new rules:

```js
var s = require("schematics");

// add an `isPositive` rule to the schema
var myNumSchema = s.num().extend({
  isPositive: function () {
    return function (value) {
      return value >= 0 ? { valid: true } : { valid: false, msg: "Value is negative" };
    };
  }
});

// the `isPositive` rule is now usable at any point in the rule chain
myNumSchema.isReal().isPositive().run(42)
  .then(function (result) {
    console.log(result);
  });
```

Each value in `stepDefs` should be a function that returns a step-style function - one that accepts the value to validate and returns an object of the form `{ valid: bool, ... }`.

**Note:** When extending the rules of a schema this does not modify the existing schema, it returns a copy of the current schema with the newly added rule:

```js
var s = require("schematics");

var numSchema = s.num();

var myNumSchema = numSchema.extend({
  isPositive: function () { /* ... */ }
});

console.log(numSchema.isPositive) // undefined
console.log(myNumSchema.isPositive) // [Function]
```

## Compatibility

Currently `schematics` has only been tested for Node.js, but should also work in any browser that supports ES5. ES3 support and better test coverage coming soon.
