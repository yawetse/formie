(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * formie
 * http://github.amexpub.com/modules/formie
 *
 * Copyright (c) 2013 AmexPub. All rights reserved.
 */

'use strict';

module.exports = require('./lib/formie');

},{"./lib/formie":2}],2:[function(require,module,exports){
/*
 * formie
 * http://github.com/yawetse/formie
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */
'use strict';

var async = require('async'),
	// classie = require('classie'),
	events = require('events'),
	Forbject = require('forbject'),
	querystring = require('querystring'),
	request = require('superagent'),
	util = require('util'),
	extend = require('util-extend'),
	jsonpscript,
	documentHeadElement;

/**
 * A module that represents a formie object, a componentTab is a page composition tool.
 * @{@link https://github.com/typesettin/formie}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @constructor formie
 * @requires module:async
 * @requires module:classie
 * @requires module:events
 * @requires module:forbject
 * @requires module:querystring
 * @requires module:superagent
 * @requires module:util-extend
 * @requires module:util
 * @param {object} options configuration options
 * @example 
		ajaxsubmitclassname: 'formie',
		ajaxsubmitfileuploadclassname: 'formie-file',
		ajaxformselector: '#formie',
		jsonp: false,
		autosubmitselectors: '.autoFormSubmit',
		autosubmitelements: [],
		preventsubmitselectors: '.noFormSubmit',
		preventsubmitelements: [],
		headers: {},
		queryparameters: {},
		postdata: {},
		beforesubmitcallback: null,
		errorcallback: null,
		successcallback: null
 */
var formie = function (options) {
	events.EventEmitter.call(this);

	var defaultOptions = {
		//ajaxsubmitclassname: 'formie',
		ajaxsubmitfileuploadclassname: 'formie-file',
		ajaxformselector: '#formie',
		autosubmitselectors: '.autoFormSubmit',
		autosubmitelements: [],
		preventsubmitselectors: '.noFormSubmit',
		preventsubmitelements: [],
		headers: {},
		queryparameters: {},
		postdata: {},
		beforesubmitcallback: null,
		errorcallback: null,
		successcallback: null
	};
	this.options = extend(defaultOptions, options);

	this.init = this._init;
	this.ajaxSubmitFormie = this.__ajaxSubmitFormie;
	this.submitOnChangeListeners = this.__submitOnChangeListeners;
	this.autoSubmitFormOnChange = this.__autoSubmitFormOnChange;
	this.preventEnterSubmitListeners = this.__preventEnterSubmitListeners;
	this.preventSubmitOnEnter = this.__preventSubmitOnEnter;
	this.ajaxFormEventListers = this.__ajaxFormEventListers;
	this.submit = this.__submit;
	this.init();
	// this.render = this._render;
	// this.addBinder = this._addBinder;
};

util.inherits(formie, events.EventEmitter);

/**
 * asynchronously submit from data, supports, POST, GET, and GET JSONP
 * @param  {object} e       form submit event
 * @param  {object} element form html element
 * @return {Function} ajaxResponseHandler(error, response)
 * @emits submitted(formieData)
 */
formie.prototype.__ajaxSubmitFormie = function (e, element) {

	if (e) {
		e.preventDefault();
	}
	var f = (element) ? element : e.target,
		beforefn,
		errorfn,
		successfn,
		formieDataFromForm,
		formieData,
		ajaxResponseHandler = function (err, response) {
			if (err && this.options.errorcallback) {
				errorfn = this.options.errorcallback;
				if (typeof errorfn === 'function') {
					errorfn(err, response);
				}
				else if (typeof window[errorfn] === 'function') {
					errorfn = window[errorfn];
					errorfn(err, response);
				}
			}
			else if (this.options.successcallback) {
				successfn = this.options.successcallback;
				if (typeof successfn === 'function') {
					successfn(response);
				}
				else if (typeof window[successfn] === 'function') {
					successfn = window[successfn];
					successfn(response);
				}
			}
			this.emit('submitted', formieData);
		}.bind(this);

	if (this.options.beforesubmitcallback) {
		beforefn = this.options.beforesubmitcallback;
		if (typeof beforefn === 'function') {
			beforefn(e, f);
		}
		else if (typeof window[beforefn] === 'function') {
			beforefn = window[beforefn];
			beforefn(e, f);
		}
	}
	var forbjectOptions = {};
	if (f.getAttribute('forbject-autorefresh')) {
		forbjectOptions.autorefresh = f.getAttribute('forbject-autorefresh');
	}
	if (f.getAttribute('forbject-addelementsonrefresh')) {
		forbjectOptions.addelementsonrefresh = f.getAttribute('forbject-addelementsonrefresh');
	}
	if (f.getAttribute('forbject-valuefilter')) {
		forbjectOptions.valuefilter = f.getAttribute('forbject-valuefilter');
	}
	this.options.forbject = new Forbject(f, forbjectOptions);
	formieDataFromForm = this.options.forbject.getObject();
	// console.log('f.getAttribute("enctype")', f.getAttribute('enctype'));

	this.options.method = (f.getAttribute('method')) ? f.getAttribute('method').toLowerCase() : this.options.method.toLowerCase();
	this.options.action = (f.getAttribute('action')) ? f.getAttribute('action') : (this.options.action) ? this.options.action : window.location.href;

	if (this.options.jsonp) {
		formieData = extend(formieDataFromForm, this.options.queryparameters);
		// head element
		documentHeadElement = (documentHeadElement) ? documentHeadElement : document.getElementsByTagName('head')[0];

		// remove existing 
		if (document.querySelector('#formie-jsonp')) {
			documentHeadElement.removeChild(document.querySelector('#formie-jsonp'));
		}

		// Create a new script element
		jsonpscript = document.createElement('script');

		// Set its source to the JSONP API
		jsonpscript.src = this.options.action + '?' + querystring.stringify(formieData);
		jsonpscript.id = 'formie-jsonp';

		window[formieData.callback] = this.options.successcallback;

		// Stick the script element in the page <head>
		documentHeadElement.appendChild(jsonpscript);
	}
	else if (f.getAttribute('enctype') === 'multipart/form-data') {
		var formData = new FormData(f),
			fileInputs = f.querySelectorAll('input[type="file"]'),
			// reader = new FileReader(),
			client = new XMLHttpRequest(),
			asyncFunctions = [],
			asyncFileReaderCB = function (fileinputname, file) {
				return function (cb) {
					var filereader = new FileReader();
					if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
						filereader.readAsDataURL(file);
						filereader.onload = function () {
							// console.log('this is firefox');
							// console.log('e', e);
							// console.log('fileinputname', fileinputname);
							// console.log('filereader.result', filereader.result);
							// console.log('file.name', file.name);
							// console.log('file.type', file.type);
							var makeblob = function dataURItoBlob(dataURI) {
								// convert base64/URLEncoded data component to raw binary data held in a string
								var byteString;
								if (dataURI.split(',')[0].indexOf('base64') >= 0) {
									byteString = atob(dataURI.split(',')[1]);
								}
								else {
									byteString = unescape(dataURI.split(',')[1]);
								}
								// separate out the mime component
								var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

								// write the bytes of the string to a typed array
								var ia = new Uint8Array(byteString.length);
								for (var i = 0; i < byteString.length; i++) {
									ia[i] = byteString.charCodeAt(i);
								}

								return new Blob([ia], {
									type: mimeString
								});
							};
							formData.append(fileinputname, makeblob(filereader.result), file.name);
							cb(null, file);
						};
					}
					else {
						filereader.readAsDataURL(file);
						filereader.onload = function () {
							formData.append(fileinputname, filereader.result, file.name);
							cb(null, file);
						};
					}
				};
			};

		formieData = formieDataFromForm;
		//loop through file inputs and append files to formData
		if (fileInputs) {
			for (var r = 0; r < fileInputs.length; r++) {
				if (fileInputs[r].files.length > 0) {
					for (var s = 0; s < fileInputs[r].files.length; s++) {
						// reader.readAsDataURL(fileInputs[r].files[s]);
						asyncFunctions.push(asyncFileReaderCB(fileInputs[r].name, fileInputs[r].files[s]));
					}
				}
			}
			async.parallel(
				asyncFunctions,
				function (err /* , results*/ ) {
					// console.log('async err, results',err, results);
					try {
						if (err) {
							throw err;
						}
						client.open(this.options.method, this.options.action + '?' + querystring.stringify(this.options.queryparameters), true);
						if (this.options.headers) {
							for (var i in this.options.headers) {
								client.setRequestHeader(i, this.options.headers[i]);
							}
						}
						// console.log('client',client);
						// console.log('formData',formData);
						client.send(formData); /* Send to server */
						// client.onreadystatechange = function () {}
						client.onabort = function (err) {
							ajaxResponseHandler(err);
						};
						client.onerror = function (err) {
							ajaxResponseHandler(err);
						};
						client.onloadend = function () {
							if (client.readyState === 4) {
								if (client.status !== 200) {
									ajaxResponseHandler(client.statusText, client);
								}
								else {
									var res = {};
									res.body = JSON.parse(client.response);
									ajaxResponseHandler(null, res);
								}
							}
						};
					}
					catch (e) {
						ajaxResponseHandler(e);
					}
				}.bind(this)
			);

		}
		// console.log('fileInputs', fileInputs, f, formData);
	}
	else if (this.options.method === 'get') {
		formieData = extend(formieDataFromForm, this.options.queryparameters);
		request
			.get(this.options.action)
			.set(this.options.headers)
			.withCredentials()
			.query(formieData)
			.end(ajaxResponseHandler);
	}
	else if (this.options.method === 'delete' || this.options.method === 'del') {
		formieData = extend(formieDataFromForm, this.options.queryparameters);
		request
			.del(this.options.action)
			.set(this.options.headers)
			.withCredentials()
			.send(formieData)
			.end(ajaxResponseHandler);
	}
	else if (this.options.method === 'post' || this.options.method === 'put') {
		formieData = extend(formieDataFromForm, this.options.postdata);
		request
			.post(this.options.action)
			.set(this.options.headers)
			.withCredentials()
			.query(this.options.queryparameters)
			.send(formieData)
			.end(ajaxResponseHandler);
	}
	return false;
};

/**
 * submit formie via ajax
 */
formie.prototype.__submit = function () {
	this.ajaxSubmitFormie(null, this.options.form);
};

/**
 * submit current form if html element has ajaxsubmitclassname class
 * @emits autosubmitelement(element)
 */
formie.prototype.__autoSubmitFormOnChange = function () {
	var formElement = (this.form) ? this.form : this.options.form;

	this.ajaxSubmitFormie(null, formElement);
	this.emit('autosubmitelement', formElement);
	/*
	// console.log('formElement', formElement);
	if (classie.hasClass(formElement, this.options.ajaxsubmitclassname)) {
		this.ajaxSubmitFormie(null, formElement);
		this.emit('autosubmitelement', formElement);
	}
	else {
		formElement.submit();
	}
	*/
};

/**
 * add change listener for form elements with autosubmitselectors class
 */
formie.prototype.__submitOnChangeListeners = function () {
	this.options.autosubmitelements = this.options.form.querySelectorAll(this.options.autosubmitselectors);

	for (var x in this.options.autosubmitelements) {
		if (typeof this.options.autosubmitelements[x] === 'object') {
			this.options.autosubmitelements[x].addEventListener('change', this.autoSubmitFormOnChange.bind(this), false);
		}
	}
};

/**
 * prevent element from submitting form when pressing enter key
 * @param  {object} e keypress event
 * @return {boolean}   also e.preventDefault();
 * @emits prevententer(e.target)
 */
formie.prototype.__preventSubmitOnEnter = function (e) {
	if (e.which === 13 || e.keyCode === 13) {
		e.preventDefault();
		this.emit('prevententer', e.target);
		return false;
	}
};

/**
 * add keypress listeners to form elements that have preventsubmitselectors class to prevent submitting form on enter key
 */
formie.prototype.__preventEnterSubmitListeners = function () {

	this.options.preventsubmitelements = this.options.form.querySelectorAll(this.options.preventsubmitselectors);
	// console.log(this.options.preventsubmitelements);
	for (var x in this.options.preventsubmitelements) {
		if (typeof this.options.preventsubmitelements[x] === 'object') {
			this.options.preventsubmitelements[x].addEventListener('keypress', this.preventSubmitOnEnter.bind(this), false);
			this.options.preventsubmitelements[x].addEventListener('keydown', this.preventSubmitOnEnter.bind(this), false);
		}
	}
	// document.addEventListener('keypress', preventSubmitOnEnter, false);
};

/**
 * add submit event listener to formie form
 */
formie.prototype.__ajaxFormEventListers = function () {
	this.options.form.addEventListener('submit', this.ajaxSubmitFormie.bind(this), false);
};

/**
 * sets this.options.form, also adds event listener for formie form [this.ajaxFormEventListers()], adds auto submit form listeners [this.submitOnChangeListeners()], and prevent submit listeners [this.preventEnterSubmitListeners()]
 * @emits initialized
 */
formie.prototype._init = function () {
	this.options.form = (this.options.form) ? this.options.form : document.querySelector(this.options.ajaxformselector);

	this.ajaxFormEventListers();
	this.submitOnChangeListeners();
	this.preventEnterSubmitListeners();
	this.emit('initialized');
};
module.exports = formie;

},{"async":3,"events":5,"forbject":6,"querystring":12,"superagent":14,"util":20,"util-extend":18}],3:[function(require,module,exports){
(function (process,global){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.async = global.async || {})));
}(this, function (exports) { 'use strict';

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
      var length = args.length;
      switch (length) {
        case 0: return func.call(thisArg);
        case 1: return func.call(thisArg, args[0]);
        case 2: return func.call(thisArg, args[0], args[1]);
        case 3: return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
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
      return !!value && (type == 'object' || type == 'function');
    }

    var funcTag = '[object Function]';
    var genTag = '[object GeneratorFunction]';
    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8 which returns 'object' for typed array and weak map constructors,
      // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
      var tag = isObject(value) ? objectToString.call(value) : '';
      return tag == funcTag || tag == genTag;
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
      return !!value && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$1 = objectProto$1.toString;

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString$1.call(value) == symbolTag);
    }

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

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
        var other = isFunction(value.valueOf) ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var INFINITY = 1 / 0;
    var MAX_INTEGER = 1.7976931348623157e+308;
    /**
     * Converts `value` to a finite number.
     *
     * @static
     * @memberOf _
     * @since 4.12.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted number.
     * @example
     *
     * _.toFinite(3.2);
     * // => 3.2
     *
     * _.toFinite(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toFinite(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toFinite('3.2');
     * // => 3.2
     */
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }

    /**
     * Converts `value` to an integer.
     *
     * **Note:** This method is loosely based on
     * [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toInteger(3.2);
     * // => 3
     *
     * _.toInteger(Number.MIN_VALUE);
     * // => 0
     *
     * _.toInteger(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toInteger('3.2');
     * // => 3
     */
    function toInteger(value) {
      var result = toFinite(value),
          remainder = result % 1;

      return result === result ? (remainder ? result - remainder : result) : 0;
    }

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max;

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as
     * an array.
     *
     * **Note:** This method is based on the
     * [rest parameter](https://mdn.io/rest_parameters).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.rest(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function rest(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = nativeMax(start === undefined ? (func.length - 1) : toInteger(start), 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        switch (start) {
          case 0: return func.call(this, array);
          case 1: return func.call(this, args[0], array);
          case 2: return func.call(this, args[0], args[1], array);
        }
        var otherArgs = Array(start + 1);
        index = -1;
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = array;
        return apply(func, this, otherArgs);
      };
    }

    function initialParams (fn) {
        return rest(function (args /*..., callback*/) {
            var callback = args.pop();
            fn.call(this, args, callback);
        });
    }

    function applyEach$1(eachfn) {
        return rest(function (fns, args) {
            var go = initialParams(function (args, callback) {
                var that = this;
                return eachfn(fns, function (fn, cb) {
                    fn.apply(that, args.concat([cb]));
                }, callback);
            });
            if (args.length) {
                return go.apply(this, args);
            } else {
                return go;
            }
        });
    }

    /**
     * A method that returns `undefined`.
     *
     * @static
     * @memberOf _
     * @since 2.3.0
     * @category Util
     * @example
     *
     * _.times(2, _.noop);
     * // => [undefined, undefined]
     */
    function noop() {
      // No operation performed.
    }

    function once(fn) {
        return function () {
            if (fn === null) return;
            var callFn = fn;
            fn = null;
            callFn.apply(this, arguments);
        };
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new accessor function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a
     * [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792) that affects
     * Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length,
     *  else `false`.
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
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
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
      return value != null && isLength(getLength(value)) && !isFunction(value);
    }

    var iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator;

    function getIterator (coll) {
        return iteratorSymbol && coll[iteratorSymbol] && coll[iteratorSymbol]();
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetPrototype = Object.getPrototypeOf;

    /**
     * Gets the `[[Prototype]]` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {null|Object} Returns the `[[Prototype]]`.
     */
    function getPrototype(value) {
      return nativeGetPrototype(Object(value));
    }

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto$2.hasOwnProperty;

    /**
     * The base implementation of `_.has` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHas(object, key) {
      // Avoid a bug in IE 10-11 where objects with a [[Prototype]] of `null`,
      // that are composed entirely of index properties, return `false` for
      // `hasOwnProperty` checks of them.
      return object != null &&
        (hasOwnProperty.call(object, key) ||
          (typeof object == 'object' && key in object && getPrototype(object) === null));
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeKeys = Object.keys;

    /**
     * The base implementation of `_.keys` which doesn't skip the constructor
     * property of prototypes or treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      return nativeKeys(Object(object));
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

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$3.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$2 = objectProto$3.toString;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
      return isArrayLikeObject(value) && hasOwnProperty$1.call(value, 'callee') &&
        (!propertyIsEnumerable.call(value, 'callee') || objectToString$2.call(value) == argsTag);
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @type {Function}
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
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

    /** `Object#toString` result references. */
    var stringTag = '[object String]';

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$3 = objectProto$4.toString;

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' ||
        (!isArray(value) && isObjectLike(value) && objectToString$3.call(value) == stringTag);
    }

    /**
     * Creates an array of index keys for `object` values of arrays,
     * `arguments` objects, and strings, otherwise `null` is returned.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array|null} Returns index keys, else `null`.
     */
    function indexKeys(object) {
      var length = object ? object.length : undefined;
      if (isLength(length) &&
          (isArray(object) || isString(object) || isArguments(object))) {
        return baseTimes(length, String);
      }
      return null;
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
      length = length == null ? MAX_SAFE_INTEGER$1 : length;
      return !!length &&
        (typeof value == 'number' || reIsUint.test(value)) &&
        (value > -1 && value % 1 == 0 && value < length);
    }

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;

      return value === proto;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
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
      var isProto = isPrototype(object);
      if (!(isProto || isArrayLike(object))) {
        return baseKeys(object);
      }
      var indexes = indexKeys(object),
          skipIndexes = !!indexes,
          result = indexes || [],
          length = result.length;

      for (var key in object) {
        if (baseHas(object, key) &&
            !(skipIndexes && (key == 'length' || isIndex(key, length))) &&
            !(isProto && key == 'constructor')) {
          result.push(key);
        }
      }
      return result;
    }

    function iterator(coll) {
        var i = -1;
        var len;
        if (isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? { value: coll[i], key: i } : null;
            };
        }

        var iterate = getIterator(coll);
        if (iterate) {
            return function next() {
                var item = iterate.next();
                if (item.done) return null;
                i++;
                return { value: item.value, key: i };
            };
        }

        var okeys = keys(coll);
        len = okeys.length;
        return function next() {
            i++;
            var key = okeys[i];
            return i < len ? { value: coll[key], key: key } : null;
        };
    }

    function onlyOnce(fn) {
        return function () {
            if (fn === null) throw new Error("Callback was already called.");
            var callFn = fn;
            fn = null;
            callFn.apply(this, arguments);
        };
    }

    function _eachOfLimit(limit) {
        return function (obj, iteratee, callback) {
            callback = once(callback || noop);
            obj = obj || [];
            var nextElem = iterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish() {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var elem = nextElem();
                    if (elem === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iteratee(elem.value, elem.key, onlyOnce(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        } else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }

    function doParallelLimit(fn) {
        return function (obj, limit, iteratee, callback) {
            return fn(_eachOfLimit(limit), obj, iteratee, callback);
        };
    }

    function _asyncMap(eachfn, arr, iteratee, callback) {
        callback = once(callback || noop);
        arr = arr || [];
        var results = [];
        var counter = 0;

        eachfn(arr, function (value, _, callback) {
            var index = counter++;
            iteratee(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    /**
     * The same as `map` but runs a maximum of `limit` async operations at a time.
     *
     * @name mapLimit
     * @static
     * @memberOf async
     * @see async.map
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a transformed
     * item. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an array of the
     * transformed items from the `coll`. Invoked with (err, results).
     */
    var mapLimit = doParallelLimit(_asyncMap);

    function doLimit(fn, limit) {
        return function (iterable, iteratee, callback) {
            return fn(iterable, limit, iteratee, callback);
        };
    }

    /**
     * Produces a new collection of values by mapping each value in `coll` through
     * the `iteratee` function. The `iteratee` is called with an item from `coll`
     * and a callback for when it has finished processing. Each of these callback
     * takes 2 arguments: an `error`, and the transformed item from `coll`. If
     * `iteratee` passes an error to its callback, the main `callback` (for the
     * `map` function) is immediately called with the error.
     *
     * Note, that since this function applies the `iteratee` to each item in
     * parallel, there is no guarantee that the `iteratee` functions will complete
     * in order. However, the results array will be in the same order as the
     * original `coll`.
     *
     * If `map` is passed an Object, the results will be an Array.  The results
     * will roughly be in the order of the original Objects' keys (but this can
     * vary across JavaScript engines)
     *
     * @name map
     * @static
     * @memberOf async
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed item. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an Array of the
     * transformed items from the `coll`. Invoked with (err, results).
     * @example
     *
     * async.map(['file1','file2','file3'], fs.stat, function(err, results) {
     *     // results is now an array of stats for each file
     * });
     */
    var map = doLimit(mapLimit, Infinity);

    /**
     * Applies the provided arguments to each function in the array, calling
     * `callback` after all functions have completed. If you only provide the first
     * argument, then it will return a function which lets you pass in the
     * arguments as if it were a single function call.
     *
     * @name applyEach
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Array|Object} fns - A collection of asynchronous functions to all
     * call with the same arguments
     * @param {...*} [args] - any number of separate arguments to pass to the
     * function.
     * @param {Function} [callback] - the final argument should be the callback,
     * called when all functions have completed processing.
     * @returns {Function} - If only the first argument is provided, it will return
     * a function which lets you pass in the arguments as if it were a single
     * function call.
     * @example
     *
     * async.applyEach([enableSearch, updateSchema], 'bucket', callback);
     *
     * // partial application example:
     * async.each(
     *     buckets,
     *     async.applyEach([enableSearch, updateSchema]),
     *     callback
     * );
     */
    var applyEach = applyEach$1(map);

    /**
     * The same as `map` but runs only a single async operation at a time.
     *
     * @name mapSeries
     * @static
     * @memberOf async
     * @see async.map
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed item. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an array of the
     * transformed items from the `coll`. Invoked with (err, results).
     */
    var mapSeries = doLimit(mapLimit, 1);

    /**
     * The same as `applyEach` but runs only a single async operation at a time.
     *
     * @name applyEachSeries
     * @static
     * @memberOf async
     * @see async.applyEach
     * @category Control Flow
     * @param {Array|Object} fns - A collection of asynchronous functions to all
     * call with the same arguments
     * @param {...*} [args] - any number of separate arguments to pass to the
     * function.
     * @param {Function} [callback] - the final argument should be the callback,
     * called when all functions have completed processing.
     * @returns {Function} - If only the first argument is provided, it will return
     * a function which lets you pass in the arguments as if it were a single
     * function call.
     */
    var applyEachSeries = applyEach$1(mapSeries);

    /**
     * Creates a continuation function with some arguments already applied.
     *
     * Useful as a shorthand when combined with other control flow functions. Any
     * arguments passed to the returned function are added to the arguments
     * originally passed to apply.
     *
     * @name apply
     * @static
     * @memberOf async
     * @category Util
     * @param {Function} function - The function you want to eventually apply all
     * arguments to. Invokes with (arguments...).
     * @param {...*} arguments... - Any number of arguments to automatically apply
     * when the continuation is called.
     * @example
     *
     * // using apply
     * async.parallel([
     *     async.apply(fs.writeFile, 'testfile1', 'test1'),
     *     async.apply(fs.writeFile, 'testfile2', 'test2')
     * ]);
     *
     *
     * // the same process without using apply
     * async.parallel([
     *     function(callback) {
     *         fs.writeFile('testfile1', 'test1', callback);
     *     },
     *     function(callback) {
     *         fs.writeFile('testfile2', 'test2', callback);
     *     }
     * ]);
     *
     * // It's possible to pass any number of additional arguments when calling the
     * // continuation:
     *
     * node> var fn = async.apply(sys.puts, 'one');
     * node> fn('two', 'three');
     * one
     * two
     * three
     */
    var apply$1 = rest(function (fn, args) {
        return rest(function (callArgs) {
            return fn.apply(null, args.concat(callArgs));
        });
    });

    /**
     * Take a sync function and make it async, passing its return value to a
     * callback. This is useful for plugging sync functions into a waterfall,
     * series, or other async functions. Any arguments passed to the generated
     * function will be passed to the wrapped function (except for the final
     * callback argument). Errors thrown will be passed to the callback.
     *
     * If the function passed to `asyncify` returns a Promise, that promises's
     * resolved/rejected state will be used to call the callback, rather than simply
     * the synchronous return value.
     *
     * This also means you can asyncify ES2016 `async` functions.
     *
     * @name asyncify
     * @static
     * @memberOf async
     * @alias wrapSync
     * @category Util
     * @param {Function} func - The synchronous function to convert to an
     * asynchronous function.
     * @returns {Function} An asynchronous wrapper of the `func`. To be invoked with
     * (callback).
     * @example
     *
     * // passing a regular synchronous function
     * async.waterfall([
     *     async.apply(fs.readFile, filename, "utf8"),
     *     async.asyncify(JSON.parse),
     *     function (data, next) {
     *         // data is the result of parsing the text.
     *         // If there was a parsing error, it would have been caught.
     *     }
     * ], callback);
     *
     * // passing a function returning a promise
     * async.waterfall([
     *     async.apply(fs.readFile, filename, "utf8"),
     *     async.asyncify(function (contents) {
     *         return db.model.create(contents);
     *     }),
     *     function (model, next) {
     *         // `model` is the instantiated model object.
     *         // If there was an error, this function would be skipped.
     *     }
     * ], callback);
     *
     * // es6 example
     * var q = async.queue(async.asyncify(async function(file) {
     *     var intermediateStep = await processFile(file);
     *     return await somePromise(intermediateStep)
     * }));
     *
     * q.push(files);
     */
    function asyncify(func) {
        return initialParams(function (args, callback) {
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (isObject(result) && typeof result.then === 'function') {
                result.then(function (value) {
                    callback(null, value);
                })['catch'](function (err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    }

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
          length = array ? array.length : 0;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * Creates a base function for methods like `_.forIn` and `_.forOwn`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
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

    /**
     * The base implementation of `_.forOwn` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
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
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'fred' };
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
      return value === other || (value !== value && other !== other);
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to search.
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
          length = entries ? entries.length : 0;

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

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache;
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
      return this.__data__['delete'](key);
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

    /**
     * Checks if `value` is a host object in IE < 9.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
     */
    function isHostObject(value) {
      // Many host objects are `Object` objects that can coerce to strings
      // despite having improperly defined `toString` methods.
      var result = false;
      if (value != null && typeof value.toString != 'function') {
        try {
          result = !!(value + '');
        } catch (e) {}
      }
      return result;
    }

    /**
     * Checks if `value` is a global object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {null|Object} Returns `value` if it's a global object, else `null`.
     */
    function checkGlobal(value) {
      return (value && value.Object === Object) ? value : null;
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = checkGlobal(typeof global == 'object' && global);

    /** Detect free variable `self`. */
    var freeSelf = checkGlobal(typeof self == 'object' && self);

    /** Detect `this` as the global object. */
    var thisGlobal = checkGlobal(typeof this == 'object' && this);

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || thisGlobal || Function('return this')();

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root['__core-js_shared__'];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = Function.prototype.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to process.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString$1.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var objectProto$6 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$6.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty$2).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

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
      var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
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

    /* Built-in method references that are verified to be native. */
    var nativeCreate = getNative(Object, 'create');

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
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
      return this.has(key) && delete this.__data__[key];
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$7 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$7.hasOwnProperty;

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
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty$3.call(data, key) ? data[key] : undefined;
    }

    /** Used for built-in method references. */
    var objectProto$8 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$8.hasOwnProperty;

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
      return nativeCreate ? data[key] !== undefined : hasOwnProperty$4.call(data, key);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

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
      data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
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
          length = entries ? entries.length : 0;

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

    /* Built-in method references that are verified to be native. */
    var Map = getNative(root, 'Map');

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map || ListCache),
        'string': new Hash
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
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
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
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
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
      return getMapData(this, key)['delete'](key);
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
      getMapData(this, key).set(key, value);
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
          length = entries ? entries.length : 0;

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
      var cache = this.__data__;
      if (cache instanceof ListCache && cache.__data__.length == LARGE_ARRAY_SIZE) {
        cache = this.__data__ = new MapCache(cache.__data__);
      }
      cache.set(key, value);
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
      this.__data__ = new ListCache(entries);
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype['delete'] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED$2);
      return this;
    }

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
          length = values ? values.length : 0;

      this.__data__ = new MapCache;
      while (++index < length) {
        this.add(values[index]);
      }
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;

    /**
     * A specialized version of `_.some` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array ? array.length : 0;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    var UNORDERED_COMPARE_FLAG$1 = 1;
    var PARTIAL_COMPARE_FLAG$2 = 2;
    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} customizer The function to customize comparisons.
     * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} stack Tracks traversed `array` and `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG$2,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(array);
      if (stacked) {
        return stacked == other;
      }
      var index = -1,
          result = true,
          seen = (bitmask & UNORDERED_COMPARE_FLAG$1) ? new SetCache : undefined;

      stack.set(array, other);

      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, arrValue, index, other, array, stack)
            : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
          if (!arraySome(other, function(othValue, othIndex) {
                if (!seen.has(othIndex) &&
                    (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
                  return seen.add(othIndex);
                }
              })) {
            result = false;
            break;
          }
        } else if (!(
              arrValue === othValue ||
                equalFunc(arrValue, othValue, customizer, bitmask, stack)
            )) {
          result = false;
          break;
        }
      }
      stack['delete'](array);
      return result;
    }

    /** Built-in value references. */
    var Symbol$1 = root.Symbol;

    /** Built-in value references. */
    var Uint8Array = root.Uint8Array;

    /**
     * Converts `map` to its key-value pairs.
     *
     * @private
     * @param {Object} map The map to convert.
     * @returns {Array} Returns the key-value pairs.
     */
    function mapToArray(map) {
      var index = -1,
          result = Array(map.size);

      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
          result = Array(set.size);

      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }

    var UNORDERED_COMPARE_FLAG$2 = 1;
    var PARTIAL_COMPARE_FLAG$3 = 2;
    var boolTag = '[object Boolean]';
    var dateTag = '[object Date]';
    var errorTag = '[object Error]';
    var mapTag = '[object Map]';
    var numberTag = '[object Number]';
    var regexpTag = '[object RegExp]';
    var setTag = '[object Set]';
    var stringTag$1 = '[object String]';
    var symbolTag$1 = '[object Symbol]';
    var arrayBufferTag = '[object ArrayBuffer]';
    var dataViewTag = '[object DataView]';
    var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} customizer The function to customize comparisons.
     * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
      switch (tag) {
        case dataViewTag:
          if ((object.byteLength != other.byteLength) ||
              (object.byteOffset != other.byteOffset)) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;

        case arrayBufferTag:
          if ((object.byteLength != other.byteLength) ||
              !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
            return false;
          }
          return true;

        case boolTag:
        case dateTag:
          // Coerce dates and booleans to numbers, dates to milliseconds and
          // booleans to `1` or `0` treating invalid dates coerced to `NaN` as
          // not equal.
          return +object == +other;

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case numberTag:
          // Treat `NaN` vs. `NaN` as equal.
          return (object != +object) ? other != +other : object == +other;

        case regexpTag:
        case stringTag$1:
          // Coerce regexes to strings and treat strings, primitives and objects,
          // as equal. See http://www.ecma-international.org/ecma-262/6.0/#sec-regexp.prototype.tostring
          // for more details.
          return object == (other + '');

        case mapTag:
          var convert = mapToArray;

        case setTag:
          var isPartial = bitmask & PARTIAL_COMPARE_FLAG$3;
          convert || (convert = setToArray);

          if (object.size != other.size && !isPartial) {
            return false;
          }
          // Assume cyclic values are equal.
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= UNORDERED_COMPARE_FLAG$2;
          stack.set(object, other);

          // Recursively compare objects (susceptible to call stack limits).
          return equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);

        case symbolTag$1:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }

    /** Used to compose bitmasks for comparison styles. */
    var PARTIAL_COMPARE_FLAG$4 = 2;

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} customizer The function to customize comparisons.
     * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG$4,
          objProps = keys(object),
          objLength = objProps.length,
          othProps = keys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : baseHas(other, key))) {
          return false;
        }
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      var result = true;
      stack.set(object, other);

      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, objValue, key, other, object, stack)
            : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined
              ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
              : compared
            )) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack['delete'](object);
      return result;
    }

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(root, 'DataView');

    /* Built-in method references that are verified to be native. */
    var Promise = getNative(root, 'Promise');

    /* Built-in method references that are verified to be native. */
    var Set = getNative(root, 'Set');

    /* Built-in method references that are verified to be native. */
    var WeakMap = getNative(root, 'WeakMap');

    var mapTag$1 = '[object Map]';
    var objectTag$1 = '[object Object]';
    var promiseTag = '[object Promise]';
    var setTag$1 = '[object Set]';
    var weakMapTag = '[object WeakMap]';
    var dataViewTag$1 = '[object DataView]';

    /** Used for built-in method references. */
    var objectProto$10 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$4 = objectProto$10.toString;

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView);
    var mapCtorString = toSource(Map);
    var promiseCtorString = toSource(Promise);
    var setCtorString = toSource(Set);
    var weakMapCtorString = toSource(WeakMap);
    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function getTag(value) {
      return objectToString$4.call(value);
    }

    // Fallback for data views, maps, sets, and weak maps in IE 11,
    // for data views in Edge, and promises in Node.js.
    if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
        (Map && getTag(new Map) != mapTag$1) ||
        (Promise && getTag(Promise.resolve()) != promiseTag) ||
        (Set && getTag(new Set) != setTag$1) ||
        (WeakMap && getTag(new WeakMap) != weakMapTag)) {
      getTag = function(value) {
        var result = objectToString$4.call(value),
            Ctor = result == objectTag$1 ? value.constructor : undefined,
            ctorString = Ctor ? toSource(Ctor) : undefined;

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag$1;
            case mapCtorString: return mapTag$1;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag$1;
            case weakMapCtorString: return weakMapTag;
          }
        }
        return result;
      };
    }

    var getTag$1 = getTag;

    var argsTag$2 = '[object Arguments]';
    var arrayTag$1 = '[object Array]';
    var boolTag$1 = '[object Boolean]';
    var dateTag$1 = '[object Date]';
    var errorTag$1 = '[object Error]';
    var funcTag$1 = '[object Function]';
    var mapTag$2 = '[object Map]';
    var numberTag$1 = '[object Number]';
    var objectTag$2 = '[object Object]';
    var regexpTag$1 = '[object RegExp]';
    var setTag$2 = '[object Set]';
    var stringTag$2 = '[object String]';
    var weakMapTag$1 = '[object WeakMap]';
    var arrayBufferTag$1 = '[object ArrayBuffer]';
    var dataViewTag$2 = '[object DataView]';
    var float32Tag = '[object Float32Array]';
    var float64Tag = '[object Float64Array]';
    var int8Tag = '[object Int8Array]';
    var int16Tag = '[object Int16Array]';
    var int32Tag = '[object Int32Array]';
    var uint8Tag = '[object Uint8Array]';
    var uint8ClampedTag = '[object Uint8ClampedArray]';
    var uint16Tag = '[object Uint16Array]';
    var uint32Tag = '[object Uint32Array]';
    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
    typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
    typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
    typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
    typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag$2] = typedArrayTags[arrayTag$1] =
    typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] =
    typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] =
    typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] =
    typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] =
    typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$1] =
    typedArrayTags[setTag$2] = typedArrayTags[stringTag$2] =
    typedArrayTags[weakMapTag$1] = false;

    /** Used for built-in method references. */
    var objectProto$11 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$5 = objectProto$11.toString;

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    function isTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[objectToString$5.call(value)];
    }

    /** Used to compose bitmasks for comparison styles. */
    var PARTIAL_COMPARE_FLAG$1 = 2;

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]';
    var arrayTag = '[object Array]';
    var objectTag = '[object Object]';
    /** Used for built-in method references. */
    var objectProto$9 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$5 = objectProto$9.hasOwnProperty;

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
     *  for more details.
     * @param {Object} [stack] Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = arrayTag,
          othTag = arrayTag;

      if (!objIsArr) {
        objTag = getTag$1(object);
        objTag = objTag == argsTag$1 ? objectTag : objTag;
      }
      if (!othIsArr) {
        othTag = getTag$1(other);
        othTag = othTag == argsTag$1 ? objectTag : othTag;
      }
      var objIsObj = objTag == objectTag && !isHostObject(object),
          othIsObj = othTag == objectTag && !isHostObject(other),
          isSameTag = objTag == othTag;

      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray(object))
          ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
          : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
      }
      if (!(bitmask & PARTIAL_COMPARE_FLAG$1)) {
        var objIsWrapped = objIsObj && hasOwnProperty$5.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty$5.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object,
              othUnwrapped = othIsWrapped ? other.value() : other;

          stack || (stack = new Stack);
          return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack);
      return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
    }

    /**
     * The base implementation of `_.isEqual` which supports partial comparisons
     * and tracks traversed objects.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {boolean} [bitmask] The bitmask of comparison flags.
     *  The bitmask may be composed of the following flags:
     *     1 - Unordered comparison
     *     2 - Partial comparison
     * @param {Object} [stack] Tracks traversed `value` and `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, customizer, bitmask, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
    }

    var UNORDERED_COMPARE_FLAG = 1;
    var PARTIAL_COMPARE_FLAG = 2;
    /**
     * The base implementation of `_.isMatch` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Array} matchData The property names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparisons.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack;
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === undefined
                ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack)
                : result
              )) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }

    /**
     * Gets the property names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = keys(object),
          length = result.length;

      while (length--) {
        var key = result[length],
            value = object[key];

        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }

    /**
     * A specialized version of `matchesProperty` for source values suitable
     * for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new spec function.
     */
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue &&
          (srcValue !== undefined || (key in Object(object)));
      };
    }

    /**
     * The base implementation of `_.matches` which doesn't clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new spec function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT$1 = 'Expected a function';

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided, it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is used as the map cache key. The `func`
     * is invoked with the `this` binding of the memoized function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the
     * [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `delete`, `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoized function.
     * @example
     *
     * var object = { 'a': 1, 'b': 2 };
     * var other = { 'c': 3, 'd': 4 };
     *
     * var values = _.memoize(_.values);
     * values(object);
     * // => [1, 2]
     *
     * values(other);
     * // => [3, 4]
     *
     * object.a = 2;
     * values(object);
     * // => [1, 2]
     *
     * // Modify the result cache.
     * values.cache.set(object, ['a', 'b']);
     * values(object);
     * // => ['a', 'b']
     *
     * // Replace `_.memoize.Cache`.
     * _.memoize.Cache = WeakMap;
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT$1);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result);
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache);
      return memoized;
    }

    // Assign cache to `_.memoize`.
    memoize.Cache = MapCache;

    /** Used as references for various `Number` constants. */
    var INFINITY$1 = 1 / 0;

    /** Used to convert symbols to primitives and strings. */
    var symbolProto$1 = Symbol$1 ? Symbol$1.prototype : undefined;
    var symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;
    /**
     * The base implementation of `_.toString` which doesn't convert nullish
     * values to empty strings.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     */
    function baseToString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value;
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
    }

    /**
     * Converts `value` to a string. An empty string is returned for `null`
     * and `undefined` values. The sign of `-0` is preserved.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     * @example
     *
     * _.toString(null);
     * // => ''
     *
     * _.toString(-0);
     * // => '-0'
     *
     * _.toString([1, 2, 3]);
     * // => '1,2,3'
     */
    function toString(value) {
      return value == null ? '' : baseToString(value);
    }

    /** Used to match property names within property paths. */
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g;

    /** Used to match backslashes in property paths. */
    var reEscapeChar = /\\(\\)?/g;

    /**
     * Converts `string` to a property path array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the property path array.
     */
    var stringToPath = memoize(function(string) {
      var result = [];
      toString(string).replace(rePropName, function(match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    });

    /**
     * Casts `value` to a path array if it's not one.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {Array} Returns the cast property path array.
     */
    function castPath(value) {
      return isArray(value) ? value : stringToPath(value);
    }

    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
    var reIsPlainProp = /^\w*$/;
    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == 'number' || type == 'symbol' || type == 'boolean' ||
          value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
        (object != null && value in Object(object));
    }

    /** Used as references for various `Number` constants. */
    var INFINITY$2 = 1 / 0;

    /**
     * Converts `value` to a string key if it's not a string or symbol.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {string|symbol} Returns the key.
     */
    function toKey(value) {
      if (typeof value == 'string' || isSymbol(value)) {
        return value;
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY$2) ? '-0' : result;
    }

    /**
     * The base implementation of `_.get` without support for default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path) {
      path = isKey(path, object) ? [path] : castPath(path);

      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[toKey(path[index++])];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * Gets the value at `path` of `object`. If the resolved value is
     * `undefined`, the `defaultValue` is used in its place.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned for `undefined` resolved values.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, path);
      return result === undefined ? defaultValue : result;
    }

    /**
     * The base implementation of `_.hasIn` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHasIn(object, key) {
      return object != null && key in Object(object);
    }

    /**
     * Checks if `path` exists on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @param {Function} hasFunc The function to check properties.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     */
    function hasPath(object, path, hasFunc) {
      path = isKey(path, object) ? [path] : castPath(path);

      var result,
          index = -1,
          length = path.length;

      while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result) {
        return result;
      }
      var length = object ? object.length : 0;
      return !!length && isLength(length) && isIndex(key, length) &&
        (isArray(object) || isString(object) || isArguments(object));
    }

    /**
     * Checks if `path` is a direct or inherited property of `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     * @example
     *
     * var object = _.create({ 'a': _.create({ 'b': 2 }) });
     *
     * _.hasIn(object, 'a');
     * // => true
     *
     * _.hasIn(object, 'a.b');
     * // => true
     *
     * _.hasIn(object, ['a', 'b']);
     * // => true
     *
     * _.hasIn(object, 'b');
     * // => false
     */
    function hasIn(object, path) {
      return object != null && hasPath(object, path, baseHasIn);
    }

    var UNORDERED_COMPARE_FLAG$3 = 1;
    var PARTIAL_COMPARE_FLAG$5 = 2;
    /**
     * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new spec function.
     */
    function baseMatchesProperty(path, srcValue) {
      if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
      }
      return function(object) {
        var objValue = get(object, path);
        return (objValue === undefined && objValue === srcValue)
          ? hasIn(object, path)
          : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG$3 | PARTIAL_COMPARE_FLAG$5);
      };
    }

    /**
     * This method returns the first argument given to it.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * console.log(_.identity(object) === object);
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new accessor function.
     */
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }

    /**
     * Creates a function that returns the value at `path` of a given object.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new accessor function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': 2 } },
     *   { 'a': { 'b': 1 } }
     * ];
     *
     * _.map(objects, _.property('a.b'));
     * // => [2, 1]
     *
     * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
    }

    /**
     * The base implementation of `_.iteratee`.
     *
     * @private
     * @param {*} [value=_.identity] The value to convert to an iteratee.
     * @returns {Function} Returns the iteratee.
     */
    function baseIteratee(value) {
      // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
      // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
      if (typeof value == 'function') {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == 'object') {
        return isArray(value)
          ? baseMatchesProperty(value[0], value[1])
          : baseMatches(value);
      }
      return property(value);
    }

    /**
     * Iterates over own enumerable string keyed properties of an object and
     * invokes `iteratee` for each property. The iteratee is invoked with three
     * arguments: (value, key, object). Iteratee functions may exit iteration
     * early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @since 0.3.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns `object`.
     * @see _.forOwnRight
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'a' then 'b' (iteration order is not guaranteed).
     */
    function forOwn(object, iteratee) {
      return object && baseForOwn(object, baseIteratee(iteratee, 3));
    }

    /**
     * Gets the index at which the first occurrence of `NaN` is found in `array`.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched `NaN`, else `-1`.
     */
    function indexOfNaN(array, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        var other = array[index];
        if (other !== other) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return indexOfNaN(array, fromIndex);
      }
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Determines the best order for running the functions in `tasks`, based on
     * their requirements. Each function can optionally depend on other functions
     * being completed first, and each function is run as soon as its requirements
     * are satisfied.
     *
     * If any of the functions pass an error to their callback, the `auto` sequence
     * will stop. Further tasks will not execute (so any other functions depending
     * on it will not run), and the main `callback` is immediately called with the
     * error.
     *
     * Functions also receive an object containing the results of functions which
     * have completed so far as the first argument, if they have dependencies. If a
     * task function has no dependencies, it will only be passed a callback.
     *
     * @name auto
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Object} tasks - An object. Each of its properties is either a
     * function or an array of requirements, with the function itself the last item
     * in the array. The object's key of a property serves as the name of the task
     * defined by that property, i.e. can be used when specifying requirements for
     * other tasks. The function receives one or two arguments:
     * * a `results` object, containing the results of the previously executed
     *   functions, only passed if the task has any dependencies,
     * * a `callback(err, result)` function, which must be called when finished,
     *   passing an `error` (which can be `null`) and the result of the function's
     *   execution.
     * @param {number} [concurrency=Infinity] - An optional `integer` for
     * determining the maximum number of tasks that can be run in parallel. By
     * default, as many as possible.
     * @param {Function} [callback] - An optional callback which is called when all
     * the tasks have been completed. It receives the `err` argument if any `tasks`
     * pass an error to their callback. Results are always returned; however, if an
     * error occurs, no further `tasks` will be performed, and the results object
     * will only contain partial results. Invoked with (err, results).
     * @example
     *
     * async.auto({
     *     // this function will just be passed a callback
     *     readData: async.apply(fs.readFile, 'data.txt', 'utf-8'),
     *     showData: ['readData', function(results, cb) {
     *         // results.readData is the file's contents
     *         // ...
     *     }]
     * }, callback);
     *
     * async.auto({
     *     get_data: function(callback) {
     *         console.log('in get_data');
     *         // async code to get some data
     *         callback(null, 'data', 'converted to array');
     *     },
     *     make_folder: function(callback) {
     *         console.log('in make_folder');
     *         // async code to create a directory to store a file in
     *         // this is run at the same time as getting the data
     *         callback(null, 'folder');
     *     },
     *     write_file: ['get_data', 'make_folder', function(results, callback) {
     *         console.log('in write_file', JSON.stringify(results));
     *         // once there is some data and the directory exists,
     *         // write the data to a file in the directory
     *         callback(null, 'filename');
     *     }],
     *     email_link: ['write_file', function(results, callback) {
     *         console.log('in email_link', JSON.stringify(results));
     *         // once the file is written let's email a link to it...
     *         // results.write_file contains the filename returned by write_file.
     *         callback(null, {'file':results.write_file, 'email':'user@example.com'});
     *     }]
     * }, function(err, results) {
     *     console.log('err = ', err);
     *     console.log('results = ', results);
     * });
     */
    function auto (tasks, concurrency, callback) {
        if (typeof concurrency === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = once(callback || noop);
        var keys$$ = keys(tasks);
        var numTasks = keys$$.length;
        if (!numTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = numTasks;
        }

        var results = {};
        var runningTasks = 0;
        var hasError = false;

        var listeners = {};

        var readyTasks = [];

        // for cycle detection:
        var readyToCheck = []; // tasks that have been identified as reachable
        // without the possibility of returning to an ancestor task
        var uncheckedDependencies = {};

        forOwn(tasks, function (task, key) {
            if (!isArray(task)) {
                // no dependencies
                enqueueTask(key, [task]);
                readyToCheck.push(key);
                return;
            }

            var dependencies = task.slice(0, task.length - 1);
            var remainingDependencies = dependencies.length;
            if (remainingDependencies === 0) {
                enqueueTask(key, task);
                readyToCheck.push(key);
                return;
            }
            uncheckedDependencies[key] = remainingDependencies;

            arrayEach(dependencies, function (dependencyName) {
                if (!tasks[dependencyName]) {
                    throw new Error('async.auto task `' + key + '` has a non-existent dependency in ' + dependencies.join(', '));
                }
                addListener(dependencyName, function () {
                    remainingDependencies--;
                    if (remainingDependencies === 0) {
                        enqueueTask(key, task);
                    }
                });
            });
        });

        checkForDeadlocks();
        processQueue();

        function enqueueTask(key, task) {
            readyTasks.push(function () {
                runTask(key, task);
            });
        }

        function processQueue() {
            if (readyTasks.length === 0 && runningTasks === 0) {
                return callback(null, results);
            }
            while (readyTasks.length && runningTasks < concurrency) {
                var run = readyTasks.shift();
                run();
            }
        }

        function addListener(taskName, fn) {
            var taskListeners = listeners[taskName];
            if (!taskListeners) {
                taskListeners = listeners[taskName] = [];
            }

            taskListeners.push(fn);
        }

        function taskComplete(taskName) {
            var taskListeners = listeners[taskName] || [];
            arrayEach(taskListeners, function (fn) {
                fn();
            });
            processQueue();
        }

        function runTask(key, task) {
            if (hasError) return;

            var taskCallback = onlyOnce(rest(function (err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    forOwn(results, function (val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[key] = args;
                    hasError = true;
                    listeners = [];

                    callback(err, safeResults);
                } else {
                    results[key] = args;
                    taskComplete(key);
                }
            }));

            runningTasks++;
            var taskFn = task[task.length - 1];
            if (task.length > 1) {
                taskFn(results, taskCallback);
            } else {
                taskFn(taskCallback);
            }
        }

        function checkForDeadlocks() {
            // Kahn's algorithm
            // https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm
            // http://connalle.blogspot.com/2013/10/topological-sortingkahn-algorithm.html
            var currentTask;
            var counter = 0;
            while (readyToCheck.length) {
                currentTask = readyToCheck.pop();
                counter++;
                arrayEach(getDependents(currentTask), function (dependent) {
                    if (! --uncheckedDependencies[dependent]) {
                        readyToCheck.push(dependent);
                    }
                });
            }

            if (counter !== numTasks) {
                throw new Error('async.auto cannot execute tasks due to a recursive dependency');
            }
        }

        function getDependents(taskName) {
            var result = [];
            forOwn(tasks, function (task, key) {
                if (isArray(task) && baseIndexOf(task, taskName, 0) >= 0) {
                    result.push(key);
                }
            });
            return result;
        }
    }

    /**
     * A specialized version of `_.map` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array ? array.length : 0,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
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

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = end > length ? length : end;
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * Casts `array` to a slice if it's needed.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {number} start The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the cast slice.
     */
    function castSlice(array, start, end) {
      var length = array.length;
      end = end === undefined ? length : end;
      return (!start && end >= length) ? array : baseSlice(array, start, end);
    }

    /**
     * Used by `_.trim` and `_.trimEnd` to get the index of the last string symbol
     * that is not found in the character symbols.
     *
     * @private
     * @param {Array} strSymbols The string symbols to inspect.
     * @param {Array} chrSymbols The character symbols to find.
     * @returns {number} Returns the index of the last unmatched string symbol.
     */
    function charsEndIndex(strSymbols, chrSymbols) {
      var index = strSymbols.length;

      while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
      return index;
    }

    /**
     * Used by `_.trim` and `_.trimStart` to get the index of the first string symbol
     * that is not found in the character symbols.
     *
     * @private
     * @param {Array} strSymbols The string symbols to inspect.
     * @param {Array} chrSymbols The character symbols to find.
     * @returns {number} Returns the index of the first unmatched string symbol.
     */
    function charsStartIndex(strSymbols, chrSymbols) {
      var index = -1,
          length = strSymbols.length;

      while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
      return index;
    }

    /** Used to compose unicode character classes. */
    var rsAstralRange = '\\ud800-\\udfff';
    var rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23';
    var rsComboSymbolsRange = '\\u20d0-\\u20f0';
    var rsVarRange = '\\ufe0e\\ufe0f';
    var rsAstral = '[' + rsAstralRange + ']';
    var rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']';
    var rsFitz = '\\ud83c[\\udffb-\\udfff]';
    var rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';
    var rsNonAstral = '[^' + rsAstralRange + ']';
    var rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
    var rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
    var rsZWJ = '\\u200d';
    var reOptMod = rsModifier + '?';
    var rsOptVar = '[' + rsVarRange + ']?';
    var rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';
    var rsSeq = rsOptVar + reOptMod + rsOptJoin;
    var rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';
    /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
    var reComplexSymbol = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

    /**
     * Converts `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function stringToArray(string) {
      return string.match(reComplexSymbol);
    }

    /** Used to match leading and trailing whitespace. */
    var reTrim$1 = /^\s+|\s+$/g;

    /**
     * Removes leading and trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trim('  abc  ');
     * // => 'abc'
     *
     * _.trim('-_-abc-_-', '_-');
     * // => 'abc'
     *
     * _.map(['  foo  ', '  bar  '], _.trim);
     * // => ['foo', 'bar']
     */
    function trim(string, chars, guard) {
      string = toString(string);
      if (string && (guard || chars === undefined)) {
        return string.replace(reTrim$1, '');
      }
      if (!string || !(chars = baseToString(chars))) {
        return string;
      }
      var strSymbols = stringToArray(string),
          chrSymbols = stringToArray(chars),
          start = charsStartIndex(strSymbols, chrSymbols),
          end = charsEndIndex(strSymbols, chrSymbols) + 1;

      return castSlice(strSymbols, start, end).join('');
    }

    var argsRegex = /^(function[^\(]*)?\(?\s*([^\)=]*)/m;

    function parseParams(func) {
        return trim(func.toString().match(argsRegex)[2]).split(/\s*\,\s*/);
    }

    /**
     * A dependency-injected version of the {@link async.auto} function. Dependent
     * tasks are specified as parameters to the function, after the usual callback
     * parameter, with the parameter names matching the names of the tasks it
     * depends on. This can provide even more readable task graphs which can be
     * easier to maintain.
     *
     * If a final callback is specified, the task results are similarly injected,
     * specified as named parameters after the initial error parameter.
     *
     * The autoInject function is purely syntactic sugar and its semantics are
     * otherwise equivalent to {@link async.auto}.
     *
     * @name autoInject
     * @static
     * @memberOf async
     * @see async.auto
     * @category Control Flow
     * @param {Object} tasks - An object, each of whose properties is a function of
     * the form 'func([dependencies...], callback). The object's key of a property
     * serves as the name of the task defined by that property, i.e. can be used
     * when specifying requirements for other tasks.
     * * The `callback` parameter is a `callback(err, result)` which must be called
     *   when finished, passing an `error` (which can be `null`) and the result of
     *   the function's execution. The remaining parameters name other tasks on
     *   which the task is dependent, and the results from those tasks are the
     *   arguments of those parameters.
     * @param {Function} [callback] - An optional callback which is called when all
     * the tasks have been completed. It receives the `err` argument if any `tasks`
     * pass an error to their callback. The remaining parameters are task names
     * whose results you are interested in. This callback will only be called when
     * all tasks have finished or an error has occurred, and so do not specify
     * dependencies in the same way as `tasks` do. If an error occurs, no further
     * `tasks` will be performed, and `results` will only be valid for those tasks
     * which managed to complete. Invoked with (err, [results...]).
     * @example
     *
     * //  The example from `auto` can be rewritten as follows:
     * async.autoInject({
     *     get_data: function(callback) {
     *         // async code to get some data
     *         callback(null, 'data', 'converted to array');
     *     },
     *     make_folder: function(callback) {
     *         // async code to create a directory to store a file in
     *         // this is run at the same time as getting the data
     *         callback(null, 'folder');
     *     },
     *     write_file: function(get_data, make_folder, callback) {
     *         // once there is some data and the directory exists,
     *         // write the data to a file in the directory
     *         callback(null, 'filename');
     *     },
     *     email_link: function(write_file, callback) {
     *         // once the file is written let's email a link to it...
     *         // write_file contains the filename returned by write_file.
     *         callback(null, {'file':write_file, 'email':'user@example.com'});
     *     }
     * }, function(err, email_link) {
     *     console.log('err = ', err);
     *     console.log('email_link = ', email_link);
     * });
     *
     * // If you are using a JS minifier that mangles parameter names, `autoInject`
     * // will not work with plain functions, since the parameter names will be
     * // collapsed to a single letter identifier.  To work around this, you can
     * // explicitly specify the names of the parameters your task function needs
     * // in an array, similar to Angular.js dependency injection.  The final
     * // results callback can be provided as an array in the same way.
     *
     * // This still has an advantage over plain `auto`, since the results a task
     * // depends on are still spread into arguments.
     * async.autoInject({
     *     //...
     *     write_file: ['get_data', 'make_folder', function(get_data, make_folder, callback) {
     *         callback(null, 'filename');
     *     }],
     *     email_link: ['write_file', function(write_file, callback) {
     *         callback(null, {'file':write_file, 'email':'user@example.com'});
     *     }]
     *     //...
     * }, ['email_link', function(err, email_link) {
     *     console.log('err = ', err);
     *     console.log('email_link = ', email_link);
     * }]);
     */
    function autoInject(tasks, callback) {
        var newTasks = {};

        forOwn(tasks, function (taskFn, key) {
            var params;

            if (isArray(taskFn)) {
                params = copyArray(taskFn);
                taskFn = params.pop();

                newTasks[key] = params.concat(params.length > 0 ? newTask : taskFn);
            } else if (taskFn.length === 0) {
                throw new Error("autoInject task functions require explicit parameters.");
            } else if (taskFn.length === 1) {
                // no dependencies, use the function as-is
                newTasks[key] = taskFn;
            } else {
                params = parseParams(taskFn);
                params.pop();

                newTasks[key] = params.concat(newTask);
            }

            function newTask(results, taskCb) {
                var newArgs = arrayMap(params, function (name) {
                    return results[name];
                });
                newArgs.push(taskCb);
                taskFn.apply(null, newArgs);
            }
        });

        auto(newTasks, callback);
    }

    var hasSetImmediate = typeof setImmediate === 'function' && setImmediate;
    var hasNextTick = typeof process === 'object' && typeof process.nextTick === 'function';

    function fallback(fn) {
        setTimeout(fn, 0);
    }

    function wrap(defer) {
        return rest(function (fn, args) {
            defer(function () {
                fn.apply(null, args);
            });
        });
    }

    var _defer;

    if (hasSetImmediate) {
        _defer = setImmediate;
    } else if (hasNextTick) {
        _defer = process.nextTick;
    } else {
        _defer = fallback;
    }

    var setImmediate$1 = wrap(_defer);

    function queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        } else if (concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== 'function') {
                throw new Error('task callback must be a function');
            }
            q.started = true;
            if (!isArray(data)) {
                data = [data];
            }
            if (data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return setImmediate$1(function () {
                    q.drain();
                });
            }
            arrayEach(data, function (task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }
            });
            setImmediate$1(q.process);
        }
        function _next(q, tasks) {
            return function () {
                workers -= 1;

                var removed = false;
                var args = arguments;
                arrayEach(tasks, function (task) {
                    arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);

                    if (args[0] != null) {
                        q.error(args[0], task.data);
                    }
                });

                if (workers <= q.concurrency - q.buffer) {
                    q.unsaturated();
                }

                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            unsaturated: noop,
            buffer: concurrency / 4,
            empty: noop,
            drain: noop,
            error: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while (!q.paused && workers < q.concurrency && q.tasks.length) {

                    var tasks = q.payload ? q.tasks.splice(0, q.payload) : q.tasks.splice(0, q.tasks.length);

                    var data = arrayMap(tasks, baseProperty('data'));

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);

                    if (workers === q.concurrency) {
                        q.saturated();
                    }

                    var cb = onlyOnce(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function () {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) {
                    return;
                }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    setImmediate$1(q.process);
                }
            }
        };
        return q;
    }

    /**
     * A cargo of tasks for the worker function to complete. Cargo inherits all of
     * the same methods and event callbacks as {@link async.queue}.
     * @typedef {Object} cargo
     * @property {Function} length - A function returning the number of items
     * waiting to be processed. Invoke with ().
     * @property {number} payload - An `integer` for determining how many tasks
     * should be process per round. This property can be changed after a `cargo` is
     * created to alter the payload on-the-fly.
     * @property {Function} push - Adds `task` to the `queue`. The callback is
     * called once the `worker` has finished processing the task. Instead of a
     * single task, an array of `tasks` can be submitted. The respective callback is
     * used for every task in the list. Invoke with (task, [callback]).
     * @property {Function} saturated - A callback that is called when the
     * `queue.length()` hits the concurrency and further tasks will be queued.
     * @property {Function} empty - A callback that is called when the last item
     * from the `queue` is given to a `worker`.
     * @property {Function} drain - A callback that is called when the last item
     * from the `queue` has returned from the `worker`.
     * @property {Function} idle - a function returning false if there are items
     * waiting or being processed, or true if not. Invoke with ().
     * @property {Function} pause - a function that pauses the processing of tasks
     * until `resume()` is called. Invoke with ().
     * @property {Function} resume - a function that resumes the processing of
     * queued tasks when the queue is paused. Invoke with ().
     * @property {Function} kill - a function that removes the `drain` callback and
     * empties remaining tasks from the queue forcing it to go idle. Invoke with ().
     */

    /**
     * Creates a `cargo` object with the specified payload. Tasks added to the
     * cargo will be processed altogether (up to the `payload` limit). If the
     * `worker` is in progress, the task is queued until it becomes available. Once
     * the `worker` has completed some tasks, each callback of those tasks is
     * called. Check out [these](https://camo.githubusercontent.com/6bbd36f4cf5b35a0f11a96dcd2e97711ffc2fb37/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130382f62626330636662302d356632392d313165322d393734662d3333393763363464633835382e676966) [animations](https://camo.githubusercontent.com/f4810e00e1c5f5f8addbe3e9f49064fd5d102699/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130312f38346339323036362d356632392d313165322d383134662d3964336430323431336266642e676966)
     * for how `cargo` and `queue` work.
     *
     * While [queue](#queue) passes only one task to one of a group of workers
     * at a time, cargo passes an array of tasks to a single worker, repeating
     * when the worker is finished.
     *
     * @name cargo
     * @static
     * @memberOf async
     * @see async.queue
     * @category Control Flow
     * @param {Function} worker - An asynchronous function for processing an array
     * of queued tasks, which must call its `callback(err)` argument when finished,
     * with an optional `err` argument. Invoked with (tasks, callback).
     * @param {number} [payload=Infinity] - An optional `integer` for determining
     * how many tasks should be processed per round; if omitted, the default is
     * unlimited.
     * @returns {cargo} A cargo object to manage the tasks. Callbacks can
     * attached as certain properties to listen for specific events during the
     * lifecycle of the cargo and inner queue.
     * @example
     *
     * // create a cargo object with payload 2
     * var cargo = async.cargo(function(tasks, callback) {
     *     for (var i=0; i<tasks.length; i++) {
     *         console.log('hello ' + tasks[i].name);
     *     }
     *     callback();
     * }, 2);
     *
     * // add some items
     * cargo.push({name: 'foo'}, function(err) {
     *     console.log('finished processing foo');
     * });
     * cargo.push({name: 'bar'}, function(err) {
     *     console.log('finished processing bar');
     * });
     * cargo.push({name: 'baz'}, function(err) {
     *     console.log('finished processing baz');
     * });
     */
    function cargo(worker, payload) {
      return queue(worker, 1, payload);
    }

    /**
     * The same as `eachOf` but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name eachOfLimit
     * @static
     * @memberOf async
     * @see async.eachOf
     * @alias forEachOfLimit
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each
     * item in `coll`. The `key` is the item's key, or index in the case of an
     * array. The iteratee is passed a `callback(err)` which must be called once it
     * has completed. If no error has occurred, the callback should be run without
     * arguments or with an explicit `null` argument. Invoked with
     * (item, key, callback).
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     */
    function eachOfLimit(obj, limit, iteratee, cb) {
      _eachOfLimit(limit)(obj, iteratee, cb);
    }

    /**
     * The same as `eachOf` but runs only a single async operation at a time.
     *
     * @name eachOfSeries
     * @static
     * @memberOf async
     * @see async.eachOf
     * @alias forEachOfSeries
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`. The
     * `key` is the item's key, or index in the case of an array. The iteratee is
     * passed a `callback(err)` which must be called once it has completed. If no
     * error has occurred, the callback should be run without arguments or with an
     * explicit `null` argument. Invoked with (item, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Invoked with (err).
     */
    var eachOfSeries = doLimit(eachOfLimit, 1);

    /**
     * Reduces `coll` into a single value using an async `iteratee` to return each
     * successive step. `memo` is the initial state of the reduction. This function
     * only operates in series.
     *
     * For performance reasons, it may make sense to split a call to this function
     * into a parallel map, and then use the normal `Array.prototype.reduce` on the
     * results. This function is for situations where each step in the reduction
     * needs to be async; if you can get the data before reducing it, then it's
     * probably a good idea to do so.
     *
     * @name reduce
     * @static
     * @memberOf async
     * @alias inject, foldl
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {*} memo - The initial state of the reduction.
     * @param {Function} iteratee - A function applied to each item in the
     * array to produce the next step in the reduction. The `iteratee` is passed a
     * `callback(err, reduction)` which accepts an optional error as its first
     * argument, and the state of the reduction as the second. If an error is
     * passed to the callback, the reduction is stopped and the main `callback` is
     * immediately called with the error. Invoked with (memo, item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result is the reduced value. Invoked with
     * (err, result).
     * @example
     *
     * async.reduce([1,2,3], 0, function(memo, item, callback) {
     *     // pointless async:
     *     process.nextTick(function() {
     *         callback(null, memo + item)
     *     });
     * }, function(err, result) {
     *     // result is now equal to the last value of memo, which is 6
     * });
     */
    function reduce(arr, memo, iteratee, cb) {
        eachOfSeries(arr, function (x, i, cb) {
            iteratee(memo, x, function (err, v) {
                memo = v;
                cb(err);
            });
        }, function (err) {
            cb(err, memo);
        });
    }

    /**
     * Version of the compose function that is more natural to read. Each function
     * consumes the return value of the previous function. It is the equivalent of
     * {@link async.compose} with the arguments reversed.
     *
     * Each function is executed with the `this` binding of the composed function.
     *
     * @name seq
     * @static
     * @memberOf async
     * @see async.compose
     * @category Control Flow
     * @param {...Function} functions - the asynchronous functions to compose
     * @example
     *
     * // Requires lodash (or underscore), express3 and dresende's orm2.
     * // Part of an app, that fetches cats of the logged user.
     * // This example uses `seq` function to avoid overnesting and error
     * // handling clutter.
     * app.get('/cats', function(request, response) {
     *     var User = request.models.User;
     *     async.seq(
     *         _.bind(User.get, User),  // 'User.get' has signature (id, callback(err, data))
     *         function(user, fn) {
     *             user.getCats(fn);      // 'getCats' has signature (callback(err, data))
     *         }
     *     )(req.session.user_id, function (err, cats) {
     *         if (err) {
     *             console.error(err);
     *             response.json({ status: 'error', message: err.message });
     *         } else {
     *             response.json({ status: 'ok', message: 'Cats found', data: cats });
     *         }
     *     });
     * });
     */
    function seq() /* functions... */{
        var fns = arguments;
        return rest(function (args) {
            var that = this;

            var cb = args[args.length - 1];
            if (typeof cb == 'function') {
                args.pop();
            } else {
                cb = noop;
            }

            reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([rest(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            }, function (err, results) {
                cb.apply(that, [err].concat(results));
            });
        });
    }

    var reverse = Array.prototype.reverse;

    /**
     * Creates a function which is a composition of the passed asynchronous
     * functions. Each function consumes the return value of the function that
     * follows. Composing functions `f()`, `g()`, and `h()` would produce the result
     * of `f(g(h()))`, only this version uses callbacks to obtain the return values.
     *
     * Each function is executed with the `this` binding of the composed function.
     *
     * @name compose
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {...Function} functions - the asynchronous functions to compose
     * @example
     *
     * function add1(n, callback) {
     *     setTimeout(function () {
     *         callback(null, n + 1);
     *     }, 10);
     * }
     *
     * function mul3(n, callback) {
     *     setTimeout(function () {
     *         callback(null, n * 3);
     *     }, 10);
     * }
     *
     * var add1mul3 = async.compose(mul3, add1);
     * add1mul3(4, function (err, result) {
     *     // result now equals 15
     * });
     */
    function compose() /* functions... */{
      return seq.apply(null, reverse.call(arguments));
    }

    function concat$1(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }

    /**
     * Like `each`, except that it passes the key (or index) as the second argument
     * to the iteratee.
     *
     * @name eachOf
     * @static
     * @memberOf async
     * @alias forEachOf
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each
     * item in `coll`. The `key` is the item's key, or index in the case of an
     * array. The iteratee is passed a `callback(err)` which must be called once it
     * has completed. If no error has occurred, the callback should be run without
     * arguments or with an explicit `null` argument. Invoked with
     * (item, key, callback).
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     * @example
     *
     * var obj = {dev: "/dev.json", test: "/test.json", prod: "/prod.json"};
     * var configs = {};
     *
     * async.forEachOf(obj, function (value, key, callback) {
     *     fs.readFile(__dirname + value, "utf8", function (err, data) {
     *         if (err) return callback(err);
     *         try {
     *             configs[key] = JSON.parse(data);
     *         } catch (e) {
     *             return callback(e);
     *         }
     *         callback();
     *     });
     * }, function (err) {
     *     if (err) console.error(err.message);
     *     // configs is now a map of JSON data
     *     doSomethingWith(configs);
     * });
     */
    var eachOf = doLimit(eachOfLimit, Infinity);

    function doParallel(fn) {
        return function (obj, iteratee, callback) {
            return fn(eachOf, obj, iteratee, callback);
        };
    }

    /**
     * Applies `iteratee` to each item in `coll`, concatenating the results. Returns
     * the concatenated list. The `iteratee`s are called in parallel, and the
     * results are concatenated as they return. There is no guarantee that the
     * results array will be returned in the original order of `coll` passed to the
     * `iteratee` function.
     *
     * @name concat
     * @static
     * @memberOf async
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, results)` which must be called once
     * it has completed with an error (which can be `null`) and an array of results.
     * Invoked with (item, callback).
     * @param {Function} [callback(err)] - A callback which is called after all the
     * `iteratee` functions have finished, or an error occurs. Results is an array
     * containing the concatenated results of the `iteratee` function. Invoked with
     * (err, results).
     * @example
     *
     * async.concat(['dir1','dir2','dir3'], fs.readdir, function(err, files) {
     *     // files is now a list of filenames that exist in the 3 directories
     * });
     */
    var concat = doParallel(concat$1);

    function doSeries(fn) {
        return function (obj, iteratee, callback) {
            return fn(eachOfSeries, obj, iteratee, callback);
        };
    }

    /**
     * The same as `concat` but runs only a single async operation at a time.
     *
     * @name concatSeries
     * @static
     * @memberOf async
     * @see async.concat
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, results)` which must be called once
     * it has completed with an error (which can be `null`) and an array of results.
     * Invoked with (item, callback).
     * @param {Function} [callback(err)] - A callback which is called after all the
     * `iteratee` functions have finished, or an error occurs. Results is an array
     * containing the concatenated results of the `iteratee` function. Invoked with
     * (err, results).
     */
    var concatSeries = doSeries(concat$1);

    /**
     * Returns a function that when called, calls-back with the values provided.
     * Useful as the first function in a `waterfall`, or for plugging values in to
     * `auto`.
     *
     * @name constant
     * @static
     * @memberOf async
     * @category Util
     * @param {...*} arguments... - Any number of arguments to automatically invoke
     * callback with.
     * @returns {Function} Returns a function that when invoked, automatically
     * invokes the callback with the previous given arguments.
     * @example
     *
     * async.waterfall([
     *     async.constant(42),
     *     function (value, next) {
     *         // value === 42
     *     },
     *     //...
     * ], callback);
     *
     * async.waterfall([
     *     async.constant(filename, "utf8"),
     *     fs.readFile,
     *     function (fileData, next) {
     *         //...
     *     }
     *     //...
     * ], callback);
     *
     * async.auto({
     *     hostname: async.constant("https://server.net/"),
     *     port: findFreePort,
     *     launchServer: ["hostname", "port", function (options, cb) {
     *         startServer(options, cb);
     *     }],
     *     //...
     * }, callback);
     */
    var constant = rest(function (values) {
        var args = [null].concat(values);
        return initialParams(function (ignoredArgs, callback) {
            return callback.apply(this, args);
        });
    });

    function _createTester(eachfn, check, getResult) {
        return function (arr, limit, iteratee, cb) {
            function done(err) {
                if (cb) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, getResult(false));
                    }
                }
            }
            function wrappedIteratee(x, _, callback) {
                if (!cb) return callback();
                iteratee(x, function (err, v) {
                    if (cb) {
                        if (err) {
                            cb(err);
                            cb = iteratee = false;
                        } else if (check(v)) {
                            cb(null, getResult(true, x));
                            cb = iteratee = false;
                        }
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                cb = cb || noop;
                eachfn(arr, limit, wrappedIteratee, done);
            } else {
                cb = iteratee;
                cb = cb || noop;
                iteratee = limit;
                eachfn(arr, wrappedIteratee, done);
            }
        };
    }

    function _findGetResult(v, x) {
        return x;
    }

    /**
     * Returns the first value in `coll` that passes an async truth test. The
     * `iteratee` is applied in parallel, meaning the first iteratee to return
     * `true` will fire the detect `callback` with that result. That means the
     * result might not be the first item in the original `coll` (in terms of order)
     * that passes the test.

     * If order within the original `coll` is important, then look at
     * `detectSeries`.
     *
     * @name detect
     * @static
     * @memberOf async
     * @alias find
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, truthValue)` which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the `iteratee` functions have finished.
     * Result will be the first item in the array that passes the truth test
     * (iteratee) or the value `undefined` if none passed. Invoked with
     * (err, result).
     * @example
     *
     * async.detect(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, result) {
     *     // result now equals the first file in the list that exists
     * });
     */
    var detect = _createTester(eachOf, identity, _findGetResult);

    /**
     * The same as `detect` but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name detectLimit
     * @static
     * @memberOf async
     * @see async.detect
     * @alias findLimit
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, truthValue)` which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the `iteratee` functions have finished.
     * Result will be the first item in the array that passes the truth test
     * (iteratee) or the value `undefined` if none passed. Invoked with
     * (err, result).
     */
    var detectLimit = _createTester(eachOfLimit, identity, _findGetResult);

    /**
     * The same as `detect` but runs only a single async operation at a time.
     *
     * @name detectSeries
     * @static
     * @memberOf async
     * @see async.detect
     * @alias findSeries
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, truthValue)` which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the `iteratee` functions have finished.
     * Result will be the first item in the array that passes the truth test
     * (iteratee) or the value `undefined` if none passed. Invoked with
     * (err, result).
     */
    var detectSeries = _createTester(eachOfSeries, identity, _findGetResult);

    function consoleFunc(name) {
        return rest(function (fn, args) {
            fn.apply(null, args.concat([rest(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    } else if (console[name]) {
                        arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }

    /**
     * Logs the result of an `async` function to the `console` using `console.dir`
     * to display the properties of the resulting object. Only works in Node.js or
     * in browsers that support `console.dir` and `console.error` (such as FF and
     * Chrome). If multiple arguments are returned from the async function,
     * `console.dir` is called on each argument in order.
     *
     * @name log
     * @static
     * @memberOf async
     * @category Util
     * @param {Function} function - The function you want to eventually apply all
     * arguments to.
     * @param {...*} arguments... - Any number of arguments to apply to the function.
     * @example
     *
     * // in a module
     * var hello = function(name, callback) {
     *     setTimeout(function() {
     *         callback(null, {hello: name});
     *     }, 1000);
     * };
     *
     * // in the node repl
     * node> async.dir(hello, 'world');
     * {hello: 'world'}
     */
    var dir = consoleFunc('dir');

    /**
     * Like {@link async.whilst}, except the `test` is an asynchronous function that
     * is passed a callback in the form of `function (err, truth)`. If error is
     * passed to `test` or `fn`, the main callback is immediately called with the
     * value of the error.
     *
     * @name during
     * @static
     * @memberOf async
     * @see async.whilst
     * @category Control Flow
     * @param {Function} test - asynchronous truth test to perform before each
     * execution of `fn`. Invoked with (callback).
     * @param {Function} fn - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     * @example
     *
     * var count = 0;
     *
     * async.during(
     *     function (callback) {
     *         return callback(null, count < 5);
     *     },
     *     function (callback) {
     *         count++;
     *         setTimeout(callback, 1000);
     *     },
     *     function (err) {
     *         // 5 seconds have passed
     *     }
     * );
     */
    function during(test, iteratee, cb) {
        cb = cb || noop;

        var next = rest(function (err, args) {
            if (err) {
                cb(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function (err, truth) {
            if (err) return cb(err);
            if (!truth) return cb(null);
            iteratee(next);
        };

        test(check);
    }

    /**
     * The post-check version of {@link async.during}. To reflect the difference in
     * the order of operations, the arguments `test` and `fn` are switched.
     *
     * Also a version of {@link async.doWhilst} with asynchronous `test` function.
     * @name doDuring
     * @static
     * @memberOf async
     * @see async.during
     * @category Control Flow
     * @param {Function} fn - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} test - asynchronous truth test to perform before each
     * execution of `fn`. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     */
    function doDuring(iteratee, test, cb) {
        var calls = 0;

        during(function (next) {
            if (calls++ < 1) return next(null, true);
            test.apply(this, arguments);
        }, iteratee, cb);
    }

    /**
     * Repeatedly call `fn`, while `test` returns `true`. Calls `callback` when
     * stopped, or an error occurs.
     *
     * @name whilst
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Function} test - synchronous truth test to perform before each
     * execution of `fn`. Invoked with ().
     * @param {Function} fn - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     * @example
     *
     * var count = 0;
     * async.whilst(
     *     function() { return count < 5; },
     *     function(callback) {
     *         count++;
     *         setTimeout(function() {
     *             callback(null, count);
     *         }, 1000);
     *     },
     *     function (err, n) {
     *         // 5 seconds have passed, n = 5
     *     }
     * );
     */
    function whilst(test, iteratee, cb) {
        cb = cb || noop;
        if (!test()) return cb(null);
        var next = rest(function (err, args) {
            if (err) return cb(err);
            if (test.apply(this, args)) return iteratee(next);
            cb.apply(null, [null].concat(args));
        });
        iteratee(next);
    }

    /**
     * The post-check version of {@link async.whilst}. To reflect the difference in
     * the order of operations, the arguments `test` and `fn` are switched.
     *
     * `doWhilst` is to `whilst` as `do while` is to `while` in plain JavaScript.
     *
     * @name doWhilst
     * @static
     * @memberOf async
     * @see async.whilst
     * @category Control Flow
     * @param {Function} fn - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} test - synchronous truth test to perform after each
     * execution of `fn`. Invoked with Invoked with the non-error callback results
     * of `fn`.
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     */
    function doWhilst(iteratee, test, cb) {
        var calls = 0;
        return whilst(function () {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iteratee, cb);
    }

    /**
     * Like {@link async.doWhilst}, except the `test` is inverted. Note the
     * argument ordering differs from `until`.
     *
     * @name doUntil
     * @static
     * @memberOf async
     * @see async.doWhilst
     * @category Control Flow
     * @param {Function} fn - A function which is called each time `test` fails.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} test - synchronous truth test to perform after each
     * execution of `fn`. Invoked with the non-error callback results of `fn`.
     * @param {Function} [callback] - A callback which is called after the test
     * function has passed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     */
    function doUntil(iteratee, test, cb) {
        return doWhilst(iteratee, function () {
            return !test.apply(this, arguments);
        }, cb);
    }

    function _withoutIndex(iteratee) {
        return function (value, index, callback) {
            return iteratee(value, callback);
        };
    }

    /**
     * The same as `each` but runs a maximum of `limit` async operations at a time.
     *
     * @name eachLimit
     * @static
     * @memberOf async
     * @see async.each
     * @alias forEachLimit
     * @category Collection
     * @param {Array|Object} coll - A colleciton to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each item in `coll`. The
     * iteratee is passed a `callback(err)` which must be called once it has
     * completed. If no error has occurred, the `callback` should be run without
     * arguments or with an explicit `null` argument. The array index is not passed
     * to the iteratee. Invoked with (item, callback). If you need the index, use
     * `eachOfLimit`.
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     */
    function eachLimit(arr, limit, iteratee, cb) {
      return _eachOfLimit(limit)(arr, _withoutIndex(iteratee), cb);
    }

    /**
     * Applies the function `iteratee` to each item in `coll`, in parallel.
     * The `iteratee` is called with an item from the list, and a callback for when
     * it has finished. If the `iteratee` passes an error to its `callback`, the
     * main `callback` (for the `each` function) is immediately called with the
     * error.
     *
     * Note, that since this function applies `iteratee` to each item in parallel,
     * there is no guarantee that the iteratee functions will complete in order.
     *
     * @name each
     * @static
     * @memberOf async
     * @alias forEach
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item
     * in `coll`. The iteratee is passed a `callback(err)` which must be called once
     * it has completed. If no error has occurred, the `callback` should be run
     * without arguments or with an explicit `null` argument. The array index is not
     * passed to the iteratee. Invoked with (item, callback). If you need the index,
     * use `eachOf`.
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     * @example
     *
     * // assuming openFiles is an array of file names and saveFile is a function
     * // to save the modified contents of that file:
     *
     * async.each(openFiles, saveFile, function(err){
     *   // if any of the saves produced an error, err would equal that error
     * });
     *
     * // assuming openFiles is an array of file names
     * async.each(openFiles, function(file, callback) {
     *
     *     // Perform operation on file here.
     *     console.log('Processing file ' + file);
     *
     *     if( file.length > 32 ) {
     *       console.log('This file name is too long');
     *       callback('File name too long');
     *     } else {
     *       // Do work to process file here
     *       console.log('File processed');
     *       callback();
     *     }
     * }, function(err) {
     *     // if any of the file processing produced an error, err would equal that error
     *     if( err ) {
     *       // One of the iterations produced an error.
     *       // All processing will now stop.
     *       console.log('A file failed to process');
     *     } else {
     *       console.log('All files have been processed successfully');
     *     }
     * });
     */
    var each = doLimit(eachLimit, Infinity);

    /**
     * The same as `each` but runs only a single async operation at a time.
     *
     * @name eachSeries
     * @static
     * @memberOf async
     * @see async.each
     * @alias forEachSeries
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each
     * item in `coll`. The iteratee is passed a `callback(err)` which must be called
     * once it has completed. If no error has occurred, the `callback` should be run
     * without arguments or with an explicit `null` argument. The array index is
     * not passed to the iteratee. Invoked with (item, callback). If you need the
     * index, use `eachOfSeries`.
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     */
    var eachSeries = doLimit(eachLimit, 1);

    /**
     * Wrap an async function and ensure it calls its callback on a later tick of
     * the event loop.  If the function already calls its callback on a next tick,
     * no extra deferral is added. This is useful for preventing stack overflows
     * (`RangeError: Maximum call stack size exceeded`) and generally keeping
     * [Zalgo](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)
     * contained.
     *
     * @name ensureAsync
     * @static
     * @memberOf async
     * @category Util
     * @param {Function} fn - an async function, one that expects a node-style
     * callback as its last argument.
     * @returns {Function} Returns a wrapped function with the exact same call
     * signature as the function passed in.
     * @example
     *
     * function sometimesAsync(arg, callback) {
     *     if (cache[arg]) {
     *         return callback(null, cache[arg]); // this would be synchronous!!
     *     } else {
     *         doSomeIO(arg, callback); // this IO would be asynchronous
     *     }
     * }
     *
     * // this has a risk of stack overflows if many results are cached in a row
     * async.mapSeries(args, sometimesAsync, done);
     *
     * // this will defer sometimesAsync's callback if necessary,
     * // preventing stack overflows
     * async.mapSeries(args, async.ensureAsync(sometimesAsync), done);
     */
    function ensureAsync(fn) {
        return initialParams(function (args, callback) {
            var sync = true;
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    setImmediate$1(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            fn.apply(this, args);
            sync = false;
        });
    }

    function notId(v) {
        return !v;
    }

    /**
     * The same as `every` but runs a maximum of `limit` async operations at a time.
     *
     * @name everyLimit
     * @static
     * @memberOf async
     * @see async.every
     * @alias allLimit
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in the
     * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
     * which must be called with a  boolean argument once it has completed. Invoked
     * with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result will be either `true` or `false`
     * depending on the values of the async tests. Invoked with (err, result).
     */
    var everyLimit = _createTester(eachOfLimit, notId, notId);

    /**
     * Returns `true` if every element in `coll` satisfies an async test. If any
     * iteratee call returns `false`, the main `callback` is immediately called.
     *
     * @name every
     * @static
     * @memberOf async
     * @alias all
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the
     * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
     * which must be called with a  boolean argument once it has completed. Invoked
     * with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result will be either `true` or `false`
     * depending on the values of the async tests. Invoked with (err, result).
     * @example
     *
     * async.every(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, result) {
     *     // if result is true then every file exists
     * });
     */
    var every = doLimit(everyLimit, Infinity);

    /**
     * The same as `every` but runs only a single async operation at a time.
     *
     * @name everySeries
     * @static
     * @memberOf async
     * @see async.every
     * @alias allSeries
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the
     * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
     * which must be called with a  boolean argument once it has completed. Invoked
     * with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result will be either `true` or `false`
     * depending on the values of the async tests. Invoked with (err, result).
     */
    var everySeries = doLimit(everyLimit, 1);

    function _filter(eachfn, arr, iteratee, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iteratee(x, function (err, v) {
                if (err) {
                    callback(err);
                } else {
                    if (v) {
                        results.push({ index: index, value: x });
                    }
                    callback();
                }
            });
        }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, arrayMap(results.sort(function (a, b) {
                    return a.index - b.index;
                }), baseProperty('value')));
            }
        });
    }

    /**
     * The same as `filter` but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name filterLimit
     * @static
     * @memberOf async
     * @see async.filter
     * @alias selectLimit
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     */
    var filterLimit = doParallelLimit(_filter);

    /**
     * Returns a new array of all the values in `coll` which pass an async truth
     * test. This operation is performed in parallel, but the results array will be
     * in the same order as the original.
     *
     * @name filter
     * @static
     * @memberOf async
     * @alias select
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     * @example
     *
     * async.filter(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, results) {
     *     // results now equals an array of the existing files
     * });
     */
    var filter = doLimit(filterLimit, Infinity);

    /**
     * The same as `filter` but runs only a single async operation at a time.
     *
     * @name filterSeries
     * @static
     * @memberOf async
     * @see async.filter
     * @alias selectSeries
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results)
     */
    var filterSeries = doLimit(filterLimit, 1);

    /**
     * Calls the asynchronous function `fn` with a callback parameter that allows it
     * to call itself again, in series, indefinitely.

     * If an error is passed to the
     * callback then `errback` is called with the error, and execution stops,
     * otherwise it will never be called.
     *
     * @name forever
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Function} fn - a function to call repeatedly. Invoked with (next).
     * @param {Function} [errback] - when `fn` passes an error to it's callback,
     * this function will be called, and execution stops. Invoked with (err).
     * @example
     *
     * async.forever(
     *     function(next) {
     *         // next is suitable for passing to things that need a callback(err [, whatever]);
     *         // it will result in this function being called again.
     *     },
     *     function(err) {
     *         // if next is called with a value in its first parameter, it will appear
     *         // in here as 'err', and execution will stop.
     *     }
     * );
     */
    function forever(fn, cb) {
        var done = onlyOnce(cb || noop);
        var task = ensureAsync(fn);

        function next(err) {
            if (err) return done(err);
            task(next);
        }
        next();
    }

    /**
     * Creates an iterator function which calls the next function in the `tasks`
     * array, returning a continuation to call the next one after that. It's also
     * possible to “peek” at the next iterator with `iterator.next()`.
     *
     * This function is used internally by the `async` module, but can be useful
     * when you want to manually control the flow of functions in series.
     *
     * @name iterator
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Array} tasks - An array of functions to run.
     * @returns The next function to run in the series.
     * @example
     *
     * var iterator = async.iterator([
     *     function() { sys.p('one'); },
     *     function() { sys.p('two'); },
     *     function() { sys.p('three'); }
     * ]);
     *
     * node> var iterator2 = iterator();
     * 'one'
     * node> var iterator3 = iterator2();
     * 'two'
     * node> iterator3();
     * 'three'
     * node> var nextfn = iterator2.next();
     * node> nextfn();
     * 'three'
     */
    function iterator$1 (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return index < tasks.length - 1 ? makeCallback(index + 1) : null;
            };
            return fn;
        }
        return makeCallback(0);
    }

    /**
     * Logs the result of an `async` function to the `console`. Only works in
     * Node.js or in browsers that support `console.log` and `console.error` (such
     * as FF and Chrome). If multiple arguments are returned from the async
     * function, `console.log` is called on each argument in order.
     *
     * @name log
     * @static
     * @memberOf async
     * @category Util
     * @param {Function} function - The function you want to eventually apply all
     * arguments to.
     * @param {...*} arguments... - Any number of arguments to apply to the function.
     * @example
     *
     * // in a module
     * var hello = function(name, callback) {
     *     setTimeout(function() {
     *         callback(null, 'hello ' + name);
     *     }, 1000);
     * };
     *
     * // in the node repl
     * node> async.log(hello, 'world');
     * 'hello world'
     */
    var log = consoleFunc('log');

    /**
     * The same as `mapValues` but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name mapValuesLimit
     * @static
     * @memberOf async
     * @see async.mapValues
     * @category Collection
     * @param {Object} obj - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each value in `obj`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed value. Invoked with (value, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Result is an object of the
     * transformed values from the `obj`. Invoked with (err, result).
     */
    function mapValuesLimit(obj, limit, iteratee, callback) {
        var newObj = {};
        eachOfLimit(obj, limit, function (val, key, next) {
            iteratee(val, key, function (err, result) {
                if (err) return next(err);
                newObj[key] = result;
                next();
            });
        }, function (err) {
            callback(err, newObj);
        });
    }

    /**
     * A relative of `map`, designed for use with objects.
     *
     * Produces a new Object by mapping each value of `obj` through the `iteratee`
     * function. The `iteratee` is called each `value` and `key` from `obj` and a
     * callback for when it has finished processing. Each of these callbacks takes
     * two arguments: an `error`, and the transformed item from `obj`. If `iteratee`
     * passes an error to its callback, the main `callback` (for the `mapValues`
     * function) is immediately called with the error.
     *
     * Note, the order of the keys in the result is not guaranteed.  The keys will
     * be roughly in the order they complete, (but this is very engine-specific)
     *
     * @name mapValues
     * @static
     * @memberOf async
     * @category Collection
     * @param {Object} obj - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each value and key in
     * `coll`. The iteratee is passed a `callback(err, transformed)` which must be
     * called once it has completed with an error (which can be `null`) and a
     * transformed value. Invoked with (value, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an array of the
     * transformed items from the `obj`. Invoked with (err, result).
     * @example
     *
     * async.mapValues({
     *     f1: 'file1',
     *     f2: 'file2',
     *     f3: 'file3'
     * }, fs.stat, function(err, result) {
     *     // results is now a map of stats for each file, e.g.
     *     // {
     *     //     f1: [stats for file1],
     *     //     f2: [stats for file2],
     *     //     f3: [stats for file3]
     *     // }
     * });
     */

    var mapValues = doLimit(mapValuesLimit, Infinity);

    /**
     * The same as `mapValues` but runs only a single async operation at a time.
     *
     * @name mapValuesSeries
     * @static
     * @memberOf async
     * @see async.mapValues
     * @category Collection
     * @param {Object} obj - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each value in `obj`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed value. Invoked with (value, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Result is an object of the
     * transformed values from the `obj`. Invoked with (err, result).
     */
    var mapValuesSeries = doLimit(mapValuesLimit, 1);

    function has(obj, key) {
        return key in obj;
    }

    /**
     * Caches the results of an `async` function. When creating a hash to store
     * function results against, the callback is omitted from the hash and an
     * optional hash function can be used.
     *
     * If no hash function is specified, the first argument is used as a hash key,
     * which may work reasonably if it is a string or a data type that converts to a
     * distinct string. Note that objects and arrays will not behave reasonably.
     * Neither will cases where the other arguments are significant. In such cases,
     * specify your own hash function.
     *
     * The cache of results is exposed as the `memo` property of the function
     * returned by `memoize`.
     *
     * @name memoize
     * @static
     * @memberOf async
     * @category Util
     * @param {Function} fn - The function to proxy and cache results from.
     * @param {Function} hasher - An optional function for generating a custom hash
     * for storing results. It has all the arguments applied to it apart from the
     * callback, and must be synchronous.
     * @example
     *
     * var slow_fn = function(name, callback) {
     *     // do something
     *     callback(null, result);
     * };
     * var fn = async.memoize(slow_fn);
     *
     * // fn can now be used as if it were slow_fn
     * fn('some name', function() {
     *     // callback
     * });
     */
    function memoize$1(fn, hasher) {
        var memo = Object.create(null);
        var queues = Object.create(null);
        hasher = hasher || identity;
        var memoized = initialParams(function memoized(args, callback) {
            var key = hasher.apply(null, args);
            if (has(memo, key)) {
                setImmediate$1(function () {
                    callback.apply(null, memo[key]);
                });
            } else if (has(queues, key)) {
                queues[key].push(callback);
            } else {
                queues[key] = [callback];
                fn.apply(null, args.concat([rest(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    }

    /**
     * Calls `callback` on a later loop around the event loop. In Node.js this just
     * calls `setImmediate`.  In the browser it will use `setImmediate` if
     * available, otherwise `setTimeout(callback, 0)`, which means other higher
     * priority events may precede the execution of `callback`.
     *
     * This is used internally for browser-compatibility purposes.
     *
     * @name nextTick
     * @static
     * @memberOf async
     * @alias setImmediate
     * @category Util
     * @param {Function} callback - The function to call on a later loop around
     * the event loop. Invoked with (args...).
     * @param {...*} args... - any number of additional arguments to pass to the
     * callback on the next tick.
     * @example
     *
     * var call_order = [];
     * async.nextTick(function() {
     *     call_order.push('two');
     *     // call_order now equals ['one','two']
     * });
     * call_order.push('one');
     *
     * async.setImmediate(function (a, b, c) {
     *     // a, b, and c equal 1, 2, and 3
     * }, 1, 2, 3);
     */
    var _defer$1;

    if (hasNextTick) {
        _defer$1 = process.nextTick;
    } else if (hasSetImmediate) {
        _defer$1 = setImmediate;
    } else {
        _defer$1 = fallback;
    }

    var nextTick = wrap(_defer$1);

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(rest(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    /**
     * The same as `parallel` but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name parallel
     * @static
     * @memberOf async
     * @see async.parallel
     * @category Control Flow
     * @param {Array|Collection} tasks - A collection containing functions to run.
     * Each function is passed a `callback(err, result)` which it must call on
     * completion with an error `err` (which can be `null`) and an optional `result`
     * value.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed successfully. This function gets a results array
     * (or object) containing all the result arguments passed to the task callbacks.
     * Invoked with (err, results).
     */
    function parallelLimit(tasks, limit, cb) {
      return _parallel(_eachOfLimit(limit), tasks, cb);
    }

    /**
     * Run the `tasks` collection of functions in parallel, without waiting until
     * the previous function has completed. If any of the functions pass an error to
     * its callback, the main `callback` is immediately called with the value of the
     * error. Once the `tasks` have completed, the results are passed to the final
     * `callback` as an array.
     *
     * **Note:** `parallel` is about kicking-off I/O tasks in parallel, not about
     * parallel execution of code.  If your tasks do not use any timers or perform
     * any I/O, they will actually be executed in series.  Any synchronous setup
     * sections for each task will happen one after the other.  JavaScript remains
     * single-threaded.
     *
     * It is also possible to use an object instead of an array. Each property will
     * be run as a function and the results will be passed to the final `callback`
     * as an object instead of an array. This can be a more readable way of handling
     * results from {@link async.parallel}.
     *
     * @name parallel
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Array|Object} tasks - A collection containing functions to run.
     * Each function is passed a `callback(err, result)` which it must call on
     * completion with an error `err` (which can be `null`) and an optional `result`
     * value.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed successfully. This function gets a results array
     * (or object) containing all the result arguments passed to the task callbacks.
     * Invoked with (err, results).
     * @example
     * async.parallel([
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'one');
     *         }, 200);
     *     },
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'two');
     *         }, 100);
     *     }
     * ],
     * // optional callback
     * function(err, results) {
     *     // the results array will equal ['one','two'] even though
     *     // the second function had a shorter timeout.
     * });
     *
     * // an example using an object instead of an array
     * async.parallel({
     *     one: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 1);
     *         }, 200);
     *     },
     *     two: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 2);
     *         }, 100);
     *     }
     * }, function(err, results) {
     *     // results is now equals to: {one: 1, two: 2}
     * });
     */
    var parallel = doLimit(parallelLimit, Infinity);

    /**
     * A queue of tasks for the worker function to complete.
     * @typedef {Object} queue
     * @property {Function} length - a function returning the number of items
     * waiting to be processed. Invoke with ().
     * @property {Function} started - a function returning whether or not any
     * items have been pushed and processed by the queue. Invoke with ().
     * @property {Function} running - a function returning the number of items
     * currently being processed. Invoke with ().
     * @property {Function} workersList - a function returning the array of items
     * currently being processed. Invoke with ().
     * @property {Function} idle - a function returning false if there are items
     * waiting or being processed, or true if not. Invoke with ().
     * @property {number} concurrency - an integer for determining how many `worker`
     * functions should be run in parallel. This property can be changed after a
     * `queue` is created to alter the concurrency on-the-fly.
     * @property {Function} push - add a new task to the `queue`. Calls `callback`
     * once the `worker` has finished processing the task. Instead of a single task,
     * a `tasks` array can be submitted. The respective callback is used for every
     * task in the list. Invoke with (task, [callback]),
     * @property {Function} unshift - add a new task to the front of the `queue`.
     * Invoke with (task, [callback]).
     * @property {Function} saturated - a callback that is called when the number of
     * running workers hits the `concurrency` limit, and further tasks will be
     * queued.
     * @property {Function} unsaturated - a callback that is called when the number
     * of running workers is less than the `concurrency` & `buffer` limits, and
     * further tasks will not be queued.
     * @property {number} buffer - A minimum threshold buffer in order to say that
     * the `queue` is `unsaturated`.
     * @property {Function} empty - a callback that is called when the last item
     * from the `queue` is given to a `worker`.
     * @property {Function} drain - a callback that is called when the last item
     * from the `queue` has returned from the `worker`.
     * @property {Function} error - a callback that is called when a task errors.
     * Has the signature `function(error, task)`.
     * @property {boolean} paused - a boolean for determining whether the queue is
     * in a paused state.
     * @property {Function} pause - a function that pauses the processing of tasks
     * until `resume()` is called. Invoke with ().
     * @property {Function} resume - a function that resumes the processing of
     * queued tasks when the queue is paused. Invoke with ().
     * @property {Function} kill - a function that removes the `drain` callback and
     * empties remaining tasks from the queue forcing it to go idle. Invoke with ().
     */

    /**
     * Creates a `queue` object with the specified `concurrency`. Tasks added to the
     * `queue` are processed in parallel (up to the `concurrency` limit). If all
     * `worker`s are in progress, the task is queued until one becomes available.
     * Once a `worker` completes a `task`, that `task`'s callback is called.
     *
     * @name queue
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Function} worker - An asynchronous function for processing a queued
     * task, which must call its `callback(err)` argument when finished, with an
     * optional `error` as an argument.  If you want to handle errors from an
     * individual task, pass a callback to `q.push()`. Invoked with
     * (task, callback).
     * @param {number} [concurrency=1] - An `integer` for determining how many
     * `worker` functions should be run in parallel.  If omitted, the concurrency
     * defaults to `1`.  If the concurrency is `0`, an error is thrown.
     * @returns {queue} A queue object to manage the tasks. Callbacks can
     * attached as certain properties to listen for specific events during the
     * lifecycle of the queue.
     * @example
     *
     * // create a queue object with concurrency 2
     * var q = async.queue(function(task, callback) {
     *     console.log('hello ' + task.name);
     *     callback();
     * }, 2);
     *
     * // assign a callback
     * q.drain = function() {
     *     console.log('all items have been processed');
     * };
     *
     * // add some items to the queue
     * q.push({name: 'foo'}, function(err) {
     *     console.log('finished processing foo');
     * });
     * q.push({name: 'bar'}, function (err) {
     *     console.log('finished processing bar');
     * });
     *
     * // add some items to the queue (batch-wise)
     * q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
     *     console.log('finished processing item');
     * });
     *
     * // add some items to the front of the queue
     * q.unshift({name: 'bar'}, function (err) {
     *     console.log('finished processing bar');
     * });
     */
    function queue$1 (worker, concurrency) {
      return queue(function (items, cb) {
        worker(items[0], cb);
      }, concurrency, 1);
    }

    /**
     * The same as {@link async.queue} only tasks are assigned a priority and
     * completed in ascending priority order.
     *
     * @name priorityQueue
     * @static
     * @memberOf async
     * @see async.queue
     * @category Control Flow
     * @param {Function} worker - An asynchronous function for processing a queued
     * task, which must call its `callback(err)` argument when finished, with an
     * optional `error` as an argument.  If you want to handle errors from an
     * individual task, pass a callback to `q.push()`. Invoked with
     * (task, callback).
     * @param {number} concurrency - An `integer` for determining how many `worker`
     * functions should be run in parallel.  If omitted, the concurrency defaults to
     * `1`.  If the concurrency is `0`, an error is thrown.
     * @returns {queue} A priorityQueue object to manage the tasks. There are two
     * differences between `queue` and `priorityQueue` objects:
     * * `push(task, priority, [callback])` - `priority` should be a number. If an
     *   array of `tasks` is given, all tasks will be assigned the same priority.
     * * The `unshift` method was removed.
     */
    function priorityQueue (worker, concurrency) {
        function _compareTasks(a, b) {
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + (end - beg + 1 >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== 'function') {
                throw new Error('task callback must be a function');
            }
            q.started = true;
            if (!isArray(data)) {
                data = [data];
            }
            if (data.length === 0) {
                // call drain immediately if there are no tasks
                return setImmediate$1(function () {
                    q.drain();
                });
            }
            arrayEach(data, function (task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                setImmediate$1(q.process);
            });
        }

        // Start with a normal queue
        var q = queue$1(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
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
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length,
            index = fromRight ? length : -1,
            iterable = Object(collection);

        while ((fromRight ? index-- : ++index < length)) {
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
     * _([1, 2]).forEach(function(value) {
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
      var func = isArray(collection) ? arrayEach : baseEach;
      return func(collection, baseIteratee(iteratee, 3));
    }

    /**
     * Runs the `tasks` array of functions in parallel, without waiting until the
     * previous function has completed. Once any the `tasks` completed or pass an
     * error to its callback, the main `callback` is immediately called. It's
     * equivalent to `Promise.race()`.
     *
     * @name race
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Array} tasks - An array containing functions to run. Each function
     * is passed a `callback(err, result)` which it must call on completion with an
     * error `err` (which can be `null`) and an optional `result` value.
     * @param {Function} callback - A callback to run once any of the functions have
     * completed. This function gets an error or result from the first function that
     * completed. Invoked with (err, result).
     * @example
     *
     * async.race([
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'one');
     *         }, 200);
     *     },
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'two');
     *         }, 100);
     *     }
     * ],
     * // main callback
     * function(err, result) {
     *     // the result will be equal to 'two' as it finishes earlier
     * });
     */
    function race(tasks, cb) {
        cb = once(cb || noop);
        if (!isArray(tasks)) return cb(new TypeError('First argument to race must be an array of functions'));
        if (!tasks.length) return cb();
        forEach(tasks, function (task) {
            task(cb);
        });
    }

    var slice = Array.prototype.slice;

    /**
     * Same as `reduce`, only operates on `coll` in reverse order.
     *
     * @name reduceRight
     * @static
     * @memberOf async
     * @see async.reduce
     * @alias foldr
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {*} memo - The initial state of the reduction.
     * @param {Function} iteratee - A function applied to each item in the
     * array to produce the next step in the reduction. The `iteratee` is passed a
     * `callback(err, reduction)` which accepts an optional error as its first
     * argument, and the state of the reduction as the second. If an error is
     * passed to the callback, the reduction is stopped and the main `callback` is
     * immediately called with the error. Invoked with (memo, item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result is the reduced value. Invoked with
     * (err, result).
     */
    function reduceRight(arr, memo, iteratee, cb) {
      var reversed = slice.call(arr).reverse();
      reduce(reversed, memo, iteratee, cb);
    }

    /**
     * Wraps the function in another function that always returns data even when it
     * errors.
     *
     * The object returned has either the property `error` or `value`.
     *
     * @name reflect
     * @static
     * @memberOf async
     * @category Util
     * @param {Function} function - The function you want to wrap
     * @returns {Function} - A function that always passes null to it's callback as
     * the error. The second argument to the callback will be an `object` with
     * either an `error` or a `value` property.
     * @example
     *
     * async.parallel([
     *     async.reflect(function(callback) {
     *         // do some stuff ...
     *         callback(null, 'one');
     *     }),
     *     async.reflect(function(callback) {
     *         // do some more stuff but error ...
     *         callback('bad stuff happened');
     *     }),
     *     async.reflect(function(callback) {
     *         // do some more stuff ...
     *         callback(null, 'two');
     *     })
     * ],
     * // optional callback
     * function(err, results) {
     *     // values
     *     // results[0].value = 'one'
     *     // results[1].error = 'bad stuff happened'
     *     // results[2].value = 'two'
     * });
     */
    function reflect(fn) {
        return initialParams(function reflectOn(args, reflectCallback) {
            args.push(rest(function callback(err, cbArgs) {
                if (err) {
                    reflectCallback(null, {
                        error: err
                    });
                } else {
                    var value = null;
                    if (cbArgs.length === 1) {
                        value = cbArgs[0];
                    } else if (cbArgs.length > 1) {
                        value = cbArgs;
                    }
                    reflectCallback(null, {
                        value: value
                    });
                }
            }));

            return fn.apply(this, args);
        });
    }

    function reject$1(eachfn, arr, iteratee, callback) {
        _filter(eachfn, arr, function (value, cb) {
            iteratee(value, function (err, v) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, !v);
                }
            });
        }, callback);
    }

    /**
     * The same as `reject` but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name rejectLimit
     * @static
     * @memberOf async
     * @see async.reject
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     */
    var rejectLimit = doParallelLimit(reject$1);

    /**
     * The opposite of `filter`. Removes values that pass an `async` truth test.
     *
     * @name reject
     * @static
     * @memberOf async
     * @see async.filter
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     * @example
     *
     * async.reject(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, results) {
     *     // results now equals an array of missing files
     *     createFiles(results);
     * });
     */
    var reject = doLimit(rejectLimit, Infinity);

    /**
     * A helper function that wraps an array of functions with reflect.
     *
     * @name reflectAll
     * @static
     * @memberOf async
     * @see async.reflect
     * @category Util
     * @param {Array} tasks - The array of functions to wrap in `async.reflect`.
     * @returns {Array} Returns an array of functions, each function wrapped in
     * `async.reflect`
     * @example
     *
     * let tasks = [
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'one');
     *         }, 200);
     *     },
     *     function(callback) {
     *         // do some more stuff but error ...
     *         callback(new Error('bad stuff happened'));
     *     },
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'two');
     *         }, 100);
     *     }
     * ];
     *
     * async.parallel(async.reflectAll(tasks),
     * // optional callback
     * function(err, results) {
     *     // values
     *     // results[0].value = 'one'
     *     // results[1].error = Error('bad stuff happened')
     *     // results[2].value = 'two'
     * });
     */
    function reflectAll(tasks) {
      return tasks.map(reflect);
    }

    /**
     * The same as `reject` but runs only a single async operation at a time.
     *
     * @name rejectSeries
     * @static
     * @memberOf async
     * @see async.reject
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     */
    var rejectSeries = doLimit(rejectLimit, 1);

    /**
     * Run the functions in the `tasks` collection in series, each one running once
     * the previous function has completed. If any functions in the series pass an
     * error to its callback, no more functions are run, and `callback` is
     * immediately called with the value of the error. Otherwise, `callback`
     * receives an array of results when `tasks` have completed.
     *
     * It is also possible to use an object instead of an array. Each property will
     * be run as a function, and the results will be passed to the final `callback`
     * as an object instead of an array. This can be a more readable way of handling
     *  results from {@link async.series}.
     *
     * **Note** that while many implementations preserve the order of object
     * properties, the [ECMAScript Language Specification](http://www.ecma-international.org/ecma-262/5.1/#sec-8.6)
     * explicitly states that
     *
     * > The mechanics and order of enumerating the properties is not specified.
     *
     * So if you rely on the order in which your series of functions are executed,
     * and want this to work on all platforms, consider using an array.
     *
     * @name series
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Array|Object} tasks - A collection containing functions to run, each
     * function is passed a `callback(err, result)` it must call on completion with
     * an error `err` (which can be `null`) and an optional `result` value.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed. This function gets a results array (or object)
     * containing all the result arguments passed to the `task` callbacks. Invoked
     * with (err, result).
     * @example
     * async.series([
     *     function(callback) {
     *         // do some stuff ...
     *         callback(null, 'one');
     *     },
     *     function(callback) {
     *         // do some more stuff ...
     *         callback(null, 'two');
     *     }
     * ],
     * // optional callback
     * function(err, results) {
     *     // results is now equal to ['one', 'two']
     * });
     *
     * async.series({
     *     one: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 1);
     *         }, 200);
     *     },
     *     two: function(callback){
     *         setTimeout(function() {
     *             callback(null, 2);
     *         }, 100);
     *     }
     * }, function(err, results) {
     *     // results is now equal to: {one: 1, two: 2}
     * });
     */
    function series(tasks, cb) {
      return _parallel(eachOfSeries, tasks, cb);
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
    function constant$1(value) {
      return function() {
        return value;
      };
    }

    /**
     * Attempts to get a successful response from `task` no more than `times` times
     * before returning an error. If the task is successful, the `callback` will be
     * passed the result of the successful task. If all attempts fail, the callback
     * will be passed the error and result (if any) of the final attempt.
     *
     * @name retry
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - Can be either an
     * object with `times` and `interval` or a number.
     * * `times` - The number of attempts to make before giving up.  The default
     *   is `5`.
     * * `interval` - The time to wait between retries, in milliseconds.  The
     *   default is `0`. The interval may also be specified as a function of the
     *   retry count (see example).
     * * If `opts` is a number, the number specifies the number of times to retry,
     *   with the default interval of `0`.
     * @param {Function} task - A function which receives two arguments: (1) a
     * `callback(err, result)` which must be called when finished, passing `err`
     * (which can be `null`) and the `result` of the function's execution, and (2)
     * a `results` object, containing the results of the previously executed
     * functions (if nested inside another control flow). Invoked with
     * (callback, results).
     * @param {Function} [callback] - An optional callback which is called when the
     * task has succeeded, or after the final failed attempt. It receives the `err`
     * and `result` arguments of the last attempt at completing the `task`. Invoked
     * with (err, results).
     * @example
     *
     * // The `retry` function can be used as a stand-alone control flow by passing
     * // a callback, as shown below:
     *
     * // try calling apiMethod 3 times
     * async.retry(3, apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // try calling apiMethod 3 times, waiting 200 ms between each retry
     * async.retry({times: 3, interval: 200}, apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // try calling apiMethod 10 times with exponential backoff
     * // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
     * async.retry({
     *   times: 10,
     *   interval: function(retryCount) {
     *     return 50 * Math.pow(2, retryCount);
     *   }
     * }, apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // try calling apiMethod the default 5 times no delay between each retry
     * async.retry(apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // It can also be embedded within other control flow functions to retry
     * // individual methods that are not as reliable, like this:
     * async.auto({
     *     users: api.getUsers.bind(api),
     *     payments: async.retry(3, api.getPayments.bind(api))
     * }, function(err, results) {
     *     // do something with the results
     * });
     */
    function retry(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var opts = {
            times: DEFAULT_TIMES,
            intervalFunc: constant$1(DEFAULT_INTERVAL)
        };

        function parseTimes(acc, t) {
            if (typeof t === 'object') {
                acc.times = +t.times || DEFAULT_TIMES;

                acc.intervalFunc = typeof t.interval === 'function' ? t.interval : constant$1(+t.interval || DEFAULT_INTERVAL);
            } else if (typeof t === 'number' || typeof t === 'string') {
                acc.times = +t || DEFAULT_TIMES;
            } else {
                throw new Error("Invalid arguments for async.retry");
            }
        }

        if (arguments.length < 3 && typeof times === 'function') {
            callback = task || noop;
            task = times;
        } else {
            parseTimes(opts, times);
            callback = callback || noop;
        }

        if (typeof task !== 'function') {
            throw new Error("Invalid arguments for async.retry");
        }

        var attempts = [];
        for (var i = 1; i < opts.times + 1; i++) {
            var isFinalAttempt = i == opts.times;
            attempts.push(retryAttempt(isFinalAttempt));
            var interval = opts.intervalFunc(i);
            if (!isFinalAttempt && interval > 0) {
                attempts.push(retryInterval(interval));
            }
        }

        series(attempts, function (done, data) {
            data = data[data.length - 1];
            callback(data.err, data.result);
        });

        function retryAttempt(isFinalAttempt) {
            return function (seriesCallback) {
                task(function (err, result) {
                    seriesCallback(!err || isFinalAttempt, {
                        err: err,
                        result: result
                    });
                });
            };
        }

        function retryInterval(interval) {
            return function (seriesCallback) {
                setTimeout(function () {
                    seriesCallback(null);
                }, interval);
            };
        }
    }

    /**
     * A close relative of `retry`.  This method wraps a task and makes it
     * retryable, rather than immediately calling it with retries.
     *
     * @name retryable
     * @static
     * @memberOf async
     * @see async.retry
     * @category Control Flow
     * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - optional
     * options, exactly the same as from `retry`
     * @param {Function} task - the asynchronous function to wrap
     * @returns {Functions} The wrapped function, which when invoked, will retry on
     * an error, based on the parameters specified in `opts`.
     * @example
     *
     * async.auto({
     *     dep1: async.retryable(3, getFromFlakyService),
     *     process: ["dep1", async.retryable(3, function (results, cb) {
     *         maybeProcessData(results.dep1, cb);
     *     })]
     * }, callback);
     */
    function retryable (opts, task) {
        if (!task) {
            task = opts;
            opts = null;
        }
        return initialParams(function (args, callback) {
            function taskFn(cb) {
                task.apply(null, args.concat([cb]));
            }

            if (opts) retry(opts, taskFn, callback);else retry(taskFn, callback);
        });
    }

    /**
     * The same as `some` but runs a maximum of `limit` async operations at a time.
     *
     * @name someLimit
     * @static
     * @memberOf async
     * @see async.some
     * @alias anyLimit
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in the array
     * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
     * be called with a boolean argument once it has completed. Invoked with
     * (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the iteratee functions have finished.
     * Result will be either `true` or `false` depending on the values of the async
     * tests. Invoked with (err, result).
     */
    var someLimit = _createTester(eachOfLimit, Boolean, identity);

    /**
     * Returns `true` if at least one element in the `coll` satisfies an async test.
     * If any iteratee call returns `true`, the main `callback` is immediately
     * called.
     *
     * @name some
     * @static
     * @memberOf async
     * @alias any
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the array
     * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
     * be called with a boolean argument once it has completed. Invoked with
     * (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the iteratee functions have finished.
     * Result will be either `true` or `false` depending on the values of the async
     * tests. Invoked with (err, result).
     * @example
     *
     * async.some(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, result) {
     *     // if result is true then at least one of the files exists
     * });
     */
    var some = doLimit(someLimit, Infinity);

    /**
     * The same as `some` but runs only a single async operation at a time.
     *
     * @name someSeries
     * @static
     * @memberOf async
     * @see async.some
     * @alias anySeries
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the array
     * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
     * be called with a boolean argument once it has completed. Invoked with
     * (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the iteratee functions have finished.
     * Result will be either `true` or `false` depending on the values of the async
     * tests. Invoked with (err, result).
     */
    var someSeries = doLimit(someLimit, 1);

    /**
     * Sorts a list by the results of running each `coll` value through an async
     * `iteratee`.
     *
     * @name sortBy
     * @static
     * @memberOf async
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, sortValue)` which must be called once
     * it has completed with an error (which can be `null`) and a value to use as
     * the sort criteria. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished, or an error occurs. Results is the items
     * from the original `coll` sorted by the values returned by the `iteratee`
     * calls. Invoked with (err, results).
     * @example
     *
     * async.sortBy(['file1','file2','file3'], function(file, callback) {
     *     fs.stat(file, function(err, stats) {
     *         callback(err, stats.mtime);
     *     });
     * }, function(err, results) {
     *     // results is now the original array of files sorted by
     *     // modified date
     * });
     *
     * // By modifying the callback parameter the
     * // sorting order can be influenced:
     *
     * // ascending order
     * async.sortBy([1,9,3,5], function(x, callback) {
     *     callback(null, x);
     * }, function(err,result) {
     *     // result callback
     * });
     *
     * // descending order
     * async.sortBy([1,9,3,5], function(x, callback) {
     *     callback(null, x*-1);    //<- x*-1 instead of x, turns the order around
     * }, function(err,result) {
     *     // result callback
     * });
     */
    function sortBy(arr, iteratee, cb) {
        map(arr, function (x, cb) {
            iteratee(x, function (err, criteria) {
                if (err) return cb(err);
                cb(null, { value: x, criteria: criteria });
            });
        }, function (err, results) {
            if (err) return cb(err);
            cb(null, arrayMap(results.sort(comparator), baseProperty('value')));
        });

        function comparator(left, right) {
            var a = left.criteria,
                b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    }

    /**
     * Sets a time limit on an asynchronous function. If the function does not call
     * its callback within the specified miliseconds, it will be called with a
     * timeout error. The code property for the error object will be `'ETIMEDOUT'`.
     *
     * @name timeout
     * @static
     * @memberOf async
     * @category Util
     * @param {Function} function - The asynchronous function you want to set the
     * time limit.
     * @param {number} miliseconds - The specified time limit.
     * @param {*} [info] - Any variable you want attached (`string`, `object`, etc)
     * to timeout Error for more information..
     * @returns {Function} Returns a wrapped function that can be used with any of
     * the control flow functions.
     * @example
     *
     * async.timeout(function(callback) {
     *     doAsyncTask(callback);
     * }, 1000);
     */
    function timeout(asyncFn, miliseconds, info) {
        var originalCallback, timer;
        var timedOut = false;

        function injectedCallback() {
            if (!timedOut) {
                originalCallback.apply(null, arguments);
                clearTimeout(timer);
            }
        }

        function timeoutCallback() {
            var name = asyncFn.name || 'anonymous';
            var error = new Error('Callback function "' + name + '" timed out.');
            error.code = 'ETIMEDOUT';
            if (info) {
                error.info = info;
            }
            timedOut = true;
            originalCallback(error);
        }

        return initialParams(function (args, origCallback) {
            originalCallback = origCallback;
            // setup timer and call original function
            timer = setTimeout(timeoutCallback, miliseconds);
            asyncFn.apply(null, args.concat(injectedCallback));
        });
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil;
    var nativeMax$1 = Math.max;
    /**
     * The base implementation of `_.range` and `_.rangeRight` which doesn't
     * coerce arguments to numbers.
     *
     * @private
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @param {number} step The value to increment or decrement by.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the range of numbers.
     */
    function baseRange(start, end, step, fromRight) {
      var index = -1,
          length = nativeMax$1(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
      }
      return result;
    }

    /**
    * The same as {@link times} but runs a maximum of `limit` async operations at a
    * time.
     *
     * @name timesLimit
     * @static
     * @memberOf async
     * @see async.times
     * @category Control Flow
     * @param {number} n - The number of times to run the function.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - The function to call `n` times. Invoked with the
     * iteration index and a callback (n, next).
     * @param {Function} callback - see {@link async.map}.
     */
    function timeLimit(count, limit, iteratee, cb) {
      return mapLimit(baseRange(0, count, 1), limit, iteratee, cb);
    }

    /**
     * Calls the `iteratee` function `n` times, and accumulates results in the same
     * manner you would use with {@link async.map}.
     *
     * @name times
     * @static
     * @memberOf async
     * @see async.map
     * @category Control Flow
     * @param {number} n - The number of times to run the function.
     * @param {Function} iteratee - The function to call `n` times. Invoked with the
     * iteration index and a callback (n, next).
     * @param {Function} callback - see {@link async.map}.
     * @example
     *
     * // Pretend this is some complicated async factory
     * var createUser = function(id, callback) {
     *     callback(null, {
     *         id: 'user' + id
     *     });
     * };
     *
     * // generate 5 users
     * async.times(5, function(n, next) {
     *     createUser(n, function(err, user) {
     *         next(err, user);
     *     });
     * }, function(err, users) {
     *     // we should now have 5 users
     * });
     */
    var times = doLimit(timeLimit, Infinity);

    /**
     * The same as {@link async.times} but runs only a single async operation at a time.
     *
     * @name timesSeries
     * @static
     * @memberOf async
     * @see async.times
     * @category Control Flow
     * @param {number} n - The number of times to run the function.
     * @param {Function} iteratee - The function to call `n` times. Invoked with the
     * iteration index and a callback (n, next).
     * @param {Function} callback - see {@link async.map}.
     */
    var timesSeries = doLimit(timeLimit, 1);

    /**
     * A relative of `reduce`.  Takes an Object or Array, and iterates over each
     * element in series, each step potentially mutating an `accumulator` value.
     * The type of the accumulator defaults to the type of collection passed in.
     *
     * @name transform
     * @static
     * @memberOf async
     * @category Collection
     * @param {Array|Object} coll - A collection to iterate over.
     * @param {*} [accumulator] - The initial state of the transform.  If omitted,
     * it will default to an empty Object or Array, depending on the type of `coll`
     * @param {Function} iteratee - A function applied to each item in the
     * collection that potentially modifies the accumulator. The `iteratee` is
     * passed a `callback(err)` which accepts an optional error as its first
     * argument. If an error is passed to the callback, the transform is stopped
     * and the main `callback` is immediately called with the error.
     * Invoked with (accumulator, item, key, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result is the transformed accumulator.
     * Invoked with (err, result).
     * @example
     *
     * async.transform([1,2,3], function(acc, item, index, callback) {
     *     // pointless async:
     *     process.nextTick(function() {
     *         acc.push(item * 2)
     *         callback(null)
     *     });
     * }, function(err, result) {
     *     // result is now equal to [2, 4, 6]
     * });
     *
     * @example
     *
     * async.transform({a: 1, b: 2, c: 3}, function (obj, val, key, callback) {
     *     setImmediate(function () {
     *         obj[key] = val * 2;
     *         callback();
     *     })
     * }, function (err, result) {
     *     // result is equal to {a: 2, b: 4, c: 6}
     * })
     */
    function transform(arr, acc, iteratee, callback) {
        if (arguments.length === 3) {
            callback = iteratee;
            iteratee = acc;
            acc = isArray(arr) ? [] : {};
        }

        eachOf(arr, function (v, k, cb) {
            iteratee(acc, v, k, cb);
        }, function (err) {
            callback(err, acc);
        });
    }

    /**
     * Undoes a {@link async.memoize}d function, reverting it to the original,
     * unmemoized form. Handy for testing.
     *
     * @name unmemoize
     * @static
     * @memberOf async
     * @see async.memoize
     * @category Util
     * @param {Function} fn - the memoized function
     */
    function unmemoize(fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    }

    /**
     * Repeatedly call `fn` until `test` returns `true`. Calls `callback` when
     * stopped, or an error occurs. `callback` will be passed an error and any
     * arguments passed to the final `fn`'s callback.
     *
     * The inverse of {@link async.whilst}.
     *
     * @name until
     * @static
     * @memberOf async
     * @see async.whilst
     * @category Control Flow
     * @param {Function} test - synchronous truth test to perform before each
     * execution of `fn`. Invoked with ().
     * @param {Function} fn - A function which is called each time `test` fails.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has passed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     */
    function until(test, iteratee, cb) {
        return whilst(function () {
            return !test.apply(this, arguments);
        }, iteratee, cb);
    }

    /**
     * Runs the `tasks` array of functions in series, each passing their results to
     * the next in the array. However, if any of the `tasks` pass an error to their
     * own callback, the next function is not executed, and the main `callback` is
     * immediately called with the error.
     *
     * @name waterfall
     * @static
     * @memberOf async
     * @category Control Flow
     * @param {Array} tasks - An array of functions to run, each function is passed
     * a `callback(err, result1, result2, ...)` it must call on completion. The
     * first argument is an error (which can be `null`) and any further arguments
     * will be passed as arguments in order to the next task.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed. This will be passed the results of the last task's
     * callback. Invoked with (err, [results]).
     * @example
     *
     * async.waterfall([
     *     function(callback) {
     *         callback(null, 'one', 'two');
     *     },
     *     function(arg1, arg2, callback) {
     *         // arg1 now equals 'one' and arg2 now equals 'two'
     *         callback(null, 'three');
     *     },
     *     function(arg1, callback) {
     *         // arg1 now equals 'three'
     *         callback(null, 'done');
     *     }
     * ], function (err, result) {
     *     // result now equals 'done'
     * });
     *
     * // Or, with named functions:
     * async.waterfall([
     *     myFirstFunction,
     *     mySecondFunction,
     *     myLastFunction,
     * ], function (err, result) {
     *     // result now equals 'done'
     * });
     * function myFirstFunction(callback) {
     *     callback(null, 'one', 'two');
     * }
     * function mySecondFunction(arg1, arg2, callback) {
     *     // arg1 now equals 'one' and arg2 now equals 'two'
     *     callback(null, 'three');
     * }
     * function myLastFunction(arg1, callback) {
     *     // arg1 now equals 'three'
     *     callback(null, 'done');
     * }
     */
    function waterfall (tasks, cb) {
        cb = once(cb || noop);
        if (!isArray(tasks)) return cb(new Error('First argument to waterfall must be an array of functions'));
        if (!tasks.length) return cb();
        var taskIndex = 0;

        function nextTask(args) {
            if (taskIndex === tasks.length) {
                return cb.apply(null, [null].concat(args));
            }

            var taskCallback = onlyOnce(rest(function (err, args) {
                if (err) {
                    return cb.apply(null, [err].concat(args));
                }
                nextTask(args);
            }));

            args.push(taskCallback);

            var task = tasks[taskIndex++];
            task.apply(null, args);
        }

        nextTask([]);
    }

    var index = {
        applyEach: applyEach,
        applyEachSeries: applyEachSeries,
        apply: apply$1,
        asyncify: asyncify,
        auto: auto,
        autoInject: autoInject,
        cargo: cargo,
        compose: compose,
        concat: concat,
        concatSeries: concatSeries,
        constant: constant,
        detect: detect,
        detectLimit: detectLimit,
        detectSeries: detectSeries,
        dir: dir,
        doDuring: doDuring,
        doUntil: doUntil,
        doWhilst: doWhilst,
        during: during,
        each: each,
        eachLimit: eachLimit,
        eachOf: eachOf,
        eachOfLimit: eachOfLimit,
        eachOfSeries: eachOfSeries,
        eachSeries: eachSeries,
        ensureAsync: ensureAsync,
        every: every,
        everyLimit: everyLimit,
        everySeries: everySeries,
        filter: filter,
        filterLimit: filterLimit,
        filterSeries: filterSeries,
        forever: forever,
        iterator: iterator$1,
        log: log,
        map: map,
        mapLimit: mapLimit,
        mapSeries: mapSeries,
        mapValues: mapValues,
        mapValuesLimit: mapValuesLimit,
        mapValuesSeries: mapValuesSeries,
        memoize: memoize$1,
        nextTick: nextTick,
        parallel: parallel,
        parallelLimit: parallelLimit,
        priorityQueue: priorityQueue,
        queue: queue$1,
        race: race,
        reduce: reduce,
        reduceRight: reduceRight,
        reflect: reflect,
        reflectAll: reflectAll,
        reject: reject,
        rejectLimit: rejectLimit,
        rejectSeries: rejectSeries,
        retry: retry,
        retryable: retryable,
        seq: seq,
        series: series,
        setImmediate: setImmediate$1,
        some: some,
        someLimit: someLimit,
        someSeries: someSeries,
        sortBy: sortBy,
        timeout: timeout,
        times: times,
        timesLimit: timeLimit,
        timesSeries: timesSeries,
        transform: transform,
        unmemoize: unmemoize,
        until: until,
        waterfall: waterfall,
        whilst: whilst,

        // aliases
        all: every,
        any: some,
        forEach: each,
        forEachSeries: eachSeries,
        forEachLimit: eachLimit,
        forEachOf: eachOf,
        forEachOfSeries: eachOfSeries,
        forEachOfLimit: eachOfLimit,
        inject: reduce,
        foldl: reduce,
        foldr: reduceRight,
        select: filter,
        selectLimit: filterLimit,
        selectSeries: filterSeries,
        wrapSync: asyncify
    };

    exports['default'] = index;
    exports.applyEach = applyEach;
    exports.applyEachSeries = applyEachSeries;
    exports.apply = apply$1;
    exports.asyncify = asyncify;
    exports.auto = auto;
    exports.autoInject = autoInject;
    exports.cargo = cargo;
    exports.compose = compose;
    exports.concat = concat;
    exports.concatSeries = concatSeries;
    exports.constant = constant;
    exports.detect = detect;
    exports.detectLimit = detectLimit;
    exports.detectSeries = detectSeries;
    exports.dir = dir;
    exports.doDuring = doDuring;
    exports.doUntil = doUntil;
    exports.doWhilst = doWhilst;
    exports.during = during;
    exports.each = each;
    exports.eachLimit = eachLimit;
    exports.eachOf = eachOf;
    exports.eachOfLimit = eachOfLimit;
    exports.eachOfSeries = eachOfSeries;
    exports.eachSeries = eachSeries;
    exports.ensureAsync = ensureAsync;
    exports.every = every;
    exports.everyLimit = everyLimit;
    exports.everySeries = everySeries;
    exports.filter = filter;
    exports.filterLimit = filterLimit;
    exports.filterSeries = filterSeries;
    exports.forever = forever;
    exports.iterator = iterator$1;
    exports.log = log;
    exports.map = map;
    exports.mapLimit = mapLimit;
    exports.mapSeries = mapSeries;
    exports.mapValues = mapValues;
    exports.mapValuesLimit = mapValuesLimit;
    exports.mapValuesSeries = mapValuesSeries;
    exports.memoize = memoize$1;
    exports.nextTick = nextTick;
    exports.parallel = parallel;
    exports.parallelLimit = parallelLimit;
    exports.priorityQueue = priorityQueue;
    exports.queue = queue$1;
    exports.race = race;
    exports.reduce = reduce;
    exports.reduceRight = reduceRight;
    exports.reflect = reflect;
    exports.reflectAll = reflectAll;
    exports.reject = reject;
    exports.rejectLimit = rejectLimit;
    exports.rejectSeries = rejectSeries;
    exports.retry = retry;
    exports.retryable = retryable;
    exports.seq = seq;
    exports.series = series;
    exports.setImmediate = setImmediate$1;
    exports.some = some;
    exports.someLimit = someLimit;
    exports.someSeries = someSeries;
    exports.sortBy = sortBy;
    exports.timeout = timeout;
    exports.times = times;
    exports.timesLimit = timeLimit;
    exports.timesSeries = timesSeries;
    exports.transform = transform;
    exports.unmemoize = unmemoize;
    exports.until = until;
    exports.waterfall = waterfall;
    exports.whilst = whilst;
    exports.all = every;
    exports.allLimit = everyLimit;
    exports.allSeries = everySeries;
    exports.any = some;
    exports.anyLimit = someLimit;
    exports.anySeries = someSeries;
    exports.find = detect;
    exports.findLimit = detectLimit;
    exports.findSeries = detectSeries;
    exports.forEach = each;
    exports.forEachSeries = eachSeries;
    exports.forEachLimit = eachLimit;
    exports.forEachOf = eachOf;
    exports.forEachOfSeries = eachOfSeries;
    exports.forEachOfLimit = eachOfLimit;
    exports.inject = reduce;
    exports.foldl = reduce;
    exports.foldr = reduceRight;
    exports.select = filter;
    exports.selectLimit = filterLimit;
    exports.selectSeries = filterSeries;
    exports.wrapSync = asyncify;

}));
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":9}],4:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
/*
 * forbject
 * http://github.amexpub.com/modules/forbject
 *
 * Copyright (c) 2013 AmexPub. All rights reserved.
 */

'use strict';

module.exports = require('./lib/forbject');

},{"./lib/forbject":7}],7:[function(require,module,exports){
/*
 * forbject
 * http://github.com/yawetse/forbject
 * inspired by: https://github.com/serbanghita/formToObject.js
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */
'use strict';

var events = require('events'),
	extend = require('util-extend'),
	util = require('util');

/**
 * A module that represents a forbject object, a componentTab is a page composition tool.
 * @{@link https://github.com/typesettin/forbject}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @constructor forbject
 * @requires module:events
 * @requires module:util
 * @param {object} formRef element selector of form element or actual form element
 */
var forbject = function (formRef, options) {
	events.EventEmitter.call(this);
	var defaultOptions = {
		autorefresh: false,
		addelementsonrefresh: true,
		valuefilter: false
	},
	testValuefilterReturn;
	this.options = extend(defaultOptions, options);
	if (!formRef) {
		return false;
	}

	if(this.options.valuefilter){
		testValuefilterReturn = this.options.valuefilter('test value');
		if(typeof testValuefilterReturn === 'undefined'){
			throw new Error('valuefilter must return a value');
		}
	}
	this.formRef = formRef;
	this.keyRegex = /[^\[\]]+/g;
	this.$form = null;
	this.$formElements = [];
	this.formObj = {};
	this.refresh = this._refresh;
	this.getObject = this._getObject;
	if (!this.setForm()) {
		return false;
	}
	if (!this.setFormElements()) {
		return false;
	}
	this.setFormObj();
};

util.inherits(forbject, events.EventEmitter);

/**
 * refresh form object key/value pair mapping
 * @return {object} form object
 * @emits refresh
 */
forbject.prototype._refresh = function () {
	this.formObj = {};
	if(this.options.addelementsonrefresh){
		this.setFormElements();
	}
	this.setFormObj();
	this.emit('refresh', this.formObj);
};

/**
 * returns form object
 * @return {object} form object
 */
forbject.prototype._getObject = function () {
	return this.formObj;
};

/**
 * Set the main form object we are working on.
 * @return {object} Form Element Object
 */
forbject.prototype.setForm = function () {
	try {
		switch (typeof this.formRef) {
		case 'string':
			this.$form = document.querySelector(this.formRef);
			break;
		case 'object':
			if (this.isDomNode(this.formRef)) {
				this.$form = this.formRef;
			}
			break;
		}
		this.emit('init');
		return this.$form;
	}
	catch (e) {
		throw new Error(e);
	}
};


/**
 * Set the elements we need to parse.
 * @return {number} number of form elements
 */
forbject.prototype.setFormElements = function () {
	var autoRefreshOnValChange = function () {
		this.refresh();
		this.emit('autoRefreshOnValChange',this.getObject());
	}.bind(this);
	this.$formElements = this.$form.querySelectorAll('input, button, textarea, select');
	if (this.options.autorefresh === true) {
		for (var x = 0; x < this.$formElements.length; x++) {
			this.$formElements[x].addEventListener('change', autoRefreshOnValChange, false);
		}
	}
	return this.$formElements.length;
};

/**
 * Check to see if the object is a HTML node.
 * @param  {object}  node dom element
 * @return {Boolean} if object is a dom node
 */
forbject.prototype.isDomNode = function (node) {
	return typeof node === 'object' && 'nodeType' in node && node.nodeType === 1;
};

/**
 * Iteration through arrays and objects. Compatible with IE.
 * @param  {Array}   arr      array to iterate through
 * @param  {Function} callback async callback
 */
forbject.prototype.forEach = function (arr, callback) {
	if ([].forEach) {
		return [].forEach.call(arr, callback);
	}

	var i;
	for (i in arr) {
		// Object.prototype.hasOwnProperty instead of arr.hasOwnProperty for IE8 compatibility.
		if (Object.prototype.hasOwnProperty.call(arr, i)) {
			callback.call(arr, arr[i]);
		}
	}

	return;
};

/**
 * Recursive method that adds keys and values of the corresponding fields.
 * @param {object} result  form object
 * @param {object} domNode element in form object
 * @param {string} keys    regex result of form elements
 * @param {object} value   value of domNode
 */
forbject.prototype.addChild = function (result, domNode, keys, value) {
	value = (this.options.valuefilter) ? this.options.valuefilter(value) : value; 

	// #1 - Single dimensional array.
	if (keys.length === 1) {

		// We're only interested in the radio that is checked.
		if (domNode.nodeName === 'INPUT' && domNode.type === 'radio') {
			if (domNode.checked) {
				return result[keys] = value;
			}
			else {
				return;
			}
		}

		// Checkboxes are a special case. We have to grab each checked values
		// and put them into an array.
		if (domNode.nodeName === 'INPUT' && domNode.type === 'checkbox') {

			if (domNode.checked) {

				if (!result[keys]) {
					result[keys] = [];
				}
				return result[keys].push(value);

			}
			else {
				return;
			}

		}

		// Multiple select is a special case.
		// We have to grab each selected option and put them into an array.
		if (domNode.nodeName === 'SELECT' && domNode.type === 'select-multiple') {

			result[keys] = [];
			var DOMchilds = domNode.querySelectorAll('option[selected]');
			if (DOMchilds) {
				this.forEach(DOMchilds, function (child) {
					child.value = (this.options.valuefilter) ? this.options.valuefilter(child.value) : child.value; 

					result[keys].push(child.value);
				});
			}
			return;

		}


		// Fallback. The default one to one assign.
		result[keys] = value;

	}

	// #2 - Multi dimensional array.
	if (keys.length > 1) {

		if (!result[keys[0]]) {
			result[keys[0]] = {};
		}

		return this.addChild(result[keys[0]], domNode, keys.splice(1, keys.length), value);

	}

	return result;
};

/**
 * iterate through form element items and append enabled elements to form object
 */
forbject.prototype.setFormObj = function () {
	var test, i = 0;

	for (i = 0; i < this.$formElements.length; i++) {
		// Ignore the element if the 'name' attribute is empty.
		// Ignore the 'disabled' elements.
		if (this.$formElements[i].name && !this.$formElements[i].disabled) {
			test = this.$formElements[i].name.match(this.keyRegex);
			this.addChild(this.formObj, this.$formElements[i], test, this.$formElements[i].value);
		}
	}
	this.emit('serialized', this.formObj);
	return this.formObj;
};
module.exports = forbject;

},{"events":5,"util":20,"util-extend":18}],8:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],10:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],11:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],12:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":10,"./encode":11}],13:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],14:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');
var requestBase = require('./request-base');
var isObject = require('./is-object');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `request`.
 */

var request = module.exports = require('./request').bind(null, Request);

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
    }
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (Array.isArray(val)) {
    return val.forEach(function(v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  } else if (isObject(val)) {
    for(var subkey in val) {
      pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
    }
    return;
  }
  pairs.push(encodeURIComponent(key)
    + '=' + encodeURIComponent(val));
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] =
        decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this._setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this._parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype._setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function(str){
  var parse = request.parse[this.type];
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype._setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = self.xhr && self.xhr.status ? self.xhr.status : null;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    try {
      if (res.status >= 200 && res.status < 300) {
        return self.callback(err, res);
      }

      var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;

      self.callback(new_err, res);
    } catch(e) {
      self.callback(e); // #985 touching res may cause INVALID_STATE_ERR on old Android
    }
  });
}

/**
 * Mixin `Emitter` and `requestBase`.
 */

Emitter(Request.prototype);
for (var key in requestBase) {
  Request.prototype[key] = requestBase[key];
}

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set responseType to `val`. Presently valid responseTypes are 'blob' and
 * 'arraybuffer'.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (!options) {
    options = {
      type: 'basic'
    }
  }

  switch (options.type) {
    case 'basic':
      var str = btoa(user + ':' + pass);
      this.set('Authorization', 'Basic ' + str);
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
  }
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  this._getFormData().append(field, file, filename || file.name);
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype._timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */

Request.prototype._appendQueryString = function(){
  var query = this._query.join('&');
  if (query) {
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self._timeoutError();
      if (self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = 'download';
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  this._appendQueryString();

  // initiate request
  if (this.username && this.password) {
    xhr.open(this.method, this.url, true, this.username, this.password);
  } else {
    xhr.open(this.method, this.url, true);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};


/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.options = function(url, data, fn){
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":15,"./request":17,"./request-base":16,"emitter":4,"reduce":13}],15:[function(require,module,exports){
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null !== obj && 'object' === typeof obj;
}

module.exports = isObject;

},{}],16:[function(require,module,exports){
/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

exports.clearTimeout = function _clearTimeout(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

exports.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

exports.serialize = function serialize(fn){
  this._serializer = fn;
  return this;
};

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

exports.timeout = function timeout(ms){
  this._timeout = ms;
  return this;
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} reject
 * @return {Request}
 */

exports.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
      self.end(function(err, res){
        if (err) innerReject(err); else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
}

/**
 * Allow for extension
 */

exports.use = function use(fn) {
  fn(this);
  return this;
}


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

exports.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

exports.getHeader = exports.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

exports.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
exports.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
exports.field = function(name, val) {
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
exports.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

exports.withCredentials = function(){
  // This is browser-only functionality. Node side is no-op.
  this._withCredentials = true;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

exports.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

exports.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    data: this._data
  };
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

exports._isHost = function _isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

exports.send = function(data){
  var obj = isObject(data);
  var type = this._header['content-type'];

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || this._isHost(data)) return this;

  // default to json
  if (!type) this.type('json');
  return this;
};

},{"./is-object":15}],17:[function(require,module,exports){
// The node and browser modules expose versions of this with the
// appropriate constructor function bound as first argument
/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(RequestConstructor, method, url) {
  // callback
  if ('function' == typeof url) {
    return new RequestConstructor('GET', method).end(url);
  }

  // url first
  if (2 == arguments.length) {
    return new RequestConstructor('GET', method);
  }

  return new RequestConstructor(method, url);
}

module.exports = request;

},{}],18:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = extend;
function extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

},{}],19:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],20:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":19,"_process":9,"inherits":8}],21:[function(require,module,exports){
'use strict';

var formie = require('../../index'),
	formieduckduckgo,
	formiegithub,
	formie1,
	formie2,
	responseContainer;

var defaultErrorCallback = function (err, response) {
	//console.log(err, response);
	responseContainer.innerHTML = 'error : ' + JSON.stringify(err, null, 2);
	responseContainer.innerHTML += '\nresponse : ' + JSON.stringify(response, null, 2);
};

window.addEventListener('load', function () {
	responseContainer = document.querySelector('#formie-test-result');
	formieduckduckgo = new formie({
		jsonp: true,
		ajaxsubmitselector: '#duckduckgo-formie-test',
		queryparameters: {
			callback: 'duckduckgocallback',
		},
		errorcallback: defaultErrorCallback,
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response, null, 2);
		}
	});

	formiegithub = new formie({
		ajaxsubmitselector: '#github-formie-test',
		errorcallback: defaultErrorCallback,
		successcallback: function (response) {
			responseContainer.innerHTML = response.text;
		}
	});


	formie1 = new formie({
		ajaxsubmitselector: '#formie-test',
		postdata: {
			_csrf: document.querySelector('input[name="_csrf"]').value
		},
		queryparameters: {
			format: 'json',
			_csrf: document.querySelector('input[name="_csrf"]').value
		},
		errorcallback: defaultErrorCallback,
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response.body, null, 2);
		}
	});

	formie2 = new formie({
		ajaxsubmitselector: '#upload-formie-test',
		postdata: {
			_csrf: document.querySelector('input[name="_csrf"]').value
		},
		queryparameters: {
			format: 'json',
			_csrf: document.querySelector('input[name="_csrf"]').value
		},
		headers: {
			_csrf: document.querySelector('input[name="_csrf"]').value
		},
		errorcallback: defaultErrorCallback,
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response.body, null, 2);
		}
	});

	window.formie1 = formie1;
}, false);

},{"../../index":1}]},{},[21]);
