/*
 * formie
 * http://github.com/yawetse/formie
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */
'use strict';

var async = require('async'),
	classie = require('classie'),
	events = require('events'),
	extend = require('util-extend'),
	forbject = require('forbject'),
	request = require('superagent'),
	querystring = require('querystring'),
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
		ajaxsubmitclassname: 'formie',
		ajaxsubmitfileuploadclassname: 'formie-file',
		ajaxsubmitselector: '.formie',
		ajaxsubmitform: null,
		autosubmitselectors: '.autoFormSubmit',
		autosubmitelements: [],
		preventsubmitselectors: '.noFormSubmit',
		preventsubmitelements: [],
		headers: {},
		// method: 'get',
		// action: '/',
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
	this.init();
	// this.render = this._render;
	// this.addBinder = this._addBinder;
};

util.inherits(formie, events.EventEmitter);

// formie.prototype.ajaxEventSubmitHandler = function(e){
// 	this.ajaxSubmitFormie(e);
// };

formie.prototype.__ajaxSubmitFormie = function (e, element) {
	// console.log('this', this, 'e', e, 'element', element);

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

	formieDataFromForm = new forbject(f).getObject();
	// console.log('f.getAttribute("enctype")', f.getAttribute('enctype'));

	this.options.method = (f.getAttribute('method')) ? f.getAttribute('method') : this.options.method;
	this.options.action = (f.getAttribute('action')) ? f.getAttribute('action') : (this.options.action) ? this.options.action : window.location.href;

	if (f.getAttribute('enctype') === 'multipart/form-data') {
		var formData = new FormData(f),
			fileInputs = f.querySelectorAll('input[type="file"]'),
			// reader = new FileReader(),
			client = new XMLHttpRequest(),
			asyncFunctions = [],
			asyncFileReaderCB = function (fileinputname, file) {
				return function (cb) {
					var filereader = new FileReader();
					filereader.readAsDataURL(file);
					filereader.onload = function (e) {
						// console.log('e', e);
						// console.log('filereader', filereader);
						formData.append(fileinputname, filereader.result, file.name);
						cb(null, file);
					}
				};
			};


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
				function (err, results) {
					// console.log('async results', results);
					client.open(this.options.method, this.options.action + '?' + querystring.stringify(this.options.queryparameters), true);
					if (this.options.headers) {
						for (var i in this.options.headers) {
							client.setRequestHeader(i, this.options.headers[i]);
						}
					}
					client.send(formData); /* Send to server */
					// client.onreadystatechange = function () {
					client.onloadend = function () {
						console.log('client', client);
						if (client.readyState === 4) {
							var res = {};
							res.body = JSON.parse(client.response);
							try {
								if (client.status !== 200) {
									ajaxResponseHandler(client.statusText, client.response);
								}
								else {
									ajaxResponseHandler(null, res);
								}
							}
							catch (e) {
								ajaxResponseHandler(e, res);
							}
						}
					};
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
			.query(formieData)
			.end(ajaxResponseHandler);
	}
	else if (this.options.method === 'post') {
		formieData = extend(formieDataFromForm, this.options.postdata);
		request
			.post(this.options.action)
			.set(this.options.headers)
			.query(this.options.queryparameters)
			.send(formieData)
			.end(ajaxResponseHandler);
	}
	return false;
};

formie.prototype.__autoSubmitFormOnChange = function () {
	var formElement = (this.form) ? this.form : this.options.form;

	console.log('formElement', formElement);
	if (classie.hasClass(formElement, this.options.ajaxsubmitclassname)) {
		this.ajaxSubmitFormie(null, formElement);
	}
	else {
		formElement.submit();
	}
};

formie.prototype.__submitOnChangeListeners = function () {
	this.options.form = (this.options.ajaxsubmitform) ? this.options.ajaxsubmitform : document.querySelector(this.options.ajaxsubmitselector);
	this.options.autosubmitelements = this.options.form.querySelectorAll(this.options.autosubmitselectors);

	for (var x in this.options.autosubmitelements) {
		if (typeof this.options.autosubmitelements[x] === 'object') {
			this.options.autosubmitelements[x].addEventListener('change', this.autoSubmitFormOnChange.bind(this), false);
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

formie.prototype.__ajaxFormEventListers = function () {
	this.options.ajaxsubmitform = document.querySelector(this.options.ajaxsubmitselector);
	this.options.ajaxsubmitform.addEventListener('submit', this.ajaxSubmitFormie.bind(this), false);
};

formie.prototype._init = function () {
	this.ajaxFormEventListers();
	this.submitOnChangeListeners();
	this.preventEnterSubmitListeners();
};
module.exports = formie;
