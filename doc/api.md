<a name="formie"></a>
#class: formie
**Members**

* [class: formie](#formie)
  * [new formie(el, options)](#new_formie)
  * [formie._addBinder(options)](#formie#_addBinder)
  * [formie._update(options)](#formie#_update)
  * [formie._render(options)](#formie#_render)

<a name="new_formie"></a>
##new formie(el, options)
A module that represents a formie object, a componentTab is a page composition tool.

**Params**

- el `object` - element of tab container  
- options `object` - configuration options  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="formie#_addBinder"></a>
##formie._addBinder(options)
adds a data property binding to an html element selector

**Params**

- options `object` - prop,elementSelector,binderType, binderValue, listenerEventArray  

<a name="formie#_update"></a>
##formie._update(options)
this will update your binded elements ui, once your formie object is updated with new data

**Params**

- options `object` - data  

<a name="formie#_render"></a>
##formie._render(options)
render element template with new data

**Params**

- options `object` - template, data  

**Returns**: `string` - rendered html fragment  
