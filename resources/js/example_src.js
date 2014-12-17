'use strict';

var formie = require('../../index'),
	querystring = require('querystring'),
	formieduckduckgo,
	formiehtml,
	formiejson,
	formiepost,
	responseContainer;

var defaultErrorCallback = function (err, response) {
	responseContainer.innerHTML = 'error : ' + JSON.stringify(err, null, 2);
	responseContainer.innerHTML += '\nresponse : ' + JSON.stringify(response, null, 2);
};

window.addEventListener('load', function () {
	responseContainer = document.querySelector('#formie-test-result');
	formieduckduckgo = new formie({
		jsonp: true,
		ajaxformselector: '#duckduckgo-formie-test',
		queryparameters: {
			callback: 'duckduckgocallback',
		},
		errorcallback: defaultErrorCallback,
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response, null, 2);
		}
	});

	formiehtml = new formie({
		ajaxformselector: '#html-formie-test',
		errorcallback: defaultErrorCallback,
		successcallback: function (response) {
			responseContainer.innerHTML = response.text;
		}
	});


	formiejson = new formie({
		ajaxformselector: '#formie-test',
		queryparameters: {
			additional: 'queryparameter',
		},
		headers: {
			formieheader: 'can be anything'
		},
		errorcallback: defaultErrorCallback,
		successcallback: function (response) {
			var queryfromajaxresponse = response.req._query[0];
			queryfromajaxresponse = querystring.parse(queryfromajaxresponse);
			responseContainer.innerHTML = JSON.stringify(queryfromajaxresponse, null, 2);
		}
	});

	formiepost = new formie({
		ajaxformselector: '#upload-formie-test',
		postdata: {
			moredata: 'can be object of anything'
		},
		headers: {
			formieheader: 'can be anything'
		},
		errorcallback: function (err, response) {
			var Forbject = require('forbject'),
				postformfields = new Forbject('#upload-formie-test').getObject(),
				postresult = {
					form: postformfields,
					response: response
				},
				file = document.querySelector('#image'),
				reader = new FileReader();

			if (file && file.files && file.files[0]) {
				reader.readAsDataURL(file.files[0]);
				reader.onloadend = function () {
					if (reader.result.match(/image/gi)) {
						responseContainer.innerHTML = '<div><img src="' + reader.result + '"/></div>';
					}
					else {
						responseContainer.innerHTML = '<div>' + reader.result + '</div>';
					}
					responseContainer.innerHTML += JSON.stringify(postresult, null, 2);
				};
			}
			else {
				responseContainer.innerHTML = JSON.stringify(postresult, null, 2);
			}
		},
		successcallback: function (response) {
			responseContainer.innerHTML = JSON.stringify(response.body, null, 2);
		}
	});

	window.formiejson = formiejson;
}, false);
