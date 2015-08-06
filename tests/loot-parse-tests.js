var chai = require('chai');
var sinon = require('sinon');


describe('Loot Parse Middleware', function() {
	var test = require('../middleware/loot-parse.js');

	it('should call next with no parsed body', function(done) {
		test({}, {}, function() {
			done();
		});
	});
});