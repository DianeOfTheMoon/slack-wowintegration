var chai = require('chai');
var sinon = require('sinon');

chai.should();


describe('Loot Parse Middleware', function() {
	var test = require('../middleware/loot-parse.js');


	it('should call next with no parsed body', function(done) {
		test({}, {}, function() {
			done();
		});
	});

	it('should send command list if not a valid command', function(done) {
		var resp = {
			send: function(text) {
				text.should.equal("Usage: `/foo [init activate deactivate seed claim display] [options]`");
				done();
			}
		};
		var req = {body: { command: 'foo', text: "foo text here"}};
		test(req, resp, function() {
			throw new Error("resp.send was not called");
		});
	});
});