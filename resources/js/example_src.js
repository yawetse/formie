'use strict';

var formie = require('../../index'),
	formie1,
	yawbutton,
	rafbutton,
	ajaxbutton;

var yawprofiledata = {
		username: "@yawetse",
		profile: {
			summary: "<h2>@yawetse's profile</h2><p>probably from database</p>"
		}
	},
	rafprofiledata = {
		username: "@sonicsound",
		profile: {
			summary: "<h2>@sonicsound's profile</h2><p>you can overwrite formie's  render prototype function to use your favorite own template language. The default is EJS</p>"
		}
	},
	ajaxprofiledata = {
		username: "@ajaxmockcall",
		profile: {
			summary: "<h2>grab this from ajax post/get</p>"
		}
	};

var loadprofile = function (e) {
	var etarget = e.target;
	if (etarget.id === 'yawbutton') {
		formie1.update({
			data: yawprofiledata
		});
	}
	else if (etarget.id === 'rafbutton') {
		formie1.update({
			data: rafprofiledata
		});
	}
	else if (etarget.id === 'ajaxbutton') {
		formie1.update({
			data: ajaxprofiledata
		});
	}
};

// var tabEvents = function () {
// 	formie1.on('tabsShowIndex', function (index) {
// 		console.log('tab show index', index);
// 	});
// };

window.addEventListener('load', function () {

	yawbutton = document.querySelector('#yawbutton');
	rafbutton = document.querySelector('#rafbutton');
	// ajaxbutton = document.querySelector('#ajaxbutton');

	formie1 = new formie({
		ejsopen: '{{',
		ejsclose: '}}'
	});

	formie1.addBinder({
		prop: 'username',
		elementSelector: '#username',
		binderType: 'value'
	});

	formie1.addBinder({
		prop: 'profile',
		elementSelector: '#profile',
		binderType: 'template',
		binderTemplate: document.querySelector('#profile-template').innerHTML
	});

	yawbutton.addEventListener('click', loadprofile, false);
	rafbutton.addEventListener('click', loadprofile, false);
	// ajaxbutton.addEventListener('click', loadprofile, false);
	window.formie1 = formie1;
}, false);
