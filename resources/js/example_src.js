'use strict';

var formie = require('../../index'),
	formie1,
	responseContainer;

window.addEventListener('load', function () {
	responseContainer = document.querySelector('#formie-test-result');
	formie1 = new formie({
		queryparameters: {
			format: 'json'
		},
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response.body, null, 2);
		}
	});

	window.formie1 = formie1;
}, false);
