'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var web = require('solid-js/web');
var solidJs = require('solid-js');

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
var freeGlobal$1 = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal$1 || freeSelf || Function('return this')();
var root$1 = root;

/** Built-in value references. */
var Symbol$1 = root$1.Symbol;
var Symbol$2 = Symbol$1;

/** Used for built-in method references. */
var objectProto$b = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9 = objectProto$b.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$b.toString;

/** Built-in value references. */
var symToStringTag$1 = Symbol$2 ? Symbol$2.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty$9.call(value, symToStringTag$1),
    tag = value[symToStringTag$1];
  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}
  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$a = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto$a.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]',
  undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol$2 ? Symbol$2.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' || isObjectLike(value) && baseGetTag(value) == symbolTag;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;
var isArray$1 = isArray;

/** Used to match a single whitespace character. */
var reWhitespace = /\s/;

/**
 * Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the last non-whitespace character.
 */
function trimmedEndIndex(string) {
  var index = string.length;
  while (index-- && reWhitespace.test(string.charAt(index))) {}
  return index;
}

/** Used to match leading whitespace. */
var reTrimStart = /^\s+/;

/**
 * The base implementation of `_.trim`.
 *
 * @private
 * @param {string} string The string to trim.
 * @returns {string} Returns the trimmed string.
 */
function baseTrim(string) {
  return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '') : string;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? other + '' : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = baseTrim(value);
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
  funcTag$1 = '[object Function]',
  genTag = '[object GeneratorFunction]',
  proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/** Used to detect overreaching core-js shims. */
var coreJsData = root$1['__core-js_shared__'];
var coreJsData$1 = coreJsData;

/** Used to detect methods masquerading as native. */
var maskSrcKey = function () {
  var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}

/** Used for built-in method references. */
var funcProto$2 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$2 = funcProto$2.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$2.call(func);
    } catch (e) {}
    try {
      return func + '';
    } catch (e) {}
  }
  return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype,
  objectProto$9 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$9.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' + funcToString$1.call(hasOwnProperty$8).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = function () {
  function object() {}
  return function (proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = undefined;
    return result;
  };
}();
var baseCreate$1 = baseCreate;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
    length = source.length;
  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
  HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
    lastCalled = 0;
  return function () {
    var stamp = nativeNow(),
      remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function () {
    return value;
  };
}

var defineProperty = function () {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}();
var defineProperty$1 = defineProperty;

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty$1 ? identity : function (func, string) {
  return defineProperty$1(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};
var baseSetToString$1 = baseSetToString;

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString$1);
var setToString$1 = setToString;

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
    length = array == null ? 0 : array.length;
  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length && (type == 'number' || type != 'symbol' && reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty$1) {
    defineProperty$1(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || value !== value && other !== other;
}

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$8.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$7.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
    baseAssignValue(object, key, value);
  }
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});
  var index = -1,
    length = props.length;
  while (++index < length) {
    var key = props[index];
    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;
    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax$1 = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax$1(start === undefined ? func.length - 1 : start, 0);
  return function () {
    var args = arguments,
      index = -1,
      length = nativeMax$1(args.length - start, 0),
      array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString$1(overRest(func, start, identity), func + '');
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number' ? isArrayLike(object) && isIndex(index, object.length) : type == 'string' && index in object) {
    return eq(object[index], value);
  }
  return false;
}

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function (object, sources) {
    var index = -1,
      length = sources.length,
      customizer = length > 1 ? sources[length - 1] : undefined,
      guard = length > 2 ? sources[2] : undefined;
    customizer = assigner.length > 3 && typeof customizer == 'function' ? (length--, customizer) : undefined;
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
    proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$7;
  return value === proto;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
    result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag$1;
}

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$6.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function () {
  return arguments;
}()) ? baseIsArguments : function (value) {
  return isObjectLike(value) && hasOwnProperty$6.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
};
var isArguments$1 = isArguments;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

/** Detect free variable `exports`. */
var freeExports$2 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$2 = freeExports$2 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

/** Built-in value references. */
var Buffer$1 = moduleExports$2 ? root$1.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;
var isBuffer$1 = isBuffer;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
  arrayTag = '[object Array]',
  boolTag = '[object Boolean]',
  dateTag = '[object Date]',
  errorTag = '[object Error]',
  funcTag = '[object Function]',
  mapTag = '[object Map]',
  numberTag = '[object Number]',
  objectTag$1 = '[object Object]',
  regexpTag = '[object RegExp]',
  setTag = '[object Set]',
  stringTag = '[object String]',
  weakMapTag = '[object WeakMap]';
var arrayBufferTag = '[object ArrayBuffer]',
  dataViewTag = '[object DataView]',
  float32Tag = '[object Float32Array]',
  float64Tag = '[object Float64Array]',
  int8Tag = '[object Int8Array]',
  int16Tag = '[object Int16Array]',
  int32Tag = '[object Int32Array]',
  uint8Tag = '[object Uint8Array]',
  uint8ClampedTag = '[object Uint8ClampedArray]',
  uint16Tag = '[object Uint16Array]',
  uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag$1] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function (value) {
    return func(value);
  };
}

/** Detect free variable `exports`. */
var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports$1 && freeGlobal$1.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = function () {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule$1 && freeModule$1.require && freeModule$1.require('util').types;
    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}();
var nodeUtil$1 = nodeUtil;

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil$1 && nodeUtil$1.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
var isTypedArray$1 = isTypedArray;

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$5.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray$1(value),
    isArg = !isArr && isArguments$1(value),
    isBuff = !isArr && !isArg && isBuffer$1(value),
    isType = !isArr && !isArg && !isBuff && isTypedArray$1(value),
    skipIndexes = isArr || isArg || isBuff || isType,
    result = skipIndexes ? baseTimes(value.length, String) : [],
    length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty$5.call(value, key)) && !(skipIndexes && (
    // Safari 9 has enumerable `arguments.length` in strict mode.
    key == 'length' ||
    // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == 'offset' || key == 'parent') ||
    // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset') ||
    // Skip index properties.
    isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);
var nativeKeys$1 = nativeKeys;

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$4.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys$1(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$4.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$3.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
    result = [];
  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty$3.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');
var nativeCreate$1 = nativeCreate;

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate$1) {
    var result = data[key];
    return result === HASH_UNDEFINED$1 ? undefined : result;
  }
  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate$1 ? data[key] !== undefined : hasOwnProperty$1.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate$1 && value === undefined ? HASH_UNDEFINED : value;
  return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
    length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
    index = assocIndexOf(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
    index = assocIndexOf(data, key);
  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
    index = assocIndexOf(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
    length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/* Built-in method references that are verified to be native. */
var Map = getNative(root$1, 'Map');
var Map$1 = Map;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash(),
    'map': new (Map$1 || ListCache)(),
    'string': new Hash()
  };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
    size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
    length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);
var getPrototype$1 = getPrototype;

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
  objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype$1(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache();
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
    result = data['delete'](key);
  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map$1 || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root$1.Buffer : undefined,
  allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
    result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
  buffer.copy(result);
  return result;
}

/** Built-in value references. */
var Uint8Array = root$1.Uint8Array;
var Uint8Array$1 = Uint8Array;

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array$1(result).set(new Uint8Array$1(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return typeof object.constructor == 'function' && !isPrototype(object) ? baseCreate$1(getPrototype$1(object)) : {};
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function (object, iteratee, keysFunc) {
    var index = -1,
      iterable = Object(object),
      props = keysFunc(object),
      length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();
var baseFor$1 = baseFor;

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor$1(object, iteratee, keys);
}

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function (collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
      index = fromRight ? length : -1,
      iterable = Object(collection);
    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);
var baseEach$1 = baseEach;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function () {
  return root$1.Date.now();
};
var now$1 = now;

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
  nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
    lastThis,
    maxWait,
    result,
    timerId,
    lastCallTime,
    lastInvokeTime = 0,
    leading = false,
    maxing = false,
    trailing = true;
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  function invokeFunc(time) {
    var args = lastArgs,
      thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }
  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }
  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
      timeSinceLastInvoke = time - lastInvokeTime,
      timeWaiting = wait - timeSinceLastCall;
    return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }
  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
      timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
  }
  function timerExpired() {
    var time = now$1();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }
  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }
  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }
  function flush() {
    return timerId === undefined ? result : trailingEdge(now$1());
  }
  function debounced() {
    var time = now$1(),
      isInvoking = shouldInvoke(time);
    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if (value !== undefined && !eq(object[key], value) || value === undefined && !(key in object)) {
    baseAssignValue(object, key, value);
  }
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function safeGet(object, key) {
  if (key === 'constructor' && typeof object[key] === 'function') {
    return;
  }
  if (key == '__proto__') {
    return;
  }
  return object[key];
}

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = safeGet(object, key),
    srcValue = safeGet(source, key),
    stacked = stack.get(srcValue);
  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer ? customizer(objValue, srcValue, key + '', object, source, stack) : undefined;
  var isCommon = newValue === undefined;
  if (isCommon) {
    var isArr = isArray$1(srcValue),
      isBuff = !isArr && isBuffer$1(srcValue),
      isTyped = !isArr && !isBuff && isTypedArray$1(srcValue);
    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray$1(objValue)) {
        newValue = objValue;
      } else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      } else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer(srcValue, true);
      } else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray(srcValue, true);
      } else {
        newValue = [];
      }
    } else if (isPlainObject(srcValue) || isArguments$1(srcValue)) {
      newValue = objValue;
      if (isArguments$1(objValue)) {
        newValue = toPlainObject(objValue);
      } else if (!isObject(objValue) || isFunction(objValue)) {
        newValue = initCloneObject(srcValue);
      }
    } else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor$1(source, function (srcValue, key) {
    stack || (stack = new Stack());
    if (isObject(srcValue)) {
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    } else {
      var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + '', object, source, stack) : undefined;
      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  }, keysIn);
}

/**
 * Casts `value` to `identity` if it's not a function.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Function} Returns cast function.
 */
function castFunction(value) {
  return typeof value == 'function' ? value : identity;
}

/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length"
 * property are iterated like arrays. To avoid this behavior use `_.forIn`
 * or `_.forOwn` for object iteration.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @alias each
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @see _.forEachRight
 * @example
 *
 * _.forEach([1, 2], function(value) {
 *   console.log(value);
 * });
 * // => Logs `1` then `2`.
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forEach(collection, iteratee) {
  var func = isArray$1(collection) ? arrayEach : baseEach$1;
  return func(collection, castFunction(iteratee));
}

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = createAssigner(function (object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});
var merge$1 = merge;

const calculateChange$2 = (e, hsl, direction, initialA, container) => {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const x = typeof e.pageX === 'number' ? e.pageX : e.touches[0].pageX;
  const y = typeof e.pageY === 'number' ? e.pageY : e.touches[0].pageY;
  const left = x - (container.getBoundingClientRect().left + window.pageXOffset);
  const top = y - (container.getBoundingClientRect().top + window.pageYOffset);
  if (direction === 'vertical') {
    let a;
    if (top < 0) {
      a = 0;
    } else if (top > containerHeight) {
      a = 1;
    } else {
      a = Math.round(top * 100 / containerHeight) / 100;
    }
    if (hsl.a !== a) {
      return {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        a,
        source: 'rgb'
      };
    }
  } else {
    let a;
    if (left < 0) {
      a = 0;
    } else if (left > containerWidth) {
      a = 1;
    } else {
      a = Math.round(left * 100 / containerWidth) / 100;
    }
    if (initialA !== a) {
      return {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        a,
        source: 'rgb'
      };
    }
  }
  return null;
};

const checkboardCache = {};
const render = (c1, c2, size, serverCanvas) => {
  if (typeof document === 'undefined' && !serverCanvas) {
    return null;
  }
  const canvas = serverCanvas ? new serverCanvas() : document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  } // If no context can be found, return early.
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = c2;
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size, size);
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL();
};
const get = (c1, c2, size, serverCanvas) => {
  const key = `${c1}-${c2}-${size}${serverCanvas ? '-server' : ''}`;
  if (checkboardCache[key]) {
    return checkboardCache[key];
  }
  const checkboard = render(c1, c2, size, serverCanvas);
  checkboardCache[key] = checkboard;
  return checkboard;
};

const _tmpl$$K = /*#__PURE__*/web.template(`<div>`);
function Checkboard(_props) {
  const props = solidJs.mergeProps({
    white: 'transparent',
    grey: 'rgba(0,0,0,.08)',
    size: 8,
    renderers: {}
  }, _props);
  const styles = () => {
    const {
      size,
      white,
      grey,
      borderRadius,
      boxShadow,
      renderers
    } = props;
    return {
      grid: {
        'border-radius': borderRadius,
        'box-shadow': boxShadow,
        position: 'absolute',
        inset: '0px',
        background: `url(${get(white, grey, size, renderers.canvas)}) center left`
      }
    };
  };

  // return isValidElement(children) ? (
  //   React.cloneElement(children, {
  //     ...children.props,
  //     style: { ...children.props.style, ...styles.grid },
  //   })
  // ) : (
  //   <div style={styles.grid} />
  // )
  // 判断children是否是一个有效的元素
  return props.children ? // clone
  (() => {
    const _el$ = _tmpl$$K();
    web.insert(_el$, () => props.children);
    web.effect(_$p => web.style(_el$, styles().grid, _$p));
    return _el$;
  })() : (() => {
    const _el$2 = _tmpl$$K();
    web.effect(_$p => web.style(_el$2, styles().grid, _$p));
    return _el$2;
  })();
}

const _tmpl$$J = /*#__PURE__*/web.template(`<div><div></div><div></div><div><div>`),
  _tmpl$2$7 = /*#__PURE__*/web.template(`<div>`);
const Alpha$1 = _props => {
  const props = solidJs.mergeProps({
    direction: 'horizontal',
    styles: {}
  }, _props);
  let container;
  const styles = () => {
    const {
      rgb
    } = props;
    return merge$1({
      alpha: {
        position: 'absolute',
        inset: '0px',
        'border-radius': props.radius
      },
      checkboard: {
        position: 'absolute',
        inset: '0px',
        overflow: 'hidden',
        'border-radius': props.radius
      },
      gradient: {
        position: 'absolute',
        inset: '0px',
        background: props.direction === 'vertical' ? `linear-gradient(to bottom, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%,
          rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)` : `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%,
         rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`,
        'box-shadow': props.shadow,
        'border-radius': props.radius
      },
      container: {
        position: 'relative',
        height: '100%',
        margin: '0 3px'
      },
      pointer: {
        position: 'absolute',
        left: props.direction === 'vertical' ? 0 : `${rgb.a && rgb.a * 100}%`,
        top: props.direction === 'vertical' ? `${rgb.a && rgb.a * 100}%` : undefined
      },
      slider: {
        width: '4px',
        'border-radius': '1px',
        height: '8px',
        'box-shadow': '0 0 2px rgba(0, 0, 0, .6)',
        background: '#fff',
        'margin-top': '1px',
        transform: 'translateX(-2px)'
      }
    }, props.styles);
  };
  const handleChange = e => {
    const change = calculateChange$2(e, props.hsl, props.direction, props.a, container);
    change && typeof props.onChange === 'function' && props.onChange(change, e);
  };
  const handleMouseDown = e => {
    handleChange(e);
    window.addEventListener('mousemove', handleChange);
    window.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseUp = () => {
    unbindEventListeners();
  };
  const unbindEventListeners = () => {
    window.removeEventListener('mousemove', handleChange);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  solidJs.onCleanup(() => unbindEventListeners());
  return (() => {
    const _el$ = _tmpl$$J(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.firstChild;
    web.insert(_el$2, web.createComponent(Checkboard, {
      get renderers() {
        return props.renderers;
      }
    }));
    _el$4.$$touchstart = handleChange;
    _el$4.$$touchmove = handleChange;
    _el$4.$$mouseup = handleChange;
    _el$4.$$mousedown = handleMouseDown;
    const _ref$ = container;
    typeof _ref$ === "function" ? web.use(_ref$, _el$4) : container = _el$4;
    web.insert(_el$5, (() => {
      const _c$ = web.memo(() => !!props.pointer);
      return () => _c$() ? web.createComponent(props.pointer, props) : (() => {
        const _el$6 = _tmpl$2$7();
        web.effect(_$p => web.style(_el$6, styles().slider, _$p));
        return _el$6;
      })();
    })());
    web.effect(_p$ => {
      const _v$ = styles().alpha,
        _v$2 = styles().checkboard,
        _v$3 = styles().gradient,
        _v$4 = styles().container,
        _v$5 = styles().pointer;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$4, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$5, _v$5, _p$._v$5);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined
    });
    return _el$;
  })();
};
web.delegateEvents(["mousedown", "mouseup", "touchmove", "touchstart"]);

const _tmpl$$I = /*#__PURE__*/web.template(`<label>`),
  _tmpl$2$6 = /*#__PURE__*/web.template(`<div><input>`);
function EditableInput(_props) {
  const props = solidJs.mergeProps({
    arrowOffset: 1,
    hideLabel: false
  }, _props);
  let inputRef;
  const inputId = `sc-editable-input-${Math.random().toString().slice(2, 5)}`;
  const [state, setState] = solidJs.createSignal({
    value: String(props.value).toUpperCase(),
    blurValue: String(props.value).toUpperCase()
  });
  const DEFAULT_ARROW_OFFSET = 1;
  const UP_KEY_CODE = 38;
  const DOWN_KEY_CODE = 40;
  const VALID_KEY_CODES = [UP_KEY_CODE, DOWN_KEY_CODE];
  const isValidKeyCode = keyCode => VALID_KEY_CODES.indexOf(keyCode) > -1;
  const getNumberValue = value => Number(String(value).replace(/%/g, ''));
  const getValueObjectWithLabel = value => {
    return {
      [props.label]: value
    };
  };
  const setUpdatedValue = (value, e) => {
    const onChangeValue = props.label ? getValueObjectWithLabel(value) : value;
    props.onChange && props.onChange(onChangeValue, e);
    setState({
      value,
      blurValue: value
    });
  };
  const handleBlur = () => {
    if (state().blurValue) {
      setState({
        value: state().blurValue,
        blurValue: ''
      });
    }
  };
  const handleChange = e => {
    setUpdatedValue(e.target.value, e);
  };
  const handleDrag = e => {
    if (props.dragLabel) {
      const newValue = Math.round(+props.value + e.movementX);
      if (newValue >= 0 && newValue <= props.dragMax) {
        props.onChange && props.onChange(getValueObjectWithLabel(String(newValue)), e);
      }
    }
  };
  const unbindEventListeners = () => {
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  const handleMouseUp = () => {
    unbindEventListeners();
  };
  const handleMouseDown = e => {
    if (props.dragLabel) {
      e.preventDefault();
      handleDrag(e);
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };
  const handleKeyDown = e => {
    const value = getNumberValue(e.target.value);
    if (!isNaN(value) && isValidKeyCode(e.keyCode)) {
      const offset = props.arrowOffset || DEFAULT_ARROW_OFFSET;
      const updatedValue = e.keyCode === UP_KEY_CODE ? value + offset : value - offset;
      setUpdatedValue(updatedValue, e);
    }
  };
  solidJs.createEffect(() => {
    setState({
      value: String(props.value).toUpperCase(),
      blurValue: ''
    });
  });
  const styles = () => {
    return merge$1({
      wrap: {
        position: 'relative'
      }
    }, props.styles);
  };
  solidJs.onCleanup(() => unbindEventListeners());
  return (() => {
    const _el$ = _tmpl$2$6(),
      _el$2 = _el$.firstChild;
    _el$2.$$input = handleChange;
    _el$2.$$keydown = handleKeyDown;
    _el$2.addEventListener("change", handleChange);
    _el$2.addEventListener("blur", handleBlur);
    const _ref$ = inputRef;
    typeof _ref$ === "function" ? web.use(_ref$, _el$2) : inputRef = _el$2;
    web.setAttribute(_el$2, "id", inputId);
    web.setAttribute(_el$2, "spellcheck", false);
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return props.label && !props.hideLabel;
      },
      get children() {
        const _el$3 = _tmpl$$I();
        _el$3.$$mousedown = handleMouseDown;
        web.insert(_el$3, () => props.label);
        web.effect(_$p => web.style(_el$3, styles().label, _$p));
        return _el$3;
      }
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().wrap,
        _v$2 = styles().input,
        _v$3 = props.placeholder;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _v$3 !== _p$._v$3 && web.setAttribute(_el$2, "placeholder", _p$._v$3 = _v$3);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined
    });
    web.effect(() => _el$2.value = state().value);
    return _el$;
  })();
}
web.delegateEvents(["keydown", "input", "mousedown"]);

const _tmpl$$H = /*#__PURE__*/web.template(`<div><div></div><div>`);
function Raised(_props) {
  const props = solidJs.mergeProps({
    zDepth: 1,
    radius: 2,
    background: '#fff',
    styles: {}
  }, _props);
  const styles = merge$1({
    wrap: {
      position: 'relative',
      display: 'inline-block'
    },
    content: {
      position: 'relative'
    },
    bg: {
      position: 'absolute',
      inset: '0px',
      'box-shadow': props.zDepth === 1 ? '0 2px 10px rgba(0,0,0,.12), 0 2px 5px rgba(0,0,0,.16)' : `0 ${props.zDepth}px ${props.zDepth * 4}px rgba(0,0,0,.24)`,
      'border-radius': props.radius,
      background: props.background
    }
  }, props.styles);
  return (() => {
    const _el$ = _tmpl$$H(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling;
    web.insert(_el$3, () => props.children);
    web.effect(_p$ => {
      const _v$ = styles.wrap,
        _v$2 = styles.bg,
        _v$3 = styles.content;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined
    });
    return _el$;
  })();
}

const calculateChange$1 = (e, direction, hsl, container) => {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const x = typeof e.pageX === 'number' ? e.pageX : e.touches[0].pageX;
  const y = typeof e.pageY === 'number' ? e.pageY : e.touches[0].pageY;
  const left = x - (container.getBoundingClientRect().left + window.pageXOffset);
  const top = y - (container.getBoundingClientRect().top + window.pageYOffset);
  if (direction === 'vertical') {
    let h;
    if (top < 0) {
      h = 359;
    } else if (top > containerHeight) {
      h = 0;
    } else {
      const percent = -(top * 100 / containerHeight) + 100;
      h = 360 * percent / 100;
    }
    if (hsl.h !== h) {
      return {
        h,
        s: hsl.s,
        l: hsl.l,
        a: hsl.a,
        source: 'hsl'
      };
    }
  } else {
    let h;
    if (left < 0) {
      h = 0;
    } else if (left > containerWidth) {
      h = 359;
    } else {
      const percent = left * 100 / containerWidth;
      h = 360 * percent / 100;
    }
    if (hsl.h !== h) {
      return {
        h,
        s: hsl.s,
        l: hsl.l,
        a: hsl.a,
        source: 'hsl'
      };
    }
  }
  return null;
};

const _tmpl$$G = /*#__PURE__*/web.template(`<div><div><style>
          .hue-horizontal {
            background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0
              33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            background: -webkit-linear-gradient(to right, #f00 0%, #ff0
              17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
          }
          .hue-vertical {
            background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%,
              #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%,
              #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
          }
        </style><div>`),
  _tmpl$2$5 = /*#__PURE__*/web.template(`<div>`);
function Hue$1(_props) {
  const props = solidJs.mergeProps({
    direction: 'horizontal'
  }, _props);
  let container;
  const styles = () => {
    return {
      hue: {
        position: 'absolute',
        inset: '0px',
        'border-radius': typeof props.radius === 'string' ? props.radius : `${props.radius}px`,
        'box-shadow': props.shadow
      },
      container: {
        padding: '0 2px',
        position: 'relative',
        height: '100%',
        'border-radius': typeof props.radius === 'string' ? props.radius : `${props.radius}px`
      },
      pointer: {
        position: 'absolute',
        left: props.direction === 'vertical' ? '0px' : `${props.hsl.h * 100 / 360}%`,
        top: props.direction === 'vertical' ? `${-(props.hsl.h * 100 / 360) + 100}%` : undefined
      },
      slider: {
        'margin-top': '1px',
        width: '4px',
        'border-radius': '1px',
        height: '8px',
        'box-shadow': '0 0 2px rgba(0, 0, 0, .6)',
        background: '#fff',
        transform: 'translateX(-2px)'
      }
    };
  };
  const handleChange = e => {
    const change = calculateChange$1(e, props.direction, props.hsl, container);
    change && typeof props.onChange === 'function' && props.onChange(change, e);
  };
  const unbindEventListeners = () => {
    window.removeEventListener('mousemove', handleChange);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  const handleMouseUp = () => {
    unbindEventListeners();
  };
  const handleMouseDown = e => {
    handleChange(e);
    window.addEventListener('mousemove', handleChange);
    window.addEventListener('mouseup', handleMouseUp);
  };
  solidJs.onCleanup(() => unbindEventListeners());
  return (() => {
    const _el$ = _tmpl$$G(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.nextSibling;
    _el$2.$$mousedown = handleMouseDown;
    const _ref$ = container;
    typeof _ref$ === "function" ? web.use(_ref$, _el$2) : container = _el$2;
    web.insert(_el$4, (() => {
      const _c$ = web.memo(() => !!props.pointer);
      return () => _c$() ? web.createComponent(props.pointer, props) : (() => {
        const _el$5 = _tmpl$2$5();
        web.effect(_$p => web.style(_el$5, styles().slider, _$p));
        return _el$5;
      })();
    })());
    web.effect(_p$ => {
      const _v$ = styles().hue,
        _v$2 = `hue-${props.direction}`,
        _v$3 = styles().container,
        _v$4 = styles().pointer;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$2, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$4, _v$4, _p$._v$4);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined
    });
    return _el$;
  })();
}
web.delegateEvents(["mousedown"]);

// This file is autogenerated. It's used to publish ESM to npm.
function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

// https://github.com/bgrins/TinyColor
// Brian Grinstead, MIT License

var trimLeft = /^\s+/;
var trimRight = /\s+$/;
function tinycolor(color, opts) {
  color = color ? color : "";
  opts = opts || {};

  // If input is already a tinycolor, return itself
  if (color instanceof tinycolor) {
    return color;
  }
  // If we are called as a function, call using new instead
  if (!(this instanceof tinycolor)) {
    return new tinycolor(color, opts);
  }
  var rgb = inputToRGB(color);
  this._originalInput = color, this._r = rgb.r, this._g = rgb.g, this._b = rgb.b, this._a = rgb.a, this._roundA = Math.round(100 * this._a) / 100, this._format = opts.format || rgb.format;
  this._gradientType = opts.gradientType;

  // Don't let the range of [0,255] come back in [0,1].
  // Potentially lose a little bit of precision here, but will fix issues where
  // .5 gets interpreted as half of the total, instead of half of 1
  // If it was supposed to be 128, this was already taken care of by `inputToRgb`
  if (this._r < 1) this._r = Math.round(this._r);
  if (this._g < 1) this._g = Math.round(this._g);
  if (this._b < 1) this._b = Math.round(this._b);
  this._ok = rgb.ok;
}
tinycolor.prototype = {
  isDark: function isDark() {
    return this.getBrightness() < 128;
  },
  isLight: function isLight() {
    return !this.isDark();
  },
  isValid: function isValid() {
    return this._ok;
  },
  getOriginalInput: function getOriginalInput() {
    return this._originalInput;
  },
  getFormat: function getFormat() {
    return this._format;
  },
  getAlpha: function getAlpha() {
    return this._a;
  },
  getBrightness: function getBrightness() {
    //http://www.w3.org/TR/AERT#color-contrast
    var rgb = this.toRgb();
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  },
  getLuminance: function getLuminance() {
    //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    var rgb = this.toRgb();
    var RsRGB, GsRGB, BsRGB, R, G, B;
    RsRGB = rgb.r / 255;
    GsRGB = rgb.g / 255;
    BsRGB = rgb.b / 255;
    if (RsRGB <= 0.03928) R = RsRGB / 12.92;else R = Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    if (GsRGB <= 0.03928) G = GsRGB / 12.92;else G = Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    if (BsRGB <= 0.03928) B = BsRGB / 12.92;else B = Math.pow((BsRGB + 0.055) / 1.055, 2.4);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  },
  setAlpha: function setAlpha(value) {
    this._a = boundAlpha(value);
    this._roundA = Math.round(100 * this._a) / 100;
    return this;
  },
  toHsv: function toHsv() {
    var hsv = rgbToHsv(this._r, this._g, this._b);
    return {
      h: hsv.h * 360,
      s: hsv.s,
      v: hsv.v,
      a: this._a
    };
  },
  toHsvString: function toHsvString() {
    var hsv = rgbToHsv(this._r, this._g, this._b);
    var h = Math.round(hsv.h * 360),
      s = Math.round(hsv.s * 100),
      v = Math.round(hsv.v * 100);
    return this._a == 1 ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")";
  },
  toHsl: function toHsl() {
    var hsl = rgbToHsl(this._r, this._g, this._b);
    return {
      h: hsl.h * 360,
      s: hsl.s,
      l: hsl.l,
      a: this._a
    };
  },
  toHslString: function toHslString() {
    var hsl = rgbToHsl(this._r, this._g, this._b);
    var h = Math.round(hsl.h * 360),
      s = Math.round(hsl.s * 100),
      l = Math.round(hsl.l * 100);
    return this._a == 1 ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")";
  },
  toHex: function toHex(allow3Char) {
    return rgbToHex(this._r, this._g, this._b, allow3Char);
  },
  toHexString: function toHexString(allow3Char) {
    return "#" + this.toHex(allow3Char);
  },
  toHex8: function toHex8(allow4Char) {
    return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
  },
  toHex8String: function toHex8String(allow4Char) {
    return "#" + this.toHex8(allow4Char);
  },
  toRgb: function toRgb() {
    return {
      r: Math.round(this._r),
      g: Math.round(this._g),
      b: Math.round(this._b),
      a: this._a
    };
  },
  toRgbString: function toRgbString() {
    return this._a == 1 ? "rgb(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ")" : "rgba(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ", " + this._roundA + ")";
  },
  toPercentageRgb: function toPercentageRgb() {
    return {
      r: Math.round(bound01(this._r, 255) * 100) + "%",
      g: Math.round(bound01(this._g, 255) * 100) + "%",
      b: Math.round(bound01(this._b, 255) * 100) + "%",
      a: this._a
    };
  },
  toPercentageRgbString: function toPercentageRgbString() {
    return this._a == 1 ? "rgb(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%)" : "rgba(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
  },
  toName: function toName() {
    if (this._a === 0) {
      return "transparent";
    }
    if (this._a < 1) {
      return false;
    }
    return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
  },
  toFilter: function toFilter(secondColor) {
    var hex8String = "#" + rgbaToArgbHex(this._r, this._g, this._b, this._a);
    var secondHex8String = hex8String;
    var gradientType = this._gradientType ? "GradientType = 1, " : "";
    if (secondColor) {
      var s = tinycolor(secondColor);
      secondHex8String = "#" + rgbaToArgbHex(s._r, s._g, s._b, s._a);
    }
    return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")";
  },
  toString: function toString(format) {
    var formatSet = !!format;
    format = format || this._format;
    var formattedString = false;
    var hasAlpha = this._a < 1 && this._a >= 0;
    var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");
    if (needsAlphaFormat) {
      // Special case for "transparent", all other non-alpha formats
      // will return rgba when there is transparency.
      if (format === "name" && this._a === 0) {
        return this.toName();
      }
      return this.toRgbString();
    }
    if (format === "rgb") {
      formattedString = this.toRgbString();
    }
    if (format === "prgb") {
      formattedString = this.toPercentageRgbString();
    }
    if (format === "hex" || format === "hex6") {
      formattedString = this.toHexString();
    }
    if (format === "hex3") {
      formattedString = this.toHexString(true);
    }
    if (format === "hex4") {
      formattedString = this.toHex8String(true);
    }
    if (format === "hex8") {
      formattedString = this.toHex8String();
    }
    if (format === "name") {
      formattedString = this.toName();
    }
    if (format === "hsl") {
      formattedString = this.toHslString();
    }
    if (format === "hsv") {
      formattedString = this.toHsvString();
    }
    return formattedString || this.toHexString();
  },
  clone: function clone() {
    return tinycolor(this.toString());
  },
  _applyModification: function _applyModification(fn, args) {
    var color = fn.apply(null, [this].concat([].slice.call(args)));
    this._r = color._r;
    this._g = color._g;
    this._b = color._b;
    this.setAlpha(color._a);
    return this;
  },
  lighten: function lighten() {
    return this._applyModification(_lighten, arguments);
  },
  brighten: function brighten() {
    return this._applyModification(_brighten, arguments);
  },
  darken: function darken() {
    return this._applyModification(_darken, arguments);
  },
  desaturate: function desaturate() {
    return this._applyModification(_desaturate, arguments);
  },
  saturate: function saturate() {
    return this._applyModification(_saturate, arguments);
  },
  greyscale: function greyscale() {
    return this._applyModification(_greyscale, arguments);
  },
  spin: function spin() {
    return this._applyModification(_spin, arguments);
  },
  _applyCombination: function _applyCombination(fn, args) {
    return fn.apply(null, [this].concat([].slice.call(args)));
  },
  analogous: function analogous() {
    return this._applyCombination(_analogous, arguments);
  },
  complement: function complement() {
    return this._applyCombination(_complement, arguments);
  },
  monochromatic: function monochromatic() {
    return this._applyCombination(_monochromatic, arguments);
  },
  splitcomplement: function splitcomplement() {
    return this._applyCombination(_splitcomplement, arguments);
  },
  // Disabled until https://github.com/bgrins/TinyColor/issues/254
  // polyad: function (number) {
  //   return this._applyCombination(polyad, [number]);
  // },
  triad: function triad() {
    return this._applyCombination(polyad, [3]);
  },
  tetrad: function tetrad() {
    return this._applyCombination(polyad, [4]);
  }
};

// If input is an object, force 1 into "1.0" to handle ratios properly
// String input requires "1.0" as input, so 1 will be treated as 1
tinycolor.fromRatio = function (color, opts) {
  if (_typeof(color) == "object") {
    var newColor = {};
    for (var i in color) {
      if (color.hasOwnProperty(i)) {
        if (i === "a") {
          newColor[i] = color[i];
        } else {
          newColor[i] = convertToPercentage(color[i]);
        }
      }
    }
    color = newColor;
  }
  return tinycolor(color, opts);
};

// Given a string or object, convert that input to RGB
// Possible string inputs:
//
//     "red"
//     "#f00" or "f00"
//     "#ff0000" or "ff0000"
//     "#ff000000" or "ff000000"
//     "rgb 255 0 0" or "rgb (255, 0, 0)"
//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
//
function inputToRGB(color) {
  var rgb = {
    r: 0,
    g: 0,
    b: 0
  };
  var a = 1;
  var s = null;
  var v = null;
  var l = null;
  var ok = false;
  var format = false;
  if (typeof color == "string") {
    color = stringInputToObject(color);
  }
  if (_typeof(color) == "object") {
    if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
      rgb = rgbToRgb(color.r, color.g, color.b);
      ok = true;
      format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
    } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
      s = convertToPercentage(color.s);
      v = convertToPercentage(color.v);
      rgb = hsvToRgb(color.h, s, v);
      ok = true;
      format = "hsv";
    } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
      s = convertToPercentage(color.s);
      l = convertToPercentage(color.l);
      rgb = hslToRgb(color.h, s, l);
      ok = true;
      format = "hsl";
    }
    if (color.hasOwnProperty("a")) {
      a = color.a;
    }
  }
  a = boundAlpha(a);
  return {
    ok: ok,
    format: color.format || format,
    r: Math.min(255, Math.max(rgb.r, 0)),
    g: Math.min(255, Math.max(rgb.g, 0)),
    b: Math.min(255, Math.max(rgb.b, 0)),
    a: a
  };
}

// Conversion Functions
// --------------------

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

// `rgbToRgb`
// Handle bounds / percentage checking to conform to CSS color spec
// <http://www.w3.org/TR/css3-color/>
// *Assumes:* r, g, b in [0, 255] or [0, 1]
// *Returns:* { r, g, b } in [0, 255]
function rgbToRgb(r, g, b) {
  return {
    r: bound01(r, 255) * 255,
    g: bound01(g, 255) * 255,
    b: bound01(b, 255) * 255
  };
}

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
// *Returns:* { h, s, l } in [0,1]
function rgbToHsl(r, g, b) {
  r = bound01(r, 255);
  g = bound01(g, 255);
  b = bound01(b, 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;
  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: h,
    s: s,
    l: l
  };
}

// `hslToRgb`
// Converts an HSL color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
function hslToRgb(h, s, l) {
  var r, g, b;
  h = bound01(h, 360);
  s = bound01(s, 100);
  l = bound01(l, 100);
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: r * 255,
    g: g * 255,
    b: b * 255
  };
}

// `rgbToHsv`
// Converts an RGB color value to HSV
// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
// *Returns:* { h, s, v } in [0,1]
function rgbToHsv(r, g, b) {
  r = bound01(r, 255);
  g = bound01(g, 255);
  b = bound01(b, 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    v = max;
  var d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: h,
    s: s,
    v: v
  };
}

// `hsvToRgb`
// Converts an HSV color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
function hsvToRgb(h, s, v) {
  h = bound01(h, 360) * 6;
  s = bound01(s, 100);
  v = bound01(v, 100);
  var i = Math.floor(h),
    f = h - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s),
    mod = i % 6,
    r = [v, q, p, p, t, v][mod],
    g = [t, v, v, q, p, p][mod],
    b = [p, p, t, v, v, q][mod];
  return {
    r: r * 255,
    g: g * 255,
    b: b * 255
  };
}

// `rgbToHex`
// Converts an RGB color to hex
// Assumes r, g, and b are contained in the set [0, 255]
// Returns a 3 or 6 character hex
function rgbToHex(r, g, b, allow3Char) {
  var hex = [pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16))];

  // Return a 3 character hex if possible
  if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
    return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
  }
  return hex.join("");
}

// `rgbaToHex`
// Converts an RGBA color plus alpha transparency to hex
// Assumes r, g, b are contained in the set [0, 255] and
// a in [0, 1]. Returns a 4 or 8 character rgba hex
function rgbaToHex(r, g, b, a, allow4Char) {
  var hex = [pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16)), pad2(convertDecimalToHex(a))];

  // Return a 4 character hex if possible
  if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
    return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
  }
  return hex.join("");
}

// `rgbaToArgbHex`
// Converts an RGBA color to an ARGB Hex8 string
// Rarely used, but required for "toFilter()"
function rgbaToArgbHex(r, g, b, a) {
  var hex = [pad2(convertDecimalToHex(a)), pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16))];
  return hex.join("");
}

// `equals`
// Can be called with any tinycolor input
tinycolor.equals = function (color1, color2) {
  if (!color1 || !color2) return false;
  return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
};
tinycolor.random = function () {
  return tinycolor.fromRatio({
    r: Math.random(),
    g: Math.random(),
    b: Math.random()
  });
};

// Modification Functions
// ----------------------
// Thanks to less.js for some of the basics here
// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

function _desaturate(color, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  hsl.s -= amount / 100;
  hsl.s = clamp01(hsl.s);
  return tinycolor(hsl);
}
function _saturate(color, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  hsl.s += amount / 100;
  hsl.s = clamp01(hsl.s);
  return tinycolor(hsl);
}
function _greyscale(color) {
  return tinycolor(color).desaturate(100);
}
function _lighten(color, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  hsl.l += amount / 100;
  hsl.l = clamp01(hsl.l);
  return tinycolor(hsl);
}
function _brighten(color, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var rgb = tinycolor(color).toRgb();
  rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * -(amount / 100))));
  rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * -(amount / 100))));
  rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * -(amount / 100))));
  return tinycolor(rgb);
}
function _darken(color, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl = tinycolor(color).toHsl();
  hsl.l -= amount / 100;
  hsl.l = clamp01(hsl.l);
  return tinycolor(hsl);
}

// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
// Values outside of this range will be wrapped into this range.
function _spin(color, amount) {
  var hsl = tinycolor(color).toHsl();
  var hue = (hsl.h + amount) % 360;
  hsl.h = hue < 0 ? 360 + hue : hue;
  return tinycolor(hsl);
}

// Combination Functions
// ---------------------
// Thanks to jQuery xColor for some of the ideas behind these
// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

function _complement(color) {
  var hsl = tinycolor(color).toHsl();
  hsl.h = (hsl.h + 180) % 360;
  return tinycolor(hsl);
}
function polyad(color, number) {
  if (isNaN(number) || number <= 0) {
    throw new Error("Argument to polyad must be a positive number");
  }
  var hsl = tinycolor(color).toHsl();
  var result = [tinycolor(color)];
  var step = 360 / number;
  for (var i = 1; i < number; i++) {
    result.push(tinycolor({
      h: (hsl.h + i * step) % 360,
      s: hsl.s,
      l: hsl.l
    }));
  }
  return result;
}
function _splitcomplement(color) {
  var hsl = tinycolor(color).toHsl();
  var h = hsl.h;
  return [tinycolor(color), tinycolor({
    h: (h + 72) % 360,
    s: hsl.s,
    l: hsl.l
  }), tinycolor({
    h: (h + 216) % 360,
    s: hsl.s,
    l: hsl.l
  })];
}
function _analogous(color, results, slices) {
  results = results || 6;
  slices = slices || 30;
  var hsl = tinycolor(color).toHsl();
  var part = 360 / slices;
  var ret = [tinycolor(color)];
  for (hsl.h = (hsl.h - (part * results >> 1) + 720) % 360; --results;) {
    hsl.h = (hsl.h + part) % 360;
    ret.push(tinycolor(hsl));
  }
  return ret;
}
function _monochromatic(color, results) {
  results = results || 6;
  var hsv = tinycolor(color).toHsv();
  var h = hsv.h,
    s = hsv.s,
    v = hsv.v;
  var ret = [];
  var modification = 1 / results;
  while (results--) {
    ret.push(tinycolor({
      h: h,
      s: s,
      v: v
    }));
    v = (v + modification) % 1;
  }
  return ret;
}

// Utility Functions
// ---------------------

tinycolor.mix = function (color1, color2, amount) {
  amount = amount === 0 ? 0 : amount || 50;
  var rgb1 = tinycolor(color1).toRgb();
  var rgb2 = tinycolor(color2).toRgb();
  var p = amount / 100;
  var rgba = {
    r: (rgb2.r - rgb1.r) * p + rgb1.r,
    g: (rgb2.g - rgb1.g) * p + rgb1.g,
    b: (rgb2.b - rgb1.b) * p + rgb1.b,
    a: (rgb2.a - rgb1.a) * p + rgb1.a
  };
  return tinycolor(rgba);
};

// Readability Functions
// ---------------------
// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

// `contrast`
// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
tinycolor.readability = function (color1, color2) {
  var c1 = tinycolor(color1);
  var c2 = tinycolor(color2);
  return (Math.max(c1.getLuminance(), c2.getLuminance()) + 0.05) / (Math.min(c1.getLuminance(), c2.getLuminance()) + 0.05);
};

// `isReadable`
// Ensure that foreground and background color combinations meet WCAG2 guidelines.
// The third argument is an optional Object.
//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

// *Example*
//    tinycolor.isReadable("#000", "#111") => false
//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
tinycolor.isReadable = function (color1, color2, wcag2) {
  var readability = tinycolor.readability(color1, color2);
  var wcag2Parms, out;
  out = false;
  wcag2Parms = validateWCAG2Parms(wcag2);
  switch (wcag2Parms.level + wcag2Parms.size) {
    case "AAsmall":
    case "AAAlarge":
      out = readability >= 4.5;
      break;
    case "AAlarge":
      out = readability >= 3;
      break;
    case "AAAsmall":
      out = readability >= 7;
      break;
  }
  return out;
};

// `mostReadable`
// Given a base color and a list of possible foreground or background
// colors for that base, returns the most readable color.
// Optionally returns Black or White if the most readable color is unreadable.
// *Example*
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
tinycolor.mostReadable = function (baseColor, colorList, args) {
  var bestColor = null;
  var bestScore = 0;
  var readability;
  var includeFallbackColors, level, size;
  args = args || {};
  includeFallbackColors = args.includeFallbackColors;
  level = args.level;
  size = args.size;
  for (var i = 0; i < colorList.length; i++) {
    readability = tinycolor.readability(baseColor, colorList[i]);
    if (readability > bestScore) {
      bestScore = readability;
      bestColor = tinycolor(colorList[i]);
    }
  }
  if (tinycolor.isReadable(baseColor, bestColor, {
    level: level,
    size: size
  }) || !includeFallbackColors) {
    return bestColor;
  } else {
    args.includeFallbackColors = false;
    return tinycolor.mostReadable(baseColor, ["#fff", "#000"], args);
  }
};

// Big List of Colors
// ------------------
// <https://www.w3.org/TR/css-color-4/#named-colors>
var names = tinycolor.names = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "0ff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000",
  blanchedalmond: "ffebcd",
  blue: "00f",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  burntsienna: "ea7e5d",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "0ff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgreen: "006400",
  darkgrey: "a9a9a9",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "f0f",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  green: "008000",
  greenyellow: "adff2f",
  grey: "808080",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgreen: "90ee90",
  lightgrey: "d3d3d3",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "789",
  lightslategrey: "789",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "0f0",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "f0f",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "663399",
  red: "f00",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "fff",
  whitesmoke: "f5f5f5",
  yellow: "ff0",
  yellowgreen: "9acd32"
};

// Make it easy to access colors via `hexNames[hex]`
var hexNames = tinycolor.hexNames = flip(names);

// Utilities
// ---------

// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
function flip(o) {
  var flipped = {};
  for (var i in o) {
    if (o.hasOwnProperty(i)) {
      flipped[o[i]] = i;
    }
  }
  return flipped;
}

// Return a valid alpha value [0,1] with all invalid values being set to 1
function boundAlpha(a) {
  a = parseFloat(a);
  if (isNaN(a) || a < 0 || a > 1) {
    a = 1;
  }
  return a;
}

// Take input from [0, n] and return it as [0, 1]
function bound01(n, max) {
  if (isOnePointZero(n)) n = "100%";
  var processPercent = isPercentage(n);
  n = Math.min(max, Math.max(0, parseFloat(n)));

  // Automatically convert percentage into number
  if (processPercent) {
    n = parseInt(n * max, 10) / 100;
  }

  // Handle floating point rounding errors
  if (Math.abs(n - max) < 0.000001) {
    return 1;
  }

  // Convert into [0, 1] range if it isn't already
  return n % max / parseFloat(max);
}

// Force a number between 0 and 1
function clamp01(val) {
  return Math.min(1, Math.max(0, val));
}

// Parse a base-16 hex value into a base-10 integer
function parseIntFromHex(val) {
  return parseInt(val, 16);
}

// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
function isOnePointZero(n) {
  return typeof n == "string" && n.indexOf(".") != -1 && parseFloat(n) === 1;
}

// Check to see if string passed in is a percentage
function isPercentage(n) {
  return typeof n === "string" && n.indexOf("%") != -1;
}

// Force a hex value to have 2 characters
function pad2(c) {
  return c.length == 1 ? "0" + c : "" + c;
}

// Replace a decimal with it's percentage value
function convertToPercentage(n) {
  if (n <= 1) {
    n = n * 100 + "%";
  }
  return n;
}

// Converts a decimal to a hex value
function convertDecimalToHex(d) {
  return Math.round(parseFloat(d) * 255).toString(16);
}
// Converts a hex value to a decimal
function convertHexToDecimal(h) {
  return parseIntFromHex(h) / 255;
}
var matchers = function () {
  // <http://www.w3.org/TR/css3-values/#integers>
  var CSS_INTEGER = "[-\\+]?\\d+%?";

  // <http://www.w3.org/TR/css3-values/#number-value>
  var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

  // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
  var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

  // Actual matching.
  // Parentheses and commas are optional, but not required.
  // Whitespace can take the place of commas or opening paren
  var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
  var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
  return {
    CSS_UNIT: new RegExp(CSS_UNIT),
    rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
    rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
    hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
    hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
    hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
    hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
    hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
  };
}();

// `isValidCSSUnit`
// Take in a single string / number and check to see if it looks like a CSS unit
// (see `matchers` above for definition).
function isValidCSSUnit(color) {
  return !!matchers.CSS_UNIT.exec(color);
}

// `stringInputToObject`
// Permissive string parsing.  Take in a number of formats, and output an object
// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
function stringInputToObject(color) {
  color = color.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
  var named = false;
  if (names[color]) {
    color = names[color];
    named = true;
  } else if (color == "transparent") {
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
      format: "name"
    };
  }

  // Try to match string input using regular expressions.
  // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
  // Just return an object and let the conversion functions handle that.
  // This way the result will be the same whether the tinycolor is initialized with string or object.
  var match;
  if (match = matchers.rgb.exec(color)) {
    return {
      r: match[1],
      g: match[2],
      b: match[3]
    };
  }
  if (match = matchers.rgba.exec(color)) {
    return {
      r: match[1],
      g: match[2],
      b: match[3],
      a: match[4]
    };
  }
  if (match = matchers.hsl.exec(color)) {
    return {
      h: match[1],
      s: match[2],
      l: match[3]
    };
  }
  if (match = matchers.hsla.exec(color)) {
    return {
      h: match[1],
      s: match[2],
      l: match[3],
      a: match[4]
    };
  }
  if (match = matchers.hsv.exec(color)) {
    return {
      h: match[1],
      s: match[2],
      v: match[3]
    };
  }
  if (match = matchers.hsva.exec(color)) {
    return {
      h: match[1],
      s: match[2],
      v: match[3],
      a: match[4]
    };
  }
  if (match = matchers.hex8.exec(color)) {
    return {
      r: parseIntFromHex(match[1]),
      g: parseIntFromHex(match[2]),
      b: parseIntFromHex(match[3]),
      a: convertHexToDecimal(match[4]),
      format: named ? "name" : "hex8"
    };
  }
  if (match = matchers.hex6.exec(color)) {
    return {
      r: parseIntFromHex(match[1]),
      g: parseIntFromHex(match[2]),
      b: parseIntFromHex(match[3]),
      format: named ? "name" : "hex"
    };
  }
  if (match = matchers.hex4.exec(color)) {
    return {
      r: parseIntFromHex(match[1] + "" + match[1]),
      g: parseIntFromHex(match[2] + "" + match[2]),
      b: parseIntFromHex(match[3] + "" + match[3]),
      a: convertHexToDecimal(match[4] + "" + match[4]),
      format: named ? "name" : "hex8"
    };
  }
  if (match = matchers.hex3.exec(color)) {
    return {
      r: parseIntFromHex(match[1] + "" + match[1]),
      g: parseIntFromHex(match[2] + "" + match[2]),
      b: parseIntFromHex(match[3] + "" + match[3]),
      format: named ? "name" : "hex"
    };
  }
  return false;
}
function validateWCAG2Parms(parms) {
  // return valid WCAG2 parms for isReadable.
  // If input parms are invalid, return {"level":"AA", "size":"small"}
  var level, size;
  parms = parms || {
    level: "AA",
    size: "small"
  };
  level = (parms.level || "AA").toUpperCase();
  size = (parms.size || "small").toLowerCase();
  if (level !== "AA" && level !== "AAA") {
    level = "AA";
  }
  if (size !== "small" && size !== "large") {
    size = "small";
  }
  return {
    level: level,
    size: size
  };
}

const simpleCheckForValidColor = data => {
  const keysToCheck = ['r', 'g', 'b', 'a', 'h', 's', 'l', 'v'];
  let checked = 0;
  let passed = 0;
  forEach(keysToCheck, letter => {
    if (data[letter]) {
      checked += 1;
      if (!isNaN(data[letter])) {
        passed += 1;
      }
      if (letter === 's' || letter === 'l') {
        const percentPatt = /^\d+%$/;
        if (percentPatt.test(data[letter])) {
          passed += 1;
        }
      }
    }
  });
  return checked === passed ? data : false;
};
const toState = (data, oldHue) => {
  const color = data.hex ? tinycolor(data.hex) : tinycolor(data);
  const hsl = color.toHsl();
  const hsv = color.toHsv();
  const rgb = color.toRgb();
  const hex = color.toHex();
  if (hsl.s === 0) {
    hsl.h = oldHue || 0;
    hsv.h = oldHue || 0;
  }
  const transparent = hex === '000000' && rgb.a === 0;
  return {
    hsl,
    hex: transparent ? 'transparent' : `#${hex}`,
    rgb,
    hsv,
    oldHue: data.h || oldHue || hsl.h,
    source: data.source
  };
};
const isValidHex = hex => {
  if (hex === 'transparent') {
    return true;
  }
  // disable hex4 and hex8
  const lh = String(hex).charAt(0) === '#' ? 1 : 0;
  return hex.length !== 4 + lh && hex.length < 7 + lh && tinycolor(hex).isValid();
};
const getContrastingColor = data => {
  if (!data) {
    return '#fff';
  }
  const col = toState(data);
  if (col.hex === 'transparent') {
    return 'rgba(0,0,0,0.4)';
  }
  const yiq = (col.rgb.r * 299 + col.rgb.g * 587 + col.rgb.b * 114) / 1000;
  return yiq >= 128 ? '#000' : '#fff';
};
const isvalidColorString = (str, type) => {
  const stringWithoutDegree = str.replace('°', '');
  return tinycolor(`${type} (${stringWithoutDegree})`).isValid();
};

const ColorPickerContext = solidJs.createContext(undefined);
function ColorPickerProvider(_props) {
  const props = solidJs.mergeProps({
    defaultColor: {
      h: 250,
      s: 0.5,
      l: 0.2,
      a: 1
    }
  }, _props);
  const [colors, setColors] = solidJs.createSignal({
    ...toState(props.color ?? props.defaultColor, 0)
  });
  solidJs.createEffect(() => {
    if (props.color) {
      setColors({
        ...toState(props.color, 0)
      });
    }
  });
  const handler = (fn, data, event) => fn(data, event);
  const debouncedChangeHandler = solidJs.createMemo(() => debounce(handler, 100), []);
  const changeColor = (newColor, event) => {
    const isValidColor = simpleCheckForValidColor(newColor);
    if (isValidColor) {
      const newColors = toState(newColor, (typeof newColor !== 'string' && 'h' in newColor ? newColor.h : undefined) || colors().oldHue);
      setColors(newColors);
      props.onChangeComplete && debouncedChangeHandler()(props.onChangeComplete, newColors, event);
      props.onChange && props.onChange(newColors, event);
    }
  };
  const handleSwatchHover = (data, event) => {
    const isValidColor = simpleCheckForValidColor(data);
    if (isValidColor) {
      const newColors = toState(data, (typeof data !== 'string' && 'h' in data ? data.h : undefined) || colors().oldHue);
      props.onSwatchHover && props.onSwatchHover(newColors, event);
    }
  };
  const store = {
    colors,
    changeColor,
    onSwatchHover: props.onSwatchHover ? handleSwatchHover : undefined
  };
  return web.createComponent(ColorPickerContext.Provider, {
    value: store,
    get children() {
      return props.children;
    }
  });
}
function useColorPicker() {
  return solidJs.useContext(ColorPickerContext);
}
function withColorPicker(Component) {
  return props => web.createComponent(ColorPickerProvider, web.mergeProps(props, {
    get children() {
      return web.createComponent(Component, props);
    }
  }));
}

const _tmpl$$F = /*#__PURE__*/web.template(`<div tabindex="0">`);
const ENTER = 13;
function Swatch(_props) {
  const props = solidJs.mergeProps({
    onClick: () => {},
    title: _props.color,
    focusStyle: {}
  }, _props);
  const {
    onSwatchHover
  } = useColorPicker();
  const transparent = props.color === 'transparent';
  const [focused, setFocused] = solidJs.createSignal(false);
  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);
  const handleClick = e => {
    props.onClick(props.color, e);
    handleFocus();
  };
  const handleKeyDown = e => e.keyCode === ENTER && props.onClick(props.color, e);
  const styles = () => {
    return {
      swatch: {
        background: props.color,
        height: '100%',
        width: '100%',
        cursor: 'pointer',
        position: 'relative',
        outline: 'none',
        ...props.styles,
        ...(focused() ? props.focusStyle : {})
      }
    };
  };
  return (() => {
    const _el$ = _tmpl$$F();
    _el$.$$mouseover = event => {
      onSwatchHover && onSwatchHover(props.color, event);
    };
    _el$.addEventListener("blur", handleBlur);
    _el$.$$keydown = handleKeyDown;
    _el$.$$click = handleClick;
    web.insert(_el$, () => props.children, null);
    web.insert(_el$, transparent && web.createComponent(Checkboard, {
      get borderRadius() {
        return styles().swatch.borderRadius;
      },
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)"
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().swatch,
        _v$2 = props.title;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.setAttribute(_el$, "title", _p$._v$2 = _v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
}
web.delegateEvents(["click", "keydown", "mouseover"]);

function calculateChange(e, hsl, container) {
  const {
    width: containerWidth,
    height: containerHeight
  } = container.getBoundingClientRect();
  const x = typeof e.pageX === 'number' ? e.pageX : e.touches[0].pageX;
  const y = typeof e.pageY === 'number' ? e.pageY : e.touches[0].pageY;
  let left = x - (container.getBoundingClientRect().left + window.pageXOffset);
  let top = y - (container.getBoundingClientRect().top + window.pageYOffset);
  if (left < 0) {
    left = 0;
  } else if (left > containerWidth) {
    left = containerWidth;
  }
  if (top < 0) {
    top = 0;
  } else if (top > containerHeight) {
    top = containerHeight;
  }
  const saturation = left / containerWidth;
  const bright = 1 - top / containerHeight;
  return {
    h: hsl.h,
    s: saturation,
    v: bright,
    a: hsl.a,
    source: 'hsv'
  };
}

const _tmpl$$E = /*#__PURE__*/web.template(`<div><style>
          .saturation-white {
            background: -webkit-linear-gradient(to right, #fff, rgba(255,255,255,0));
            background: linear-gradient(to right, #fff, rgba(255,255,255,0));
          }
          .saturation-black {
            background: -webkit-linear-gradient(to top, #000, rgba(0,0,0,0));
            background: linear-gradient(to top, #000, rgba(0,0,0,0));
          }
        </style><div class="saturation-white"><div class="saturation-black"></div><div>`),
  _tmpl$2$4 = /*#__PURE__*/web.template(`<div>`);
function Saturation(_props) {
  const props = solidJs.mergeProps({
    styles: {}
  }, _props);
  let container;
  solidJs.createEffect(() => {
    return () => {
      unbindEventListeners();
    };
  }, []);
  function handleChange(event) {
    if (props.onChange) {
      props.onChange(calculateChange(event, props.hsl, container), event);
    }
  }
  function handleMouseDown(event) {
    handleChange(event);
    if (container) {
      container.addEventListener('mousemove', handleChange);
      container.addEventListener('mouseup', handleMouseUp);
    }
  }
  function handleMouseUp() {
    unbindEventListeners();
  }
  function unbindEventListeners() {
    if (container) {
      container.removeEventListener('mousemove', handleChange);
      container.removeEventListener('mouseup', handleMouseUp);
    }
  }
  const styles = () => {
    const {
      hsv,
      hsl,
      shadow,
      radius,
      styles
    } = props;
    return merge$1({
      color: {
        position: 'absolute',
        inset: '0px',
        background: `hsl(${hsl.h},100%, 50%)`,
        'border-radius': radius
      },
      white: {
        position: 'absolute',
        inset: '0px',
        'border-radius': radius
      },
      black: {
        position: 'absolute',
        inset: '0px',
        boxShadow: shadow,
        'border-radius': radius
      },
      pointer: {
        position: 'absolute',
        top: `${-(hsv.v * 100) + 100}%`,
        left: `${hsv.s * 100}%`,
        cursor: 'default'
      },
      circle: {
        width: '4px',
        height: '4px',
        'box-shadow': `0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3),
            0 0 1px 2px rgba(0,0,0,.4)`,
        'border-radius': '50%',
        cursor: 'hand',
        transform: 'translate(-2px, -2px)'
      }
    }, styles);
  };
  return (() => {
    const _el$ = _tmpl$$E(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.nextSibling;
    _el$.$$touchstart = handleChange;
    _el$.$$touchmove = handleChange;
    _el$.$$mousedown = handleMouseDown;
    const _ref$ = container;
    typeof _ref$ === "function" ? web.use(_ref$, _el$) : container = _el$;
    web.insert(_el$5, (() => {
      const _c$ = web.memo(() => !!props.pointer);
      return () => _c$() ? props.pointer : (() => {
        const _el$6 = _tmpl$2$4();
        web.effect(_$p => web.style(_el$6, styles().circle, _$p));
        return _el$6;
      })();
    })());
    web.effect(_p$ => {
      const _v$ = styles().color,
        _v$2 = styles().white,
        _v$3 = styles().black,
        _v$4 = styles().pointer;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$3, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$4, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$5, _v$4, _p$._v$4);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined
    });
    return _el$;
  })();
}
web.delegateEvents(["mousedown", "touchmove", "touchstart"]);

const _tmpl$$D = /*#__PURE__*/web.template(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="0.5"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z">`),
  _tmpl$2$3 = /*#__PURE__*/web.template(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="0.5"><path d="M12,18.17L8.83,15L7.42,16.41L12,21L16.59,16.41L15.17,15M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z">`);
function CheckIcon(_props) {
  const props = solidJs.mergeProps({
    width: 24,
    height: 24,
    fill: 'white',
    stroke: 'white'
  }, _props);
  return (() => {
    const _el$ = _tmpl$$D();
    web.effect(_p$ => {
      const _v$ = `${props.width}px`,
        _v$2 = `${props.height}px`,
        _v$3 = props.fill,
        _v$4 = props.stroke;
      _v$ !== _p$._v$ && web.setAttribute(_el$, "width", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && web.setAttribute(_el$, "height", _p$._v$2 = _v$2);
      _v$3 !== _p$._v$3 && web.setAttribute(_el$, "fill", _p$._v$3 = _v$3);
      _v$4 !== _p$._v$4 && web.setAttribute(_el$, "stroke", _p$._v$4 = _v$4);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined
    });
    return _el$;
  })();
}
function UnfoldMoreHorizontalIcon(_props) {
  const props = solidJs.mergeProps({
    width: 24,
    height: 24
  }, _props);
  return (() => {
    const _el$2 = _tmpl$2$3();
    web.addEventListener(_el$2, "mouseout", props.onMouseOut, true);
    web.addEventListener(_el$2, "mouseenter", props.onMouseEnter);
    web.addEventListener(_el$2, "mouseover", props.onMouseOver, true);
    _el$2.style.setProperty("border-radius", "5px");
    web.effect(_p$ => {
      const _v$5 = `${props.width}px`,
        _v$6 = `${props.height}px`;
      _v$5 !== _p$._v$5 && web.setAttribute(_el$2, "width", _p$._v$5 = _v$5);
      _v$6 !== _p$._v$6 && web.setAttribute(_el$2, "height", _p$._v$6 = _v$6);
      return _p$;
    }, {
      _v$5: undefined,
      _v$6: undefined
    });
    return _el$2;
  })();
}
web.delegateEvents(["mouseover", "mouseout"]);

const _tmpl$$C = /*#__PURE__*/web.template(`<div>`);
function AlphaPointer(_props) {
  const props = solidJs.mergeProps({}, _props);
  const styles = {
    picker: {
      width: '18px',
      height: '18px',
      'border-radius': '50%',
      transform: props.direction === 'vertical' ? 'translate(-3px, -9px)' : 'translate(-9px, -1px)',
      'background-color': 'rgb(248, 248, 248)',
      'box-shadow': '0 1px 4px 0 rgba(0, 0, 0, 0.37)'
    }
  };
  return (() => {
    const _el$ = _tmpl$$C();
    web.effect(_$p => web.style(_el$, styles.picker, _$p));
    return _el$;
  })();
}

const _tmpl$$B = /*#__PURE__*/web.template(`<div>`);
function AlphaPicker(_props) {
  const props = solidJs.mergeProps({
    width: '316px',
    height: '16px',
    direction: 'horizontal',
    pointer: AlphaPointer,
    className: ''
  }, _props);
  const {
    colors: currentColors,
    changeColor
  } = useColorPicker();
  const styles = {
    picker: {
      position: 'relative',
      width: props.width,
      height: props.height
    },
    alpha: {
      borderRadius: '2px',
      ...props.style
    }
  };
  return (() => {
    const _el$ = _tmpl$$B();
    web.insert(_el$, web.createComponent(Alpha$1, web.mergeProps(() => styles.alpha, {
      get rgb() {
        return currentColors().rgb;
      },
      get hsl() {
        return currentColors().hsl;
      },
      get pointer() {
        return props.pointer;
      },
      get renderers() {
        return props.renderers;
      },
      onChange: changeColor,
      get direction() {
        return props.direction;
      }
    })));
    web.effect(_p$ => {
      const _v$ = styles.picker,
        _v$2 = `alpha-picker ${props.className}`;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
}
var Alpha = withColorPicker(AlphaPicker);

const _tmpl$$A = /*#__PURE__*/web.template(`<div><div class="flexbox-fix"><div></div><div></div><div>`);
function Material(_props) {
  const props = solidJs.mergeProps({
    styles: {},
    className: ''
  }, _props);
  const {
    colors,
    changeColor
  } = useColorPicker();
  const styles = () => {
    return merge$1({
      material: {
        width: '98px',
        height: '98px',
        padding: '16px',
        'font-family': 'Roboto'
      },
      hexWrap: {
        position: 'relative'
      },
      hexInput: {
        width: '100%',
        'margin-top': '12px',
        'font-size': '15px',
        color: '#333',
        padding: '0px',
        border: '0px',
        'border-bottom': `2px solid ${colors().hex}`,
        outline: 'none',
        height: '30px'
      },
      hexLabel: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        'font-size': '11px',
        color: '#999999',
        'text-transform': 'capitalize'
      },
      hex: {},
      rgbWrap: {
        position: 'relative'
      },
      rgbInput: {
        width: '100%',
        'margin-top': '12px',
        'font-size': '15px',
        color: '#333',
        padding: '0px',
        border: '0px',
        'border-bottom': '1px solid #eee',
        outline: 'none',
        height: '30px'
      },
      rgbLabel: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        'font-size': '11px',
        color: '#999999',
        'text-transform': 'capitalize'
      },
      split: {
        display: 'flex',
        'margin-right': '-10px',
        'padding-top': '11px'
      },
      third: {
        flex: '1',
        'padding-right': '10px'
      }
    }, props.styles);
  };
  const handleChange = (data, e) => {
    if (typeof data !== 'string' && 'hex' in data) {
      isValidHex(data.hex) && changeColor({
        hex: data.hex,
        source: 'hex'
      }, e);
    } else if (typeof data !== 'string' && ('r' in data || 'g' in data || 'b' in data)) {
      data = data;
      changeColor({
        r: data.r || colors().rgb.r,
        g: data.g || colors().rgb.g,
        b: data.b || colors().rgb.b,
        source: 'rgb'
      }, e);
    }
  };
  return web.createComponent(Raised, {
    get styles() {
      return props.styles;
    },
    get children() {
      const _el$ = _tmpl$$A(),
        _el$2 = _el$.firstChild,
        _el$3 = _el$2.firstChild,
        _el$4 = _el$3.nextSibling,
        _el$5 = _el$4.nextSibling;
      web.insert(_el$, web.createComponent(EditableInput, {
        get styles() {
          return {
            wrap: styles().hexWrap,
            input: styles().hexInput,
            label: styles().hexLabel
          };
        },
        label: "hex",
        get value() {
          return colors().hex;
        },
        onChange: handleChange
      }), _el$2);
      web.insert(_el$3, web.createComponent(EditableInput, {
        get styles() {
          return {
            wrap: styles().rgbWrap,
            input: styles().rgbInput,
            label: styles().rgbLabel
          };
        },
        label: "r",
        get value() {
          return colors().rgb.r;
        },
        onChange: handleChange
      }));
      web.insert(_el$4, web.createComponent(EditableInput, {
        get styles() {
          return {
            wrap: styles().rgbWrap,
            input: styles().rgbInput,
            label: styles().rgbLabel
          };
        },
        label: "g",
        get value() {
          return colors().rgb.g;
        }
      }));
      web.insert(_el$5, web.createComponent(EditableInput, {
        get styles() {
          return {
            wrap: styles().rgbWrap,
            input: styles().rgbInput,
            label: styles().rgbLabel
          };
        },
        label: "b",
        get value() {
          return colors().rgb.b;
        },
        onChange: handleChange
      }));
      web.effect(_p$ => {
        const _v$ = styles().material,
          _v$2 = `material-picker ${props.className}`,
          _v$3 = styles().split,
          _v$4 = styles().third,
          _v$5 = styles().third,
          _v$6 = styles().third;
        _p$._v$ = web.style(_el$, _v$, _p$._v$);
        _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
        _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
        _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
        _p$._v$5 = web.style(_el$4, _v$5, _p$._v$5);
        _p$._v$6 = web.style(_el$5, _v$6, _p$._v$6);
        return _p$;
      }, {
        _v$: undefined,
        _v$2: undefined,
        _v$3: undefined,
        _v$4: undefined,
        _v$5: undefined,
        _v$6: undefined
      });
      return _el$;
    }
  });
}
var Material$1 = withColorPicker(Material);

const _tmpl$$z = /*#__PURE__*/web.template(`<div>`);
function SliderPointer$1({
  direction
}) {
  const styles = {
    picker: {
      width: '18px',
      height: '18px',
      'border-radius': '50%',
      transform: direction === 'vertical' ? 'translate(-3px, -9px)' : 'translate(-9px, -1px)',
      'background-color': 'rgb(248, 248, 248)',
      'box-shadow': '0 1px 4px 0 rgba(0, 0, 0, 0.37)'
    }
  };
  return (() => {
    const _el$ = _tmpl$$z();
    web.effect(_$p => web.style(_el$, styles.picker, _$p));
    return _el$;
  })();
}

const _tmpl$$y = /*#__PURE__*/web.template(`<div>`);
function HuePicker(_props) {
  const props = solidJs.mergeProps({
    width: '316px',
    height: '16px',
    direction: 'horizontal',
    pointer: SliderPointer$1,
    styles: {},
    className: ''
  }, _props);
  const {
    colors,
    changeColor
  } = useColorPicker();
  const styles = merge$1({
    picker: {
      position: 'relative',
      width: props.width,
      height: props.height
    },
    hue: {
      'border-radius': '2px'
    }
  }, props.styles);

  // Overwrite to provide pure hue color
  const handleChange = data => changeColor({
    a: 1,
    h: typeof data !== 'string' && 'h' in data ? data.h : 0,
    l: 0.5,
    s: 1
  });
  return (() => {
    const _el$ = _tmpl$$y();
    web.insert(_el$, web.createComponent(Hue$1, web.mergeProps(() => styles.hue, {
      get hsl() {
        return colors().hsl;
      },
      get pointer() {
        return props.pointer;
      },
      get direction() {
        return props.direction;
      },
      onChange: handleChange
    })));
    web.effect(_p$ => {
      const _v$ = styles.picker,
        _v$2 = `hue-picker ${props.className}`;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
}
var Hue = withColorPicker(HuePicker);

const _tmpl$$x = /*#__PURE__*/web.template(`<div><div></div><div></div><div><div>#</div><div>`);
const Twitter = _props => {
  const props = solidJs.mergeProps({
    colors: ['#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'],
    width: 276,
    triangle: 'top-left',
    styles: {},
    className: ''
  }, _props);
  const {
    colors: currentColors,
    changeColor
  } = useColorPicker();
  const styles = () => {
    const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    const {
      triangle
    } = props;
    return merge$1({
      card: {
        width,
        background: '#fff',
        border: '0 solid rgba(0,0,0,0.25)',
        'box-shadow': '0 1px 4px rgba(0,0,0,0.25)',
        'border-radius': '4px',
        position: 'relative'
      },
      body: {
        padding: '15px 9px 9px 15px'
      },
      label: {
        'font-size': '18px',
        color: '#fff'
      },
      triangle: {
        width: '0px',
        height: '0px',
        'border-style': 'solid',
        'border-width': '0 9px 10px 9px',
        'border-color': 'transparent transparent #fff transparent',
        position: 'absolute',
        display: triangle === 'hide' ? 'none' : undefined,
        top: triangle === 'top-left' || triangle === 'top-right' ? '-10px' : undefined,
        left: triangle === 'top-left' || triangle === 'top-right' ? '12px' : undefined
      },
      triangleShadow: {
        width: '0px',
        height: '0px',
        'border-style': 'solid',
        'border-width': '0 9px 10px 9px',
        'border-color': 'transparent transparent rgba(0,0,0,.1) transparent',
        position: 'absolute',
        display: triangle === 'hide' ? 'none' : undefined,
        top: triangle === 'top-left' || triangle === 'top-right' ? '-11px' : undefined,
        left: triangle === 'top-left' || triangle === 'top-right' ? '12px' : undefined
      },
      hash: {
        background: '#F0F0F0',
        height: '30px',
        width: '30px',
        'border-radius': '4px 0 0 4px',
        float: 'left',
        color: '#98A1A4',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center'
      },
      input: {
        width: '100px',
        'font-size': '14px',
        color: '#666',
        border: '0px',
        outline: 'none',
        height: '28px',
        'box-shadow': 'inset 0 0 0 1px #F0F0F0',
        'box-sizing': 'content-box',
        'border-radius': '0 4px 4px 0',
        float: 'left',
        'padding-left': '8px'
      },
      swatch: {
        width: '30px',
        height: '30px',
        float: 'left',
        'border-radius': '4px',
        margin: '0 6px 6px 0'
      },
      clear: {
        clear: 'both'
      }
    }, props.styles);
  };
  const handleChange = (hexcode, e) => {
    isValidHex(hexcode) && changeColor({
      hex: hexcode,
      source: 'hex'
    }, e);
  };
  return (() => {
    const _el$ = _tmpl$$x(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.firstChild,
      _el$6 = _el$5.nextSibling;
    web.insert(_el$4, web.createComponent(solidJs.For, {
      get each() {
        return props.colors;
      },
      children: c => web.createComponent(Swatch, {
        color: c,
        get styles() {
          return styles().swatch;
        },
        onClick: handleChange,
        focusStyle: {
          'box-shadow': `0 0 4px ${c}`
        }
      })
    }), _el$5);
    web.insert(_el$4, web.createComponent(EditableInput, {
      label: '',
      get styles() {
        return {
          input: styles().input
        };
      },
      get value() {
        return currentColors().hex.replace('#', '');
      },
      onChange: handleChange
    }), _el$6);
    web.effect(_p$ => {
      const _v$ = styles().card,
        _v$2 = `twitter-picker ${props.className}`,
        _v$3 = styles().triangleShadow,
        _v$4 = styles().triangle,
        _v$5 = styles().body,
        _v$6 = styles().hash,
        _v$7 = styles().clear;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$4, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$5, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$6, _v$7, _p$._v$7);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined
    });
    return _el$;
  })();
};
var Twitter$1 = withColorPicker(Twitter);

const _tmpl$$w = /*#__PURE__*/web.template(`<div><div>`);
const BlockSwatches = ({
  colors,
  onClick
}) => {
  const styles = {
    swatches: {
      'margin-right': '-10px'
    },
    swatch: {
      width: '22px',
      height: '22px',
      float: 'left',
      'margin-right': '10px',
      'margin-bottom': '10px',
      'border-radius': '4px'
    },
    clear: {
      clear: 'both'
    }
  };
  return (() => {
    const _el$ = _tmpl$$w(),
      _el$2 = _el$.firstChild;
    web.insert(_el$, web.createComponent(solidJs.For, {
      each: colors,
      children: c => web.createComponent(Swatch, {
        color: c,
        get styles() {
          return styles.swatch;
        },
        onClick: onClick,
        focusStyle: {
          'box-shadow': `0 0 4px ${c}`
        }
      })
    }), _el$2);
    web.effect(_p$ => {
      const _v$ = styles.swatches,
        _v$2 = styles.clear;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
};
var BlockSwatches$1 = BlockSwatches;

const _tmpl$$v = /*#__PURE__*/web.template(`<div><div></div><div><div></div></div><div>`);
const Block = _props => {
  const props = solidJs.mergeProps({
    colors: ['#D9E3F0', '#F47373', '#697689', '#37D67A', '#2CCCE4', '#555555', '#dce775', '#ff8a65', '#ba68c8'],
    width: 170,
    triangle: 'top',
    styles: {},
    className: ''
  }, _props);
  const {
    colors: currentColors,
    changeColor
  } = useColorPicker();
  const transparent = currentColors().hex === 'transparent';
  const handleChange = (hexCode, e) => {
    isValidHex(hexCode) && changeColor({
      hex: hexCode,
      source: 'hex'
    }, e);
  };
  const styles = () => {
    const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    const {
      triangle,
      styles
    } = props;
    return merge$1({
      card: {
        width,
        background: '#fff',
        'box-shadow': '0 1px rgba(0,0,0,.1)',
        'border-radius': '6px',
        position: 'relative'
      },
      head: {
        height: '110px',
        background: currentColors().hex,
        'border-radius': '6px 6px 0 0',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        position: 'relative'
      },
      body: {
        padding: '10px'
      },
      label: {
        'font-size': '18px',
        color: getContrastingColor(currentColors().hex),
        position: 'relative'
      },
      triangle: {
        width: '0px',
        height: '0px',
        'border-style': 'solid',
        'border-width': '0 10px 10px 10px',
        'border-color': `transparent transparent ${currentColors().hex} transparent`,
        position: 'absolute',
        top: '-10px',
        left: '50%',
        'margin-left': '-10px',
        display: triangle === 'hide' ? 'none' : undefined
      },
      input: {
        width: '100%',
        'font-size': '12px',
        color: '#666',
        border: '0px',
        outline: 'none',
        height: '22px',
        'box-shadow': 'inset 0 0 0 1px #ddd',
        'border-radius': '4px',
        padding: '0 7px',
        'box-sizing': 'border-box'
      }
    }, styles);
  };
  return (() => {
    const _el$ = _tmpl$$v(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$3.nextSibling;
    web.insert(_el$3, transparent && web.createComponent(Checkboard, {
      borderRadius: "6px 6px 0 0"
    }), _el$4);
    web.insert(_el$4, () => currentColors().hex);
    web.insert(_el$5, web.createComponent(BlockSwatches$1, {
      get colors() {
        return props.colors;
      },
      onClick: handleChange
    }), null);
    web.insert(_el$5, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles().input
        };
      },
      get value() {
        return currentColors().hex;
      },
      onChange: handleChange
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().card,
        _v$2 = `block-picker ${props.className}`,
        _v$3 = styles().triangle,
        _v$4 = styles().head,
        _v$5 = styles().label,
        _v$6 = styles().body;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$4, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$5, _v$6, _p$._v$6);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined
    });
    return _el$;
  })();
};
var Block$1 = withColorPicker(Block);

const _tmpl$$u = /*#__PURE__*/web.template(`<div>`);
function SliderPointer() {
  const styles = {
    picker: {
      width: '14px',
      height: '14px',
      'border-radius': '6px',
      transform: 'translate(-7px, -1px)',
      'background-color': 'rgb(248, 248, 248)',
      'box-shadow': '0 1px 4px 0 rgba(0, 0, 0, 0.37)'
    }
  };
  return (() => {
    const _el$ = _tmpl$$u();
    web.effect(_$p => web.style(_el$, styles.picker, _$p));
    return _el$;
  })();
}

const _tmpl$$t = /*#__PURE__*/web.template(`<div>`);
function SliderSwatch(_props) {
  const props = solidJs.mergeProps({
    onClick: () => {}
  }, _props);
  const styles = () => {
    const {
      hsl,
      offset,
      active,
      first,
      last
    } = props;
    return {
      swatch: {
        height: '12px',
        background: `hsl(${hsl.h}, 50%, ${offset * 100}%)`,
        cursor: 'pointer',
        'border-radius': active ? '3.6px/2px' : first ? '2px 0 0 2px' : last ? '0 2px 2px 0' : undefined,
        transform: active ? 'scaleY(1.8)' : undefined
      }
    };
  };
  const handleClick = e => {
    props.onClick({
      h: props.hsl.h,
      s: 0.5,
      l: props.offset,
      source: 'hsl'
    }, e);
  };
  return (() => {
    const _el$ = _tmpl$$t();
    _el$.$$click = handleClick;
    web.effect(_$p => web.style(_el$, styles().swatch, _$p));
    return _el$;
  })();
}
web.delegateEvents(["click"]);

const _tmpl$$s = /*#__PURE__*/web.template(`<div><div></div><div></div><div></div><div></div><div></div><div>`);
function SliderSwatches(_props) {
  const props = solidJs.mergeProps({}, _props);
  const styles = {
    swatches: {
      'margin-top': '20px'
    },
    swatch: {
      'box-sizing': 'border-box',
      width: '20%',
      'padding-right': '1px',
      float: 'left'
    },
    clear: {
      clear: 'both'
    }
  };

  // Acceptible difference in floating point equality
  const epsilon = 0.1;
  return (() => {
    const _el$ = _tmpl$$s(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$5.nextSibling,
      _el$7 = _el$6.nextSibling;
    web.insert(_el$2, web.createComponent(SliderSwatch, {
      get hsl() {
        return props.hsl;
      },
      offset: 0.8,
      get active() {
        return web.memo(() => Math.abs(props.hsl.l - 0.8) < epsilon)() && Math.abs(props.hsl.s - 0.5) < epsilon;
      },
      get onClick() {
        return props.onClick;
      },
      first: true
    }));
    web.insert(_el$3, web.createComponent(SliderSwatch, {
      get hsl() {
        return props.hsl;
      },
      offset: 0.65,
      get active() {
        return web.memo(() => Math.abs(props.hsl.l - 0.65) < epsilon)() && Math.abs(props.hsl.s - 0.5) < epsilon;
      },
      get onClick() {
        return props.onClick;
      }
    }));
    web.insert(_el$4, web.createComponent(SliderSwatch, {
      get hsl() {
        return props.hsl;
      },
      offset: 0.5,
      get active() {
        return web.memo(() => Math.abs(props.hsl.l - 0.5) < epsilon)() && Math.abs(props.hsl.s - 0.5) < epsilon;
      },
      get onClick() {
        return props.onClick;
      }
    }));
    web.insert(_el$5, web.createComponent(SliderSwatch, {
      get hsl() {
        return props.hsl;
      },
      offset: 0.35,
      get active() {
        return web.memo(() => Math.abs(props.hsl.l - 0.35) < epsilon)() && Math.abs(props.hsl.s - 0.5) < epsilon;
      },
      get onClick() {
        return props.onClick;
      }
    }));
    web.insert(_el$6, web.createComponent(SliderSwatch, {
      get hsl() {
        return props.hsl;
      },
      offset: 0.2,
      get active() {
        return web.memo(() => Math.abs(props.hsl.l - 0.2) < epsilon)() && Math.abs(props.hsl.s - 0.5) < epsilon;
      },
      get onClick() {
        return props.onClick;
      },
      last: true
    }));
    web.effect(_p$ => {
      const _v$ = styles.swatches,
        _v$2 = styles.swatch,
        _v$3 = styles.swatch,
        _v$4 = styles.swatch,
        _v$5 = styles.swatch,
        _v$6 = styles.swatch,
        _v$7 = styles.clear;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$4, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$5, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$6, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$7, _v$7, _p$._v$7);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined
    });
    return _el$;
  })();
}

const _tmpl$$r = /*#__PURE__*/web.template(`<div><div></div><div>`);
const Slider = _props => {
  const props = solidJs.mergeProps({
    pointer: SliderPointer,
    styles: {},
    className: ''
  }, _props);
  const {
    colors,
    changeColor
  } = useColorPicker();
  const styles = merge$1({
    hue: {
      height: '12px',
      position: 'relative'
    },
    Hue: {
      'border-radius': '2px'
    }
  }, props.styles);
  return (() => {
    const _el$ = _tmpl$$r(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling;
    web.insert(_el$2, web.createComponent(Hue$1, {
      radius: 2,
      get hsl() {
        return colors().hsl;
      },
      get pointer() {
        return props.pointer;
      },
      onChange: changeColor
    }));
    web.insert(_el$3, web.createComponent(SliderSwatches, {
      get hsl() {
        return colors().hsl;
      },
      onClick: changeColor
    }));
    web.effect(_p$ => {
      const _v$ = styles.wrap || {},
        _v$2 = `slider-picker ${props.className}`,
        _v$3 = styles.hue,
        _v$4 = styles.swatches;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined
    });
    return _el$;
  })();
};
var Slider$1 = withColorPicker(Slider);

const _tmpl$$q = /*#__PURE__*/web.template(`<div><div>`);
function GithubSwatch(_props) {
  const props = solidJs.mergeProps({}, _props);
  const hoverSwatch = {
    position: 'relative',
    'z-index': 2,
    outline: '2px solid #fff',
    'box-shadow': '0 0 5px 2px rgba(0,0,0,0.25)'
  };
  const [hover, setHover] = solidJs.createSignal(false);
  const styles = () => {
    return {
      swatch: {
        width: '25px',
        height: '25px',
        'font-size': '0',
        ...(hover() ? hoverSwatch : {})
      }
    };
  };
  return (() => {
    const _el$ = _tmpl$$q(),
      _el$2 = _el$.firstChild;
    _el$.$$mouseout = () => setHover(false);
    _el$.$$mouseover = () => setHover(true);
    web.insert(_el$2, web.createComponent(Swatch, {
      get color() {
        return props.color;
      },
      get onClick() {
        return props.onClick;
      },
      focusStyle: hoverSwatch
    }));
    web.effect(_$p => web.style(_el$2, styles().swatch, _$p));
    return _el$;
  })();
}
web.delegateEvents(["mouseover", "mouseout"]);

const _tmpl$$p = /*#__PURE__*/web.template(`<div><div></div><div>`);
function Github(_props) {
  const props = solidJs.mergeProps({
    width: 200,
    colors: ['#B80000', '#DB3E00', '#FCCB00', '#008B02', '#006B76', '#1273DE', '#004DCF', '#5300EB', '#EB9694', '#FAD0C3', '#FEF3BD', '#C1E1C5', '#BEDADC', '#C4DEF6', '#BED3F3', '#D4C4FB'],
    triangle: 'top-left',
    styles: {},
    className: ''
  }, _props);
  const {
    changeColor
  } = useColorPicker();
  const styles = () => {
    const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    const {
      triangle
    } = props;
    return merge$1({
      card: {
        width,
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.2)',
        'box-shadow': '0 3px 12px rgba(0,0,0,0.15)',
        'border-radius': '4px',
        position: 'relative',
        padding: '5px',
        display: 'flex',
        'flex-wrap': 'wrap'
      },
      triangle: {
        position: 'absolute',
        border: '7px solid transparent',
        'border-bottom-color': '#fff',
        display: triangle === 'hide' ? 'none' : undefined,
        top: triangle === 'top-left' || triangle === 'top-right' ? '-14px' : '37px',
        left: triangle === 'top-left' || triangle === 'bottom-left' ? '10px' : undefined,
        right: triangle === 'top-right' || triangle === 'bottom-right' ? '10px' : undefined,
        transform: triangle === 'bottom-left' || triangle === 'bottom-right' ? 'rotate(180deg)' : undefined
      },
      triangleShadow: {
        position: 'absolute',
        border: '8px solid transparent',
        'border-bottom-color': 'rgba(0,0,0,0.15)',
        display: triangle === 'hide' ? 'none' : undefined,
        top: triangle === 'top-left' || triangle === 'top-right' ? '-16px' : '35px',
        left: triangle === 'top-left' || triangle === 'bottom-left' ? '9px' : undefined,
        right: triangle === 'top-right' || triangle === 'bottom-right' ? '9px' : undefined,
        transform: triangle === 'bottom-left' || triangle === 'bottom-right' ? 'rotate(180deg)' : undefined
      }
    }, props.styles);
  };
  const handleChange = (hex, e) => changeColor({
    hex,
    source: 'hex'
  }, e);
  return (() => {
    const _el$ = _tmpl$$p(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling;
    web.insert(_el$, web.createComponent(solidJs.For, {
      get each() {
        return props.colors;
      },
      children: c => web.createComponent(GithubSwatch, {
        color: c,
        onClick: handleChange
      })
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().card,
        _v$2 = `github-picker ${props.className}`,
        _v$3 = styles().triangleShadow,
        _v$4 = styles().triangle;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined
    });
    return _el$;
  })();
}
var Github$1 = withColorPicker(Github);

const _tmpl$$o = /*#__PURE__*/web.template(`<div>`);
function CompactColor(_props) {
  const props = solidJs.mergeProps({
    onClick: () => {}
  }, _props);
  const styles = () => {
    const {
      color,
      active
    } = props;
    return {
      color: {
        background: color,
        width: '15px',
        height: '15px',
        float: 'left',
        'margin-right': '5px',
        'margin-bottom': '5px',
        position: 'relative',
        cursor: 'pointer',
        'box-shadow': color === '#FFFFFF' ? 'inset 0 0 0 1px #ddd' : undefined
      },
      dot: {
        position: 'absolute',
        inset: '5px',
        background: color === '#FFFFFF' ? '#000' : color === 'transparent' ? '#000' : getContrastingColor(color),
        'border-radius': '50%',
        opacity: active ? 1 : 0
      }
    };
  };
  return web.createComponent(Swatch, {
    get styles() {
      return styles().color;
    },
    get color() {
      return props.color;
    },
    get onClick() {
      return props.onClick;
    },
    get focusStyle() {
      return {
        'box-shadow': `0 0 4px ${props.color}`
      };
    },
    get children() {
      const _el$ = _tmpl$$o();
      web.effect(_$p => web.style(_el$, styles().dot, _$p));
      return _el$;
    }
  });
}

const _tmpl$$n = /*#__PURE__*/web.template(`<div class="flexbox-fix"><div>`);
function CompactFields(_props) {
  const props = solidJs.mergeProps({}, _props);
  const styles = () => {
    const hex = props.hex;
    return {
      fields: {
        display: 'flex',
        'padding-bottom': '6px',
        'padding-right': '5px',
        position: 'relative'
      },
      active: {
        position: 'absolute',
        top: '6px',
        left: '5px',
        height: '9px',
        width: '9px',
        background: hex
      },
      hexWrap: {
        flex: '6',
        position: 'relative'
      },
      hexInput: {
        width: '80%',
        padding: '0px',
        'padding-left': '20%',
        border: 'none',
        outline: 'none',
        background: 'none',
        'font-size': '12px',
        color: '#333',
        height: '16px'
      },
      hexLabel: {
        display: 'none'
      },
      rgbWrap: {
        flex: '3',
        position: 'relative'
      },
      rgbInput: {
        width: '70%',
        padding: '0px',
        'padding-left': '30%',
        border: 'none',
        outline: 'none',
        background: 'none',
        'font-size': '12px',
        color: '#333',
        height: '16px'
      },
      rgbLabel: {
        position: 'absolute',
        top: '3px',
        left: '0px',
        'line-height': '16px',
        'text-transform': 'uppercase',
        'font-size': '12px',
        color: '#999'
      }
    };
  };
  const handleChange = (data, e) => {
    if (data.r || data.g || data.b) {
      props.onChange({
        r: data.r || props.rgb.r,
        g: data.g || props.rgb.g,
        b: data.b || props.rgb.b,
        source: 'rgb'
      }, e);
    } else {
      props.onChange({
        hex: data.hex,
        source: 'hex'
      }, e);
    }
  };
  return (() => {
    const _el$ = _tmpl$$n(),
      _el$2 = _el$.firstChild;
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles().hexWrap,
          input: styles().hexInput,
          label: styles().hexLabel
        };
      },
      label: "hex",
      get value() {
        return props.hex;
      },
      onChange: handleChange
    }), null);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles().rgbWrap,
          input: styles().rgbInput,
          label: styles().rgbLabel
        };
      },
      label: "r",
      get value() {
        return props.rgb.r;
      },
      onChange: handleChange
    }), null);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles().rgbWrap,
          input: styles().rgbInput,
          label: styles().rgbLabel
        };
      },
      label: "g",
      get value() {
        return props.rgb.g;
      },
      onChange: handleChange
    }), null);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles().rgbWrap,
          input: styles().rgbInput,
          label: styles().rgbLabel
        };
      },
      label: "b",
      get value() {
        return props.rgb.b;
      },
      onChange: handleChange
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().fields,
        _v$2 = styles().active;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
}

const _tmpl$$m = /*#__PURE__*/web.template(`<div><div><div>`);
function Compact(_props) {
  const props = solidJs.mergeProps({
    colors: ['#4D4D4D', '#999999', '#FFFFFF', '#F44E3B', '#FE9200', '#FCDC00', '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF', '#333333', '#808080', '#cccccc', '#D33115', '#E27300', '#FCC400', '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF', '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00', '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', '#AB149E'],
    styles: {},
    className: ''
  }, _props);
  const {
    colors: currentColors,
    changeColor
  } = useColorPicker();
  const styles = merge$1({
    Compact: {
      background: '#f6f6f6',
      'border-radius': '4px'
    },
    compact: {
      'padding-top': '5px',
      'padding-left': '5px',
      'box-sizing': 'initial',
      width: '240px'
    },
    clear: {
      clear: 'both'
    }
  }, props.styles);
  const handleChange = (data, e) => {
    if (data.hex) {
      isValidHex(data.hex) && changeColor({
        hex: data.hex,
        source: 'hex'
      }, e);
    } else {
      changeColor(data, e);
    }
  };
  return web.createComponent(Raised, {
    get styles() {
      return props.styles;
    },
    get children() {
      const _el$ = _tmpl$$m(),
        _el$2 = _el$.firstChild,
        _el$3 = _el$2.firstChild;
      web.insert(_el$2, web.createComponent(solidJs.For, {
        get each() {
          return props.colors;
        },
        children: c => web.createComponent(CompactColor, {
          color: c,
          get active() {
            return c.toLowerCase() === currentColors().hex;
          },
          onClick: handleChange
        })
      }), _el$3);
      web.insert(_el$, web.createComponent(CompactFields, {
        get hex() {
          return currentColors().hex;
        },
        get rgb() {
          return currentColors().rgb;
        },
        onChange: handleChange
      }), null);
      web.effect(_p$ => {
        const _v$ = styles.compact,
          _v$2 = `compact-picker ${props.className}`,
          _v$3 = styles.clear;
        _p$._v$ = web.style(_el$, _v$, _p$._v$);
        _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
        _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
        return _p$;
      }, {
        _v$: undefined,
        _v$2: undefined,
        _v$3: undefined
      });
      return _el$;
    }
  });
}
var Compact$1 = withColorPicker(Compact);

const _tmpl$$l = /*#__PURE__*/web.template(`<div>`);
function SwatchesColor(_props) {
  const props = solidJs.mergeProps({
    onClick: () => {}
  }, _props);
  const styles = () => {
    const {
      color,
      active,
      first,
      last
    } = props;
    return {
      color: {
        width: '40px',
        height: '24px',
        cursor: 'pointer',
        background: color,
        'margin-bottom': '1px',
        overflow: first || last ? 'hidden' : undefined,
        'border-radius': first ? '2px 2px 0 0' : last ? '0 0 2px 2px' : undefined,
        'box-shadow': color === '#FFFFFF' ? 'inset 0 0 0 1px #ddd' : undefined
      },
      check: {
        color: color === '#FFFFFF' || color === 'transparent' ? '#333' : getContrastingColor(color),
        'margin-left': '8px',
        display: active ? 'block' : 'none',
        margin: '0 auto'
      }
    };
  };
  return web.createComponent(Swatch, {
    get color() {
      return props.color;
    },
    get styles() {
      return styles().color;
    },
    get onClick() {
      return props.onClick;
    },
    get focusStyle() {
      return {
        'box-shadow': `0 0 4px ${props.color}`
      };
    },
    get children() {
      const _el$ = _tmpl$$l();
      web.insert(_el$, web.createComponent(CheckIcon, {
        width: "24",
        height: "24",
        fill: "white",
        stroke: "white"
      }));
      web.effect(_$p => web.style(_el$, styles().check, _$p));
      return _el$;
    }
  });
}

const _tmpl$$k = /*#__PURE__*/web.template(`<div>`);
function SwatchesGroup(_props) {
  const props = solidJs.mergeProps({}, _props);
  const styles = {
    group: {
      'padding-bottom': '10px',
      width: '40px',
      float: 'left',
      'margin-right': '10px'
    }
  };
  return (() => {
    const _el$ = _tmpl$$k();
    web.insert(_el$, web.createComponent(solidJs.For, {
      get each() {
        return props.group;
      },
      children: (color, i) => web.createComponent(SwatchesColor, {
        color: color,
        get active() {
          return color.toLowerCase() === props.active;
        },
        get first() {
          return i() === 0;
        },
        get last() {
          return i() === props.group.length - 1;
        },
        get onClick() {
          return props.onClick;
        }
      })
    }));
    web.effect(_$p => web.style(_el$, styles.group, _$p));
    return _el$;
  })();
}

const _tmpl$$j = /*#__PURE__*/web.template(`<div><div><div>`),
  _tmpl$2$2 = /*#__PURE__*/web.template(`<div>`);
function Swatches(_props) {
  const props = solidJs.mergeProps({
    width: 320,
    height: 240,
    colors: [['#B71C1C', '#D32F2F', '#F44336', '#E57373', '#FFCDD2'], ['#880E4F', '#C2185B', '#E91E63', '#F06292', '#F8BBD0'], ['#4A148C', '#7B1FA2', '#9C27B0', '#BA68C8', '#E1BEE7'], ['#311B92', '#512DA8', '#673AB7', '#9575CD', '#D1C4E9'], ['#1A237E', '#303F9F', '#3F51B5', '#7986CB', '#C5CAE9'], ['#0D47A1', '#1976D2', '#2196F3', '#64B5F6', '#BBDEFB'], ['#01579B', '#0288D1', '#03A9F4', '#4FC3F7', '#B3E5FC'], ['#006064', '#0097A7', '#00BCD4', '#4DD0E1', '#B2EBF2'], ['#004D40', '#00796B', '#009688', '#4DB6AC', '#B2DFDB'], ['#1B5E20', '#388E3C', '#4CAF50', '#81C784', '#C8E6C9'], ['#33691E', '#689F38', '#8BC34A', '#AED581', '#DCEDC8'], ['#827717', '#AFB42B', '#CDDC39', '#DCE775', '#F0F4C3'], ['#F57F17', '#FBC02D', '#FFEB3B', '#FFF176', '#FFF9C4'], ['#FF6F00', '#FFA000', '#FFC107', '#FFD54F', '#FFECB3'], ['#E65100', '#F57C00', '#FF9800', '#FFB74D', '#FFE0B2'], ['#BF360C', '#E64A19', '#FF5722', '#FF8A65', '#FFCCBC'], ['#3E2723', '#5D4037', '#795548', '#A1887F', '#D7CCC8'], ['#263238', '#455A64', '#607D8B', '#90A4AE', '#CFD8DC'], ['#000000', '#525252', '#969696', '#D9D9D9', '#FFFFFF']],
    styles: {},
    className: ''
  }, _props);
  const {
    colors: currentColors,
    changeColor
  } = useColorPicker();
  const styles = () => {
    const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    const height = typeof props.height === 'number' ? `${props.height}px` : props.height;
    return merge$1({
      picker: {
        width,
        height
      },
      overflow: {
        height,
        'overflow-y': 'scroll'
      },
      body: {
        padding: '16px 0 6px 16px'
      },
      clear: {
        clear: 'both'
      }
    }, props.styles);
  };
  const handleChange = (data, e) => changeColor({
    hex: data,
    source: 'hex'
  }, e);
  return (() => {
    const _el$ = _tmpl$2$2();
    web.insert(_el$, web.createComponent(Raised, {
      get children() {
        const _el$2 = _tmpl$$j(),
          _el$3 = _el$2.firstChild,
          _el$4 = _el$3.firstChild;
        web.insert(_el$3, web.createComponent(solidJs.For, {
          get each() {
            return props.colors;
          },
          children: group => web.createComponent(SwatchesGroup, {
            group: group,
            get active() {
              return currentColors().hex;
            },
            onClick: handleChange
          })
        }), _el$4);
        web.effect(_p$ => {
          const _v$ = styles().overflow,
            _v$2 = styles().body,
            _v$3 = styles().clear;
          _p$._v$ = web.style(_el$2, _v$, _p$._v$);
          _p$._v$2 = web.style(_el$3, _v$2, _p$._v$2);
          _p$._v$3 = web.style(_el$4, _v$3, _p$._v$3);
          return _p$;
        }, {
          _v$: undefined,
          _v$2: undefined,
          _v$3: undefined
        });
        return _el$2;
      }
    }));
    web.effect(_p$ => {
      const _v$4 = styles().picker,
        _v$5 = `swatches-picker ${props.className}`;
      _p$._v$4 = web.style(_el$, _v$4, _p$._v$4);
      _v$5 !== _p$._v$5 && web.className(_el$, _p$._v$5 = _v$5);
      return _p$;
    }, {
      _v$4: undefined,
      _v$5: undefined
    });
    return _el$;
  })();
}
var Swatches$1 = withColorPicker(Swatches);

const _tmpl$$i = /*#__PURE__*/web.template(`<div><div>`);
const CircleSwatch = _props => {
  const props = solidJs.mergeProps({
    circleSize: 28,
    circleSpacing: 14
  }, _props);
  const [hover, setHover] = solidJs.createSignal(false);
  const styles = () => {
    const {
      circleSize,
      circleSpacing,
      color,
      active
    } = props;
    return {
      swatch: {
        width: `${circleSize}px`,
        height: `${circleSize}px`,
        'margin-right': `${circleSpacing}px`,
        'margin-bottom': `${circleSpacing}px`,
        transform: 'scale(1)',
        transition: '100ms transform ease'
      },
      Swatch: {
        'border-radius': '50%',
        background: 'transparent',
        'box-shadow': active ? `inset 0 0 0 3px ${color}` : `inset 0 0 0 ${circleSize / 2 + 1}px ${color}`,
        transition: '100ms box-shadow ease',
        transform: hover() ? 'scale(1.2)' : undefined
      }
    };
  };
  return (() => {
    const _el$ = _tmpl$$i(),
      _el$2 = _el$.firstChild;
    _el$.$$mouseout = () => setHover(false);
    _el$.$$mouseover = () => setHover(true);
    web.insert(_el$2, web.createComponent(Swatch, {
      get styles() {
        return styles().Swatch;
      },
      get color() {
        return props.color;
      },
      get onClick() {
        return props.onClick;
      },
      get focusStyle() {
        return {
          'box-shadow': `${styles().Swatch.boxShadow}, 0 0 5px ${props.color}`
        };
      }
    }));
    web.effect(_$p => web.style(_el$2, styles().swatch, _$p));
    return _el$;
  })();
};
var CircleSwatch$1 = CircleSwatch;
web.delegateEvents(["mouseover", "mouseout"]);

const _tmpl$$h = /*#__PURE__*/web.template(`<div>`);
function Circle(_props) {
  const props = solidJs.mergeProps({
    width: 252,
    colors: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B'],
    circleSize: 28,
    styles: {},
    circleSpacing: 14,
    className: ''
  }, _props);
  const {
    colors: currentColors,
    changeColor
  } = useColorPicker();
  const styles = () => {
    const {
      width,
      circleSpacing,
      styles
    } = props;
    return merge$1({
      card: {
        width: `${width}px`,
        display: 'flex',
        'flex-wrap': 'wrap',
        'margin-right': `${-circleSpacing}px`,
        'margin-bottom': `${-circleSpacing}px`
      }
    }, styles);
  };
  const handleChange = (hexCode, e) => changeColor({
    hex: hexCode,
    source: 'hex'
  }, e);
  return (() => {
    const _el$ = _tmpl$$h();
    web.insert(_el$, web.createComponent(solidJs.For, {
      get each() {
        return props.colors;
      },
      children: c => web.createComponent(CircleSwatch$1, {
        color: c,
        onClick: handleChange,
        get active() {
          return currentColors().hex === c.toLowerCase();
        },
        get circleSize() {
          return props.circleSize;
        },
        get circleSpacing() {
          return props.circleSpacing;
        }
      })
    }));
    web.effect(_p$ => {
      const _v$ = styles().card,
        _v$2 = `circle-picker ${props.className}`;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
}
var Circle$1 = withColorPicker(Circle);

const _tmpl$$g = /*#__PURE__*/web.template(`<div class="flexbox-fix"><div><div></div><div><div></div><div></div><div>`);
function GoogleFields(_props) {
  const props = solidJs.mergeProps({}, _props);
  const [rgbValue, setRgbValue] = solidJs.createSignal('');
  const [hslValue, setHslValue] = solidJs.createSignal('');
  const [hsvValue, setHsvValue] = solidJs.createSignal('');
  solidJs.createEffect(() => {
    setRgbValue(`${props.rgb.r}, ${props.rgb.g}, ${props.rgb.b}`);
    setHslValue(`${Math.round(props.hsl.h)}°, ${Math.round(props.hsl.s * 100)}%, ${Math.round(props.hsl.l * 100)}%`);
    setHsvValue(`${Math.round(props.hsv.h)}°, ${Math.round(props.hsv.s * 100)}%, ${Math.round(props.hsv.v * 100)}%`);
  }, [props.rgb, props.hsl, props.hsv]);
  const handleChange = (data, e) => {
    if (data.hex) {
      isValidHex(data.hex) && props.onChange({
        hex: data.hex,
        source: 'hex'
      }, e);
    } else if (data.rgb) {
      const values = data.rgb.split(',');
      isvalidColorString(data.rgb, 'rgb') && props.onChange({
        r: values[0],
        g: values[1],
        b: values[2],
        a: 1,
        source: 'rgb'
      }, e);
    } else if (data.hsv) {
      const values = data.hsv.split(',');
      if (isvalidColorString(data.hsv, 'hsv')) {
        values[2] = values[2].replace('%', '');
        values[1] = values[1].replace('%', '');
        values[0] = values[0].replace('°', '');
        if (values[1] == 1) {
          values[1] = 0.01;
        } else if (values[2] == 1) {
          values[2] = 0.01;
        }
        props.onChange({
          h: Number(values[0]),
          s: Number(values[1]),
          v: Number(values[2]),
          source: 'hsv'
        }, e);
      }
    } else if (data.hsl) {
      const values = data.hsl.split(',');
      if (isvalidColorString(data.hsl, 'hsl')) {
        values[2] = values[2].replace('%', '');
        values[1] = values[1].replace('%', '');
        values[0] = values[0].replace('°', '');
        // @ts-ignore
        if (props.hsvValue[1] == 1) {
          // @ts-ignore
          hsvValue[1] = 0.01;
          // @ts-ignore
        } else if (hsvValue[2] == 1) {
          // @ts-ignore
          hsvValue[2] = 0.01;
        }
        props.onChange({
          h: Number(values[0]),
          s: Number(values[1]),
          v: Number(values[2]),
          source: 'hsl'
        }, e);
      }
    }
  };
  const styles = {
    wrap: {
      display: 'flex',
      height: '100px',
      'margin-top': '4px'
    },
    fields: {
      width: '100%'
    },
    column: {
      'padding-top': '10px',
      display: 'flex',
      'justify-content': 'space-between'
    },
    double: {
      padding: '0px 4.4px',
      'box-sizing': 'border-box'
    },
    input: {
      width: '100%',
      height: '38px',
      'box-sizing': 'border-box',
      padding: '4px 10% 3px',
      'text-align': 'center',
      border: '1px solid #dadce0',
      'font-size': '11px',
      'text-transform': 'lowercase',
      'border-radius': '5px',
      outline: 'none',
      'font-family': 'Roboto,Arial,sans-serif'
    },
    input2: {
      height: '38px',
      width: '100%',
      border: '1px solid #dadce0',
      'box-sizing': 'border-box',
      'font-size': '11px',
      'text-transform': 'lowercase',
      'border-radius': '5px',
      outline: 'none',
      'padding-left': '10px',
      'font-family': 'Roboto,Arial,sans-serif'
    },
    label: {
      'text-align': 'center',
      'font-size': '12px',
      background: '#fff',
      position: 'absolute',
      'text-transform': 'uppercase',
      color: '#3c4043',
      width: '35px',
      top: '-6px',
      left: '0',
      right: '0',
      'margin-left': 'auto',
      'margin-right': 'auto',
      'font-family': 'Roboto,Arial,sans-serif'
    },
    label2: {
      left: '10px',
      'text-align': 'center',
      'font-size': '12px',
      background: '#fff',
      position: 'absolute',
      'text-transform': 'uppercase',
      color: '#3c4043',
      width: '32px',
      top: '-6px',
      'font-family': 'Roboto,Arial,sans-serif'
    },
    single: {
      'flex-grow': 1,
      margin: '0px 4.4px'
    }
  };
  return (() => {
    const _el$ = _tmpl$$g(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.firstChild,
      _el$6 = _el$5.nextSibling,
      _el$7 = _el$6.nextSibling;
    web.insert(_el$3, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles.input,
          label: styles.label
        };
      },
      label: "hex",
      get value() {
        return props.hex;
      },
      onChange: handleChange
    }));
    web.insert(_el$5, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles.input2,
          label: styles.label2
        };
      },
      label: "rgb",
      get value() {
        return rgbValue();
      },
      onChange: handleChange
    }));
    web.insert(_el$6, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles.input2,
          label: styles.label2
        };
      },
      label: "hsv",
      get value() {
        return hsvValue();
      },
      onChange: handleChange
    }));
    web.insert(_el$7, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles.input2,
          label: styles.label2
        };
      },
      label: "hsl",
      get value() {
        return hslValue();
      },
      onChange: handleChange
    }));
    web.effect(_p$ => {
      const _v$ = styles.wrap,
        _v$2 = styles.fields,
        _v$3 = styles.double,
        _v$4 = styles.column,
        _v$5 = styles.single,
        _v$6 = styles.single,
        _v$7 = styles.single;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$4, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$5, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$6, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$7, _v$7, _p$._v$7);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined
    });
    return _el$;
  })();
}

const _tmpl$$f = /*#__PURE__*/web.template(`<div>`);
function GooglePointer(_props) {
  const props = solidJs.mergeProps({
    hsl: {
      a: 1,
      h: 249.94,
      l: 0.2,
      s: 0.5
    }
  }, _props);
  return (() => {
    const _el$ = _tmpl$$f();
    _el$.style.setProperty("width", "20px");
    _el$.style.setProperty("height", "20px");
    _el$.style.setProperty("border-radius", "22px");
    _el$.style.setProperty("transform", "translate(-10px, -7px)");
    _el$.style.setProperty("border", "2px white solid");
    web.effect(() => `hsl(${Math.round(props.hsl.h)}, 100%, 50%)` != null ? _el$.style.setProperty("background", `hsl(${Math.round(props.hsl.h)}, 100%, 50%)`) : _el$.style.removeProperty("background"));
    return _el$;
  })();
}

const _tmpl$$e = /*#__PURE__*/web.template(`<div>`);
function GooglePointerCircle(_props) {
  const props = solidJs.mergeProps({
    hsl: {
      a: 1,
      h: 249.94,
      l: 0.2,
      s: 0.5
    }
  }, _props);
  return (() => {
    const _el$ = _tmpl$$e();
    _el$.style.setProperty("width", "20px");
    _el$.style.setProperty("height", "20px");
    _el$.style.setProperty("border-radius", "22px");
    _el$.style.setProperty("border", "2px #fff solid");
    _el$.style.setProperty("transform", "translate(-12px, -13px)");
    web.effect(() => `hsl(${Math.round(props.hsl.h)}, ${Math.round(props.hsl.s * 100)}%, ${Math.round(props.hsl.l * 100)}%)` != null ? _el$.style.setProperty("background", `hsl(${Math.round(props.hsl.h)}, ${Math.round(props.hsl.s * 100)}%, ${Math.round(props.hsl.l * 100)}%)`) : _el$.style.removeProperty("background"));
    return _el$;
  })();
}

const _tmpl$$d = /*#__PURE__*/web.template(`<div><div></div><div></div><div></div><div><div class="flexbox-fix"><div>`);
function Google(_props) {
  const props = solidJs.mergeProps({
    width: 652,
    header: 'Color picker',
    styles: {},
    className: ''
  }, _props);
  const {
    colors,
    changeColor
  } = useColorPicker();
  const styles = () => {
    const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    return merge$1({
      picker: {
        width,
        background: '#fff',
        border: '1px solid #dfe1e5',
        'box-sizing': 'initial',
        display: 'flex',
        'flex-wrap': 'wrap',
        'border-radius': '8px 8px 0px 0px'
      },
      head: {
        height: '57px',
        width: '100%',
        'padding-top': '16px',
        'padding-bottom': '16px',
        'padding-left': '16px',
        'font-size': '20px',
        'box-sizing': 'border-box',
        'font-family': 'Roboto-Regular,HelveticaNeue,Arial,sans-serif'
      },
      saturation: {
        width: '70%',
        padding: '0px',
        position: 'relative',
        overflow: 'hidden'
      },
      swatch: {
        width: '30%',
        height: '228px',
        padding: '0px',
        background: `rgba(${colors().rgb.r}, ${colors().rgb.g}, ${colors().rgb.b}, 1)`,
        position: 'relative',
        overflow: 'hidden'
      },
      body: {
        margin: 'auto',
        width: '95%'
      },
      controls: {
        display: 'flex',
        'box-sizing': 'border-box',
        height: '52px',
        'padding-top': '22px'
      },
      color: {
        width: '32px'
      },
      hue: {
        height: '8px',
        position: 'relative',
        margin: '0px 16px 0px 16px',
        width: '100%'
      },
      Hue: {
        'border-radius': '2px'
      }
    }, props.styles);
  };
  return (() => {
    const _el$ = _tmpl$$d(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$5.firstChild,
      _el$7 = _el$6.firstChild;
    web.insert(_el$2, () => props.header);
    web.insert(_el$4, web.createComponent(Saturation, {
      get hsl() {
        return colors().hsl;
      },
      get hsv() {
        return colors().hsv;
      },
      get pointer() {
        return web.createComponent(GooglePointerCircle, {
          get hsl() {
            return colors().hsl;
          }
        });
      },
      onChange: changeColor
    }));
    web.insert(_el$7, web.createComponent(Hue$1, {
      get styles() {
        return styles().Hue;
      },
      get hsl() {
        return colors().hsl;
      },
      radius: "4px",
      pointer: GooglePointer,
      onChange: changeColor
    }));
    web.insert(_el$5, web.createComponent(GoogleFields, {
      get rgb() {
        return colors().rgb;
      },
      get hsl() {
        return colors().hsl;
      },
      get hex() {
        return colors().hex;
      },
      get hsv() {
        return colors().hsv;
      },
      onChange: changeColor
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().picker,
        _v$2 = `google-picker ${props.className}`,
        _v$3 = styles().head,
        _v$4 = styles().swatch,
        _v$5 = styles().saturation,
        _v$6 = styles().body,
        _v$7 = styles().controls,
        _v$8 = styles().hue;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$4, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$5, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$6, _v$7, _p$._v$7);
      _p$._v$8 = web.style(_el$7, _v$8, _p$._v$8);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined,
      _v$8: undefined
    });
    return _el$;
  })();
}
var Google$1 = withColorPicker(Google);

const _tmpl$$c = /*#__PURE__*/web.template(`<div class="flexbox-fix"><div>`),
  _tmpl$2$1 = /*#__PURE__*/web.template(`<div class="flexbox-fix"><div></div><div></div><div></div><div>`),
  _tmpl$3 = /*#__PURE__*/web.template(`<div class="flexbox-fix"><div><div>`);
function ChromeFields(_props) {
  const props = solidJs.mergeProps({
    view: 'hex'
  }, _props);
  const [view, setView] = solidJs.createSignal(props.view);
  solidJs.createEffect(() => {
    if (props.hsl.a !== 1 && view() === 'hex') {
      setView('rgb');
    }
  }, []);
  solidJs.createEffect(() => {
    if (props.hsl.a !== 1 && view() === 'hex') {
      setView('rgb');
    }
  }, [props]);
  function toggleViews() {
    if (view() === 'hex') {
      setView('rgb');
    } else if (view() === 'rgb') {
      setView('hsl');
    } else if (view() === 'hsl') {
      if (props.hsl.a === 1) {
        setView('hex');
      } else {
        setView('rgb');
      }
    }
  }
  function handleChange(data, e) {
    if (data.hex) {
      isValidHex(data.hex) && props.onChange({
        hex: data.hex,
        source: 'hex'
      }, e);
    } else if (data.r || data.g || data.b) {
      props.onChange({
        r: data.r || props.rgb.r,
        g: data.g || props.rgb.g,
        b: data.b || props.rgb.b,
        source: 'rgb'
      }, e);
    } else if (data.a) {
      if (data.a < 0) {
        data.a = 0;
      } else if (data.a > 1) {
        data.a = 1;
      }
      props.onChange({
        h: props.hsl.h,
        s: props.hsl.s,
        l: props.hsl.l,
        a: Math.round(data.a * 100) / 100,
        source: 'rgb'
      }, e);
    } else if (data.h || data.s || data.l) {
      // Remove any occurances of '%'.
      if (typeof data.s === 'string' && data.s.includes('%')) {
        data.s = data.s.replace('%', '');
      }
      if (typeof data.l === 'string' && data.l.includes('%')) {
        data.l = data.l.replace('%', '');
      }

      // We store HSL as a unit interval so we need to override the 1 input to 0.01
      if (data.s == 1) {
        data.s = 0.01;
      } else if (data.l == 1) {
        data.l = 0.01;
      }
      props.onChange({
        h: data.h || props.hsl.h,
        s: Number(data.s !== undefined ? data.s : props.hsl.s),
        l: Number(data.l !== undefined ? data.l : props.hsl.l),
        source: 'hsl'
      }, e);
    }
  }
  function showHighlight(e) {
    e.currentTarget.style.backgroundColor = '#eee';
  }
  function hideHighlight(e) {
    e.currentTarget.style.backgroundColor = 'transparent';
  }
  const styles = () => {
    return {
      wrap: {
        'padding-top': '16px',
        display: 'flex'
      },
      fields: {
        flex: '1',
        display: 'flex',
        'margin-left': '-6px'
      },
      field: {
        'padding-left': '6px',
        width: '100%'
      },
      alpha: {
        'padding-left': '6px',
        width: '100%',
        display: props.disableAlpha ? 'none' : undefined
      },
      toggle: {
        width: '32px',
        'text-align': 'right',
        position: 'relative'
      },
      icon: {
        'margin-right': '-4px',
        'margin-top': '12px',
        cursor: 'pointer',
        position: 'relative'
      },
      iconHighlight: {
        position: 'absolute',
        width: '24px',
        height: '28px',
        background: '#eee',
        'border-radius': '4px',
        top: '10px',
        left: '12px',
        display: 'none'
      },
      input: {
        'font-size': '11px',
        color: '#333',
        width: '100%',
        'border-radius': '2px',
        border: 'none',
        'box-shadow': 'inset 0 0 0 1px #dadada',
        height: '21px',
        'text-align': 'center'
      },
      label: {
        'text-transform': 'uppercase',
        'font-size': '11px',
        'line-height': '11px',
        color: '#969696',
        'text-align': 'center',
        display: 'block',
        'margin-top': '12px'
      },
      svg: {
        fill: '#333',
        width: '24px',
        height: '24px',
        border: '1px transparent solid',
        'border-radius': '5px'
      }
    };
  };
  return (() => {
    const _el$ = _tmpl$3(),
      _el$14 = _el$.firstChild,
      _el$15 = _el$14.firstChild;
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return view() == 'hex';
      },
      get children() {
        const _el$2 = _tmpl$$c(),
          _el$3 = _el$2.firstChild;
        web.insert(_el$3, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "hex",
          get value() {
            return props.hex;
          },
          onChange: handleChange
        }));
        web.effect(_p$ => {
          const _v$ = styles().fields,
            _v$2 = styles().field;
          _p$._v$ = web.style(_el$2, _v$, _p$._v$);
          _p$._v$2 = web.style(_el$3, _v$2, _p$._v$2);
          return _p$;
        }, {
          _v$: undefined,
          _v$2: undefined
        });
        return _el$2;
      }
    }), _el$14);
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return view() == 'rgb';
      },
      get children() {
        const _el$4 = _tmpl$2$1(),
          _el$5 = _el$4.firstChild,
          _el$6 = _el$5.nextSibling,
          _el$7 = _el$6.nextSibling,
          _el$8 = _el$7.nextSibling;
        web.insert(_el$5, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "r",
          get value() {
            return props.rgb.r;
          },
          onChange: handleChange
        }));
        web.insert(_el$6, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "g",
          get value() {
            return props.rgb.g;
          },
          onChange: handleChange
        }));
        web.insert(_el$7, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "b",
          get value() {
            return props.rgb.b;
          },
          onChange: handleChange
        }));
        web.insert(_el$8, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "a",
          get value() {
            return props.rgb.a;
          },
          arrowOffset: 0.01,
          onChange: handleChange
        }));
        web.effect(_p$ => {
          const _v$3 = styles().fields,
            _v$4 = styles().field,
            _v$5 = styles().field,
            _v$6 = styles().field,
            _v$7 = styles().alpha;
          _p$._v$3 = web.style(_el$4, _v$3, _p$._v$3);
          _p$._v$4 = web.style(_el$5, _v$4, _p$._v$4);
          _p$._v$5 = web.style(_el$6, _v$5, _p$._v$5);
          _p$._v$6 = web.style(_el$7, _v$6, _p$._v$6);
          _p$._v$7 = web.style(_el$8, _v$7, _p$._v$7);
          return _p$;
        }, {
          _v$3: undefined,
          _v$4: undefined,
          _v$5: undefined,
          _v$6: undefined,
          _v$7: undefined
        });
        return _el$4;
      }
    }), _el$14);
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return view() == 'hsl';
      },
      get children() {
        const _el$9 = _tmpl$2$1(),
          _el$10 = _el$9.firstChild,
          _el$11 = _el$10.nextSibling,
          _el$12 = _el$11.nextSibling,
          _el$13 = _el$12.nextSibling;
        web.insert(_el$10, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "h",
          get value() {
            return Math.round(props.hsl.h);
          },
          onChange: handleChange
        }));
        web.insert(_el$11, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "s",
          get value() {
            return `${Math.round(props.hsl.s * 100)}%`;
          },
          onChange: handleChange
        }));
        web.insert(_el$12, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "l",
          get value() {
            return `${Math.round(props.hsl.l * 100)}%`;
          },
          onChange: handleChange
        }));
        web.insert(_el$13, web.createComponent(EditableInput, {
          get styles() {
            return {
              input: styles().input,
              label: styles().label
            };
          },
          label: "a",
          get value() {
            return props.hsl.a;
          },
          arrowOffset: 0.01,
          onChange: handleChange
        }));
        web.effect(_p$ => {
          const _v$8 = styles().fields,
            _v$9 = styles().field,
            _v$10 = styles().field,
            _v$11 = styles().field,
            _v$12 = styles().alpha;
          _p$._v$8 = web.style(_el$9, _v$8, _p$._v$8);
          _p$._v$9 = web.style(_el$10, _v$9, _p$._v$9);
          _p$._v$10 = web.style(_el$11, _v$10, _p$._v$10);
          _p$._v$11 = web.style(_el$12, _v$11, _p$._v$11);
          _p$._v$12 = web.style(_el$13, _v$12, _p$._v$12);
          return _p$;
        }, {
          _v$8: undefined,
          _v$9: undefined,
          _v$10: undefined,
          _v$11: undefined,
          _v$12: undefined
        });
        return _el$9;
      }
    }), _el$14);
    _el$15.$$click = toggleViews;
    web.insert(_el$15, web.createComponent(UnfoldMoreHorizontalIcon, {
      width: "24",
      height: "24",
      onMouseOver: showHighlight,
      onMouseEnter: showHighlight,
      onMouseOut: hideHighlight
    }));
    web.effect(_p$ => {
      const _v$13 = styles().wrap,
        _v$14 = styles().toggle,
        _v$15 = styles().icon;
      _p$._v$13 = web.style(_el$, _v$13, _p$._v$13);
      _p$._v$14 = web.style(_el$14, _v$14, _p$._v$14);
      _p$._v$15 = web.style(_el$15, _v$15, _p$._v$15);
      return _p$;
    }, {
      _v$13: undefined,
      _v$14: undefined,
      _v$15: undefined
    });
    return _el$;
  })();
}
web.delegateEvents(["click"]);

const _tmpl$$b = /*#__PURE__*/web.template(`<div>`);
function ChromePointer() {
  return (() => {
    const _el$ = _tmpl$$b();
    _el$.style.setProperty("width", "12px");
    _el$.style.setProperty("height", "12px");
    _el$.style.setProperty("border-radius", "6px");
    _el$.style.setProperty("transform", "translate(-6px, -1px)");
    _el$.style.setProperty("background-color", "rgb(248, 248, 248)");
    _el$.style.setProperty("box-shadow", "0 1px 4px 0 rgba(0, 0, 0, 0.37)");
    return _el$;
  })();
}

const _tmpl$$a = /*#__PURE__*/web.template(`<div>`);
function ChromePointerCircle() {
  return (() => {
    const _el$ = _tmpl$$a();
    _el$.style.setProperty("width", "12px");
    _el$.style.setProperty("height", "12px");
    _el$.style.setProperty("border-radius", "6px");
    _el$.style.setProperty("box-shadow", "inset 0 0 0 1px #fff");
    _el$.style.setProperty("transform", "translate(-6px, -6px)");
    return _el$;
  })();
}

const _tmpl$$9 = /*#__PURE__*/web.template(`<div><div></div><div><div class="flexbox-fix"><div><div><div></div></div></div><div><div></div><div>`);
const Chrome = _props => {
  const props = solidJs.mergeProps({
    width: 225,
    disableAlpha: false,
    styles: {},
    className: ''
  }, _props);
  const {
    colors,
    changeColor
  } = useColorPicker();
  const styles = () => {
    const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    return merge$1({
      picker: {
        width,
        background: '#fff',
        'border-radius': '2px',
        'box-shadow': '0 0 2px rgba(0,0,0,.3), 0 4px 8px rgba(0,0,0,.3)',
        'box-sizing': 'initial',
        'font-family': 'Menlo'
      },
      saturation: {
        width: '100%',
        'padding-bottom': '55%',
        position: 'relative',
        'border-radius': '2px 2px 0 0',
        overflow: 'hidden'
      },
      Saturation: {
        'border-radius': '2px 2px 0 0'
      },
      body: {
        padding: '16px 16px 12px'
      },
      controls: {
        display: 'flex'
      },
      color: {
        width: props.disableAlpha ? '22px' : '32px'
      },
      swatch: {
        'margin-top': props.disableAlpha ? '0px' : '6px',
        width: props.disableAlpha ? '10px' : '16px',
        height: props.disableAlpha ? '10px' : '16px',
        'border-radius': '8px',
        position: 'relative',
        overflow: 'hidden'
      },
      active: {
        position: 'absolute',
        inset: '0px',
        'border-radius': '8px',
        'box-shadow': 'inset 0 0 0 1px rgba(0,0,0,.1)',
        background: `rgba(${colors().rgb.r}, ${colors().rgb.g}, ${colors().rgb.b}, ${colors().rgb.a})`,
        'z-index': 2
      },
      toggles: {
        flex: '1'
      },
      hue: {
        height: '10px',
        position: 'relative',
        'margin-bottom': props.disableAlpha ? '0px' : '8px'
      },
      Hue: {
        'border-radius': '2px'
      },
      alpha: {
        height: '10px',
        position: 'relative',
        display: props.disableAlpha ? 'none' : undefined
      },
      Alpha: {
        'border-radius': '2px'
      }
    }, props.styles);
  };
  return (() => {
    const _el$ = _tmpl$$9(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.firstChild,
      _el$6 = _el$5.firstChild,
      _el$7 = _el$6.firstChild,
      _el$8 = _el$5.nextSibling,
      _el$9 = _el$8.firstChild,
      _el$10 = _el$9.nextSibling;
    web.insert(_el$2, web.createComponent(Saturation, {
      get styles() {
        return styles().Saturation;
      },
      get hsl() {
        return colors().hsl;
      },
      get hsv() {
        return colors().hsv;
      },
      get pointer() {
        return web.createComponent(ChromePointerCircle, {});
      },
      onChange: changeColor
    }));
    web.insert(_el$6, web.createComponent(Checkboard, {
      get renderers() {
        return props.renderers;
      }
    }), null);
    web.insert(_el$9, web.createComponent(Hue$1, {
      get styles() {
        return styles().Hue;
      },
      get hsl() {
        return colors().hsl;
      },
      pointer: ChromePointer,
      onChange: changeColor
    }));
    web.insert(_el$10, web.createComponent(Alpha$1, {
      direction: "horizontal",
      get styles() {
        return styles().Alpha;
      },
      get rgb() {
        return colors().rgb;
      },
      get hsl() {
        return colors().hsl;
      },
      pointer: ChromePointer,
      get renderers() {
        return props.renderers;
      },
      onChange: changeColor
    }));
    web.insert(_el$3, web.createComponent(ChromeFields, {
      get rgb() {
        return colors().rgb;
      },
      get hsl() {
        return colors().hsl;
      },
      get hex() {
        return colors().hex;
      },
      get view() {
        return props.defaultView;
      },
      onChange: changeColor
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().picker,
        _v$2 = `chrome-picker ${props.className}`,
        _v$3 = styles().saturation,
        _v$4 = styles().body,
        _v$5 = styles().controls,
        _v$6 = styles().color,
        _v$7 = styles().swatch,
        _v$8 = styles().active,
        _v$9 = styles().toggles,
        _v$10 = styles().hue,
        _v$11 = styles().alpha;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$4, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$5, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$6, _v$7, _p$._v$7);
      _p$._v$8 = web.style(_el$7, _v$8, _p$._v$8);
      _p$._v$9 = web.style(_el$8, _v$9, _p$._v$9);
      _p$._v$10 = web.style(_el$9, _v$10, _p$._v$10);
      _p$._v$11 = web.style(_el$10, _v$11, _p$._v$11);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined,
      _v$8: undefined,
      _v$9: undefined,
      _v$10: undefined,
      _v$11: undefined
    });
    return _el$;
  })();
};
var Chrome$1 = withColorPicker(Chrome);

const _tmpl$$8 = /*#__PURE__*/web.template(`<div class="flexbox-fix"><div></div><div></div><div></div><div></div><div>`);
const SketchFields = _props => {
  const props = solidJs.mergeProps({
    onChange: () => {}
  }, _props);
  const styles = () => {
    return {
      fields: {
        display: 'flex',
        'padding-top': '4px'
      },
      single: {
        flex: '1',
        'padding-left': '6px'
      },
      alpha: {
        flex: '1',
        'padding-left': '6px',
        display: props.disableAlpha ? 'none' : undefined
      },
      double: {
        flex: '2'
      },
      input: {
        width: '80%',
        padding: '4px 10% 3px',
        border: 'none',
        'box-shadow': 'inset 0 0 0 1px #ccc',
        'font-size': '11px'
      },
      label: {
        display: 'block',
        'text-align': 'center',
        'font-size': '11px',
        color: '#222',
        'padding-top': '3px',
        'padding-bottom': '4px',
        'text-transform': 'capitalize'
      }
    };
  };
  const handleChange = (data, e) => {
    if (typeof data !== 'string' && 'hex' in data) {
      isValidHex(data.hex) && props.onChange({
        hex: data.hex,
        source: 'hex'
      }, e);
    } else if (typeof data !== 'string' && ('r' in data || 'g' in data || 'b' in data)) {
      props.onChange({
        r: data.r || props.rgb.r,
        g: data.g || props.rgb.g,
        b: data.b || props.rgb.b,
        a: props.rgb.a,
        source: 'rgb'
      }, e);
    } else if (typeof data !== 'string' && data.a) {
      if (data.a < 0) {
        data.a = 0;
      } else if (data.a > 100) {
        data.a = 100;
      }
      data.a /= 100;
      props.onChange({
        h: props.hsl.h,
        s: props.hsl.s,
        l: props.hsl.l,
        a: data.a,
        source: 'rgb'
      }, e);
    }
  };
  return (() => {
    const _el$ = _tmpl$$8(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$5.nextSibling;
    web.insert(_el$2, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles().input,
          label: styles().label
        };
      },
      label: "hex",
      get value() {
        return props.hex.replace('#', '');
      },
      onChange: handleChange
    }));
    web.insert(_el$3, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles().input,
          label: styles().label
        };
      },
      label: "r",
      get value() {
        return props.rgb.r;
      },
      onChange: handleChange,
      dragLabel: true,
      dragMax: 255
    }));
    web.insert(_el$4, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles().input,
          label: styles().label
        };
      },
      label: "g",
      get value() {
        return props.rgb.g;
      },
      onChange: handleChange,
      dragLabel: true,
      dragMax: 255
    }));
    web.insert(_el$5, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles().input,
          label: styles().label
        };
      },
      label: "b",
      get value() {
        return props.rgb.b;
      },
      onChange: handleChange,
      dragLabel: true,
      dragMax: 255
    }));
    web.insert(_el$6, web.createComponent(EditableInput, {
      get styles() {
        return {
          input: styles().input,
          label: styles().label
        };
      },
      label: "a",
      get value() {
        return Math.round((props.rgb.a ?? 1) * 100);
      },
      onChange: handleChange,
      dragLabel: true,
      dragMax: 100
    }));
    web.effect(_p$ => {
      const _v$ = styles().fields,
        _v$2 = styles().double,
        _v$3 = styles().single,
        _v$4 = styles().single,
        _v$5 = styles().single,
        _v$6 = styles().alpha;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$4, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$5, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$6, _v$6, _p$._v$6);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined
    });
    return _el$;
  })();
};
var SketchFields$1 = SketchFields;

const _tmpl$$7 = /*#__PURE__*/web.template(`<div class="flexbox-fix">`),
  _tmpl$2 = /*#__PURE__*/web.template(`<div>`);
function SketchPresetColors(_props) {
  const props = solidJs.mergeProps({
    onClick: () => {}
  }, _props);
  const styles = () => {
    return {
      colors: {
        margin: '0 -10px',
        padding: '10px 0 0 10px',
        'border-top': '1px solid #eee',
        display: !props.colors || !props.colors.length ? 'none' : 'flex',
        'flex-wrap': 'wrap',
        position: 'relative'
      },
      swatchWrap: {
        width: '16px',
        height: '16px',
        margin: '0 10px 10px 0'
      },
      swatch: {
        'border-radius': '3px',
        'box-shadow': 'inset 0 0 0 1px rgba(0,0,0,.15)'
      }
    };
  };
  const handleClick = (hex, e) => {
    props.onClick({
      hex,
      source: 'hex'
    }, e);
  };
  return (() => {
    const _el$ = _tmpl$$7();
    web.insert(_el$, web.createComponent(solidJs.For, {
      get each() {
        return props.colors;
      },
      children: colorObjOrString => {
        const c = typeof colorObjOrString === 'string' ? {
          color: colorObjOrString
        } : colorObjOrString;
        return (() => {
          const _el$2 = _tmpl$2();
          web.insert(_el$2, web.createComponent(Swatch, web.mergeProps(c, {
            get styles() {
              return styles().swatch;
            },
            onClick: handleClick,
            get focusStyle() {
              return {
                'box-shadow': `inset 0 0 0 1px rgba(0,0,0,.15), 0 0 4px ${c.color}`
              };
            }
          })));
          web.effect(_$p => web.style(_el$2, styles().swatchWrap, _$p));
          return _el$2;
        })();
      }
    }));
    web.effect(_$p => web.style(_el$, styles().colors, _$p));
    return _el$;
  })();
}

const _tmpl$$6 = /*#__PURE__*/web.template(`<div><div></div><div class="flexbox-fix"><div><div></div><div></div></div><div><div>`);
function Sketch(_props) {
  const props = solidJs.mergeProps({
    width: 200,
    disableAlpha: false,
    presetColors: ['#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0', '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000', '#4A4A4A', '#9B9B9B', '#FFFFFF'],
    styles: {},
    className: ''
  }, _props);
  const {
    colors,
    changeColor
  } = useColorPicker();
  const styles = () => {
    const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    const rgb = colors().rgb;
    return merge$1({
      picker: {
        width,
        padding: '10px 10px 0',
        'box-sizing': 'initial',
        background: '#fff',
        'border-radius': '4px',
        'box-shadow': '0 0 0 1px rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.15)'
      },
      saturation: {
        width: '100%',
        'padding-bottom': '75%',
        position: 'relative',
        overflow: 'hidden'
      },
      Saturation: {
        'border-radius': '3px',
        'box-shadow': 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)'
      },
      controls: {
        display: 'flex'
      },
      sliders: {
        padding: '4px 0',
        flex: '1'
      },
      color: {
        width: '24px',
        height: props.disableAlpha ? '10px' : '24px',
        position: 'relative',
        'margin-top': '4px',
        'margin-left': '4px',
        'border-radius': '3px'
      },
      activeColor: {
        position: 'absolute',
        inset: '0px',
        'border-radius': '2px',
        background: `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`,
        'box-shadow': 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)'
      },
      hue: {
        position: 'relative',
        height: '10px',
        overflow: 'hidden'
      },
      Hue: {
        'border-radius': '2px',
        'box-shadow': 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)'
      },
      alpha: {
        position: 'relative',
        height: '10px',
        'margin-top': '4px',
        overflow: 'hidden',
        display: props.disableAlpha ? 'none' : undefined
      },
      Alpha: {
        'border-radius': '2px',
        'box-shadow': 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)'
      },
      ...props.styles
    }, props.styles);
  };
  return (() => {
    const _el$ = _tmpl$$6(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.firstChild,
      _el$6 = _el$5.nextSibling,
      _el$7 = _el$4.nextSibling,
      _el$8 = _el$7.firstChild;
    web.insert(_el$2, web.createComponent(Saturation, {
      get styles() {
        return styles().Saturation;
      },
      get hsl() {
        return colors().hsl;
      },
      get hsv() {
        return colors().hsv;
      },
      onChange: changeColor
    }));
    web.insert(_el$5, web.createComponent(Hue$1, {
      get styles() {
        return styles().Hue;
      },
      get hsl() {
        return colors().hsl;
      },
      onChange: changeColor
    }));
    web.insert(_el$6, web.createComponent(Alpha$1, {
      direction: "horizontal",
      get styles() {
        return styles().Alpha;
      },
      get rgb() {
        return colors().rgb;
      },
      get hsl() {
        return colors().hsl;
      },
      get renderers() {
        return props.renderers;
      },
      onChange: changeColor
    }));
    web.insert(_el$7, web.createComponent(Checkboard, {}), _el$8);
    web.insert(_el$, web.createComponent(SketchFields$1, {
      get rgb() {
        return colors().rgb;
      },
      get hsl() {
        return colors().hsl;
      },
      get hex() {
        return colors().hex;
      },
      onChange: changeColor,
      get disableAlpha() {
        return props.disableAlpha;
      }
    }), null);
    web.insert(_el$, web.createComponent(SketchPresetColors, {
      get colors() {
        return props.presetColors;
      },
      onClick: changeColor
    }), null);
    web.effect(_p$ => {
      const _v$ = styles().picker,
        _v$2 = `sketch-picker ${props.className}`,
        _v$3 = styles().saturation,
        _v$4 = styles().controls,
        _v$5 = styles().sliders,
        _v$6 = styles().hue,
        _v$7 = styles().alpha,
        _v$8 = styles().color,
        _v$9 = styles().activeColor;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$4, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$5, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$6, _v$7, _p$._v$7);
      _p$._v$8 = web.style(_el$7, _v$8, _p$._v$8);
      _p$._v$9 = web.style(_el$8, _v$9, _p$._v$9);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined,
      _v$8: undefined,
      _v$9: undefined
    });
    return _el$;
  })();
}
var Sketch$1 = withColorPicker(Sketch);

const _tmpl$$5 = /*#__PURE__*/web.template(`<div>`);
function PhotoshopButton(_props) {
  const props = solidJs.mergeProps({}, _props);
  const styles = () => {
    return {
      button: {
        'background-image': 'linear-gradient(-180deg, #FFFFFF 0%, #E6E6E6 100%)',
        border: '1px solid #878787',
        'border-radius': '2px',
        height: '20px',
        'box-shadow': props.active ? '0 0 0 1px #878787' : '0 1px 0 0 #EAEAEA',
        'font-size': '14px',
        color: '#000',
        'line-height': '20px',
        'text-align': 'center',
        'margin-bottom': '10px',
        cursor: 'pointer'
      }
    };
  };
  return (() => {
    const _el$ = _tmpl$$5();
    web.addEventListener(_el$, "click", props.onClick, true);
    web.insert(_el$, () => props.label || props.children);
    web.effect(_$p => web.style(_el$, styles().button, _$p));
    return _el$;
  })();
}
web.delegateEvents(["click"]);

const _tmpl$$4 = /*#__PURE__*/web.template(`<div><div></div><div></div><div><div>°</div><div>%</div><div>%`);
function PhotoshopPicker(_props) {
  const props = solidJs.mergeProps({}, _props);
  const styles = {
    fields: {
      'padding-top': '5px',
      'padding-bottom': '9px',
      width: '80px',
      position: 'relative'
    },
    divider: {
      height: '5px'
    },
    rgbWrap: {
      position: 'relative'
    },
    rgbInput: {
      'margin-left': '40%',
      width: '40%',
      height: '18px',
      border: '1px solid #888888',
      'box-shadow': 'inset 0 1px 1px rgba(0,0,0,.1), 0 1px 0 0 #ECECEC',
      'margin-bottom': '5px',
      'font-size': '13px',
      'padding-left': '3px',
      'margin-right': '10px'
    },
    rgbLabel: {
      left: '0px',
      top: '0px',
      width: '34px',
      'text-transform': 'uppercase',
      'font-size': '13px',
      height: '18px',
      'line-height': '22px',
      position: 'absolute'
    },
    hexWrap: {
      position: 'relative'
    },
    hexInput: {
      'margin-left': '20%',
      width: '80%',
      height: '18px',
      border: '1px solid #888888',
      'box-shadow': 'inset 0 1px 1px rgba(0,0,0,.1), 0 1px 0 0 #ECECEC',
      'margin-bottom': '6px',
      'font-size': '13px',
      'padding-left': '3px'
    },
    hexLabel: {
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '14px',
      'text-transform': 'uppercase',
      'font-size': '13px',
      height: '18px',
      'line-height': '22px'
    },
    fieldSymbols: {
      position: 'absolute',
      top: '5px',
      right: '-7px',
      'font-size': '13px'
    },
    symbol: {
      height: '20px',
      'line-height': '22px',
      'padding-bottom': '7px'
    }
  };
  const handleChange = (data, e) => {
    if (data['#']) {
      isValidHex(data['#']) && props.onChange({
        hex: data['#'],
        source: 'hex'
      }, e);
    } else if (data.r || data.g || data.b) {
      props.onChange({
        r: data.r || props.rgb.r,
        g: data.g || props.rgb.g,
        b: data.b || props.rgb.b,
        source: 'rgb'
      }, e);
    } else if (data.h || data.s || data.v) {
      props.onChange({
        h: data.h || props.hsv.h,
        s: data.s || props.hsv.s,
        v: data.v || props.hsv.v,
        source: 'hsv'
      }, e);
    }
  };
  return (() => {
    const _el$ = _tmpl$$4(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.firstChild,
      _el$6 = _el$5.nextSibling,
      _el$7 = _el$6.nextSibling;
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles.rgbWrap,
          input: styles.rgbInput,
          label: styles.rgbLabel
        };
      },
      label: "h",
      get value() {
        return Math.round(props.hsv.h);
      },
      onChange: handleChange
    }), _el$2);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles.rgbWrap,
          input: styles.rgbInput,
          label: styles.rgbLabel
        };
      },
      label: "s",
      get value() {
        return Math.round(props.hsv.s * 100);
      },
      onChange: handleChange
    }), _el$2);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles.rgbWrap,
          input: styles.rgbInput,
          label: styles.rgbLabel
        };
      },
      label: "v",
      get value() {
        return Math.round(props.hsv.v * 100);
      },
      onChange: handleChange
    }), _el$2);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles.rgbWrap,
          input: styles.rgbInput,
          label: styles.rgbLabel
        };
      },
      label: "r",
      get value() {
        return props.rgb.r;
      },
      onChange: handleChange
    }), _el$3);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles.rgbWrap,
          input: styles.rgbInput,
          label: styles.rgbLabel
        };
      },
      label: "g",
      get value() {
        return props.rgb.g;
      },
      onChange: handleChange
    }), _el$3);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles.rgbWrap,
          input: styles.rgbInput,
          label: styles.rgbLabel
        };
      },
      label: "b",
      get value() {
        return props.rgb.b;
      },
      onChange: handleChange
    }), _el$3);
    web.insert(_el$, web.createComponent(EditableInput, {
      get styles() {
        return {
          wrap: styles.hexWrap,
          input: styles.hexInput,
          label: styles.hexLabel
        };
      },
      label: "#",
      get value() {
        return props.hex.replace('#', '');
      },
      onChange: handleChange
    }), _el$4);
    web.effect(_p$ => {
      const _v$ = styles.fields,
        _v$2 = styles.divider,
        _v$3 = styles.divider,
        _v$4 = styles.fieldSymbols,
        _v$5 = styles.symbol,
        _v$6 = styles.symbol,
        _v$7 = styles.symbol;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$4, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$5, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$6, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$7, _v$7, _p$._v$7);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined
    });
    return _el$;
  })();
}

const _tmpl$$3 = /*#__PURE__*/web.template(`<div><div><div></div></div><div><div>`);
function PhotoshopPointerCircle$1() {
  const triangleStyles = {
    width: 0,
    height: 0,
    'border-style': 'solid',
    'border-width': '4px 0 4px 6px',
    'border-color': 'transparent transparent transparent #fff',
    position: 'absolute',
    top: '1px',
    left: '1px'
  };
  const triangleBorderStyles = {
    width: 0,
    height: 0,
    'border-style': 'solid',
    'border-width': '5px 0 5px 8px',
    'border-color': 'transparent transparent transparent #555'
  };
  const styles = {
    left: {
      ...triangleBorderStyles,
      transform: 'translate(-13px, -4px)'
    },
    leftInside: {
      ...triangleStyles,
      transform: 'translate(-8px, -5px)'
    },
    right: {
      ...triangleBorderStyles,
      transform: 'translate(20px, -14px) rotate(180deg)'
    },
    rightInside: {
      ...triangleStyles,
      transform: 'translate(-8px, -5px)'
    }
  };
  return (() => {
    const _el$ = _tmpl$$3(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$2.nextSibling,
      _el$5 = _el$4.firstChild;
    web.effect(_p$ => {
      const _v$ = styles.pointer,
        _v$2 = styles.left,
        _v$3 = styles.leftInside,
        _v$4 = styles.right,
        _v$5 = styles.rightInside;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$2, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$3, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$4, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$5, _v$5, _p$._v$5);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined
    });
    return _el$;
  })();
}

const _tmpl$$2 = /*#__PURE__*/web.template(`<div>`);
function PhotoshopPointerCircle(_props) {
  const props = solidJs.mergeProps({}, _props);
  return (() => {
    const _el$ = _tmpl$$2();
    _el$.style.setProperty("width", "12px");
    _el$.style.setProperty("height", "12px");
    _el$.style.setProperty("borderRadius", "6px");
    _el$.style.setProperty("transform", "translate(-6px, -6px)");
    web.effect(() => (props.hsl.l > 0.5 ? 'inset 0 0 0 1px #000' : 'inset 0 0 0 1px #fff') != null ? _el$.style.setProperty("boxShadow", props.hsl.l > 0.5 ? 'inset 0 0 0 1px #000' : 'inset 0 0 0 1px #fff') : _el$.style.removeProperty("boxShadow"));
    return _el$;
  })();
}

const _tmpl$$1 = /*#__PURE__*/web.template(`<div><div>new</div><div><div></div><div></div></div><div>current`);
function PhotoshopPreviews(_props) {
  const props = solidJs.mergeProps({}, _props);
  const styles = () => {
    const {
      rgb,
      currentColor
    } = props;
    return {
      swatches: {
        border: '1px solid #B3B3B3',
        'border-bottom': '1px solid #F0F0F0',
        'margin-bottom': '2px',
        'margin-top': '1px'
      },
      new: {
        height: '34px',
        background: `rgb(${rgb.r},${rgb.g}, ${rgb.b})`,
        'box-shadow': 'inset 1px 0 0 #000, inset -1px 0 0 #000, inset 0 1px 0 #000'
      },
      current: {
        height: '34px',
        background: currentColor,
        'box-shadow': 'inset 1px 0 0 #000, inset -1px 0 0 #000, inset 0 -1px 0 #000'
      },
      label: {
        'font-size': '14px',
        color: '#000',
        'text-align': 'center'
      }
    };
  };
  return (() => {
    const _el$ = _tmpl$$1(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$3.nextSibling;
    web.effect(_p$ => {
      const _v$ = styles().label,
        _v$2 = styles().swatches,
        _v$3 = styles().new,
        _v$4 = styles().current,
        _v$5 = styles().label;
      _p$._v$ = web.style(_el$2, _v$, _p$._v$);
      _p$._v$2 = web.style(_el$3, _v$2, _p$._v$2);
      _p$._v$3 = web.style(_el$4, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$5, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$6, _v$5, _p$._v$5);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined
    });
    return _el$;
  })();
}

const _tmpl$ = /*#__PURE__*/web.template(`<div><div></div><div class="flexbox-fix"><div></div><div></div><div><div class="flexbox-fix"><div></div><div>`);
function Photoshop(_props) {
  const props = solidJs.mergeProps({
    header: 'Color Picker',
    styles: {},
    className: ''
  }, _props);
  const {
    colors,
    changeColor
  } = useColorPicker();
  const [currentColor, setCurrentColor] = solidJs.createSignal(colors().hex);
  const styles = merge$1({
    picker: {
      background: '#DCDCDC',
      'border-radius': '4px',
      'box-shadow': '0 0 0 1px rgba(0,0,0,.25), 0 8px 16px rgba(0,0,0,.15)',
      'box-sizing': 'initial',
      width: '513px'
    },
    head: {
      'background-image': 'linear-gradient(-180deg, #F0F0F0 0%, #D4D4D4 100%)',
      'border-bottom': '1px solid #B1B1B1',
      'box-shadow': 'inset 0 1px 0 0 rgba(255,255,255,.2), inset 0 -1px 0 0 rgba(0,0,0,.02)',
      height: '23px',
      'line-height': '24px',
      'border-radius': '4px 4px 0 0',
      'font-size': '13px',
      color: '#4D4D4D',
      'text-align': 'center'
    },
    body: {
      padding: '15px 15px 0',
      display: 'flex'
    },
    saturation: {
      width: '256px',
      height: '256px',
      position: 'relative',
      border: '2px solid #B3B3B3',
      'border-bottom': '2px solid #F0F0F0',
      overflow: 'hidden'
    },
    hue: {
      position: 'relative',
      height: '256px',
      width: '19px',
      'margin-left': '10px',
      border: '2px solid #B3B3B3',
      'border-bottom': '2px solid #F0F0F0'
    },
    controls: {
      width: '180px',
      'margin-left': '10px'
    },
    top: {
      display: 'flex'
    },
    previews: {
      width: '60px'
    },
    actions: {
      flex: '1',
      'margin-left': '20px'
    }
  }, props.styles);
  function handleAccept() {
    props.onAccept && props.onAccept();
    setCurrentColor(colors().hex);
  }
  return (() => {
    const _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$5.nextSibling,
      _el$7 = _el$6.firstChild,
      _el$8 = _el$7.firstChild,
      _el$9 = _el$8.nextSibling;
    web.insert(_el$2, () => props.header);
    web.insert(_el$4, web.createComponent(Saturation, {
      get hsl() {
        return colors().hsl;
      },
      get hsv() {
        return colors().hsv;
      },
      get pointer() {
        return web.createComponent(PhotoshopPointerCircle, {
          get hsl() {
            return colors().hsl;
          }
        });
      },
      onChange: changeColor
    }));
    web.insert(_el$5, web.createComponent(Hue$1, {
      direction: "vertical",
      get hsl() {
        return colors().hsl;
      },
      pointer: PhotoshopPointerCircle$1,
      onChange: changeColor
    }));
    web.insert(_el$8, web.createComponent(PhotoshopPreviews, {
      get rgb() {
        return colors().rgb;
      },
      get currentColor() {
        return currentColor();
      }
    }));
    web.insert(_el$9, web.createComponent(PhotoshopButton, {
      label: "OK",
      onClick: handleAccept,
      active: true
    }), null);
    web.insert(_el$9, web.createComponent(PhotoshopButton, {
      label: "Cancel",
      get onClick() {
        return props.onCancel;
      }
    }), null);
    web.insert(_el$9, web.createComponent(PhotoshopPicker, {
      onChange: changeColor,
      get rgb() {
        return colors().rgb;
      },
      get hsv() {
        return colors().hsv;
      },
      get hex() {
        return colors().hex;
      }
    }), null);
    web.effect(_p$ => {
      const _v$ = styles.picker,
        _v$2 = `photoshop-picker ${props.className}`,
        _v$3 = styles.head,
        _v$4 = styles.body,
        _v$5 = styles.saturation,
        _v$6 = styles.hue,
        _v$7 = styles.controls,
        _v$8 = styles.top,
        _v$9 = styles.previews,
        _v$10 = styles.actions;
      _p$._v$ = web.style(_el$, _v$, _p$._v$);
      _v$2 !== _p$._v$2 && web.className(_el$, _p$._v$2 = _v$2);
      _p$._v$3 = web.style(_el$2, _v$3, _p$._v$3);
      _p$._v$4 = web.style(_el$3, _v$4, _p$._v$4);
      _p$._v$5 = web.style(_el$4, _v$5, _p$._v$5);
      _p$._v$6 = web.style(_el$5, _v$6, _p$._v$6);
      _p$._v$7 = web.style(_el$6, _v$7, _p$._v$7);
      _p$._v$8 = web.style(_el$7, _v$8, _p$._v$8);
      _p$._v$9 = web.style(_el$8, _v$9, _p$._v$9);
      _p$._v$10 = web.style(_el$9, _v$10, _p$._v$10);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined,
      _v$8: undefined,
      _v$9: undefined,
      _v$10: undefined
    });
    return _el$;
  })();
}
var Photoshop$1 = withColorPicker(Photoshop);

exports.AlphaPicker = Alpha;
exports.BlockPicker = Block$1;
exports.ChromePicker = Chrome$1;
exports.CirclePicker = Circle$1;
exports.CompactPicker = Compact$1;
exports.GithubPicker = Github$1;
exports.GooglePicker = Google$1;
exports.HuePicker = Hue;
exports.MaterialPicker = Material$1;
exports.PhotoshopPicker = Photoshop$1;
exports.SketchPicker = Sketch$1;
exports.SliderPicker = Slider$1;
exports.SwatchesPicker = Swatches$1;
exports.TwitterPicker = Twitter$1;
//# sourceMappingURL=index.js.map
