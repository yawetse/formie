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
