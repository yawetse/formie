'use strict';

var formie = require('../../index'),
	formieduckduckgo,
	formie1,
	formie2,
	responseContainer;

// window.duckduckgocallback = function (jsonpdata) {
// 	responseContainer.innerHTML = JSON.stringify(jsonpdata, null, 2);
// };

window.addEventListener('load', function () {
	responseContainer = document.querySelector('#formie-test-result');
	formieduckduckgo = new formie({
		jsonp: true,
		ajaxsubmitselector: '#duckduckgo-formie-test',
		queryparameters: {
			callback: 'duckduckgocallback',
		},
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response, null, 2);
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
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response.body, null, 2);
		}
	});

	window.formie1 = formie1;
}, false);
