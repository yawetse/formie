/*
 * formie
 * https://github.com/yawetse/formie
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var should = require('chai').should();
// var component_navigation_header = require('../lib/formie');

describe('formie', function () {
	describe('#indexOf()', function () {
		it('should return -1 when the value is not present', function () {
			should.equal(-1, [1, 2, 3].indexOf(5));
			should.equal(-1, [1, 2, 3].indexOf(0));
		});
	});
});
