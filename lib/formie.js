/*
 * formie
 * http://github.com/yawetse/formie
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */
'use strict';

var extend = require('util-extend'),
	classie = require('classie'),
	events = require('events'),
	forbject = require('forbject'),
	request = require('superagent'),
	util = require('util');

/**
 * A module that represents a formie object, a componentTab is a page composition tool.
 * @{@link https://github.com/typesettin/formie}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @constructor formie
 * @requires module:events
 * @requires module:util-extend
 * @requires module:util
 * @param {object} el element of tab container
 * @param {object} options configuration options
 */
var formie = function (options) {
	events.EventEmitter.call(this);

	var defaultOptions = {
		ajaxsubmitselector: '.formie',
		autosubmitselectors: '.autoFormSubmit',
		autosubmitelements: [],
		preventsubmitselectors: '.noFormSubmit',
		preventsubmitelements: [],
		headers: {},
		method: 'get',
		action: '/',
		queryparameters: {},
		postdata: {},
		beforesubmitcallback: null,
		errorcallback: null,
		successcallback: null
	};
	this.options = extend(defaultOptions, options);

	this.init = this._init;
	this.submitOnChangeListeners = this.__submitOnChangeListeners;
	this.autoSubmitFormOnChange = this.__autoSubmitFormOnChange;
	this.preventEnterSubmitListeners = this.__preventEnterSubmitListeners;
	this.preventSubmitOnEnter = this.__preventSubmitOnEnter;
	// this.render = this._render;
	// this.addBinder = this._addBinder;
};

util.inherits(formie, events.EventEmitter);

formie.prototype.ajaxSubmitFormie = function (e, element) {
	// console.log('e', e);
	var f = (element) ? element : e.target,
		beforefn,
		errorfn,
		successfn,
		formData,
		formieData,
		ajaxResponseHandler = function (err, response) {
			if (this.options.errorcallback) {
				errorfn = this.options.errorcallback;
				if (typeof errorfn === 'function') {
					errorfn(err, response);
				}
				else if (typeof window[errorfn] === 'function') {
					errorfn = window[errorfn];
					errorfn(err, response);
				}
			}
			if (this.options.successcallback) {
				successfn = this.options.successcallback;
				if (typeof successfn === 'function') {
					successfn(response);
				}
				else if (typeof window[successfn] === 'function') {
					successfn = window[successfn];
					successfn(response);
				}
			}
		};
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

	formData = new forbject(f).getObject();

	if (this.options.method === 'get') {
		formieData = extend(this.options.queryparameters, this.options.postdata);
		request
			.get(this.options.action)
			.set(this.options.headers)
			.query(formieData)
			.end(ajaxResponseHandler);
	}
	else if (this.options.method === 'post') {
		request
			.post(this.options.action)
			.set(this.options.headers)
			.query(this.options.queryparameters)
			.send(this.options.postdata)
			.end(ajaxResponseHandler);
	}
	if (e) {
		e.preventDefault();
	}
};

formie.prototype.__autoSubmitFormOnChange = function () {
	var formElement = this.form;
	if (classie.hasClass(formElement, this.options.ajaxsubmitselector)) {
		formie.ajaxSubmitFormie(null, formElement);
	}
	else {
		formElement.submit();
	}
	// console.log('this.form', this.form);
};

formie.prototype.__submitOnChangeListeners = function () {
	this.options.autosubmitelements = document.querySelectorAll(this.options.autosubmitselectors);
	for (var x in this.options.autosubmitelements) {
		if (typeof this.options.autosubmitelements[x] === 'object') {
			this.options.autosubmitelements[x].addEventListener('change', this.autoSubmitFormOnChange, false);
		}
	}
};


formie.prototype.__preventSubmitOnEnter = function (e) {
	// console.log('key press');
	if (e.which === 13 || e.keyCode === 13) {
		// console.log(e);
		// console.log('prevent submit');
		e.preventDefault();
		return false;
	}
};

formie.prototype.__preventEnterSubmitListeners = function () {
	this.options.preventsubmitelements = document.querySelectorAll(this.options.preventsubmitselectors);
	// console.log(this.options.preventsubmitelements);
	for (var x in this.options.preventsubmitelements) {
		if (typeof this.options.preventsubmitelements[x] === 'object') {
			this.options.preventsubmitelements[x].addEventListener('keypress', this.preventSubmitOnEnter, false);
			this.options.preventsubmitelements[x].addEventListener('keydown', this.preventSubmitOnEnter, false);
		}
	}
	// document.addEventListener('keypress', preventSubmitOnEnter, false);
};

formie.prototype._init = function () {
	this.submitOnChangeListeners();
	this.preventEnterSubmitListeners();
};
module.exports = formie;
