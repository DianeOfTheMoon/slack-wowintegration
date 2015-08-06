var sinon = require('sinon');
var chai = require('chai');


describe('Loot Display Middleware', function() {
	var test = require('../middleware/loot-display');
	it('should call next if no loot command', function(done) {
		test({}, {}, function(err, resp) {
			if (err) {
				throw err;
			}
			done();
		});
	});

	it('should call next if loot command not display', function(done) {
		test({'lootCommand': 'foo'}, {}, function(err, resp) {
			if (err) {
				throw err;
			}
			done();
		});
	});
});