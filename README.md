# formie  [![NPM version](https://badge.fury.io/js/formie.svg)](http://badge.fury.io/js/formie)


** CommonJS/Browserified ajax form submission **

Formie submits form data via AJAX. Formie supports JSONP, GET, POST, DELETE and multipart/form-data file Uploads without the baggage of a full framework. 

[API Documenation](https://yawetse.github.io/formie/api/html/index.html)

## Example

Check out `example/index.html`, the example javascript for the example page is `resources/js/example_src.js`

## Installation

```
$ npm install formie
```

Formie is a browserified/commonjs javascript module.

## Usage

*JavaScript*
```javascript
var Formie = require('formie'),
	myFormie;

//initialize nav component after the dom has loaded
window.addEventListener('load',function(){
	myFormie = new Formie({
    ajaxformselector: '#formie',
    headers: {'customheader':'customvalue'},
    beforesubmitcallback: function(event,formelement){console.log(event,formelement)},
    successcallback: function(response){console.log(response)},
    errorcallback: function(error,response){console.log(error,response)}
  });
	//expose your nav component to the window global namespace
	window.myFormie = myFormie;
});
```

*HTML*
```html
<html>
	<head>
  	<title>Your Page</title>
  	<script src='[path/to/browserify/bundle].js'></script>
	</head>
	<body>
		<form method="get" action="" id="formie">
	    <section>
	      <label for="field1">Field 1</label>
	      <input type="text" value="" name="field1" id="field1" />
	    </section>
	    <section>
	      <label for="field2">Field 2</label>
	      <input type="text" value="" name="field2" id="field2" />
	    </section>
	    <section>
	      <input type="submit" value="ajax submit" name="submitbutton" />
	    </section>
		</form>
	</body>
</html>
```

##OPTIONS
```javascript
defaultOptions = {
	ajaxsubmitfileuploadclassname: 'formie-file', //file input class to readAsDataURL
	ajaxformselector: '#formie', //formie form selector
	ajaxsubmitform: null,
	jsonp: false, //retrieves data via JSONP, form data must contain a 'callback' parameter
	autosubmitselectors: '.autoFormSubmit',
	autosubmitelements: [],
	preventsubmitselectors: '.noFormSubmit',
	preventsubmitelements: [],
	headers: {}, // custom headers to submit
	queryparameters: {}, // programmitcally add more get data
	postdata: {}, // programmitcally add more post data
	beforesubmitcallback: null, // callback(event,formelement)  
	errorcallback: null, // callback(error,response)
	successcallback: null // callback(response)
};
```

##API

```javascript
//submit formie via ajax
myFormie.submit(); 

//events
myFormie.on('autosubmitelement',callback); // callback(formelement)
myFormie.on('prevententer',callback); // callback(eventTarget)
myFormie.on('initialized',callback); // callback()
myFormie.on('submitted',callback); // callback(formieData)
```
##Development
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt watch
```
$ grunt watch #uses grunt-connect on port 8181 
```
##For generating documentation
```
$ grunt doc
$ jsdoc2md lib/**/*.js index.js > doc/api.md
```

##Notes
* The Formie uses Node's event Emitter for event handling.
* In order to test post submission, grunt connect is used on port 8181