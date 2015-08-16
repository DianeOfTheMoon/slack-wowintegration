var chai = require('chai');
var sinon = require('sinon');

chai.should();
var expect = chai.expect;

describe('Loot Commands', function() {
	var test = require("../middleware/loot-commands.js");

	describe('claim action', function() {
		it('should provide username on successful claim', function(done) {
			var req = defaultReq;
			req.lootCommand = 'claim';
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

	describe('activate action', function() {
		it('should activate users', function(done) {
			var req = defaultReq;
			req.lootCommand = 'activate';
			req.lootOptions['_'].push('baz');

			var resp = {
				send: sinon.spy(),
			};

			test(req, resp, function() {
				for (var i = 0; i < req.lootData.members.length; i++) {
					var user = req.lootData.members[i];
					if (user.name == 'foo' || user.name == 'baz') {
						user.status.should.equal('active');
					}
				}
				done();
			});
		});

		it('should deactivate users not set with --active-only option', function(done) {
			var req = defaultReq;
			req.lootCommand = 'activate';
			req.lootOptions['_'].push('baz');
			req.lootOptions['active-only'] = true;

			var resp = {
				send: sinon.spy(),
			};

			test(req, resp, function() {
				for (var i = 0; i < req.lootData.members.length; i++) {
					var user = req.lootData.members[i];
					if (user.name == 'foo' || user.name == 'baz') {
						user.status.should.equal('active');
					} else {
						user.status.should.equal('inactive');
					}
				}
				done();
			});
		});

		it('should return message if any user is not found', function(done) {
			var req = defaultReq;
			req.lootCommand = 'activate';
			req.lootOptions['_'].push('test');
			var resp = {
				send: function(text) {
					text.should.equal('test was not found in the list');
					done();
				}
			};
			test(req, resp, function() {
				throw Error('Next should not be called');
			});
		});

		it('should not allow activation if current user is not an admin', function(done) {
			var req = defaultReq;
			req.lootCommand = 'activate';
			req.lootOptions.currentUser = 'foo';
			var resp = {
				send: function(text) {
					text.should.equal('You do not have permission to manage this loot list');
					done();
				}
			};

			test(req, resp, function() {
				throw Error("Next should not be called");
			});
		});
	});
});

var defaultReq = {
	lootCommand: 'claim',
	lootOptions: {
		"_": ['foo'],
		currentUser: 'bar'
	},
	lootData: {
		admin: ['bar'],
		members: [
			{
				name: "foo",
				status: "active"
			},
			{
				name: "bar",
				status: "inactive"
			},
			{
				name: "baz",
				status: "inactive"
			},
			{
				name: "qux",
				status: "active"
			},
		],
	},
};