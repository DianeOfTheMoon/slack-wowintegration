var sinon = require('sinon');
var Slack = require('slack-node');
var chai = require('chai');
var sinonChai = require('sinon-chai');
var test = require('../middleware/loot-display');

chai.use(sinonChai);
chai.should();

describe('Loot Display Middleware', function() {
	var sendDataStub = null;

	before(function (done) {
		sendDataStub = sinon.stub(test, "sendData");
		sendDataStub.yields(null, "response");
		done();
	});

	after(function (done) {
		sendDataStub.restore();
		done();
	});

	it('should call next if no loot command', function(done) {
		test.middleware({}, {}, function(err, resp) {
			if (err) {
				throw err;
			}
			done();
		});
	});

	it('should call next if loot command not display', function(done) {
		test.middleware({'lootCommand': 'foo'}, {}, function(err, resp) {
			if (err) {
				throw err;
			}
			done();
		});
	});

	it('should return all results', function(done) {
		var req = defaultReq;

		var resp = {
			send: function(text) {
				text.should.be.empty;
				sendDataStub.should.have.been.calledWithMatch({text: "Current List for 4 Users:\n1: *foo*\n2: *bar*\n3: baz\n4: *qux*"});
				done();
			}
		};
		test.middleware(req, resp, function(err, resp) {
			throw Error('Should not call next');
		});
	});

	it('should only return active with active option enabled', function(done) {
		var req = defaultReq;
		req.lootOptions.active = true;

		var resp = {
			send: function(text) {
				text.should.be.empty;
				sendDataStub.should.have.been.calledWithMatch({text: "Current List for 3 Users:\n1: *foo*\n2: *bar*\n4: *qux*"});
				done();
			}
		};
		test.middleware(req, resp, function(err, resp) {
			throw Error('Should not call next');
		});
	});
});

defaultReq = {
	lootCommand: "display",
	lootOptions: {
		active: false,
	},
	body: {
		channel_name: "test"
	},
	lootData: {
		members: [
			{
				name: "foo",
				status: "active"
			},
			{
				name: "bar",
				status: "active"
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