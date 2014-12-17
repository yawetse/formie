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
