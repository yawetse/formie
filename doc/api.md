<a name="formie"></a>
#class: formie
**Members**

* [class: formie](#formie)
  * [new formie(options)](#new_formie)
  * [formie.__ajaxSubmitFormie(e, element)](#formie#__ajaxSubmitFormie)
  * [formie.__submit()](#formie#__submit)
  * [formie.__autoSubmitFormOnChange()](#formie#__autoSubmitFormOnChange)
  * [formie.__submitOnChangeListeners()](#formie#__submitOnChangeListeners)
  * [formie.__preventSubmitOnEnter(e)](#formie#__preventSubmitOnEnter)
  * [formie.__preventEnterSubmitListeners()](#formie#__preventEnterSubmitListeners)
  * [formie.__ajaxFormEventListers()](#formie#__ajaxFormEventListers)
  * [formie._init()](#formie#_init)

<a name="new_formie"></a>
##new formie(options)
A module that represents a formie object, a componentTab is a page composition tool.

**Params**

- options `object` - configuration options  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
**Example**  

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

<a name="formie#__ajaxSubmitFormie"></a>
##formie.__ajaxSubmitFormie(e, element)
asynchronously submit from data, supports, POST, GET, and GET JSONP

**Params**

- e `object` - form submit event  
- element `object` - form html element  

**Returns**: `function` - ajaxResponseHandler(error, response)  
<a name="formie#__submit"></a>
##formie.__submit()
submit formie via ajax

<a name="formie#__autoSubmitFormOnChange"></a>
##formie.__autoSubmitFormOnChange()
submit current form if html element has ajaxsubmitclassname class

<a name="formie#__submitOnChangeListeners"></a>
##formie.__submitOnChangeListeners()
add change listener for form elements with autosubmitselectors class

<a name="formie#__preventSubmitOnEnter"></a>
##formie.__preventSubmitOnEnter(e)
prevent element from submitting form when pressing enter key

**Params**

- e `object` - keypress event  

**Returns**: `boolean` - also e.preventDefault();  
<a name="formie#__preventEnterSubmitListeners"></a>
##formie.__preventEnterSubmitListeners()
add keypress listeners to form elements that have preventsubmitselectors class to prevent submitting form on enter key

<a name="formie#__ajaxFormEventListers"></a>
##formie.__ajaxFormEventListers()
add submit event listener to formie form

<a name="formie#_init"></a>
##formie._init()
sets this.options.form, also adds event listener for formie form [this.ajaxFormEventListers()], adds auto submit form listeners [this.submitOnChangeListeners()], and prevent submit listeners [this.preventEnterSubmitListeners()]

