var chai = require('chai');
var sinon = require('sinon');

chai.should();
var expect = chai.expect;

describe('Loot Commands', function() {
	var test = require("../middleware/loot-commands.js");

	describe('claim action', function() {
		it('should provide username on successful claim', function(done) {
			var req = {
				lootCommand: 'claim',
				lootOptions: {
					"_": ['foo'],
					currentUser: 'bar'
				},
				lootData: {
					admin: ["bar"],
					members: [
						{
							name: "foo",
							status: "active"
						},
						{
							name: "bar",
							status: "active"
						},
					]
				},
			};
			var resp = {
				send: function(text) {
					throw Error("Next should have been called.");
				}
			};
			test(req, resp, function() {
				req.sendResponse.should.equal("Claim has been processed for foo");
				done();
			});

		});
	});
});