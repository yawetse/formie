'use strict';

var formie = require('../../index'),
	formie1,
	formie2,
	responseContainer;

window.addEventListener('load', function () {
	responseContainer = document.querySelector('#formie-test-result');
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
