if (process.env.REDISTOGO_URL) {
	// TODO: redistogo connection
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var redis = require("redis").createClient(rtg.port, rtg.hostname);

	redis.auth(rtg.auth.split(":")[1]);
} else {
	var redis = require("redis").createClient();
}

var logger = require('winston');

module.exports = {
	loader: function(req, resp, next) {
		if (req.lootKey) {
			logger.debug('checking for loot key ' + req.lootKey);
			redis.get(req.lootKey, function (err, data) {
				//TODO what about when the data is corrupt?
				req.lootData = JSON.parse(data);
				next();
			});
		} else {
			next();
		}
	},
	saver: function (req, resp, next) {
		if (req.lootSave && req.lootData) {
			redis.set(req.lootKey, JSON.stringify(req.lootData), function (err, result) {
				if (err) {
					next(err);
				} else {
					next();
				}
			});
		} else {
			next();
		}
	}
}